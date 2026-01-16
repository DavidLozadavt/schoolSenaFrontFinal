import { Tercero } from "@/pages/puntos-de-venta/models/TerceroInterface";

export interface FacturaElectronicaResponse {
  success: boolean;
  data: FacturaElectronica[];
}

export interface FacturaElectronica {
  id: number;
  ticket_id: number;
  reference_code: string;
  factus_id: string | null;
  prefix: string | null;
  number: string | null;
  cufe: string | null;
  status: string;
  email_status: string | null;
  pdf_path: string | null;
  xml_path: string | null;
  qr_url: string | null;
  error_code: string | null;
  error_message: string | null;
  validated_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  idEmpresa: number;
  ticket: Ticket
}

export interface Ticket {
  id: number
  idViaje: number
  idTercero: number
  idConfiguracionVehiculo: number
  idAgendaViaje: number
  created_at: string
  updated_at: string
  cantidad: number
  tercero:Tercero
}

// Interfaces para Notas de Crédito
export interface NotaCreditoResponse {
  success: boolean;
  message: string;
  data: {
    items: NotaCredito[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  };
  stats: {
    total: number;
    pendientes: number;
    validadas: number;
    error: number;
  };
}

export interface NotaCredito {
  id: number;
  reference_code: string;
  factus_id: string;
  number: string;
  cude: string;
  status: string;
  status_label: string;
  qr_url: string;
  pdf_path: string | null;
  xml_path: string | null;
  error_message: string | null;
  validated_at: string | null;
  created_at: string;
  devolucion: Devolucion;
  empresa: {
    id: number;
    nombre: string | null;
  };
}

export interface Devolucion {
  id: number;
  fecha: string;
  observaciones: string | null;
  valor_base: string | null;
  valor_iva: string | null;
  valor_total: string | null;
  cantidad_tickets: number;
  tercero: {
    id: number;
    identificacion: string | null;
    nombre_completo: string;
    telefono: string | null;
    email: string;
  };
  tickets: TicketDevolucion[];
}

export interface TicketDevolucion {
  numero_ticket: string;
  valor: string;
  estado: string;
}


