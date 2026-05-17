import { PrismaClient } from '@prisma/client';

const FACTURA_INCLUDE = {
  detalles: true,
} as const;

export class FacturaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(page = 1, limit = 20, reservaId?: string) {
    const where: any = reservaId ? { reservaId } : {};
    const [total, data] = await Promise.all([
      this.prisma.factura.count({ where }),
      this.prisma.factura.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: FACTURA_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string) {
    return this.prisma.factura.findUnique({ where: { id }, include: FACTURA_INCLUDE });
  }

  findByNumero(numeroFactura: string) {
    return this.prisma.factura.findUnique({ where: { numeroFactura }, include: FACTURA_INCLUDE });
  }

  async create(data: {
    reservaId:   string;
    pagoId?:     string;
    rucCliente?: string;
    razonSocial?: string;
    detalles: Array<{ descripcion: string; cantidad: number; precioUnit: number }>;
  }) {
    const IVA_RATE = 0.15;
    const detallesConSubtotal = data.detalles.map(d => ({
      ...d,
      subtotal: d.precioUnit * d.cantidad,
    }));
    const subtotal = detallesConSubtotal.reduce((s, d) => s + d.subtotal, 0);
    const iva      = subtotal * IVA_RATE;
    const total    = subtotal + iva;
    const numeroFactura = `FAC-${Date.now()}`;

    const { detalles, ...facturaData } = data;
    return this.prisma.factura.create({
      data: {
        ...facturaData,
        numeroFactura,
        subtotal,
        iva,
        total,
        detalles: { create: detallesConSubtotal },
      },
      include: FACTURA_INCLUDE,
    });
  }
}
