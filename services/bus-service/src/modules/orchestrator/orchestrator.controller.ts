import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { publishEvent, getEventLog } from '../../shared/bus/service-bus.js';
import { httpPost } from '../../shared/http/client.js';

const OPS_URL  = () => process.env.OPERACIONES_SERVICE_URL ?? 'http://localhost:3004';
const INV_URL  = () => process.env.INVENTARIO_SERVICE_URL  ?? 'http://localhost:3002';
const FIN_URL  = () => process.env.FINANCIERO_SERVICE_URL  ?? 'http://localhost:3005';

function token(req: Request): string {
  return req.headers.authorization!.slice(7);
}

function correlationId(req: Request): string {
  return (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
}

export async function crearReserva(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await httpPost<any>(
      `${OPS_URL()}/api/v1/emilypamela/reservas`,
      req.body,
      token(req),
      correlationId(req),
    );

    // operaciones-service v2 publica reservas.reserva.creada — no duplicar aquí
    res.status(201).json({ success: true, data: result?.data ?? result });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.upstream ?? { message: err.message } });
      return;
    }
    next(err);
  }
}

export async function cancelarReserva(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const result = await httpPost<any>(
      `${OPS_URL()}/api/v1/emilypamela/reservas/${id}/cancelar`,
      req.body ?? {},
      token(req),
      correlationId(req),
    );

    // operaciones-service v2 publica reservas.reserva.cancelada — no duplicar aquí
    res.json({ success: true, data: result?.data ?? result });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.upstream ?? { message: err.message } });
      return;
    }
    next(err);
  }
}

export async function iniciarAlquiler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await httpPost<any>(
      `${OPS_URL()}/api/v1/emilypamela/alquileres`,
      req.body,
      token(req),
      correlationId(req),
    );

    const alquilerId = result?.data?.id ?? result?.id ?? 'unknown';
    const event = await publishEvent('ALQUILER_INICIADO', req.user!.id, alquilerId, req.body as any);

    res.status(201).json({ success: true, data: result?.data ?? result, event });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.upstream ?? { message: err.message } });
      return;
    }
    next(err);
  }
}

export async function registrarDevolucion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await httpPost<any>(
      `${OPS_URL()}/api/v1/emilypamela/devoluciones`,
      req.body,
      token(req),
      correlationId(req),
    );

    const alquilerId = req.body?.alquilerId ?? result?.data?.alquilerId ?? 'unknown';
    const event = await publishEvent('DEVOLUCION_REGISTRADA', req.user!.id, alquilerId, req.body as any);

    res.status(201).json({ success: true, data: result?.data ?? result, event });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.upstream ?? { message: err.message } });
      return;
    }
    next(err);
  }
}

export function listarEventos(req: Request, res: Response): void {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 50;
  res.json({ success: true, data: getEventLog(page, limit) });
}
