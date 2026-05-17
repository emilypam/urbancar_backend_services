import prisma from './database/prisma.js';
import { MantenimientoRepository }  from '../modules/mantenimientos/mantenimiento.repository.js';
import { MantenimientoController }  from '../modules/mantenimientos/mantenimiento.controller.js';
import { KardexRepository }         from '../modules/kardex/kardex.repository.js';
import { KardexController }         from '../modules/kardex/kardex.controller.js';
import { SistemaExternoRepository } from '../modules/sistemas/sistema-externo.repository.js';
import { SistemaExternoController } from '../modules/sistemas/sistema-externo.controller.js';

const mantenimientoRepo  = new MantenimientoRepository(prisma);
const kardexRepo         = new KardexRepository(prisma);
const sistemaExternoRepo = new SistemaExternoRepository(prisma);

export const mantenimientoController  = new MantenimientoController(mantenimientoRepo);
export const kardexController         = new KardexController(kardexRepo);
export const sistemaExternoController = new SistemaExternoController(sistemaExternoRepo);
