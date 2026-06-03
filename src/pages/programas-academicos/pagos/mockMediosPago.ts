/** Catálogo mock de medios y tipos de pago (sustituir por GET medio_pagos / GET tipo_pagos). */

export interface MedioPagoMock {
  id: number;
  detalleMedioPago: string;
  icono: string;
}

export interface TipoPagoMock {
  id: number;
  detalleTipoPago: string;
}

export const mockMediosPago: MedioPagoMock[] = [
  { id: 1, detalleMedioPago: 'Efectivo', icono: 'ki-dollar' },
  { id: 2, detalleMedioPago: 'Transferencia bancaria', icono: 'ki-bank' },
  { id: 3, detalleMedioPago: 'PSE', icono: 'ki-credit-cart' },
  { id: 4, detalleMedioPago: 'Tarjeta débito/crédito', icono: 'ki-two-credit-cart' }
];

export const mockTiposPago: TipoPagoMock[] = [
  { id: 1, detalleTipoPago: 'Contado' },
  { id: 2, detalleTipoPago: 'Abono' }
];
