import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PrismaService } from '../../database/prisma.service';
import { toPublicUploadPath } from '../../common/upload-storage';
import { readImageDimensions } from '../../common/image-dimensions';
import { QueryMediaDto } from './dto/query-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

// Etiqueta legible de cada carpeta (mismo criterio que `folderLabel` del
// frontend, que deriva de los grupos del catálogo).
const FOLDER_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  nosotros: 'Nosotros',
  cavas: 'Cavas',
  pizzeria: 'Pizzería',
  rooftop: 'RoofTop',
  'zona-pet': 'Zona Pet',
  bobolon: 'Bobolón',
  galeria: 'Galería',
  habitaciones: 'Habitaciones',
  parque: 'Parque',
  'santo-seco': 'Santo Seco',
  general: 'General',
};

function folderLabel(slug: string): string {
  return (
    FOLDER_LABELS[slug] ??
    slug
      .split('-')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ')
  );
}

// Nombre de arranque para una imagen recién subida. Si el archivo trae un
// nombre real lo humaniza ("Cavas1" -> "Cavas 1"); si es un nombre
// autogenerado (banner-1787…-752…) cae en la etiqueta de la carpeta.
export function deriveAltText(originalName: string, folder: string): string {
  const base = (originalName || '')
    .replace(/\.[a-z0-9]+$/i, '') // sin extensión
    .replace(/^cms-[a-z0-9]+-/i, ''); // sin prefijo "cms-<área>-"

  if (/^(banner|images?|media|room)-?\d/i.test(base) || /^\d{6,}/.test(base)) {
    return folderLabel(folder);
  }

  const humanized = base
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return humanized
    ? humanized[0].toUpperCase() + humanized.slice(1)
    : folderLabel(folder);
}

// Lugares donde un archivo puede estar referenciado. Se usa para bloquear el
// envío a papelera de un recurso en uso.
export type AssetReferences = {
  sections: { sectionName: string }[];
  rooms: { id: number; name: string }[];
};

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  // Registra en la biblioteca los archivos que multer ya guardó en disco.
  // Idempotente: si el `path` ya existe (p. ej. subido desde una sección que
  // luego se re-guarda) no se duplica ni se pisa.
  async registerAssets(files: Express.Multer.File[], folder?: string) {
    if (!files?.length) return [];
    const cleanFolder = folder?.trim();

    return Promise.all(
      files.map(async (file) => {
        const path = toPublicUploadPath(file);
        const { width, height } = await this.readDimensions(file.path);

        return this.prisma.mediaAsset.upsert({
          where: { path },
          create: {
            filename: file.filename,
            path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            width,
            height,
            alt: deriveAltText(file.originalname, cleanFolder ?? 'general'),
            ...(cleanFolder ? { folder: cleanFolder } : {}),
          },
          update: {}, // ya existe: no se pisa nada
        });
      }),
    );
  }

  async listFolders(): Promise<string[]> {
    const rows = await this.prisma.mediaAsset.findMany({
      where: { deletedAt: null },
      distinct: ['folder'],
      select: { folder: true },
      orderBy: { folder: 'asc' },
    });
    return rows.map((row) => row.folder);
  }

  // Reasigna la carpeta de varios recursos de una sola vez, en una
  // transaccion (un `updateMany` por carpeta destino).
  async assignFolders(items: { id: number; folder: string }[]) {
    const byFolder = new Map<string, number[]>();
    for (const item of items) {
      const folder = item.folder.trim() || 'general';
      byFolder.set(folder, [...(byFolder.get(folder) ?? []), item.id]);
    }

    const results = await this.prisma.$transaction(
      [...byFolder].map(([folder, ids]) =>
        this.prisma.mediaAsset.updateMany({
          where: { id: { in: ids } },
          data: { folder },
        }),
      ),
    );

    return { updated: results.reduce((sum, r) => sum + r.count, 0) };
  }

  async list(query: QueryMediaDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 40, 500);
    const trashed = query.trashed === 'true';

    const where = {
      deletedAt: trashed ? { not: null } : null,
      ...(query.folder ? { folder: query.folder } : {}),
      ...(query.search
        ? {
            OR: [
              {
                originalName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                alt: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Recurso de medios no encontrado.');
    }
    return asset;
  }

  async updateMeta(id: number, dto: UpdateMediaDto) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(dto.alt !== undefined ? { alt: dto.alt } : {}),
        ...(dto.folder !== undefined
          ? { folder: dto.folder || 'general' }
          : {}),
      },
    });
  }

  // Borrado lógico: si el recurso está en uso, se rechaza (hay que quitarlo
  // de esos lugares primero). Si no, se marca `deletedAt`; el archivo sigue
  // en disco y se puede restaurar.
  async softDelete(id: number) {
    const asset = await this.findOne(id);
    if (asset.deletedAt) return asset;

    const references = await this.findReferences(asset.path);
    const total = references.sections.length + references.rooms.length;
    if (total > 0) {
      throw new ConflictException({
        message:
          'El recurso está en uso y no se puede enviar a la papelera. Quítalo de esos lugares primero.',
        references,
      });
    }

    return this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findReferences(path: string): Promise<AssetReferences> {
    const [sections, rooms] = await Promise.all([
      this.prisma.contentSection.findMany({
        where: { OR: [{ banner: path }, { images: { has: path } }] },
        select: { sectionName: true },
      }),
      this.prisma.room.findMany({
        where: { photoUrl: path },
        select: { id: true, name: true },
      }),
    ]);
    return { sections, rooms };
  }

  private async readDimensions(
    filePath: string,
  ): Promise<{ width: number | null; height: number | null }> {
    try {
      const dims = readImageDimensions(await readFile(filePath));
      return { width: dims?.width ?? null, height: dims?.height ?? null };
    } catch {
      // No se pudo leer la cabecera — no es bloqueante.
      return { width: null, height: null };
    }
  }
}
