import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsMaintenanceService } from './reservations-maintenance.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from 'src/database/database.module';



import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsMaintenanceService],
})
export class ReservationsModule { }
