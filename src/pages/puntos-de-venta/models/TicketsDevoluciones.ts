export interface TicketDevolucion {
  id: number;
  numeroTicket: string;
  fecha: string;
  trayecto: string;
  cantidad: number;
  valor: string;
  estado: string;
  tercero: {
    id: number;
    nombre: string;
    identificacion: string;
  };
  viaje: {
    id: number;
  };
  factura_electronica?: {
    id: number;
    reference_code: string;
    numero_completo: string;
    prefix: string;
    number: string;
    cufe: string;
    status: string;
    validated_at: string;
    pdf_path: string;
    xml_path: string | null;
    qr_url: string;
    qr_image?: string;
  };
  ticket_completo: {
    id: number;
    numeroTicket: string;
    fecha?: string;
    tercero: {
      nombre: string;
      identificacion: string;
    };
    ruta?: {
      ciudad_origen?: { descripcion: string } | null;
      ciudad_destino?: { descripcion: string } | null;
    };
    lugar?: {
      nombre: string;
    };
    agenda_viaje?: {
      fecha: string;
      hora: string;
    };
    viaje?: {
      id: number;
    };
    factura_electronica?: {
      id: number;
      numero_completo: string;
      status: string;
      qr_url: string;
      qr_image?: string;
      pdf_path: string;
    };
  };
}