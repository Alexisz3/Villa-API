// Backfill único de la biblioteca de medios.
//
// Recorre content_sections (banner + images) y rooms (photoUrl), toma cada
// ruta /uploads/<archivo> distinta que todavía no esté registrada, lee el
// archivo del disco para sacar tamaño y dimensiones, y crea el MediaAsset.
//
// Idempotente: se puede correr varias veces. Uso:
//   npx tsx prisma/backfill-media.ts
//
// Debe correr desde la raíz del repo (donde vive la carpeta uploads/).

import { PrismaClient } from '../backend/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readImageDimensions } from '../backend/src/common/image-dimensions';
import { stat, readFile } from 'fs/promises';
import { join, basename } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('prisma+postgres://')) {
  try {
    const urlObj = new URL(dbUrl);
    const apiKeyBase64 = urlObj.searchParams.get('api_key');
    if (apiKeyBase64) {
      const decoded = JSON.parse(
        Buffer.from(apiKeyBase64, 'base64').toString('utf-8'),
      );
      if (decoded.databaseUrl) dbUrl = decoded.databaseUrl;
    }
  } catch {
    /* ignore */
  }
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function extOf(path: string): string {
  const i = path.lastIndexOf('.');
  return i === -1 ? '' : path.slice(i).toLowerCase();
}

async function main() {
  const [sections, rooms, existing] = await Promise.all([
    prisma.contentSection.findMany({ select: { banner: true, images: true } }),
    prisma.room.findMany({ select: { photoUrl: true } }),
    prisma.mediaAsset.findMany({ select: { path: true } }),
  ]);

  const known = new Set(existing.map((a) => a.path));
  const paths = new Set<string>();

  for (const s of sections) {
    if (s.banner) paths.add(s.banner);
    for (const img of s.images) paths.add(img);
  }
  for (const r of rooms) {
    if (r.photoUrl) paths.add(r.photoUrl);
  }

  let created = 0;
  let skipped = 0;
  let missing = 0;

  for (const path of paths) {
    if (!path.startsWith('/uploads/')) {
      skipped++;
      continue;
    }
    if (known.has(path)) {
      skipped++;
      continue;
    }

    const filename = basename(path);
    const diskPath = join(process.cwd(), 'uploads', filename);

    let sizeBytes = 0;
    let width: number | null = null;
    let height: number | null = null;
    try {
      const info = await stat(diskPath);
      sizeBytes = info.size;
      const dims = readImageDimensions(await readFile(diskPath));
      width = dims?.width ?? null;
      height = dims?.height ?? null;
    } catch {
      // El archivo referenciado ya no está en disco. Se registra igual para
      // que aparezca en la biblioteca (marcado por sizeBytes = 0).
      missing++;
    }

    await prisma.mediaAsset.create({
      data: {
        filename,
        path,
        originalName: filename,
        mimeType: MIME_BY_EXT[extOf(filename)] ?? 'application/octet-stream',
        sizeBytes,
        width,
        height,
      },
    });
    created++;
  }

  console.log(
    `Backfill de medios: ${created} creados, ${skipped} ya existentes u omitidos, ${missing} sin archivo en disco.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
