/**
 * Estudiantes quemados para probar validación de solicitudes de inscripción.
 * TODO: reemplazar por GET /api/academico/estudiantes/{idEstudiante}
 */

export type EstadoMatriculaEstudiante = 'ACTIVA' | 'PENDIENTE' | 'SIN_MATRICULA' | 'RETIRADA';

export interface EstudianteInscripcionMock {
  idEstudiante: number;
  nombreCompleto: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono?: string;
  celular: string;
  fechaNacimiento: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  idMatricula: number | null;
  codigoMatricula?: string;
  estadoMatricula: EstadoMatriculaEstudiante;
  eps?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
}

export const estudiantesInscripcionMock: EstudianteInscripcionMock[] = [
  {
    idEstudiante: 1,
    nombreCompleto: 'Juan Pablo Pérez García',
    primerNombre: 'Juan',
    segundoNombre: 'Pablo',
    primerApellido: 'Pérez',
    segundoApellido: 'García',
    tipoDocumento: 'CC',
    documento: '1002456789',
    email: 'juan.perez@correo.com',
    telefono: '6041234567',
    celular: '3001234567',
    fechaNacimiento: '2004-03-15',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    direccion: 'Cra 45 # 12-30, Bello',
    idMatricula: 88,
    codigoMatricula: 'MAT-2026-0088',
    estadoMatricula: 'PENDIENTE',
    eps: 'Sura EPS',
    contactoEmergencia: 'Ana Pérez',
    telefonoEmergencia: '3101112233'
  },
  {
    idEstudiante: 2,
    nombreCompleto: 'María Fernanda López Ruiz',
    primerNombre: 'María',
    segundoNombre: 'Fernanda',
    primerApellido: 'López',
    segundoApellido: 'Ruiz',
    tipoDocumento: 'CC',
    documento: '1005678901',
    email: 'maria.lopez@correo.com',
    celular: '3109876543',
    fechaNacimiento: '2003-11-22',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    direccion: 'Cl 50 # 32-10, Laureles',
    idMatricula: 89,
    codigoMatricula: 'MAT-2026-0089',
    estadoMatricula: 'ACTIVA',
    eps: 'Sanitas',
    contactoEmergencia: 'Carlos López',
    telefonoEmergencia: '3205556677'
  },
  {
    idEstudiante: 3,
    nombreCompleto: 'Carlos Andrés Gómez Mesa',
    primerNombre: 'Carlos',
    segundoNombre: 'Andrés',
    primerApellido: 'Gómez',
    segundoApellido: 'Mesa',
    tipoDocumento: 'TI',
    documento: '1098765432',
    email: 'carlos.gomez@correo.com',
    celular: '3154445566',
    fechaNacimiento: '2008-07-08',
    ciudad: 'Envigado',
    departamento: 'Antioquia',
    direccion: 'Dg 38 # 18-45',
    idMatricula: null,
    estadoMatricula: 'SIN_MATRICULA',
    eps: 'Nueva EPS',
    contactoEmergencia: 'Lucía Mesa',
    telefonoEmergencia: '3008889900'
  },
  {
    idEstudiante: 4,
    nombreCompleto: 'Laura Valentina Restrepo Duque',
    primerNombre: 'Laura',
    segundoNombre: 'Valentina',
    primerApellido: 'Restrepo',
    segundoApellido: 'Duque',
    tipoDocumento: 'CC',
    documento: '1011223344',
    email: 'laura.restrepo@correo.com',
    celular: '3187654321',
    fechaNacimiento: '2005-01-30',
    ciudad: 'Itagüí',
    departamento: 'Antioquia',
    direccion: 'Av 34 # 56-12',
    idMatricula: 91,
    codigoMatricula: 'MAT-2026-0091',
    estadoMatricula: 'PENDIENTE',
    eps: 'Sura EPS',
    contactoEmergencia: 'Pedro Restrepo',
    telefonoEmergencia: '3112223344'
  },
  {
    idEstudiante: 5,
    nombreCompleto: 'Diego Alejandro Muñoz Vargas',
    primerNombre: 'Diego',
    segundoNombre: 'Alejandro',
    primerApellido: 'Muñoz',
    segundoApellido: 'Vargas',
    tipoDocumento: 'CC',
    documento: '1022334455',
    email: 'diego.munoz@correo.com',
    celular: '3176543210',
    fechaNacimiento: '2002-09-12',
    ciudad: 'Bello',
    departamento: 'Antioquia',
    direccion: 'Cra 52 # 78-90',
    idMatricula: 92,
    codigoMatricula: 'MAT-2026-0092',
    estadoMatricula: 'RETIRADA',
    eps: 'Compensar',
    contactoEmergencia: 'Sandra Vargas',
    telefonoEmergencia: '3145556677'
  },
  {
    idEstudiante: 6,
    nombreCompleto: 'Sofía Isabel Castaño Ortiz',
    primerNombre: 'Sofía',
    segundoNombre: 'Isabel',
    primerApellido: 'Castaño',
    segundoApellido: 'Ortiz',
    tipoDocumento: 'CC',
    documento: '1033445566',
    email: 'sofia.castano@correo.com',
    celular: '3198765432',
    fechaNacimiento: '2004-12-05',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    direccion: 'Transversal 34 # 45-67',
    idMatricula: 93,
    codigoMatricula: 'MAT-2026-0093',
    estadoMatricula: 'PENDIENTE',
    eps: 'Sanitas',
    contactoEmergencia: 'Jorge Castaño',
    telefonoEmergencia: '3123334455'
  }
];

export function getEstudiantePorId(idEstudiante: number): EstudianteInscripcionMock | undefined {
  return estudiantesInscripcionMock.find((e) => e.idEstudiante === idEstudiante);
}

export function getEstudiantePorDocumento(documento: string): EstudianteInscripcionMock | undefined {
  return estudiantesInscripcionMock.find((e) => e.documento === documento);
}

export function buscarEstudiantesInscripcion(termino: string): EstudianteInscripcionMock[] {
  const t = termino.trim().toLowerCase();
  if (!t) return estudiantesInscripcionMock;
  return estudiantesInscripcionMock.filter(
    (e) =>
      e.nombreCompleto.toLowerCase().includes(t) ||
      e.documento.includes(t) ||
      (e.codigoMatricula?.toLowerCase().includes(t) ?? false) ||
      String(e.idMatricula ?? '').includes(t)
  );
}
