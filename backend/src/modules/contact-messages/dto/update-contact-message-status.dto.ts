import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContactMessageStatusDto {
    @ApiProperty({ description: 'New status for the contact message', enum: ['pendiente', 'leido', 'respondido', 'archivado'], example: 'leido' })
    @IsIn(['pendiente', 'leido', 'respondido', 'archivado'])
    status: string;
}