/** Variante de UI para catálogo de pagos vs valores económicos académicos. */
export type ConfiguracionPagosVariant = 'pagos' | 'economicos';

export const PROCESOS_ACADEMICOS_REF = [
  'MATRICULA',
  'MATRÍCULA',
  'MATRICULA ACADEMICA',
  'MATRÍCULA ACADÉMICA',
  'INSCRIPCION',
  'INSCRIPCIÓN',
  'FACTURA',
  'RECIBO'
] as const;

export function normalizeProcesoNombre(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function esProcesoAcademicoReferencia(nombre?: string | null): boolean {
  const n = normalizeProcesoNombre(nombre);
  if (!n) return false;
  return (
    PROCESOS_ACADEMICOS_REF.some((ref) => normalizeProcesoNombre(ref) === n) ||
    n.includes('MATRICULA') ||
    n.includes('INSCRIPCION')
  );
}

export function existeProcesoMatricula(procesos: Array<{ nombreProceso?: string }>): boolean {
  return procesos.some((p) => {
    const n = normalizeProcesoNombre(p.nombreProceso);
    return n === 'MATRICULA' || n.includes('MATRICULA');
  });
}

export function getAsignacionProceso(row: Record<string, unknown> | null | undefined) {
  if (!row) return null;
  return (
    (row.asignacionProcesoPago as Record<string, unknown> | undefined) ??
    (row.asignacion_proceso_pago as Record<string, unknown> | undefined) ??
    null
  );
}

export function getNombreProcesoConfiguracion(row: Record<string, unknown> | null | undefined): string {
  const asignacion = getAsignacionProceso(row);
  const proceso = asignacion?.proceso as { nombreProceso?: string } | undefined;
  return proceso?.nombreProceso?.trim() || 'N/A';
}

export function getLabelsConfiguracionPagos(variant: ConfiguracionPagosVariant) {
  if (variant === 'economicos') {
    return {
      tableTitle: 'Valores económicos configurados',
      columnConcepto: 'Nombre del concepto',
      columnDetalle: 'Descripción',
      columnValor: 'Valor (COP)',
      columnVigencia: 'Vigencia actual',
      columnProceso: 'Proceso',
      columnTipoMovimiento: 'Tipo de movimiento',
      columnObligatorio: 'Obligatorio',
      columnEstado: 'Estado',
      deleteConfirm: 'Esta acción eliminará este valor económico.',
      deleteSuccess: 'Valor económico eliminado correctamente',
      deleteError: 'Error al eliminar el valor económico',
      fetchError: 'Error al cargar valores económicos',
      modalCreate: 'Nuevo valor económico',
      modalEdit: 'Editar valor económico',
      labelTitulo: 'Nombre del concepto',
      placeholderTitulo: 'Ej: Matrícula académica, Uniforme, Carnet',
      labelDescripcion: 'Descripción',
      placeholderDescripcion: 'Detalle del concepto de cobro académico',
      searchPlaceholder: 'Buscar por concepto, proceso o valor...'
    };
  }

  return {
    tableTitle: 'Configuración de Pagos',
    columnConcepto: 'Título del Pago',
    columnDetalle: 'Descripción',
    columnValor: 'Valor',
    columnVigencia: 'Vigencia actual',
    columnProceso: 'Proceso',
    columnTipoMovimiento: 'Tipo de movimiento',
    columnObligatorio: 'Obligatorio',
    columnEstado: 'Estado',
    deleteConfirm: 'Esta acción eliminará esta configuración de pago.',
    deleteSuccess: 'Configuración de pago eliminada exitosamente',
    deleteError: 'Error al eliminar la configuración de pago',
    fetchError: 'Error al cargar configuraciones de pago',
    modalCreate: 'Nueva Configuración de Pago',
    modalEdit: 'Editar Configuración de Pago',
    labelTitulo: 'Título de la configuración',
    placeholderTitulo: 'Ingrese el título de la configuración',
    labelDescripcion: 'Descripción',
    placeholderDescripcion: 'Ingrese la descripción',
    searchPlaceholder: 'Buscar...'
  };
}
