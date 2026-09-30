/**
 * Etiquetas visibles del módulo Pagos (no altera códigos de permiso ni rutas).
 */
const PERMISSION_CODE_DISPLAY: Record<string, string> = {
  GESTION_FACTURAS_ACADEMICAS: 'Facturas'
};

const REPLACEMENTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /Acceso\s+Facturas?\s+Acad[eé]micas?/gi, label: 'Acceso a Facturas' },
  { pattern: /Gesti[oó]n\s+Facturas?\s+Acad[eé]micas?/gi, label: 'Gestión de Facturas' },
  { pattern: /Facturas?\s+Acad[eé]micas?/gi, label: 'Facturas' },
  { pattern: /facturas?\s+acad[eé]micas?/gi, label: 'facturas' },
  { pattern: /Factura\s+acad[eé]mica/gi, label: 'Factura' },
  { pattern: /factura\s+acad[eé]mica/gi, label: 'factura' }
];

export function formatPagosDisplayLabel(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (PERMISSION_CODE_DISPLAY[trimmed]) {
    return PERMISSION_CODE_DISPLAY[trimmed];
  }
  let result = text;
  for (const { pattern, label } of REPLACEMENTS) {
    result = result.replace(pattern, label);
  }
  return result;
}

/** Título de breadcrumb para segmentos de ruta del módulo pagos. */
export function formatPagosRouteSegmentTitle(segment: string): string | null {
  if (segment === 'facturas-academicas') return 'Facturas';
  if (segment === 'configuracion-valores-economicos') return 'Valores económicos';
  if (segment === 'configuracion-pagos') return 'Configuración de pagos';
  if (segment === 'medio-pagos') return 'Medios de pago';
  if (segment === 'tipo-pagos') return 'Tipos de pago';
  return null;
}
