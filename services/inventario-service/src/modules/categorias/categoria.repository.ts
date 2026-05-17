import { PrismaClient } from '@prisma/client';

export class CategoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.categoria.findUnique({ where: { id } });
  }

  create(data: { nombre: string; descripcion?: string }) {
    return this.prisma.categoria.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.categoria.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.categoria.delete({ where: { id } });
  }
}
