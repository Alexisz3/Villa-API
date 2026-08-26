import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';

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
        isActive: dto.isActive ?? true,
      },
      update: {
        title: dto.title,
        description: dto.description,
        banner: dto.banner,
        images: dto.images ? dto.images : undefined, // Update only if provided, or handle array logic appropriately (for simplicity replacing if provided)
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

    const { imagesToRemove, images: newImages, removeBanner, banner: newBanner, ...rest } = dto;

    let images = current.images;
    if (imagesToRemove?.length) {
      const toRemove = new Set(imagesToRemove);
      images = images.filter((path) => !toRemove.has(path));
      await this.deleteUploadedFiles(imagesToRemove);
    }
    if (newImages?.length) {
      images = [...images, ...newImages];
    }

    let banner = current.banner;
    if (removeBanner) {
      if (current.banner) {
        await this.deleteUploadedFiles([current.banner]);
      }
      banner = null;
    } else if (newBanner) {
      if (current.banner && newBanner !== current.banner) {
        await this.deleteUploadedFiles([current.banner]);
      }
      banner = newBanner;
    }

    return this.prisma.contentSection.update({
      where: { id },
      data: { ...rest, banner, images },
    });
  }

  async remove(id: number) {
    const current = await this.prisma.contentSection.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Sección de contenido no encontrada.');
    }

    const filesToClean = [current.banner, ...current.images].filter(
      (path): path is string => !!path,
    );
    await this.deleteUploadedFiles(filesToClean);

    return this.prisma.contentSection.delete({ where: { id } });
  }

  private async deleteUploadedFiles(paths: string[]) {
    await Promise.all(
      paths.map(async (filePath) => {
        const match = /^\/uploads\/([^/\\]+)$/.exec(filePath);
        if (!match) return;

        try {
          await unlink(join(process.cwd(), 'uploads', match[1]));
        } catch {
          // Ya no existe o nunca existió — nada que limpiar.
        }
      }),
    );
  }
}
