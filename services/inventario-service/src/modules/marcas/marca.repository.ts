import { PrismaClient } from '@prisma/client';

export class MarcaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.marca.findMany({ include: { modelos: true }, orderBy: { nombre: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.marca.findUnique({ where: { id }, include: { modelos: true } });
  }

  create(data: { nombre: string; logoUrl?: string }) {
    return this.prisma.marca.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.marca.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.marca.delete({ where: { id } });
  }
}
