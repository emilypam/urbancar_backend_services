import { PrismaClient } from '@prisma/client';

export class KardexRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(page = 1, limit = 50, vehiculoId?: string) {
    const where: any = {};
    if (vehiculoId) where.vehiculoId = vehiculoId;

    const [total, data] = await Promise.all([
      this.prisma.kardex.count({ where }),
      this.prisma.kardex.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findByVehiculo(vehiculoId: string) {
    return this.prisma.kardex.findMany({
      where:   { vehiculoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: any) {
    return this.prisma.kardex.create({ data });
  }
}
