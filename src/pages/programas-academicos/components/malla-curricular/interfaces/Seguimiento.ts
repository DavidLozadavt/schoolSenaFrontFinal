export interface AprendizSeguimiento {
  idPersona: number;
  idContrato?: number;
  idcontrato?: number;
  nombreCompleto: string;
  identificacion?: string;
}

export interface DocumentoSeguimiento {
  id: number;
  nombre_documento: string;
  documentoUrl: string;
  documentoUrlPublica?: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  observacion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Seguimiento {
  id: number;
  idpersona: number;
  idcontrato: number;
  estado: string;
  documentos: DocumentoSeguimiento[];
  contrato?: Contrato;
  persona?: any;
}

export interface Contrato {
  id: number;
  persona: {
    id: number;
    identificacion: string;
    nombre1: string;
    nombre2?: string;
    apellido1?: string;
    apellido2?: string;
    email?: string;
  };
}

export interface ModalGestionSeguimientoProps {
  isOpen: boolean;
  onClose: () => void;
  aprendiz: AprendizSeguimiento | null;
}
