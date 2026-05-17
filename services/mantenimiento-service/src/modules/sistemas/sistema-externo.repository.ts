import { PrismaClient } from '@prisma/client';

export class SistemaExternoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(onlyActive = false) {
    return this.prisma.sistemaExterno.findMany({
      where:   onlyActive ? { isActive: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.sistemaExterno.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.sistemaExterno.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.sistemaExterno.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.sistemaExterno.update({ where: { id }, data: { isActive: false } });
  }
}
