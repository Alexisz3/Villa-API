import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';

// El contenido estructurado llega como objeto plano; Prisma lo quiere tipado
// como InputJsonValue para escribirlo en la columna jsonb.
function toJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}

@Injectable()
export class ContentSectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.contentSection.findMany({
      orderBy: { sectionName: 'asc' },
    });
  }

  findByName(sectionName: string) {
    return this.prisma.contentSection.findUnique({
      where: { sectionName },
    });
  }

  create(dto: CreateContentSectionDto) {
    const dataValue = toJson(dto.data);

    return this.prisma.contentSection.upsert({
      where: {
        sectionName: dto.sectionName,
      },
      create: {
        sectionName: dto.sectionName,
        title: dto.title,
        description: dto.description,
        banner: dto.banner,
        images: dto.images || [],
        ...(dataValue !== undefined ? { data: dataValue } : {}),
        isActive: dto.isActive ?? true,
      },
      update: {
        title: dto.title,
        description: dto.description,
        banner: dto.banner,
        images: dto.images ? dto.images : undefined, // Update only if provided, or handle array logic appropriately (for simplicity replacing if provided)
        ...(dataValue !== undefined ? { data: dataValue } : {}),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateContentSectionDto) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }

    const {
      imagesToRemove,
      images: newImages,
      removeBanner,
      banner: newBanner,
      data,
      ...rest
    } = dto;

    // Quitar una imagen de una sección solo la DESVINCULA: el archivo sigue
    // en disco y en la biblioteca de medios (puede estar en uso en otro
    // lado). La eliminación real se hace desde la biblioteca, con borrado
    // lógico y chequeo de referencias.
    let images = current.images;
    if (imagesToRemove?.length) {
      const toRemove = new Set(imagesToRemove);
      images = images.filter((path) => !toRemove.has(path));
    }
    if (newImages?.length) {
      images = [...images, ...newImages];
    }

    let banner = current.banner;
    if (removeBanner) {
      banner = null;
    } else if (newBanner) {
      banner = newBanner;
    }

    const dataValue = toJson(data);

    return this.prisma.contentSection.update({
      where: { id },
      data: {
        ...rest,
        banner,
        images,
        ...(dataValue !== undefined ? { data: dataValue } : {}),
      },
    });
  }

  async remove(id: number) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }

    // No se tocan los archivos: pueden estar referenciados por otras
    // secciones o habitaciones. Quedan en la biblioteca como recursos sin
    // usar y se eliminan desde ahí.
    return this.prisma.contentSection.delete({ where: { id } });
  }
}
