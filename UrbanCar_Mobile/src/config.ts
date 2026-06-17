export const API_HOST   = 'http://urbancar-ec.eastus2.cloudapp.azure.com';
export const BASE_URL   = `${API_HOST}/api/v1/emilypamela`;
export const BASE_URL_V2 = `${API_HOST}/api/v2/emilypamela`;

// Paleta corporativa UrbanCar EC — espejo exacto del frontend Angular
export const COLORS = {
  // Turquesa corporativo
  primary:       '#007577',   // primary-700 — botones, header, acciones principales
  primaryDark:   '#005A5C',   // primary-800 — hover/dark variant
  primaryDeep:   '#003E40',   // primary-900 — sidebar muy oscuro
  accent:        '#00CED1',   // brand turquoise — acentos, chips activos

  // Superficies
  background:    '#F8FAFC',   // surface-muted — fondo de pantallas
  surface:       '#FFFFFF',   // surface — tarjetas
  border:        '#E2E8F0',   // surface-border

  // Texto
  text:          '#0F172A',   // ink — texto principal
  textSecondary: '#475569',   // ink-muted — texto secundario
  textSoft:      '#94A3B8',   // ink-soft — placeholder

  // Semánticos
  error:         '#DC2626',   // danger
  warning:       '#D97706',   // warning
  info:          '#2563EB',   // info
  success:       '#059669',   // emerald-600
};
