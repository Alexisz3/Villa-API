import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { imageUploadLimits } from '../../common/image-upload.options';
import { assertUploadedFilesAreRealImages } from '../../common/verify-image-content';
import { ContentSectionsService } from './content-sections.service';
import { CreateContentSectionDto } from './dto/create-content-section.dto';
import { UpdateContentSectionDto } from './dto/update-content-section.dto';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads';

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Content Sections')
@Controller('content-sections')
export class ContentSectionsController {
  constructor(private readonly contentSectionsService: ContentSectionsService) {}

  @Get()
  findAll(@Query('sectionName') sectionName?: string) {
    if (sectionName) {
      return this.contentSectionsService.findByName(sectionName);
    }
    return this.contentSectionsService.findAll();
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
    await assertUploadedFilesAreRealImages([
      ...(files?.banner ?? []),
      ...(files?.images ?? []),
    ]);

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
    @Param('id') id: string,
    @Body() dto: UpdateContentSectionDto,
    @UploadedFiles() files: { banner?: Express.Multer.File[], images?: Express.Multer.File[] }
  ) {
    await assertUploadedFilesAreRealImages([
      ...(files?.banner ?? []),
      ...(files?.images ?? []),
    ]);

    if (files?.banner?.length) {
      dto.banner = `/uploads/${files.banner[0].filename}`;
    }
    if (files?.images?.length) {
      dto.images = files.images.map(f => `/uploads/${f.filename}`);
    }
    return this.contentSectionsService.update(+id, dto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('content_sections:delete')
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentSectionsService.remove(+id);
  }
}
