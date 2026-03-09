export interface HorarioMateria {
  id: number;
  idContrato: number;
  horaInicial: string;
  horaFinal: string;
  estado: string;
  idDia: number;
  duracionHoras: number;
}

export interface Instructor {
  idActivation: number;
  emailUsuario: string;
  idContrato: number;
  roles: string[];
  totalHoras: number;
  totalHorasFormato: string;
  horarios: HorarioMateria[];
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