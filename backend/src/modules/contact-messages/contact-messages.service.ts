import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactMessagesService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateContactMessageDto) {
        return this.prisma.contactMessage.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                message: dto.message,
            },
        });
    }

    findAll() {
        return this.prisma.contactMessage.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findOne(id: number) {
        const message = await this.prisma.contactMessage.findUnique({
            where: { id },
        });

        if (!message) {
            throw new NotFoundException(`Mensaje con id ${id} no encontrado`);
        }

        return message;
    }

    async updateStatus(id: number, status: string) {
        const existingMessage = await this.prisma.contactMessage.findUnique({
            where: { id },
        });

        if (!existingMessage) {
            throw new NotFoundException(
                `Mensaje con id ${id} no encontrado`,
            );
        }

        return this.prisma.contactMessage.update({
            where: { id },
            data: { status },
        });
    }
}
