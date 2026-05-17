import { PrismaClient } from '@prisma/client';

interface VehiculoFilters {
  agenciaId?:   string;
  categoriaId?: string;
  status?:      string;
}

export class VehiculoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(page = 1, limit = 20, filters: VehiculoFilters = {}) {
    const where: any = { isActive: true };
    if (filters.agenciaId)   where.agenciaId   = filters.agenciaId;
    if (filters.categoriaId) where.categoriaId = filters.categoriaId;
    if (filters.status)      where.status       = filters.status;

    const [total, data] = await Promise.all([
      this.prisma.vehiculo.count({ where }),
      this.prisma.vehiculo.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        include: {
          modelo:           { include: { marca: true } },
          categoria:        true,
          tipoCombustible:  true,
          tipoTransmision:  true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string) {
    return this.prisma.vehiculo.findFirst({
      where: { id, isActive: true },
      include: {
        modelo:          { include: { marca: true } },
        categoria:       true,
        tipoCombustible: true,
        tipoTransmision: true,
      },
    });
  }

  create(data: any) {
    return this.prisma.vehiculo.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.vehiculo.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.vehiculo.update({
      where: { id },
      data:  { isActive: false, deletedAt: new Date() },
    });
  }
}
