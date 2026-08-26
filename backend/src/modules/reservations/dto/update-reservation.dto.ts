import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateReservationDto } from './create-reservation.dto';

const RESERVATION_STATUSES = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
    @ApiProperty({ description: 'Status of the reservation', example: 'PENDIENTE', required: false, enum: RESERVATION_STATUSES })
    @IsIn(RESERVATION_STATUSES)
    @IsOptional()
    status?: string;
}
