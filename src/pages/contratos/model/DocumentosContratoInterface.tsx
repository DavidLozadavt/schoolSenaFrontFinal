export interface DocumentoContrato {
    id: number;
    fechaCarga: string;
    ruta: string;
    idContrato: number;
    idAsignacionTipoDocumentoProceso: number;
    idEstado: number | null;
    rutaFileUrl: string;
    AsignacionTipoDocumentoProceso: {
      id: number;
      idProceso: number;
      idTipoDocumento: number;
      actualizar: number;
      tipoDocumento: {
        id: number;
        tituloDocumento: string;
        descripcion: string;
        idEstado: number;
        created_at: string | null;
        updated_at: string | null;
      };
    };
  }
  