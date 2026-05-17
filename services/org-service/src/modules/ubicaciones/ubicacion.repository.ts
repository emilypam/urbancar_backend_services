import { PrismaClient } from '@prisma/client';

export class UbicacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Provincias ────────────────────────────────────────────────────────────────
  findAllProvincias() {
    return this.prisma.provincia.findMany({
      include: { ciudades: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findProvinciaById(id: string) {
    return this.prisma.provincia.findUnique({
      where:   { id },
      include: { ciudades: true },
    });
  }

  createProvincia(data: { nombre: string; codigo: string }) {
    return this.prisma.provincia.create({ data, include: { ciudades: true } });
  }

  updateProvincia(id: string, data: any) {
    return this.prisma.provincia.update({ where: { id }, data });
  }

  deleteProvincia(id: string) {
    return this.prisma.provincia.delete({ where: { id } });
  }

  // ── Ciudades ──────────────────────────────────────────────────────────────────
  findAllCiudades(provinciaId?: string) {
    return this.prisma.ciudad.findMany({
      where:   provinciaId ? { provinciaId } : undefined,
      include: { provincia: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findCiudadById(id: string) {
    return this.prisma.ciudad.findUnique({
      where:   { id },
      include: { provincia: true },
    });
  }

  createCiudad(data: { nombre: string; provinciaId?: string }) {
    return this.prisma.ciudad.create({ data, include: { provincia: true } });
  }

  updateCiudad(id: string, data: any) {
    return this.prisma.ciudad.update({ where: { id }, data, include: { provincia: true } });
  }

  deleteCiudad(id: string) {
    return this.prisma.ciudad.delete({ where: { id } });
  }
}
