// Recuperación: registra en la biblioteca de medios TODOS los archivos que
// hay en backend/uploads/, sin depender de que alguna sección los referencie.
// Se usó para reconstruir media_assets después de que se perdiera la tabla.
//
//   npx tsx prisma/rebuild-media-from-disk.ts
//
// Idempotente (upsert por path). No recupera el alt ni la carpeta manual —
// esos datos no estaban en ningún backup.

import { PrismaClient } from '../backend/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readImageDimensions } from '../backend/src/common/image-dimensions';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const ext = (f: string) => f.slice(f.lastIndexOf('.')).toLowerCase();

async function main() {
  const dir = join(process.cwd(), 'backend', 'uploads');
  const files = (await readdir(dir)).filter((f) => ext(f) in MIME);

  let done = 0;
  for (const filename of files) {
    const disk = join(dir, filename);
    let sizeBytes = 0;
    let width: number | null = null;
    let height: number | null = null;
    try {
      sizeBytes = (await stat(disk)).size;
      const dims = readImageDimensions(await readFile(disk));
      width = dims?.width ?? null;
      height = dims?.height ?? null;
    } catch {
      /* deja los valores por defecto */
    }

    await prisma.mediaAsset.upsert({
      where: { path: `/uploads/${filename}` },
      create: {
        filename,
        path: `/uploads/${filename}`,
        originalName: filename,
        mimeType: MIME[ext(filename)],
        sizeBytes,
        width,
        height,
      },
      update: {},
    });
    done++;
  }
  console.log(`Biblioteca reconstruida: ${done} imágenes registradas desde disco.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
