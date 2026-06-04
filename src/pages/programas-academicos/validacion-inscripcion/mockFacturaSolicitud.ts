export type EstadoFacturaSolicitud = 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'EN_PROCESO';

export interface FacturaDetalleMock {
  idFacturaDetalle: number;
  concepto: string;
  descripcion?: string;
  cantidad: number;
  valorUnitario: number;
  subtotal: number;
  estado: 'PENDIENTE' | 'PAGADO';
}

export interface FacturaSolicitudMock {
  idFactura: number;
  numeroFactura: string;
  idSolicitud: number;
  idTransaccion?: number;
  estadoFactura: EstadoFacturaSolicitud;
  fechaEmision: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  saldoPendiente: number;
  requierePago: boolean;
  detalles: FacturaDetalleMock[];
}
