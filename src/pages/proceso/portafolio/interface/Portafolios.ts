export interface Ficha {
  id: number;
  codigo: string;
  codigoFicha?: string;
}

export interface PortafolioCategoria {
  id: number;
  nombre: string;
  slug: string;
  idCategoriaPadre?: number | null;
  orden: number;
  hijos?: PortafolioCategoria[];
}

export interface PortafolioDocumento {
  id: number;
  descripcion: string;
  urlDocumento?: string | null;
  idPortafolioFichas: number;
  urlDocumentoUrl?: string | null;
  idCategoria?: number | null;
  categoria?: PortafolioCategoria;
}

export interface PortafolioFicha {
  id: number;
  descripcion: string;
  idPortafolio: number;
  idFicha: number;
  ficha?: Ficha;
  portafolio_documentos?: PortafolioDocumento[];
}

export interface Portafolio {
  id: number;
  descripcion: string;
  idContrato: number;
  portafolio_fichas?: PortafolioFicha[];
}
