import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ description: 'Name of the room/cabin', example: 'Cabaña del Bosque' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Description of the room', example: 'Una cabaña rústica con vista a la montaña.' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Capacity of the room (number of guests)', example: 4, minimum: 1, maximum: 100 })
    @IsNumber()
    @Min(1)
    @Max(100)
    capacity: number;

    @ApiProperty({ description: 'Price per night', example: 120.50, minimum: 0 })
    @IsNumber()
    @Min(0)
    pricePerNight: number;

    @ApiProperty({ description: 'URL of the main photo for the room', example: 'https://example.com/photo.jpg' })
    @IsString()
    @IsNotEmpty()
    photoUrl: string;

    @ApiProperty({ description: 'Status of the room (e.g. active, inactive)', example: 'active' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({ description: 'Type of room', example: 'standard' })
    @IsString()
    @IsNotEmpty()
    type: string;
}
