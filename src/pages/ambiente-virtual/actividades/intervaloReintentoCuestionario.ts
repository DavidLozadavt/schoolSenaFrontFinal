/** Conversión amigable ↔ minutos para intervalo de reintento de cuestionario. */

export type UnidadReintento = 'minutos' | 'horas' | 'dias';

export const UNIDADES_REINTENTO: { value: UnidadReintento; label: string }[] = [
  { value: 'minutos', label: 'Minutos' },
  { value: 'horas', label: 'Horas' },
  { value: 'dias', label: 'Días' }
];

export const aMinutosReintento = (cantidad: number, unidad: UnidadReintento): number => {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return 0;
  if (unidad === 'dias') return Math.round(cantidad * 1440);
  if (unidad === 'horas') return Math.round(cantidad * 60);
  return Math.round(cantidad);
};

/** Presentación amigable sin persistir unidad: prioriza días, luego horas, luego minutos. */
export const desdeMinutosReintento = (
  minutos: number | null | undefined
): { cantidad: string; unidad: UnidadReintento } => {
  if (minutos == null || !Number.isFinite(minutos) || minutos <= 0) {
    return { cantidad: '', unidad: 'horas' };
  }
  const m = Math.round(minutos);
  if (m % 1440 === 0) return { cantidad: String(m / 1440), unidad: 'dias' };
  if (m % 60 === 0) return { cantidad: String(m / 60), unidad: 'horas' };
  return { cantidad: String(m), unidad: 'minutos' };
};

export const formatearIntervaloReintento = (minutos: number | null | undefined): string => {
  if (minutos == null || minutos <= 0) return '';
  const { cantidad, unidad } = desdeMinutosReintento(minutos);
  if (!cantidad) return '';
  const n = Number(cantidad);
  if (unidad === 'dias') return n === 1 ? '1 día' : `${n} días`;
  if (unidad === 'horas') return n === 1 ? '1 hora' : `${n} horas`;
  return n === 1 ? '1 minuto' : `${n} minutos`;
};

/** Parsea fechas del backend (`Y-m-d H:i:s` o ISO). */
export const parseFechaBackend = (value: string | null | undefined): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  const normalized = v.includes('T') ? v : v.replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Cuenta regresiva HH:MM:SS.
 * Los días se convierten a horas (p. ej. 2 días = 48:00:00).
 */
export const formatearCuentaRegresivaMs = (ms: number): string => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
