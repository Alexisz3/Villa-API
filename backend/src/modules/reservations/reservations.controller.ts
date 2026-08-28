import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { ReservationsMaintenanceService } from './reservations-maintenance.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly maintenance: ReservationsMaintenanceService,
  ) { }

  // Dispara a mano el mismo mantenimiento que corre el cron diario
  // (CONFIRMADA vencida -> COMPLETADA, PENDIENTE vencida -> CANCELADA).
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:update')
  @ApiBearerAuth()
  @Post('run-maintenance')
  @ApiOperation({ summary: 'Run reservation lifecycle maintenance now' })
  runMaintenance() {
    return this.maintenance.run();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'The reservation has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Room might be unavailable or validation failed.' })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:read')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponse({ status: 200, description: 'Return all reservations.' })
  findAll() {
    return this.reservationsService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:read')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by id' })
  @ApiResponse({ status: 200, description: 'Return the reservation.' })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:update')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiResponse({ status: 200, description: 'The reservation has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:delete')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiResponse({ status: 200, description: 'The reservation has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('reservations:update')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'update reservation status (PENDIENTE, CONFIRMADA, CANCELADA)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    // Validar que el status sea correcto
    const validStatuses = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Estado de reserva no válido.');
    }

    return this.reservationsService.update(id, { status });
  }
}