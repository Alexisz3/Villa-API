import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { imageUploadLimits } from '../../common/image-upload.options';
import { assertUploadedFilesAreRealImages } from '../../common/verify-image-content';
import { createImageDiskStorage } from '../../common/upload-storage';
import { MediaService } from './media.service';
import { QueryMediaDto } from './dto/query-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:read')
  @ApiBearerAuth()
  @Get()
  list(@Query() query: QueryMediaDto) {
    return this.mediaService.list(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:read')
  @ApiBearerAuth()
  @Get('folders')
  folders() {
    return this.mediaService.listFolders();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:create')
  @ApiBearerAuth()
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: createImageDiskStorage('media'),
      ...imageUploadLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadMediaDto,
  ) {
    await assertUploadedFilesAreRealImages(files ?? []);
    return this.mediaService.registerAssets(files ?? [], dto.folder);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:update')
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMediaDto) {
    return this.mediaService.updateMeta(id, dto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:update')
  @ApiBearerAuth()
  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.restore(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('media:delete')
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.softDelete(id);
  }
}
