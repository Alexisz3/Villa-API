import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PrismaService } from '../../database/prisma.service';
import { BLOCKING_STATUSES, todayStr } from '../rooms/availability.service';

// Estados que "ocupan" una habitación en el calendario. Una reserva CANCELADA
// no bloquea; una COMPLETADA tampoco (la estadía ya terminó). Se usa la misma
// lista en el formulario público, los chequeos de choque y las tarjetas del
// admin para que todo muestre lo mismo. La constraint EXCLUDE de la BD es más
// estricta a propósito (red de seguridad ante condiciones de carrera).
const blocks = { in: [...BLOCKING_STATUSES] };

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) { }

  // 1. CREAR UNA RESERVA (Con validación anti-choques)
  async create(dto: CreateReservationDto) {
    // A. Convertir los strings de fecha a objetos Date reales
    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);



    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('La fecha de salida debe ser mayor a la fecha de entrada.');
    }

    if (checkInDate < new Date()) {
      throw new BadRequestException('La fecha de entrada debe ser mayor a la fecha actual.');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId }
    });

    if (!room) {
      throw new BadRequestException("La cabaña seleccionada no existe.");
    }

    if (!room.isActive || room.status.toLowerCase() !== 'active') {
      throw new BadRequestException("La cabaña seleccionada no esta disponible actualmente.");

    }

    // B. Buscar si ya existe una reserva que se cruce en esas fechas para esa misma habitación
    const conflictingReservation = await this.prisma.reservation.findFirst({
      where: {
        roomId: dto.roomId,
        status: blocks, // solo PENDIENTE / CONFIRMADA bloquean
        AND: [
          { checkIn: { lt: checkOutDate } }, // La entrada es antes de que el nuevo salga
          { checkOut: { gt: checkInDate } }, // La salida es después de que el nuevo entre
        ],
      },
    });

    if (conflictingReservation) {
      throw new BadRequestException('Lo sentimos, la cabaña ya está reservada en esas fechas.');
    }

    // C. Como la habitación está libre, procedemos a crear (o buscar) al cliente y hacer la reserva.
    // Usaremos algo llamado "Transacción" o conectaremos los datos.

    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const realTotalPrice = diffDays * Number(room.pricePerNight);

    // D. El chequeo de arriba (paso B) tiene una condición de carrera: dos
    // requests simultáneas pueden pasar ambas antes de que cualquiera
    // confirme. Por eso además hay una restricción a nivel de base de datos
    // (migración reservation_no_overlap_constraint) que hace imposible
    // guardar dos reservas cruzadas para la misma habitación, sin importar
    // el timing. Si esa restricción es la que frena esta inserción, la
    // traducimos al mismo mensaje amigable de siempre.
    try {
      return await this.prisma.reservation.create({
        include: { room: true, customer: true },
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice: realTotalPrice,
          status: 'PENDIENTE',
          guests: dto.guests,
          message: dto.message,
          preferredTime: dto.preferredTime,
          room: { connect: { id: dto.roomId } },
          customer: {
            // Si el cliente existe por su email, lo conecta; si no, lo crea mágicamente
            connectOrCreate: {
              where: { email: dto.email },
              create: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                document: dto.document,
              },
            },
          },
        },
      });
    } catch (error) {
      if (this.isOverlapConstraintError(error)) {
        throw new BadRequestException('Lo sentimos, la cabaña ya está reservada en esas fechas.');
      }
      throw error;
    }
  }

  private isOverlapConstraintError(error: unknown): boolean {
    const err = error as { code?: string; meta?: { code?: string }; message?: string };
    return (
      err?.code === '23P01' ||
      err?.meta?.code === '23P01' ||
      (typeof err?.message === 'string' && err.message.includes('reservations_no_overlap'))
    );
  }

  // 2. BUSCAR HABITACIONES DISPONIBLES EN UNAS FECHAS
  async findAvailableRooms(checkIn: string, checkOut: string) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Buscamos todas las habitaciones
    return this.prisma.room.findMany({
      where: {
        isActive: true,
        status: { equals: 'active', mode: 'insensitive' },
        // Y que NO tengan reservas que se crucen con estas fechas
        reservations: {
          none: {
            status: blocks,
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } },
            ],
          },
        },
      },
    });
  }

  // 3. LEER TODAS LAS RESERVAS (Para el panel de Admin)
  async findAll() {
    return this.prisma.reservation.findMany({
      include: { room: true, customer: true }, // Traemos la info de la cabaña y el cliente
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. OBTENER UNA RESERVA POR ID
  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true, customer: true },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  // 5. ACTUALIZAR UNA RESERVA
  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const existing = await this.findOne(id); // Ensure it exists

    // We only pass the fields that are allowed to be updated directly on the Reservation model
    // To handle relational updates or complex logic, we might need more specific code.
    const { roomId, checkIn, checkOut, totalPrice, status } = updateReservationDto;

    const nextRoomId = roomId ?? existing.roomId;
    const nextCheckIn = checkIn !== undefined ? new Date(checkIn) : existing.checkIn;
    const nextCheckOut = checkOut !== undefined ? new Date(checkOut) : existing.checkOut;

    if (roomId !== undefined || checkIn !== undefined || checkOut !== undefined) {
      if (nextCheckOut <= nextCheckIn) {
        throw new BadRequestException('La fecha de salida debe ser mayor a la fecha de entrada.');
      }

      // No se puede mover la entrada a una fecha pasada. Se permite conservar
      // un checkIn que ya está en el pasado (editar una reserva vieja), pero
      // no ponerle una fecha de entrada nueva anterior a hoy.
      if (checkIn !== undefined) {
        const today = new Date(`${todayStr()}T00:00:00.000Z`);
        const newDay = `${nextCheckIn.toISOString().slice(0, 10)}`;
        const oldDay = `${existing.checkIn.toISOString().slice(0, 10)}`;
        if (new Date(`${newDay}T00:00:00.000Z`) < today && newDay !== oldDay) {
          throw new BadRequestException('La fecha de entrada no puede ser anterior a hoy.');
        }
      }

      const conflictingReservation = await this.prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: nextRoomId,
          status: blocks,
          AND: [
            { checkIn: { lt: nextCheckOut } },
            { checkOut: { gt: nextCheckIn } },
          ],
        },
      });

      if (conflictingReservation) {
        throw new BadRequestException('Lo sentimos, la cabaña ya está reservada en esas fechas.');
      }
    }

    const dataToUpdate: any = {};
    if (roomId !== undefined) dataToUpdate.roomId = roomId;
    if (checkIn !== undefined) dataToUpdate.checkIn = nextCheckIn;
    if (checkOut !== undefined) dataToUpdate.checkOut = nextCheckOut;
    if (status !== undefined) dataToUpdate.status = status;

    // Si cambian fechas y/o habitación y el caller no mandó un totalPrice
    // explícito, recalculamos con el precio por noche vigente (misma fórmula
    // que create()). Evita que el admin mueva una reserva de fechas/cabaña
    // desde el panel y el precio se quede desactualizado.
    if (totalPrice !== undefined) {
      dataToUpdate.totalPrice = totalPrice;
    } else if (roomId !== undefined || checkIn !== undefined || checkOut !== undefined) {
      const room = roomId !== undefined
        ? await this.prisma.room.findUnique({ where: { id: nextRoomId } })
        : existing.room;

      if (!room) {
        throw new BadRequestException('La cabaña seleccionada no existe.');
      }

      const diffTime = Math.abs(nextCheckOut.getTime() - nextCheckIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dataToUpdate.totalPrice = diffDays * Number(room.pricePerNight);
    }

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data: dataToUpdate,
        include: { room: true, customer: true },
      });
    } catch (error) {
      if (this.isOverlapConstraintError(error)) {
        throw new BadRequestException('Lo sentimos, la cabaña ya está reservada en esas fechas.');
      }
      throw error;
    }
  }

  // 6. ELIMINAR UNA RESERVA
  async remove(id: number) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.reservation.delete({
      where: { id },
    });
  }
}
