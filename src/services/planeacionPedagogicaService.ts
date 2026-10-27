import axios from 'axios';

export type NivelPlaneacion = 'PRIMARIA' | 'BACHILLER';
export type EstadoPlaneacion =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'APROBADA'
  | 'EN_EJECUCION'
  | 'CERRADA'
  | 'INCOMPLETA';

export type SecuenciaItem = {
  momento: string;
  actividad: string;
  tiempo: string;
};

export type PlaneacionClase = {
  id?: number;
  idHorarioMateria?: number | null;
  idDia?: number | null;
  diaNombre?: string | null;
  asignatura?: string | null;
  horaInicial?: string | null;
  horaFinal?: string | null;
  tema?: string | null;
  aprendizajeEsperado?: string | null;
  preguntaProblematizadora?: string | null;
  saberesPrevios?: string | null;
  estandar?: string | null;
  dba?: string | null;
  competencia?: string | null;
  evidencia?: string | null;
  criterios?: string | null;
  instrumento?: string | null;
  recursos?: string | null;
  refuerzo?: string | null;
  profundizacion?: string | null;
  actividadPractica?: string | null;
  secuencia?: SecuenciaItem[];
  tallerTitulo?: string | null;
  tallerContenido?: string | null;
  tallerEstrategia?: string | null;
  tallerEntregables?: string | null;
  tallerInicio?: string | null;
  tallerFin?: string | null;
  idActividad?: number | null;
  idMateria?: number | null;
  ejecutada?: boolean;
  orden?: number;
};

export type PlaneacionPedagogica = {
  id: number;
  idContrato: number;
  idFicha?: number | null;
  semanaInicio: string;
  semanaFin: string;
  nivel: NivelPlaneacion;
  grado?: string | null;
  periodo?: string | null;
  institucion?: string | null;
  docenteNombre?: string | null;
  proposito?: string | null;
  temaIntegrador?: string | null;
  metodologia?: string | null;
  estado: EstadoPlaneacion;
  reflexionDocente?: string | null;
  motivoIncompleta?: string | null;
  coordinadorEmail?: string | null;
  enviadoAt?: string | null;
  clases?: PlaneacionClase[];
  clases_count?: number;
};

export function secuenciaVacia(): SecuenciaItem[] {
  return [
    { momento: 'Inicio', actividad: '', tiempo: '15 min' },
    { momento: 'Desarrollo', actividad: '', tiempo: '60 min' },
    { momento: 'Cierre', actividad: '', tiempo: '15 min' }
  ];
}

export async function listPlaneaciones(): Promise<PlaneacionPedagogica[]> {
  const { data } = await axios.get('planeacion-pedagogica');
  return data?.data ?? [];
}

export async function getPlaneacion(id: number): Promise<PlaneacionPedagogica> {
  const { data } = await axios.get(`planeacion-pedagogica/${id}`);
  return data.data;
}

export async function createPlaneacion(payload: Record<string, unknown>) {
  const { data } = await axios.post('planeacion-pedagogica', payload);
  return data.data as PlaneacionPedagogica;
}

export async function updatePlaneacion(id: number, payload: Record<string, unknown>) {
  const { data } = await axios.put(`planeacion-pedagogica/${id}`, payload);
  return data.data as PlaneacionPedagogica;
}

export async function deletePlaneacion(id: number) {
  await axios.delete(`planeacion-pedagogica/${id}`);
}

export async function enviarPlaneacion(
  id: number,
  body: { coordinadorEmail: string; reflexionDocente?: string }
) {
  const { data } = await axios.post(`planeacion-pedagogica/${id}/enviar`, body);
  return data.data as PlaneacionPedagogica;
}

export async function cambiarEstadoPlaneacion(
  id: number,
  body: { estado: 'EN_EJECUCION' | 'CERRADA' | 'INCOMPLETA'; motivoIncompleta?: string }
) {
  const { data } = await axios.post(`planeacion-pedagogica/${id}/estado`, body);
  return data.data as PlaneacionPedagogica;
}

