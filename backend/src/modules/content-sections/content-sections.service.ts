import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

// Foto completa de los campos editables de una sección. Es la forma que
// vive en la columna `draft` mientras el admin edita, y la que se copia a
// las columnas vivas al publicar.
type SectionSnapshot = {
  title: string | null;
  description: string | null;
  banner: string | null;
  images: string[];
  data: Prisma.InputJsonValue | null;
  isActive: boolean;
};

type LiveSection = {
  title: string | null;
  description: string | null;
  banner: string | null;
  images: string[];
  data: Prisma.JsonValue | null;
  isActive: boolean;
  draft: Prisma.JsonValue | null;
};

function snapshotFromLive(section: LiveSection): SectionSnapshot {
  return {
    title: section.title,
    description: section.description,
    banner: section.banner,
    images: section.images,
    data: section.data as Prisma.InputJsonValue | null,
    isActive: section.isActive,
  };
}

// El borrador vigente de una sección: lo que hay en `draft`, o si nunca se
// tocó, una foto de lo que ya está publicado. Es la base sobre la que se
// aplica cada nuevo guardado.
function effectiveDraft(section: LiveSection): SectionSnapshot {
  return (section.draft as SectionSnapshot | null) ?? snapshotFromLive(section);
}

// Combina un borrador base con los campos que sí llegaron en este guardado,
// sin JS-spreadear claves `undefined` por encima (eso pisaría el valor ya
// guardado con `undefined`, distinto de "no lo toques").
function definedPatch<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

@Injectable()
export class ContentSectionsService {
  constructor(private prisma: PrismaService) {}

  // Selección pública: nunca expone el borrador sin publicar. La usan el
  // sitio público y cualquier caller sin autenticar.
  private readonly publicSelect = {
    id: true,
    sectionName: true,
    banner: true,
    title: true,
    description: true,
    images: true,
    data: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.ContentSectionSelect;

  findAll() {
    return this.prisma.contentSection.findMany({
      orderBy: { sectionName: 'asc' },
      select: this.publicSelect,
    });
  }

  findByName(sectionName: string) {
    return this.prisma.contentSection.findUnique({
      where: { sectionName },
      select: this.publicSelect,
    });
  }

  // Variante para el panel: incluye `draft`, para poder precargar cambios
  // pendientes de publicar en el editor.
  findAllAdmin() {
    return this.prisma.contentSection.findMany({
      orderBy: { sectionName: 'asc' },
    });
  }

  async create(dto: CreateContentSectionDto) {
    const dataValue = toJson(dto.data);
    const existing = await this.prisma.contentSection.findUnique({
      where: { sectionName: dto.sectionName },
    });

    // Sección nueva: la fila vive con sus columnas en blanco (no aparece en
    // el sitio) hasta que se publique el contenido enviado.
    if (!existing) {
      const draft: SectionSnapshot = {
        title: dto.title ?? null,
        description: dto.description ?? null,
        banner: dto.banner ?? null,
        images: dto.images ?? [],
        data: dataValue ?? null,
        isActive: dto.isActive ?? true,
      };
      return this.prisma.contentSection.create({
        data: {
          sectionName: dto.sectionName,
          images: [],
          isActive: true,
          draft: draft as Prisma.InputJsonValue,
        },
      });
    }

    const base = effectiveDraft(existing);
    const patch = definedPatch({
      title: dto.title,
      description: dto.description,
      banner: dto.banner,
      images: dto.images,
      isActive: dto.isActive,
      data: dataValue,
    });
    const nextDraft: SectionSnapshot = { ...base, ...patch };

    return this.prisma.contentSection.update({
      where: { sectionName: dto.sectionName },
      data: { draft: nextDraft as Prisma.InputJsonValue },
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

    const base = effectiveDraft(current);

    // Quitar una imagen de una sección solo la DESVINCULA: el archivo sigue
    // en disco y en la biblioteca de medios (puede estar en uso en otro
    // lado). La eliminación real se hace desde la biblioteca, con borrado
    // lógico y chequeo de referencias. Opera sobre el set de imágenes del
    // borrador vigente, no directamente sobre la columna viva.
    let images = base.images;
    if (imagesToRemove?.length) {
      const toRemove = new Set(imagesToRemove);
      images = images.filter((path) => !toRemove.has(path));
    }
    if (newImages?.length) {
      images = [...images, ...newImages];
    }

    let banner = base.banner;
    if (removeBanner) {
      banner = null;
    } else if (newBanner) {
      banner = newBanner;
    }

    const dataValue = toJson(data);
    const patch = definedPatch({
      title: rest.title,
      description: rest.description,
      isActive: rest.isActive,
      banner,
      images,
      data: dataValue,
    });
    const nextDraft: SectionSnapshot = { ...base, ...patch };

    return this.prisma.contentSection.update({
      where: { id },
      data: { draft: nextDraft as Prisma.InputJsonValue },
    });
  }

  // Reordena las imágenes del borrador vigente de una galería. `images` debe
  // ser exactamente el mismo conjunto que ya tiene la sección, en otro
  // orden — no agrega ni quita fotos (para eso está `update`).
  async reorderImages(id: number, images: string[]) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }

    const base = effectiveDraft(current);
    const currentSet = [...base.images].sort();
    const nextSet = [...images].sort();
    const isSamePermutation =
      currentSet.length === nextSet.length &&
      currentSet.every((path, i) => path === nextSet[i]);

    if (!isSamePermutation) {
      throw new BadRequestException(
        'El nuevo orden debe contener exactamente las mismas imágenes.',
      );
    }

    const nextDraft: SectionSnapshot = { ...base, images };

    return this.prisma.contentSection.update({
      where: { id },
      data: { draft: nextDraft as Prisma.InputJsonValue },
    });
  }

  // Copia el borrador pendiente a las columnas vivas (lo que lee el sitio
  // público) y lo limpia.
  async publish(id: number) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }
    if (!current.draft) {
      throw new BadRequestException('No hay borrador pendiente de publicar.');
    }

    const draft = current.draft as SectionSnapshot;

    return this.prisma.contentSection.update({
      where: { id },
      data: {
        title: draft.title,
        description: draft.description,
        banner: draft.banner,
        images: draft.images ?? [],
        data: draft.data === null ? Prisma.DbNull : draft.data,
        isActive: draft.isActive ?? true,
        draft: Prisma.DbNull,
      },
    });
  }

  // Descarta el borrador pendiente sin tocar lo publicado.
  async discardDraft(id: number) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }

    return this.prisma.contentSection.update({
      where: { id },
      data: { draft: Prisma.DbNull },
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
