import { getEstudiantePorId } from './mockEstudiantesInscripcion';

export type EstadoSolicitudInscripcion = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudInscripcionMock {
  idSolicitud: number;
  numeroSolicitud: string;
  idEstudiante: number;
  nombreEstudiante: string;
  documento: string;
  email?: string;
  telefono?: string;
  idMatricula: number | null;
  idPrograma: number;
  nombrePrograma: string;
  codigoPrograma: string;
  fechaSolicitud: string;
  estado: EstadoSolicitudInscripcion;
  /** Si false, no hay cobro asociado (sin factura). */
  requierePago: boolean;
  /** Nota interna para identificar el caso de prueba en el listado. */
  casoPrueba?: string;
}

const baseSolicitudes: Omit<
  SolicitudInscripcionMock,
  'nombreEstudiante' | 'documento' | 'email' | 'telefono' | 'idMatricula'
>[] = [
  {
    idSolicitud: 1,
    numeroSolicitud: 'SOL-2026-0001',
    idEstudiante: 1,
    idPrograma: 42,
    nombrePrograma: 'Técnico en Desarrollo de Software',
    codigoPrograma: '228106-V1',
    fechaSolicitud: '2026-06-01',
    estado: 'PENDIENTE',
    requierePago: true,
    casoPrueba: 'Factura pendiente → registrar pago en paso 4'
  },
  {
    idSolicitud: 2,
    numeroSolicitud: 'SOL-2026-0002',
    idEstudiante: 2,
    idPrograma: 42,
    nombrePrograma: 'Técnico en Desarrollo de Software',
    codigoPrograma: '228106-V1',
    fechaSolicitud: '2026-05-25',
    estado: 'EN_REVISION',
    requierePago: true,
    casoPrueba: 'Factura pagada → omitir paso 4'
  },
  {
    idSolicitud: 3,
    numeroSolicitud: 'SOL-2026-0003',
    idEstudiante: 3,
    idPrograma: 15,
    nombrePrograma: 'Curso corto en habilidades digitales',
    codigoPrograma: 'CCD-001',
    fechaSolicitud: '2026-06-02',
    estado: 'PENDIENTE',
    requierePago: false,
    casoPrueba: 'Sin cobro → omitir paso 4'
  },
  {
    idSolicitud: 4,
    numeroSolicitud: 'SOL-2026-0004',
    idEstudiante: 4,
    idPrograma: 42,
    nombrePrograma: 'Técnico en Desarrollo de Software',
    codigoPrograma: '228106-V1',
    fechaSolicitud: '2026-06-03',
    estado: 'PENDIENTE',
    requierePago: true,
    casoPrueba: 'Factura en proceso → revisar paso 2, sin registro en paso 4'
  },
  {
    idSolicitud: 5,
    numeroSolicitud: 'SOL-2026-0005',
    idEstudiante: 5,
    idPrograma: 28,
    nombrePrograma: 'Análisis y Desarrollo de Software',
    codigoPrograma: 'ADSO-V2',
    fechaSolicitud: '2026-05-20',
    estado: 'EN_REVISION',
    requierePago: true,
    casoPrueba: 'Factura anulada → continuar sin registrar pago'
  },
  {
    idSolicitud: 6,
    numeroSolicitud: 'SOL-2026-0006',
    idEstudiante: 6,
    idPrograma: 28,
    nombrePrograma: 'Análisis y Desarrollo de Software',
    codigoPrograma: 'ADSO-V2',
    fechaSolicitud: '2026-06-04',
    estado: 'PENDIENTE',
    requierePago: true,
    casoPrueba: 'Factura pendiente con descuento → paso 4 con total reducido'
  }
];

function enriquecerConEstudiante(
  base: Omit<
    SolicitudInscripcionMock,
    'nombreEstudiante' | 'documento' | 'email' | 'telefono' | 'idMatricula'
  >
): SolicitudInscripcionMock {
  const estudiante = getEstudiantePorId(base.idEstudiante);
  return {
    ...base,
    nombreEstudiante: estudiante?.nombreCompleto ?? `Estudiante #${base.idEstudiante}`,
    documento: estudiante?.documento ?? '0000000000',
    email: estudiante?.email,
    telefono: estudiante?.celular ?? estudiante?.telefono,
    idMatricula: estudiante?.idMatricula ?? null
  };
}

export const solicitudesInscripcionMock: SolicitudInscripcionMock[] =
  baseSolicitudes.map(enriquecerConEstudiante);

export function getSolicitudPorId(idSolicitud: number): SolicitudInscripcionMock | undefined {
  return solicitudesInscripcionMock.find((s) => s.idSolicitud === idSolicitud);
}
