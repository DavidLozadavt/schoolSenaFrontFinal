export interface HorarioMateria {
  id: number;
  idContrato: number;
  horaInicial: string;
  horaFinal: string;
  estado: string;
  idDia: number;
  duracionHoras: number;
  fechaInicial: string; // "2025-12-01"
  fechaFinal: string;   // "2025-12-31"
  duracionSesion: number;
  cantidadSesiones: number;
}

export interface Instructor {
  idActivation: number;
  emailUsuario: string;
  idContrato: number;
  roles: string[];
  totalHoras: number;
  totalHorasFormato: string;
  totalHorasProgramadas?: number;
  horarios: HorarioMateria[];
  estado?: string; // 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO'
  idRmi?: number;
  motivoRechazo?: string;
  persona: {
    identificacion: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    email: string;
    celular: string;
    perfil: string;
    rutaFoto: string;
  };
}