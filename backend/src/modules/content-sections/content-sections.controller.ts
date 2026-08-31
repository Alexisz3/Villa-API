import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { imageUploadLimits } from '../../common/image-upload.options';
import { assertUploadedFilesAreRealImages } from '../../common/verify-image-content';
import { createImageDiskStorage } from '../../common/upload-storage';
import { MediaService } from '../media/media.service';
import { ContentSectionsService } from './content-sections.service';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

const storage = createImageDiskStorage();

@ApiTags('Content Sections')
@Controller('content-sections')
export class ContentSectionsController {
  constructor(
    private readonly contentSectionsService: ContentSectionsService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  findAll(@Query('sectionName') sectionName?: string) {
    if (sectionName) {
      return this.contentSectionsService.findByName(sectionName);
    }
    return this.contentSectionsService.findAll();
  }

  // Igual que arriba pero incluye el borrador de cada sección (columna
  // `draft`), para que el panel pueda precargar cambios sin publicar. No hay
  // permiso `content_sections:read` en el seed, así que se reutiliza
  // `update` ("si puedes editar, puedes ver el borrador").
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:update')
  @ApiBearerAuth()
  @Get('admin')
  findAllAdmin() {
    return this.contentSectionsService.findAllAdmin();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:create')
  @ApiBearerAuth()
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'banner', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ], { storage, ...imageUploadLimits }))
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() dto: CreateContentSectionDto,
    @UploadedFiles() files: { banner?: Express.Multer.File[], images?: Express.Multer.File[] }
  ) {
    const uploaded = [...(files?.banner ?? []), ...(files?.images ?? [])];
    await assertUploadedFilesAreRealImages(uploaded);
    await this.mediaService.registerAssets(uploaded, dto.folder);
    delete dto.folder; // pista para la biblioteca, no es un campo de la sección

    if (files?.banner?.length) {
      dto.banner = `/uploads/${files.banner[0].filename}`;
    }
    if (files?.images?.length) {
      // If we are passing multiple files, map to an array of paths
      dto.images = files.images.map(f => `/uploads/${f.filename}`);
    }
    return this.contentSectionsService.create(dto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:update')
  @ApiBearerAuth()
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'banner', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ], { storage, ...imageUploadLimits }))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentSectionDto,
    @UploadedFiles() files: { banner?: Express.Multer.File[], images?: Express.Multer.File[] }
  ) {
    const uploaded = [...(files?.banner ?? []), ...(files?.images ?? [])];
    await assertUploadedFilesAreRealImages(uploaded);
    await this.mediaService.registerAssets(uploaded, dto.folder);
    delete dto.folder; // pista para la biblioteca, no es un campo de la sección

    if (files?.banner?.length) {
      dto.banner = `/uploads/${files.banner[0].filename}`;
    }
    if (files?.images?.length) {
      dto.images = files.images.map(f => `/uploads/${f.filename}`);
    }
    return this.contentSectionsService.update(id, dto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:update')
  @ApiBearerAuth()
  @Patch(':id/images/order')
  reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.contentSectionsService.reorderImages(id, dto.images);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:update')
  @ApiBearerAuth()
  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.contentSectionsService.publish(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:update')
  @ApiBearerAuth()
  @Post(':id/discard-draft')
  discardDraft(@Param('id', ParseIntPipe) id: number) {
    return this.contentSectionsService.discardDraft(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:delete')
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentSectionsService.remove(id);
  }
}
