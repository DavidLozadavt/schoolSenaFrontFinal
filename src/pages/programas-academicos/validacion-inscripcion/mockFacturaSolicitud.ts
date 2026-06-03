export type EstadoFactura = 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'EN_PROCESO';
export type EstadoFacturaDetalle = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export interface FacturaDetalleMock {
  idFacturaDetalle: number;
  concepto: string;
  descripcion?: string;
  cantidad: number;
  valorUnitario: number;
  subtotal: number;
  estado?: EstadoFacturaDetalle;
}

export interface FacturaSolicitudMock {
  idFactura: number;
  numeroFactura: string;
  idSolicitud: number;
  idTransaccion?: number;
  estadoFactura: EstadoFactura;
  fechaEmision: string;
  fechaVencimiento?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  saldoPendiente: number;
  requierePago: boolean;
  detalles: FacturaDetalleMock[];
}

/** Caso 1: factura pendiente */
const facturaPendiente: FacturaSolicitudMock = {
  idFactura: 1001,
  numeroFactura: 'FAC-2026-0001',
  idSolicitud: 1,
  idTransaccion: 120,
  estadoFactura: 'PENDIENTE',
  fechaEmision: '2026-06-03',
  fechaVencimiento: '2026-06-10',
  subtotal: 350000,
  descuento: 0,
  impuestos: 0,
  total: 350000,
  saldoPendiente: 350000,
  requierePago: true,
  detalles: [
    {
      idFacturaDetalle: 1,
      concepto: 'Inscripción',
      descripcion: 'Pago de inscripción al programa',
      cantidad: 1,
      valorUnitario: 50000,
      subtotal: 50000,
      estado: 'PENDIENTE'
    },
    {
      idFacturaDetalle: 2,
      concepto: 'Matrícula',
      descripcion: 'Pago de matrícula académica',
      cantidad: 1,
      valorUnitario: 300000,
      subtotal: 300000,
      estado: 'PENDIENTE'
    }
  ]
};

/** Caso 2: factura pagada */
const facturaPagada: FacturaSolicitudMock = {
  idFactura: 1002,
  numeroFactura: 'FAC-2026-0002',
  idSolicitud: 2,
  idTransaccion: 121,
  estadoFactura: 'PAGADA',
  fechaEmision: '2026-05-28',
  fechaVencimiento: '2026-06-05',
  subtotal: 420000,
  descuento: 20000,
  impuestos: 0,
  total: 400000,
  saldoPendiente: 0,
  requierePago: true,
  detalles: [
    {
      idFacturaDetalle: 3,
      concepto: 'Inscripción',
      descripcion: 'Pago de inscripción al programa',
      cantidad: 1,
      valorUnitario: 80000,
      subtotal: 80000,
      estado: 'PAGADO'
    },
    {
      idFacturaDetalle: 4,
      concepto: 'Matrícula',
      descripcion: 'Pago de matrícula académica',
      cantidad: 1,
      valorUnitario: 340000,
      subtotal: 340000,
      estado: 'PAGADO'
    }
  ]
};

/** Caso 4: factura en proceso de pago */
const facturaEnProceso: FacturaSolicitudMock = {
  idFactura: 1004,
  numeroFactura: 'FAC-2026-0004',
  idSolicitud: 4,
  idTransaccion: 124,
  estadoFactura: 'EN_PROCESO',
  fechaEmision: '2026-06-03',
  fechaVencimiento: '2026-06-12',
  subtotal: 380000,
  descuento: 0,
  impuestos: 0,
  total: 380000,
  saldoPendiente: 380000,
  requierePago: true,
  detalles: [
    {
      idFacturaDetalle: 7,
      concepto: 'Inscripción',
      descripcion: 'Pago de inscripción al programa',
      cantidad: 1,
      valorUnitario: 80000,
      subtotal: 80000,
      estado: 'PENDIENTE'
    },
    {
      idFacturaDetalle: 8,
      concepto: 'Matrícula',
      descripcion: 'Pago de matrícula académica',
      cantidad: 1,
      valorUnitario: 300000,
      subtotal: 300000,
      estado: 'PENDIENTE'
    }
  ]
};

/** Caso 5: factura anulada */
const facturaAnulada: FacturaSolicitudMock = {
  idFactura: 1005,
  numeroFactura: 'FAC-2026-0005',
  idSolicitud: 5,
  idTransaccion: 125,
  estadoFactura: 'ANULADA',
  fechaEmision: '2026-05-18',
  fechaVencimiento: '2026-05-25',
  subtotal: 450000,
  descuento: 0,
  impuestos: 0,
  total: 450000,
  saldoPendiente: 0,
  requierePago: true,
  detalles: [
    {
      idFacturaDetalle: 9,
      concepto: 'Inscripción',
      descripcion: 'Pago de inscripción al programa',
      cantidad: 1,
      valorUnitario: 90000,
      subtotal: 90000,
      estado: 'ANULADO'
    },
    {
      idFacturaDetalle: 10,
      concepto: 'Matrícula',
      descripcion: 'Pago de matrícula académica',
      cantidad: 1,
      valorUnitario: 360000,
      subtotal: 360000,
      estado: 'ANULADO'
    }
  ]
};

/** Caso 6: factura pendiente con descuento */
const facturaPendienteDescuento: FacturaSolicitudMock = {
  idFactura: 1006,
  numeroFactura: 'FAC-2026-0006',
  idSolicitud: 6,
  idTransaccion: 126,
  estadoFactura: 'PENDIENTE',
  fechaEmision: '2026-06-04',
  fechaVencimiento: '2026-06-15',
  subtotal: 520000,
  descuento: 70000,
  impuestos: 0,
  total: 450000,
  saldoPendiente: 450000,
  requierePago: true,
  detalles: [
    {
      idFacturaDetalle: 11,
      concepto: 'Inscripción',
      descripcion: 'Pago de inscripción al programa',
      cantidad: 1,
      valorUnitario: 70000,
      subtotal: 70000,
      estado: 'PENDIENTE'
    },
    {
      idFacturaDetalle: 12,
      concepto: 'Matrícula',
      descripcion: 'Pago de matrícula académica con beca parcial',
      cantidad: 1,
      valorUnitario: 450000,
      subtotal: 450000,
      estado: 'PENDIENTE'
    }
  ]
};

export const facturasSolicitudMock: FacturaSolicitudMock[] = [
  facturaPendiente,
  facturaPagada,
  facturaEnProceso,
  facturaAnulada,
  facturaPendienteDescuento
];

/**
 * Obtiene la factura asociada a una solicitud.
 * Solicitud 3 no tiene factura / no requiere pago.
 * TODO: reemplazar por GET /api/academico/solicitudes/{idSolicitud}/factura
 */
export function getFacturaPorSolicitud(idSolicitud: number): FacturaSolicitudMock | null {
  return facturasSolicitudMock.find((f) => f.idSolicitud === idSolicitud) ?? null;
}

export function solicitudRequierePago(idSolicitud: number): boolean {
  const factura = getFacturaPorSolicitud(idSolicitud);
  if (!factura) return false;
  return factura.requierePago;
}
