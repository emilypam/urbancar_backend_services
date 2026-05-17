import { PrismaClient } from '@prisma/client';

export class MantenimientoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(page = 1, limit = 20, vehiculoId?: string) {
    const where: any = { isActive: true };
    if (vehiculoId) where.vehiculoId = vehiculoId;

    const [total, data] = await Promise.all([
      this.prisma.mantenimiento.count({ where }),
      this.prisma.mantenimiento.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { fechaInicio: 'desc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string) {
    return this.prisma.mantenimiento.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.mantenimiento.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.mantenimiento.update({ where: { id }, data });
  }
}
