import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { todayStr } from '../rooms/availability.service';

export type MaintenanceResult = { completed: number; expired: number };

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Automatiza el ciclo de vida de las reservas para que la disponibilidad de
// las habitaciones se "libere sola" sin que nadie toque nada en el panel:
//   - CONFIRMADA cuya fecha de salida ya pasó  -> COMPLETADA
//   - PENDIENTE cuya fecha de entrada ya pasó y nadie confirmó -> CANCELADA
//
// Corre al arrancar la API y cada 6 horas. Las transiciones son por fecha
// (día), así que la precisión horaria no importa; un simple setInterval basta
// y evita sumar una dependencia de scheduler.
@Injectable()
export class ReservationsMaintenanceService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationsMaintenanceService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    // En los tests no queremos timers de fondo ni escrituras inesperadas.
    if (process.env.NODE_ENV === 'test') return;

    void this.safeRun();
    this.timer = setInterval(() => void this.safeRun(), SIX_HOURS_MS);
    // No debe impedir que el proceso termine.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async safeRun(): Promise<void> {
    try {
      const result = await this.run();
      if (result.completed || result.expired) {
        this.logger.log(
          `Mantenimiento de reservas: ${result.completed} completada(s), ${result.expired} solicitud(es) vencida(s) cancelada(s).`,
        );
      }
    } catch (error) {
      this.logger.error('Falló el mantenimiento de reservas', error as Error);
    }
  }

  async run(now: Date = new Date()): Promise<MaintenanceResult> {
    const today = new Date(`${todayStr(now)}T00:00:00.000Z`);

    const [completed, expired] = await this.prisma.$transaction([
      this.prisma.reservation.updateMany({
        where: { status: 'CONFIRMADA', checkOut: { lte: today } },
        data: { status: 'COMPLETADA' },
      }),
      this.prisma.reservation.updateMany({
        where: { status: 'PENDIENTE', checkIn: { lt: today } },
        data: { status: 'CANCELADA' },
      }),
    ]);

    return { completed: completed.count, expired: expired.count };
  }
}
