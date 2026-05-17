import prisma from './database/prisma.js';
import { OrganizacionRepository } from '../modules/organizaciones/organizacion.repository.js';
import { OrganizacionController } from '../modules/organizaciones/organizacion.controller.js';
import { UbicacionRepository }    from '../modules/ubicaciones/ubicacion.repository.js';
import { UbicacionController }    from '../modules/ubicaciones/ubicacion.controller.js';

const organizacionRepo = new OrganizacionRepository(prisma);
const ubicacionRepo    = new UbicacionRepository(prisma);

export const organizacionController = new OrganizacionController(organizacionRepo);
export const ubicacionController    = new UbicacionController(ubicacionRepo);
