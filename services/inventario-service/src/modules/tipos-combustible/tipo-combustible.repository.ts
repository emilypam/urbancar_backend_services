import { PrismaClient } from '@prisma/client';

export class TipoCombustibleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.tipoCombustible.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(data: { nombre: string }) {
    return this.prisma.tipoCombustible.create({ data });
  }

  delete(id: string) {
    return this.prisma.tipoCombustible.delete({ where: { id } });
  }
}
