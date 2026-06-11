import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, BASE_URL_V2 } from '../config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Vehiculo {
  id: string;
  placa: string;
  agenciaId: string;
  modeloId: string;
  categoriaId: string;
  tipoCombustibleId: string;
  tipoTransmisionId: string;
  color: string;
  anio: number;
  kilometraje: number;
  numeroPasajeros: number;
  precioDia: string | number;
  imagenUrl?: string;
  descripcion?: string;
  activo: boolean;
  status?: string;
  modelo?: { id: string; nombre: string; marca?: { id: string; nombre: string } };
  categoria?: { id: string; nombre: string };
  tipoCombustible?: { id: string; nombre: string };
  tipoTransmision?: { id: string; nombre: string };
  agencia?: { id: string; nombre: string; direccion: string; ciudad?: { nombre: string } };
}

// Campos reales del schema Prisma de operaciones-service
export interface Reserva {
  id: string;
  usuarioId: string;
  vehiculoId: string;
  agenciaId: string;
  codigoReserva: string;
  fechaInicio: string;       // ISO date string "2024-01-15T00:00:00.000Z"
  fechaFin: string;          // ISO date string
  diasTotal: number;
  precioBase: string | number;    // Decimal → viene como string desde Prisma
  precioExtras: string | number;
  precioSeguro: string | number;
  totalAmount: string | number;
  status: 'PENDIENTE' | 'CONFIRMADA' | 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
  notas?: string;
  createdAt: string;
  vehiculo?: Vehiculo;
}

export interface AuthUser {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: 'ADMIN' | 'CLIENTE' | 'USER';
  telefono?: string | null;
  cedula?: string | null;
}

export interface CreateReservaPayload {
  vehiculoId: string;
  agenciaId: string;
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin: string;      // YYYY-MM-DD
  notas?: string;
}

export interface CreatePagoPayload {
  reservaId: string;
  monto: number;
  metodoPago: string;
  referencia?: string;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  baseUrl: string = BASE_URL
): Promise<T> {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Error ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }

  return (json?.data ?? json) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await AsyncStorage.setItem('token', data.token);
  return data;
}

export async function register(body: {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
}) {
  const data = await request<{ token: string; user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await AsyncStorage.setItem('token', data.token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}

// ── Vehículos ─────────────────────────────────────────────────────────────────

export async function getMarketplace(params: {
  categoriaId?: string;
} = {}): Promise<Vehiculo[]> {
  const parts = Object.entries(params)
    .filter(([, v]) => !!v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  const query = parts.length ? `?${parts.join('&')}` : '';
  const result = await request<Vehiculo[]>(`/vehiculos/marketplace${query}`);
  return Array.isArray(result) ? result : [];
}

export async function getVehiculo(id: string): Promise<Vehiculo> {
  return request<Vehiculo>(`/vehiculos/${id}`);
}

// ── Reservas ──────────────────────────────────────────────────────────────────

export async function getMisReservas(): Promise<Reserva[]> {
  const result = await request<Reserva[]>('/reservas/my');
  return Array.isArray(result) ? result : [];
}

export async function createReserva(payload: CreateReservaPayload): Promise<Reserva> {
  return request<Reserva>('/reservas', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, BASE_URL_V2);
}

export async function cancelarReserva(id: string): Promise<Reserva> {
  return request<Reserva>(`/reservas/${id}/cancelar`, { method: 'POST' }, BASE_URL_V2);
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function pagarReserva(payload: CreatePagoPayload) {
  return request<{ id: string; status: string }>('/pagos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface UpdateProfilePayload {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ── Catálogos ─────────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<{ id: string; nombre: string }[]> {
  const result = await request<{ id: string; nombre: string }[]>('/categorias');
  return Array.isArray(result) ? result : [];
}

// ── Facturas ──────────────────────────────────────────────────────────────────

export interface FacturaDetalle {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
}

export interface Factura {
  id: string;
  numeroFactura: string;
  reservaId: string;
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision?: string;
  createdAt: string;
  detalles?: FacturaDetalle[];
  rucCliente?: string;
  razonSocial?: string;
}

export async function getFacturaReserva(reservaId: string): Promise<Factura | null> {
  try {
    const result = await request<Factura[]>(`/facturas?reservaId=${encodeURIComponent(reservaId)}`);
    const items = Array.isArray(result) ? result : [];
    return items[0] ?? null;
  } catch {
    return null;
  }
}
