import { PrismaClient } from '@prisma/client';

export class ExtraRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll(onlyActive = false) {
    return this.prisma.extraEquipamiento.findMany({
      where:   onlyActive ? { isActive: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.extraEquipamiento.findUnique({ where: { id } });
  }

  create(data: { nombre: string; descripcion?: string; precioDia: number }) {
    return this.prisma.extraEquipamiento.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.extraEquipamiento.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.extraEquipamiento.update({ where: { id }, data: { isActive: false } });
  }
}
