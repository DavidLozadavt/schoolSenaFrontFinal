export type EstadoConceptoPago = 'PENDIENTE' | 'PAGADO' | 'RECHAZADO' | 'EN_PROCESO';

export interface ConceptoPagoMock {
  idPago: number;
  concepto: string;
  descripcion: string;
  valor: number;
  estado: EstadoConceptoPago;
  fecha: string;
  medioPago: string | null;
  referencia: string | null;
  seleccionable: boolean;
}

export interface MockPagosProgramaData {
  estudiante: {
    id: number;
    nombre: string;
    documento: string;
  };
  programa: {
    id: number;
    nombre: string;
    codigo: string;
  };
  transaccion: {
    id: number;
    estado: string;
  };
  conceptos: ConceptoPagoMock[];
}

/** Datos base de la billetera académica (maqueta). */
export const mockPagosPrograma: MockPagosProgramaData = {
  estudiante: {
    id: 1001,
    nombre: 'María Fernanda López García',
    documento: '1098765432'
  },
  programa: {
    id: 42,
    nombre: 'Técnico en Desarrollo de Software',
    codigo: '228106-V1'
  },
  transaccion: {
    id: 900245,
    estado: 'ABIERTA'
  },
  conceptos: [
    {
      idPago: 501,
      concepto: 'Matrícula académica',
      descripcion: 'Derechos de matrícula periodo 2026-1',
      valor: 850000,
      estado: 'PENDIENTE',
      fecha: '2026-02-01',
      medioPago: null,
      referencia: null,
      seleccionable: true
    },
    {
      idPago: 502,
      concepto: 'Inscripción',
      descripcion: 'Concepto de inscripción al programa formativo',
      valor: 120000,
      estado: 'PENDIENTE',
      fecha: '2026-02-05',
      medioPago: null,
      referencia: null,
      seleccionable: true
    },
    {
      idPago: 503,
      concepto: 'Certificado de notas',
      descripcion: 'Expedición certificado académico',
      valor: 45000,
      estado: 'PAGADO',
      fecha: '2025-12-10',
      medioPago: 'Transferencia bancaria',
      referencia: 'TRX-2025-88421',
      seleccionable: false
    },
    {
      idPago: 504,
      concepto: 'Carné estudiantil',
      descripcion: 'Emisión carné — pago en verificación',
      valor: 35000,
      estado: 'EN_PROCESO',
      fecha: '2026-01-28',
      medioPago: 'PSE',
      referencia: 'WOMPI-PENDING-9921',
      seleccionable: false
    },
    {
      idPago: 505,
      concepto: 'Seguro estudiantil',
      descripcion: 'Póliza rechazada por documentación incompleta',
      valor: 28000,
      estado: 'RECHAZADO',
      fecha: '2026-01-15',
      medioPago: 'Efectivo',
      referencia: 'REC-2026-0012',
      seleccionable: false
    }
  ]
};

import type { EstudiantePagoMock } from './mockEstudiantesPago';

/** Combina mock con programa y estudiante seleccionado por el administrador. */
export function getMockPagosPrograma(
  programa?: { id?: number; name?: string; codigo?: string } | null,
  estudiante?: EstudiantePagoMock | null
): MockPagosProgramaData {
  const programaData = {
    id: programa?.id ?? mockPagosPrograma.programa.id,
    nombre: programa?.name ?? mockPagosPrograma.programa.nombre,
    codigo: programa?.codigo ?? mockPagosPrograma.programa.codigo
  };

  if (!estudiante) {
    return {
      ...mockPagosPrograma,
      programa: programaData,
      estudiante: { id: 0, nombre: '', documento: '' },
      transaccion: { id: 0, estado: '—' }
    };
  }

  return {
    ...mockPagosPrograma,
    programa: programaData,
    estudiante: {
      id: estudiante.idEstudiante,
      nombre: estudiante.nombre,
      documento: estudiante.documento
    },
    transaccion: {
      id: estudiante.idTransaccion,
      estado: 'ABIERTA'
    }
  };
}
