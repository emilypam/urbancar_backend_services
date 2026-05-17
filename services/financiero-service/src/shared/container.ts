import prisma from './database/prisma.js';
import { PagoRepository }    from '../modules/pagos/pago.repository.js';
import { PagoController }    from '../modules/pagos/pago.controller.js';
import { FacturaRepository } from '../modules/facturas/factura.repository.js';
import { FacturaController } from '../modules/facturas/factura.controller.js';

const pagoRepo    = new PagoRepository(prisma);
const facturaRepo = new FacturaRepository(prisma);

export const pagoRepository    = pagoRepo;
export const pagoController    = new PagoController(pagoRepo);
export const facturaController = new FacturaController(facturaRepo);
