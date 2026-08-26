import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InstallationsService {
  constructor(private prisma: PrismaService) {}

  async create(createInstallationDto: CreateInstallationDto) {
    return this.prisma.installation.create({
      data: createInstallationDto,
    });
  }

  async findAll() {
    return this.prisma.installation.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // TODAS las instalaciones (incluidas las inactivas), para el panel de admin.
  async findAllForAdmin() {
    return this.prisma.installation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const installation = await this.prisma.installation.findUnique({
      where: { id },
    });
    if (!installation) {
      throw new NotFoundException(`Installation with ID ${id} not found`);
    }
    return installation;
  }

  async update(id: number, updateInstallationDto: UpdateInstallationDto) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.installation.update({
      where: { id },
      data: updateInstallationDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.installation.delete({
      where: { id },
    });
  }
}
