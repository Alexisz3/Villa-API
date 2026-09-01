import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../database/prisma.service';
import { AvailabilityService, BLOCKING_STATUSES } from './availability.service';

@Injectable()
export class RoomsService {

  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
  ) { }

  async create(createRoomDto: CreateRoomDto) {
    return this.prisma.room.create({
      data: createRoomDto,
    });
  }

  async findAll() {
    const rooms = await this.prisma.room.findMany({
      // La visibilidad pública la controla SOLO `status` (lo que el panel
      // de admin activa/desactiva). `isActive` quedó como campo duplicado
      // y ya no se usa para filtrar.
      where: {
        status: { equals: 'active', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
    // El sitio público ve el estado de disponibilidad pero no datos del huésped.
    return this.availability.attach(rooms, { includeGuest: false });
  }

  // TODAS las habitaciones (incluidas las inactivas), para el panel de admin.
  async findAllForAdmin() {
    const rooms = await this.prisma.room.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return this.availability.attach(rooms, { includeGuest: true });
  }

  // BUSCAR HABITACIONES DISPONIBLES EN UNAS FECHAS
  async findAvailableRooms(checkIn: string, checkOut: string) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    return this.prisma.room.findMany({
      where: {
        status: { equals: 'active', mode: 'insensitive' },
        // Solo PENDIENTE / CONFIRMADA ocupan la habitación — una reserva
        // COMPLETADA o CANCELADA no impide una reserva nueva en esas fechas.
        // Misma regla que AvailabilityService y los chequeos de choque.
        reservations: {
          none: {
            status: { in: [...BLOCKING_STATUSES] },
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } },
            ],
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    await this.findOne(id);

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }
}
