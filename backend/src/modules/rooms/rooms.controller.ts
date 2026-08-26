import { Controller, Get, Post, Body, Patch, Param, UseGuards, BadRequestException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { imageUploadLimits } from '../../common/image-upload.options';
import { assertUploadedFileIsRealImage } from '../../common/verify-image-content';
import { Query, } from '@nestjs/common';

const imageStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads';

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `room-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('rooms:create')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new room/cabin' })
  @ApiResponse({ status: 201, description: 'The room has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('rooms:create')
  @ApiBearerAuth()
  @Post('upload')
  @UseInterceptors(FileInterceptor('image', { storage: imageStorage, ...imageUploadLimits }))
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    await assertUploadedFileIsRealImage(image);

    return {
      photoUrl: `/uploads/${image.filename}`,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiResponse({ status: 200, description: 'Return all rooms.' })
  findAll() {
    return this.roomsService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('rooms:update')
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({ summary: 'Get all rooms, including inactive ones (admin panel)' })
  @ApiResponse({ status: 200, description: 'Return all rooms regardless of status.' })
  findAllForAdmin() {
    return this.roomsService.findAllForAdmin();
  }

  @Get("available")
  @ApiOperation({ summary: "Get all available rooms" })
  @ApiResponse({ status: 200, description: "Return all available rooms." })
  findAvailableRooms(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string) {
    if (!checkIn || !checkOut) {
      throw new BadRequestException("Fechas de entrada y salida requeridas.");
    }
    return this.roomsService.findAvailableRooms(checkIn, checkOut);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiResponse({ status: 200, description: 'Return the room.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('rooms:update')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'The room has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Room not found.' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }
}
