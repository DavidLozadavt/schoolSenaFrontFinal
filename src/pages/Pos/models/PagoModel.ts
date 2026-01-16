export interface Pago {
  id?: number;
  fecha?: any;
  valor: any;
  idMedioPago: MedioPagoModel;
  idTipoPago: TipoPagoModel;
  rutaComprobante: File | null;
    aporte?: any;
  opcionPago:any;
  idShoppingCart?:any,
}

export interface MedioPagoModel {
  id: number;
  detalleMedioPago: string;
}
export interface TipoPagoModel {
  id: number;
  detalleTipoPago: string;
}