export async function downloadPlaneacionPdf(id: number) {
  const res = await axios.get(`planeacion-pedagogica/${id}/pdf`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `planeacion_pedagogica_${id}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function marcarClaseEjecutada(claseId: number, ejecutada: boolean) {
  const { data } = await axios.patch(`planeacion-pedagogica/clase/${claseId}/ejecutada`, {
    ejecutada
  });
  return data.data as PlaneacionClase;
}

/** Lunes de la semana ISO local (YYYY-MM-DD). */
export function lunesDeSemana(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toYmd(date);
}

export function domingoDeSemana(lunesYmd: string): string {
  const d = new Date(lunesYmd + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return toYmd(d);
}

/** Viernes de la semana laboral (lunes + 4 días). */
export function viernesDeSemana(lunesYmd: string): string {
  const d = new Date(lunesYmd + 'T12:00:00');
  d.setDate(d.getDate() + 4);
  return toYmd(d);
}

export const GRADOS_PRIMARIA = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto'] as const;

export const GRADOS_BACHILLER = [
  'Sexto',
  'Séptimo',
  'Octavo',
  'Noveno',
  'Décimo',
  'Undécimo'
] as const;

/** Normaliza nombres cortos/truncados de grado (ej. TERCER → Tercero). */
export function normalizarGrado(valor: string | null | undefined, nivel: NivelPlaneacion): string {
  const raw = String(valor || '').trim();
  if (!raw) return '';
  const u = raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const mapa: Record<string, string> = {
    '1': 'Primero',
    PRIMERO: 'Primero',
    '1O': 'Primero',
    '2': 'Segundo',
    SEGUNDO: 'Segundo',
    '2O': 'Segundo',
    '3': 'Tercero',
    TERCER: 'Tercero',
    TERCERO: 'Tercero',
    '3O': 'Tercero',
    '4': 'Cuarto',
    CUARTO: 'Cuarto',
    '4O': 'Cuarto',
    '5': 'Quinto',
    QUINTO: 'Quinto',
    '5O': 'Quinto',
    '6': 'Sexto',
    SEXTO: 'Sexto',
    '6O': 'Sexto',
    '7': 'Séptimo',
    SEPTIMO: 'Séptimo',
    '7O': 'Séptimo',
    '8': 'Octavo',
    OCTAVO: 'Octavo',
    '8O': 'Octavo',
    '9': 'Noveno',
    NOVENO: 'Noveno',
    '9O': 'Noveno',
    '10': 'Décimo',
    DECIMO: 'Décimo',
    '10O': 'Décimo',
    '11': 'Undécimo',
    UNDECIMO: 'Undécimo',
    ONCE: 'Undécimo',
    '11O': 'Undécimo'
  };

  for (const [k, v] of Object.entries(mapa)) {
    if (u === k || u.startsWith(k + ' ') || u.includes(' ' + k + ' ') || u.endsWith(' ' + k)) {
      const okPrimaria = GRADOS_PRIMARIA.includes(v as (typeof GRADOS_PRIMARIA)[number]);
      const okBachiller = GRADOS_BACHILLER.includes(v as (typeof GRADOS_BACHILLER)[number]);
      if (nivel === 'PRIMARIA' && okPrimaria) return v;
      if (nivel === 'BACHILLER' && okBachiller) return v;
    }
  }

  // Coincidencia por prefijo (TERCER GRADO, TERCERO A, etc.)
  if (nivel === 'PRIMARIA') {
    if (u.startsWith('PRIM')) return 'Primero';
    if (u.startsWith('SEG')) return 'Segundo';
    if (u.startsWith('TERC')) return 'Tercero';
    if (u.startsWith('CUAR')) return 'Cuarto';
    if (u.startsWith('QUIN')) return 'Quinto';
  }

  return raw;
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** datetime-local value from API datetime. */
export function toDatetimeLocal(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const s = String(v).replace(' ', 'T').slice(0, 16);
    return s;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Etiqueta clara para el docente. */
export function labelEstado(estado: EstadoPlaneacion | string): string {
  if (estado === 'CERRADA') return 'Finalizada';
  if (estado === 'INCOMPLETA') return 'Incompleta';
  if (estado === 'BORRADOR') return 'Borrador';
  return 'En curso';
}

export const ESTADO_LABEL: Record<EstadoPlaneacion, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'En curso',
  APROBADA: 'En curso',
  EN_EJECUCION: 'En curso',
  CERRADA: 'Finalizada',
  INCOMPLETA: 'Incompleta'
};

export const ESTADO_CLASS: Record<EstadoPlaneacion, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700 border-slate-200',
  ENVIADA: 'bg-sky-50 text-sky-800 border-sky-200',
  APROBADA: 'bg-sky-50 text-sky-800 border-sky-200',
  EN_EJECUCION: 'bg-sky-50 text-sky-800 border-sky-200',
  CERRADA: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INCOMPLETA: 'bg-amber-50 text-amber-800 border-amber-200'
};

/** Fecha corta dd/mm para tarjetas. */
export function fechaCorta(v?: string | null): string {
  if (!v) return '—';
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}`;
}
