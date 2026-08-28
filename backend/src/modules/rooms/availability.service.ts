import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Estados de reserva que "ocupan" la habitación en el calendario. Coincide con
// la constraint EXCLUDE de la BD (todo lo que no sea CANCELADA), salvo que aquí
// además ignoramos las ya COMPLETADA porque son pasado.
export const BLOCKING_STATUSES = ['PENDIENTE', 'CONFIRMADA'] as const;

export type UpcomingReservation = {
  id: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  status: string;
  guestName: string | null;
};

export type RoomAvailability = {
  state: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  // OCCUPIED: día (YYYY-MM-DD) en que la habitación queda libre — fin del bloque
  // continuo de reservas encadenadas. El huésped se va ese día.
  availableFrom: string | null;
  // RESERVED: día de la próxima entrada.
  nextReservationFrom: string | null;
  // Solo para el panel admin: reservas actuales/futuras que bloquean la
  // habitación (incluye el nombre del huésped).
  upcoming?: UpcomingReservation[];
};

type ReservationRow = {
  id: number;
  roomId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  customer: { firstName: string; lastName: string } | null;
};

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayStr(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  // Adjunta `availability` a cada habitación. `includeGuest` controla si se
  // devuelve la lista `upcoming` con nombres (solo el panel admin).
  async attach<T extends { id: number }>(
    rooms: T[],
    { includeGuest = false }: { includeGuest?: boolean } = {},
  ): Promise<(T & { availability: RoomAvailability })[]> {
    if (rooms.length === 0) return [];

    const today = todayStr();
    const roomIds = rooms.map((room) => room.id);

    const reservations = (await this.prisma.reservation.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: [...BLOCKING_STATUSES] },
        checkOut: { gt: new Date(`${today}T00:00:00.000Z`) },
      },
      select: {
        id: true,
        roomId: true,
        checkIn: true,
        checkOut: true,
        status: true,
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { checkIn: 'asc' },
    })) as ReservationRow[];

    const byRoom = new Map<number, ReservationRow[]>();
    for (const reservation of reservations) {
      const list = byRoom.get(reservation.roomId) ?? [];
      list.push(reservation);
      byRoom.set(reservation.roomId, list);
    }

    return rooms.map((room) => ({
      ...room,
      availability: this.computeOne(
        byRoom.get(room.id) ?? [],
        today,
        includeGuest,
      ),
    }));
  }

  private computeOne(
    reservations: ReservationRow[],
    today: string,
    includeGuest: boolean,
  ): RoomAvailability {
    const ranges = reservations
      .map((r) => ({
        in: toDateStr(r.checkIn),
        out: toDateStr(r.checkOut),
        row: r,
      }))
      .sort((a, b) => (a.in < b.in ? -1 : a.in > b.in ? 1 : 0));

    const upcoming: UpcomingReservation[] | undefined = includeGuest
      ? ranges.map(({ row, in: checkIn, out: checkOut }) => ({
          id: row.id,
          checkIn,
          checkOut,
          status: row.status,
          guestName: row.customer
            ? `${row.customer.firstName} ${row.customer.lastName}`.trim()
            : null,
        }))
      : undefined;

    // Reserva que cubre HOY: checkIn <= hoy < checkOut (el día de salida ya
    // cuenta como libre).
    const current = ranges.find((r) => r.in <= today && today < r.out);

    if (current) {
      // Avanza mientras haya reservas encadenadas sin hueco.
      let cursor = current.out;
      let advanced = true;
      while (advanced) {
        advanced = false;
        for (const r of ranges) {
          if (r.in <= cursor && r.out > cursor) {
            cursor = r.out;
            advanced = true;
          }
        }
      }
      return {
        state: 'OCCUPIED',
        availableFrom: cursor,
        nextReservationFrom: null,
        ...(upcoming ? { upcoming } : {}),
      };
    }

    const next = ranges.find((r) => r.in > today);
    if (next) {
      return {
        state: 'RESERVED',
        availableFrom: null,
        nextReservationFrom: next.in,
        ...(upcoming ? { upcoming } : {}),
      };
    }

    return {
      state: 'AVAILABLE',
      availableFrom: null,
      nextReservationFrom: null,
      ...(upcoming ? { upcoming } : {}),
    };
  }
}
