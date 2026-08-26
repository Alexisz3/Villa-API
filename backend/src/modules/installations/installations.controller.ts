import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InstallationsService } from './installations.service';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Installations')
@Controller('installations')
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('installations:create')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new installation' })
  @ApiResponse({ status: 201, description: 'The installation has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  create(@Body() createInstallationDto: CreateInstallationDto) {
    return this.installationsService.create(createInstallationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active installations' })
  @ApiResponse({ status: 200, description: 'Return active installations.' })
  findAll() {
    return this.installationsService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('installations:update')
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({ summary: 'Get all installations, including inactive ones (admin panel)' })
  @ApiResponse({ status: 200, description: 'Return all installations regardless of status.' })
  findAllForAdmin() {
    return this.installationsService.findAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an installation by id' })
  @ApiResponse({ status: 200, description: 'Return the installation.' })
  @ApiResponse({ status: 404, description: 'Installation not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.installationsService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('installations:update')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an installation' })
  @ApiResponse({ status: 200, description: 'The installation has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Installation not found.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInstallationDto: UpdateInstallationDto) {
    return this.installationsService.update(id, updateInstallationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('installations:delete')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an installation' })
  @ApiResponse({ status: 200, description: 'The installation has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Installation not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.installationsService.remove(id);
  }
}
