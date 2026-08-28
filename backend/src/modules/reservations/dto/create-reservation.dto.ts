import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEmail, MaxLength } from "class-validator";
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

    // Campo de contacto opcional: el equipo llama/escribe manualmente para
    // confirmar, así que aceptamos cualquier formato razonable (local con o
    // sin código de país, espacios, guiones) en vez de rechazar la reserva
    // por un detalle de formato. Mismo criterio que el formulario de contacto.
    @ApiProperty({ description: 'Phone number of the customer', example: '+593 98 736 6584', required: false, maxLength: 30 })
    @IsString()
    @MaxLength(30)
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
