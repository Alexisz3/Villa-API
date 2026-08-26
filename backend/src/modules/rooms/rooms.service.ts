import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RoomsService {

  constructor(private prisma: PrismaService) { }

  async create(createRoomDto: CreateRoomDto) {
    return this.prisma.room.create({
      data: createRoomDto,
    });
  }

  async findAll() {
    return this.prisma.room.findMany({
      where: {
        isActive: true,
        status: { equals: 'active', mode: 'insensitive' },
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  // TODAS las habitaciones (incluidas las inactivas), para el panel de admin.
  async findAllForAdmin() {
    return this.prisma.room.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // BUSCAR HABITACIONES DISPONIBLES EN UNAS FECHAS
  async findAvailableRooms(checkIn: string, checkOut: string) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    return this.prisma.room.findMany({
      where: {
        isActive: true,
        status: { equals: 'active', mode: 'insensitive' },
        reservations: {
          none: {
            status: { not: 'CANCELADA' },
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
