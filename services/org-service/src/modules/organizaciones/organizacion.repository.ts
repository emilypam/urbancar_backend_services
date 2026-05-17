import { PrismaClient } from '@prisma/client';

export class OrganizacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Empresas ─────────────────────────────────────────────────────────────────
  async findAllEmpresas(page = 1, limit = 20) {
    const where = { isActive: true };
    const [total, data] = await Promise.all([
      this.prisma.empresa.count({ where }),
      this.prisma.empresa.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: { agencias: { select: { id: true, nombre: true, isActive: true } } },
        orderBy: { nombre: 'asc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findEmpresaById(id: string) {
    return this.prisma.empresa.findFirst({
      where:   { id, isActive: true },
      include: { agencias: { include: { ciudad: { include: { provincia: true } } } } },
    });
  }

  createEmpresa(data: any) {
    return this.prisma.empresa.create({ data });
  }

  updateEmpresa(id: string, data: any) {
    return this.prisma.empresa.update({ where: { id }, data });
  }

  deleteEmpresa(id: string) {
    return this.prisma.empresa.update({ where: { id }, data: { isActive: false } });
  }

  // ── Agencias ──────────────────────────────────────────────────────────────────
  async findAllAgencias(page = 1, limit = 20, empresaId?: string) {
    const where: any = { isActive: true };
    if (empresaId) where.empresaId = empresaId;

    const [total, data] = await Promise.all([
      this.prisma.agencia.count({ where }),
      this.prisma.agencia.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          empresa: { select: { id: true, nombre: true } },
          ciudad:  { include: { provincia: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findAgenciaById(id: string) {
    return this.prisma.agencia.findFirst({
      where:   { id, isActive: true },
      include: {
        empresa: true,
        ciudad:  { include: { provincia: true } },
      },
    });
  }

  createAgencia(data: any) {
    return this.prisma.agencia.create({
      data,
      include: {
        empresa: { select: { id: true, nombre: true } },
        ciudad:  { include: { provincia: true } },
      },
    });
  }

  updateAgencia(id: string, data: any) {
    return this.prisma.agencia.update({
      where:   { id },
      data,
      include: {
        empresa: { select: { id: true, nombre: true } },
        ciudad:  { include: { provincia: true } },
      },
    });
  }

  deleteAgencia(id: string) {
    return this.prisma.agencia.update({ where: { id }, data: { isActive: false } });
  }
}
