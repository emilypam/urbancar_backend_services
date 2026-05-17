import { PrismaClient } from '@prisma/client';

export class PagoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(page = 1, limit = 20, reservaId?: string, status?: string) {
    const where: any = {};
    if (reservaId) where.reservaId = reservaId;
    if (status)    where.status    = status;

    const [total, data] = await Promise.all([
      this.prisma.pago.count({ where }),
      this.prisma.pago.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string) {
    return this.prisma.pago.findUnique({ where: { id } });
  }

  findByReservaId(reservaId: string) {
    return this.prisma.pago.findMany({ where: { reservaId }, orderBy: { createdAt: 'desc' } });
  }

  create(data: any) {
    return this.prisma.pago.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.pago.update({ where: { id }, data });
  }
}
