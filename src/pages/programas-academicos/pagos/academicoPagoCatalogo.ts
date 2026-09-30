/** Normalización de catálogos GET medio_pagos / GET tipo_pagos para checkout académico. */

export interface MedioPagoOption {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  icono: string;
}

export interface TipoPagoOption {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

const iconoPorNombreMedio = (nombre: string): string => {
  const n = nombre.toLowerCase();
  if (n.includes('efectivo')) return 'ki-dollar';
  if (n.includes('transfer')) return 'ki-bank';
  if (n.includes('pse') || n.includes('tarjeta') || n.includes('crédit') || n.includes('credit'))
    return 'ki-credit-cart';
  if (n.includes('especie')) return 'ki-two-credit-cart';
  return 'ki-wallet';
};

export const normalizarMedioPago = (item: Record<string, unknown>): MedioPagoOption => {
  const nombre = String(
    item.detalleMedioPago ?? item.nombre ?? item.nombreMedioPago ?? item.medioPago ?? 'Sin nombre'
  );

  return {
    id: Number(item.id ?? item.idMedioPago ?? 0),
    nombre,
    descripcion: item.descripcion != null ? String(item.descripcion) : item.observacion != null ? String(item.observacion) : undefined,
    activo:
      item.activo !== undefined
        ? Boolean(item.activo)
        : item.estado !== undefined
          ? item.estado === 1 || item.estado === 'ACTIVO' || item.estado === true
          : true,
    icono: iconoPorNombreMedio(nombre)
  };
};

export const normalizarTipoPago = (item: Record<string, unknown>): TipoPagoOption => ({
  id: Number(item.id ?? item.idTipoPago ?? 0),
  nombre: String(
    item.detalleTipoPago ?? item.nombre ?? item.nombreTipoPago ?? item.tipoPago ?? 'Sin nombre'
  ),
  descripcion:
    item.descripcion != null ? String(item.descripcion) : item.observacion != null ? String(item.observacion) : undefined,
  activo:
    item.activo !== undefined
      ? Boolean(item.activo)
      : item.estado !== undefined
        ? item.estado === 1 || item.estado === 'ACTIVO' || item.estado === true
        : true
});

export const normalizarListaMedios = (data: unknown): MedioPagoOption[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizarMedioPago(item as Record<string, unknown>))
    .filter((m) => m.id > 0 && (m.activo ?? true));
};

export const normalizarListaTipos = (data: unknown): TipoPagoOption[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizarTipoPago(item as Record<string, unknown>))
    .filter((t) => t.id > 0 && (t.activo ?? true));
};
