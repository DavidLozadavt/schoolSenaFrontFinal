import { TerceroInterface } from "@/pages/registrar-compra/models/TerceroInterface";

export interface FacturaInterface {
    id: number;
    numeroFactura: string;
    fecha: string;
    valorIva: string;
    valor: string;
    valorMasIva: string;
    fotoFactura: string;
    idCompany: number;
    idTercero: number;
    created_at: string;
    updated_at: string;
    reciboPagoFactura: string;
    valor_total: number;
    excedente_total: number;
    rutaFacturaUrl: string;
    reciboPagoFacturaUrl: string;
    transacciones: Transaccion[];
    tercero: TerceroInterface;
  }
  
  export interface Transaccion {
    id: number;
    fechaTransaccion: string;
    hora: string;
    numFacturaInicial: string | null;
    valor: string;
    idEstado: number;
    idTipoTransaccion: number | null;
    idTipoPago: number;
    created_at: string;
    updated_at: string;
    contrato_id: number | null;
    excedente: string;
    pivot: Pivot;
    pago: Pago[];
  }
  
  export interface Pivot {
    idFactura: number;
    idTransaccion: number;
  }
  
  export interface Pago {
    id: number;
    fechaPago: string;
    fechaReg: string;
    valor: string;
    numeroFact: number;
    excedente: string;
    idEstado: number;
    idTransaccion: number;
    idMedioPago: number;
    created_at: string;
    updated_at: string;
    rutaComprobante: string;
    observacion: string | null;
    porcentaje: number;
    retencion: string | null;
    idPagoTotal: number | null;
    fechaCobro: string | null;
    rutaComprobanteUrl: string;
  }
