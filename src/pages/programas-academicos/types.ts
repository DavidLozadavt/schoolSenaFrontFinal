
export interface Program {
  id: number;
  name: string;
  status: string;
  imageUrl: string;
  codigo: string;
  nivel: string;
  formacion: string;
  description?: string;
  documento?: string | null;
  idNivelEducativo?: number | string;
  idTipoFormacion?: number | string;
  idEstadoPrograma?: number | string;
  idRed?:number;
  fichas_count?: number;
  estado?: {
    id: number;
    nombre: string;
  };
  red?: {
    id:number;
    nombre:string;
  }
}

// Props para el componente principal GestionProgramas
export interface GestionProgramasProps {
  onActionComplete?: () => void;
}

// Props para el componente Formulario
export interface FormularioProgramaProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProgram: (newProgram: any) => void;
  programToEdit?: Program | null; 
  onUpdateProgram?: (updatedProgram: any) => void;
}

// Props para el componente Toast
export interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning';
}

// Tipos auxiliares para los catálogos del Formulario
export interface CatalogoItem {
  id: number | string;
  nombre: string;
}

export interface CatalogosData {
  niveles: CatalogoItem[];
  tipos: CatalogoItem[];
  estados: CatalogoItem[];
  redes:any[];
}

export interface MallaCurricularProps {
  isOpen?: boolean;
  onClose?: () => void;
  program?: Program | any;
  ficha?: any;
}

export interface AsignarMateriaProps {
  idPrograma: number;
  isOpen: boolean;
  onClose: () => void;
  nivelId: number | null; // Este es el idGradoPrograma
  onMateriasSeleccionadas: (data: { 
    idGradoPrograma: number; 
    materias: number[] 
  }) => void;
}

export interface RecursoItem {
  id: number;
  nombre: string;
}

export interface MallaDataResponse {
  status: string;
  data: {
    detalle: {
      id: number;
      idPeriodo: number;
      idSede: number;
      jornadas: RecursoItem[];
      programa: {
        id: number;
        nombrePrograma: string;
        tipo_grado: RecursoItem;
      };
      periodo: RecursoItem;
    };
    recursos: {
      periodos: RecursoItem[];
      tipos_grado: RecursoItem[];
      jornadas_disponibles: RecursoItem[];
    };
  };
}