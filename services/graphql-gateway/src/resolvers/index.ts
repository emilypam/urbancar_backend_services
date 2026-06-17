const INV  = () => process.env.INVENTARIO_SERVICE_URL  ?? 'http://localhost:3002';
const OPS  = () => process.env.OPERACIONES_SERVICE_URL ?? 'http://localhost:3004';
const FIN  = () => process.env.FINANCIERO_SERVICE_URL  ?? 'http://localhost:3005';
const MANT = () => process.env.MANTENIMIENTO_SERVICE_URL ?? 'http://localhost:3006';
const BUS  = () => process.env.BUS_SERVICE_URL         ?? 'http://localhost:3007';

const BASE = '/api/v1/emilypamela';
const V2   = '/api/v2/emilypamela';

async function get(url: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const json = await res.json() as any;
  return json?.data ?? json;
}

async function post(url: string, body: unknown, token: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json() as any;
  if (!res.ok) throw new Error(json?.error?.message ?? `Error ${res.status}`);
  return json?.data ?? json;
}

function mapReserva(r: any) {
  if (!r) return null;
  return {
    id:          r.id,
    vehiculoId:  r.vehiculoId,
    usuarioId:   r.usuarioId,
    fechaInicio: r.fechaInicio,
    fechaFin:    r.fechaFin,
    estado:      r.status ?? r.estado,
    total:       r.totalAmount != null ? Number(r.totalAmount) : (r.total != null ? Number(r.total) : null),
    createdAt:   r.createdAt,
  };
}

function mapPago(p: any) {
  if (!p) return null;
  return {
    id:          p.id,
    reservaId:   p.reservaId,
    monto:       p.monto != null ? Number(p.monto) : null,
    metodoPago:  p.metodoPago,
    estado:      p.status ?? p.estado,
    createdAt:   p.createdAt,
  };
}

function mapVehiculo(v: any) {
  if (!v) return null;
  return {
    id:          v.id,
    placa:       v.placa,
    color:       v.color,
    anio:        v.anio,
    agenciaId:   v.agenciaId,
    marca:       v.modelo?.marca?.nombre ?? null,
    modelo:      v.modelo?.nombre ?? null,
    categoria:   v.categoria?.nombre ?? null,
    precioPorDia: v.precioDia != null ? Number(v.precioDia) : null,
    disponible:  v.status === 'DISPONIBLE',
    imageUrl:    v.imagenUrl ?? null,
  };
}

export const resolvers = {
  Query: {
    vehiculos: async (_: any, args: { disponible?: boolean; categoriaId?: string }) => {
      const params = new URLSearchParams();
      if (args.categoriaId) params.set('categoriaId', args.categoriaId);
      const query = params.toString() ? `?${params}` : '';
      const data = await get(`${INV()}${BASE}/vehiculos/marketplace${query}`);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const mapped = list.map(mapVehiculo);
      return args.disponible !== undefined
        ? mapped.filter((v: any) => v.disponible === args.disponible)
        : mapped;
    },

    vehiculo: async (_: any, args: { id: string }) => {
      const data = await get(`${INV()}${BASE}/vehiculos/${args.id}`);
      return mapVehiculo(data);
    },

    reservas: async (_: any, __: any, ctx: any) => {
      const data = await get(`${OPS()}${BASE}/reservas`, ctx.token);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      return list.map(mapReserva);
    },

    reserva: async (_: any, args: { id: string }, ctx: any) =>
      mapReserva(await get(`${OPS()}${BASE}/reservas/${args.id}`, ctx.token)),

    misReservas: async (_: any, args: { usuarioId: string }, ctx: any) => {
      const data = await get(`${OPS()}${BASE}/reservas?usuarioId=${args.usuarioId}`, ctx.token);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      return list.map(mapReserva);
    },

    pagos: async (_: any, __: any, ctx: any) => {
      const data = await get(`${FIN()}${BASE}/pagos`, ctx.token);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      return list.map(mapPago);
    },

    pago: async (_: any, args: { id: string }, ctx: any) =>
      mapPago(await get(`${FIN()}${BASE}/pagos/${args.id}`, ctx.token)),

    facturas: async (_: any, __: any, ctx: any) =>
      get(`${FIN()}${BASE}/facturas`, ctx.token),

    factura: async (_: any, args: { id: string }, ctx: any) =>
      get(`${FIN()}${BASE}/facturas/${args.id}`, ctx.token),

    mantenimientos: async (_: any, __: any, ctx: any) =>
      get(`${MANT()}${BASE}/mantenimientos`, ctx.token),

    mantenimiento: async (_: any, args: { id: string }, ctx: any) =>
      get(`${MANT()}${BASE}/mantenimientos/${args.id}`, ctx.token),

    kardex: async (_: any, args: { vehiculoId?: string }, ctx: any) => {
      const query = args.vehiculoId ? `?vehiculoId=${args.vehiculoId}` : '';
      return get(`${MANT()}${BASE}/kardex${query}`, ctx.token);
    },

    eventos: async (_: any, args: { page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (args.page)  params.set('page',  String(args.page));
      if (args.limit) params.set('limit', String(args.limit));
      const query = params.toString() ? `?${params}` : '';
      const result = await get(`${BUS()}${BASE}/bus/events${query}`);
      return (Array.isArray(result) ? result : result?.events ?? []).map((e: any) => ({
        ...e,
        data: typeof e.data === 'object' ? JSON.stringify(e.data) : e.data,
      }));
    },
  },

  Mutation: {
    crearReserva: async (_: any, args: { input: any; token: string }) =>
      mapReserva(await post(`${OPS()}${V2}/reservas`, args.input, args.token)),

    cancelarReserva: async (_: any, args: { id: string; token: string }) =>
      mapReserva(await post(`${OPS()}${V2}/reservas/${args.id}/cancelar`, {}, args.token)),

    crearPago: async (_: any, args: { input: any; token: string }) =>
      mapPago(await post(`${FIN()}${BASE}/pagos`, args.input, args.token)),
  },
};
