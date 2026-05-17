import { Router } from 'express';
import { PagoRepository } from '../pagos/pago.repository.js';
export function createPaymentBookingRouter(pagoRepo: PagoRepository): Router {
  const router = Router();

  // GET /api/v1/emilypamela/payment/booking/:reservaId
  router.get('/:reservaId', async (req, res, next) => {
    try {
      const { reservaId } = req.params;
      const pagos        = await pagoRepo.findByReservaId(reservaId as string);
      const totalPagado  = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

      let status: string;
      if (pagos.length === 0) {
        status = 'SIN_PAGOS';
      } else if (pagos.every(p => p.status === 'COMPLETADO')) {
        status = 'COMPLETADO';
      } else if (pagos.some(p => p.status === 'PENDIENTE')) {
        status = 'PENDIENTE';
      } else {
        status = 'PARCIAL';
      }

      res.json({
        success: true,
        data: { reservaId, pagos, totalPagado, status },
      });
    } catch (err) { next(err); }
  });

  return router;
}
