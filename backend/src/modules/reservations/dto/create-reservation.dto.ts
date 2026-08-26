import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEmail, IsPhoneNumber } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
    @ApiProperty({ description: 'ID of the room being reserved', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    roomId: number;

    @ApiProperty({ description: 'Optional ID of the customer if they already exist', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    customerId?: number;

    @ApiProperty({ description: 'Check-in date in ISO format', example: '2023-12-01T14:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    checkIn: string;

    @ApiProperty({ description: 'Check-out date in ISO format', example: '2023-12-05T10:00:00.000Z' })
    @IsDateString()
    @IsNotEmpty()
    checkOut: string;

    @ApiProperty({ description: 'Total price of the reservation', example: 250.50, required: false })
    @IsNumber()
    @IsOptional()
    totalPrice?: number;

    @ApiProperty({ description: 'First name of the customer', example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ description: 'Last name of the customer', example: 'Pérez' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ description: 'Email address of the customer', example: 'juan.perez@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Phone number of the customer', example: '+1234567890', required: false })
    @IsPhoneNumber()
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'Identification document number', example: '12345678', required: false })
    @IsString()
    @IsOptional()
    document?: string;

    @ApiProperty({ description: 'Number of guests, as chosen in the booking form', example: '2 personas', required: false })
    @IsString()
    @IsOptional()
    guests?: string;

    @ApiProperty({ description: 'Additional message from the guest', example: 'Llegamos tarde en la noche', required: false })
    @IsString()
    @IsOptional()
    message?: string;

    @ApiProperty({ description: 'Preferred arrival time (HH:mm)', example: '15:00', required: false })
    @IsString()
    @IsOptional()
    preferredTime?: string;
}
