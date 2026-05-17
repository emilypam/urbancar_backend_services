import { PrismaClient } from '@prisma/client';

export class ModeloRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(marcaId?: string) {
    return this.prisma.modelo.findMany({
      where:   marcaId ? { marcaId } : undefined,
      include: { marca: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.modelo.findUnique({ where: { id }, include: { marca: true } });
  }

  create(data: { marcaId: string; nombre: string }) {
    return this.prisma.modelo.create({ data, include: { marca: true } });
  }

  update(id: string, data: any) {
    return this.prisma.modelo.update({ where: { id }, data, include: { marca: true } });
  }

  delete(id: string) {
    return this.prisma.modelo.delete({ where: { id } });
  }
}
