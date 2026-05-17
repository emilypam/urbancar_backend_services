import { PrismaClient } from '@prisma/client';

export class TipoTransmisionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.tipoTransmision.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(data: { nombre: string }) {
    return this.prisma.tipoTransmision.create({ data });
  }

  delete(id: string) {
    return this.prisma.tipoTransmision.delete({ where: { id } });
  }
}
