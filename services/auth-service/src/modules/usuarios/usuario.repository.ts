import { PrismaClient } from '@prisma/client';

const include = {
  cliente: true,
};

function sanitize<T extends { passwordHash?: string }>(u: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...safe } = u;
  return safe;
}

export class UsuarioRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [raw, total] = await Promise.all([
      this.db.usuario.findMany({ skip, take: limit, include, orderBy: { createdAt: 'desc' } }),
      this.db.usuario.count(),
    ]);
    return { data: raw.map(sanitize), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.db.usuario.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.db.usuario.findUnique({ where: { email }, include });
  }

  async findByEmailForLogin(email: string) {
    return this.db.usuario.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, nombres: true, apellidos: true, telefono: true, role: true, isActive: true },
    });
  }

  async findByCedula(cedula: string) {
    return this.db.usuario.findUnique({ where: { cedula } });
  }

  async findByIdWithRelations(id: string) {
    const u = await this.db.usuario.findUnique({ where: { id }, include });
    return u ? sanitize(u) : null;
  }

  async create(data: any) {
    const u = await this.db.usuario.create({ data, include });
    return sanitize(u);
  }

  async update(id: string, data: any) {
    const u = await this.db.usuario.update({ where: { id }, data, include });
    return sanitize(u);
  }

  async delete(id: string) {
    await this.db.usuario.update({ where: { id }, data: { isActive: false } });
  }
}
