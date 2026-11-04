import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth/useAuthContext';
import {
  claseOcurreHoy,
  columnaHorarioApiClase,
  jsGetDayDesdeApiClase,
  normalizarHoraCampoClaseApi,
  obtenerVentanaHorariaHoy,
  claseVisibleEnGrillaHorario,
  ocurrenciaPendienteEnDiaCalendario,
  seccionesSemanaCalendarioClase,
  sesionCompletadaEnFecha,
  textoRangoHorarioClase,
  titulosCompetenciaYRapUi,
  normalizarInstructoresRapApi,
  nombresInstructoresCalificacion,
  nombreOtroInstructorReemplazo,
  reemplazoActivoEnClase,
  horaClaveClaseAsignada,
  type InstructorRapAsociado
} from '@/utils/clasesAsignadasLogica';
import { useClasesInstructorAsignadas } from '@/hooks/useClasesInstructorAsignadas';
import { fetchHistorialSesionesInstructor, ymdFromFechaSesion } from '@/utils/clasesAsignadasLogica';
import {
  descargarPlaneacionFicha,
  FichaPlaneacionMeta,
  metaPlaneacionDesdeFichaRaw,
  obtenerIdContratoActivo,
  puedeDescargarPlaneacion
} from './utils/descargarPlaneacionFicha';
interface Props {
  evento: boolean;
  setEvento: (value: boolean) => void;
  idInstructor?: number;
}

interface SesionCompletada {
  id: number;
  numeroSesion: number;
  fechaSesion: string;
  fechaFormateada: string;
  fechaCorta: string;
  estado: string;
  observacion?: string | null;
  evaluador_nombre?: string | null;
}

interface Clase {
  ficha_id: number;
  ficha_codigo: string;
  programa_nombre: string;
  materia_nombre: string;
  /** Nombre de la competencia (padre en `materia` o la misma materia si no hay RAP). */
  competencia_nombre: string;
  /** Nombre del RAP (hijo); vacío si el horario es solo por competencia sin fila RAP. */
  rap_nombre: string | null;
  idMateriaPadre: number | null;
  jornada_nombre: string;
  jornada_tipo: string;
  dia_semana: string;
  idDia: number; // ID del día desde la BD: 1=Lunes, 2=Martes, ..., 7=Domingo
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string | null;
  estado: string;
  total_sesiones: number;
  sesiones_dadas?: number;
  sesiones_restantes?: number;
  sesiones_completadas?: SesionCompletada[];
  contrato_id: number;
  instructor_nombre: string;
  idGradoPrograma: number | null;
  grado_nombre: string | null;
  idHorarioMateria: number;
  idGradoMateria: number;
  idMateria: number;
  /** Salón/aula física si `horarioMateria.idInfraestructura` está enlazado; si no, no mostrar número inventado. */
  aula_nombre?: string | null;
  tipo_asignacion?: string | null;
  modalidad_rap?: string | null;
  asignacion_vigente?: boolean;
  reemplazo_vigente_por_otro?: boolean;
  es_reemplazante?: boolean;
  instructores_rap?: InstructorRapAsociado[];
}

/** Quita caracteres invisibles que a veces vienen del backend y rompen .includes() en prefijos cortos. */
function sanitizeBusquedaRaw(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00AD/g, '');
}

function textoIndexBusquedaClase(clase: Clase): string {
  const { competencia, rap } = titulosCompetenciaYRapUi(clase);
  const sesExtras = (clase.sesiones_completadas ?? []).flatMap((s) => [
    s.evaluador_nombre ?? '',
    s.observacion ?? ''
  ]);
  const parts = [
    competencia,
    rap ?? '',
    clase.competencia_nombre ?? '',
    clase.materia_nombre ?? '',
    clase.rap_nombre ?? '',
    clase.programa_nombre ?? '',
    clase.ficha_codigo ?? '',
    String(clase.ficha_id ?? ''),
    clase.jornada_nombre ?? '',
    clase.instructor_nombre ?? '',
    clase.grado_nombre ?? '',
    clase.aula_nombre ?? '',
    clase.dia_semana ?? '',
    String(clase.idMateria ?? ''),
    String(clase.idHorarioMateria ?? ''),
    ...sesExtras
  ];
  return sanitizeBusquedaRaw(parts.join(' '));
}

/**
 * Una sesión por registro lógico dentro del array de una clase.
 * Incluye idHorario en la clave por si el mismo id de sesión viniera mal repetido entre filas.
 */
function dedupeSesionesCompletadasPorId(
  lista: SesionCompletada[],
  idHorarioMateria: number
): SesionCompletada[] {
  const seen = new Set<string>();
  const out: SesionCompletada[] = [];
  const hm = Number(idHorarioMateria);
  for (const s of lista) {
    const ymd = String(s.fechaSesion ?? '').split('T')[0];
    const n = Number(s.numeroSesion);
    const sid = Number(s.id);
    const key =
      Number.isFinite(sid) && sid > 0
        ? `id:${sid}`
        : `hm:${hm}|${ymd}|n:${Number.isFinite(n) ? n : s.numeroSesion}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** Quita tildes y pasa a minúsculas para que "desarrollo" encuentre aunque el usuario escriba distinto. */
function foldBusqueda(s: string): string {
  const clean = sanitizeBusquedaRaw(s);
  try {
    return clean
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  } catch {
    return clean.toLowerCase();
  }
}

/** Una cadena por horario: competencia, RAP, ficha, programa, jornada, instructor — subcadena en tiempo real. */
function claseCoincideBusquedaHistorial(
  idHorarioMateria: number,
  termFolded: string,
  haystackMap: Map<number, string>
): boolean {
  if (!termFolded) return true;
  const h = haystackMap.get(idHorarioMateria);
  return h != null && h.includes(termFolded);
}

/** Ocurrencia única de sesión dictada (misma franja ficha+día+horas; titular/clon compartido = una tarjeta). */
function claveOcurrenciaSesionListado(clase: Clase, s: SesionCompletada): string {
  const ymd = ymdFromFechaSesion(s.fechaSesion) ?? '';
  const n = Number(s.numeroSesion);

  const ficha = Number(clase.ficha_id ?? 0);
  const idDia = Number(clase.idDia ?? 0);
  const hi = horaClaveClaseAsignada(clase.horaInicial ?? '');
  const hf = horaClaveClaseAsignada(clase.horaFinal ?? '');
  if (ficha > 0 && idDia > 0 && hi && hf && ymd) {
    return `slot:${ficha}|${idDia}|${hi}|${hf}|${ymd}|${Number.isFinite(n) ? n : s.numeroSesion}`;
  }

  const hm = Number(clase.idHorarioMateria);
  const id = Number(s.id);
  if (Number.isFinite(id) && id > 0) return `id:${id}`;
  return `${Number.isFinite(hm) ? hm : 0}|${ymd}|${Number.isFinite(n) ? n : s.numeroSesion}`;
}

function puntajeClaseHistorialCompletado(clase: Clase): number {
  let score = 0;
  if (clase.modalidad_rap === 'COMPARTIDO') score += 1000;
  if ((clase.instructores_rap ?? []).length > 1) score += 100;
  return score;
}

/** Historial API + sesiones de clases-asignadas (misma fuente que el badge X/Y). */
function fusionarSesionesCompletadasHistorial(
  historialApi: Array<{ clase: Clase; sesion: SesionCompletada }>,
  clasesLista: Clase[]
): Array<{ clase: Clase; sesion: SesionCompletada }> {
  const porClave = new Map<string, { clase: Clase; sesion: SesionCompletada }>();
  const insertar = (clase: Clase, sesion: SesionCompletada) => {
    const ymd = ymdFromFechaSesion(sesion.fechaSesion);
    if (!ymd) return;
    const sesionNorm: SesionCompletada = {
      ...sesion,
      fechaSesion: ymd
    };
    const key = claveOcurrenciaSesionListado(clase, sesionNorm);
    const prev = porClave.get(key);
    if (!prev) {
      porClave.set(key, { clase, sesion: sesionNorm });
      return;
    }
    if (puntajeClaseHistorialCompletado(clase) > puntajeClaseHistorialCompletado(prev.clase)) {
      porClave.set(key, { clase, sesion: sesionNorm });
    }
  };
  for (const item of historialApi) {
    insertar(item.clase, item.sesion);
  }
  for (const clase of clasesLista) {
    for (const sesion of clase.sesiones_completadas ?? []) {
      insertar(clase, sesion);
    }
  }
  return Array.from(porClave.values());
}

const parseSoloFecha = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** YYYY-MM-DD en calendario local (evita el desfase de toISOString() → UTC). */
const formatYmdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Lunes como inicio de semana (calendario local). */
const startOfWeekMondayLocal = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** 0 = misma semana que `now`, 1 = siguiente, etc. */
const weekOffsetFromTodayYmd = (ymd: string, now: Date): number => {
  const clean = ymd.split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  const session = new Date(y, m - 1, d);
  const sMon = startOfWeekMondayLocal(session);
  const tMon = startOfWeekMondayLocal(now);
  return Math.round((sMon.getTime() - tMon.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

const tituloSeccionSemanaPendiente = (weekOffset: number, primeraFechaYmd: string): string => {
  if (weekOffset === 0) return 'Esta semana';
  if (weekOffset === 1) return 'Próxima semana';
  const clean = primeraFechaYmd.split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const start = startOfWeekMondayLocal(dt);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `Semana del ${fmt.format(start)} al ${fmt.format(end)}`;
};

/** Orden lun → dom con `Date.getDay()` (1=lun … 6=sáb, 0=dom). */
const ORDEN_DIA_SEMANA_LUN_A_DOM: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/**
 * Último día de la semana con clase (columna horario), para la vista corta de pendientes.
 */
function calcularAnchorMinVistaPendiente(
  clases: Clase[],
  now: Date,
  getEstado: (c: Clase) => string
): number {
  const cols = clases.map((c) => columnaHorarioApiClase(c)).filter((n) => n >= 0 && n <= 6);
  const colUlt = cols.length > 0 ? Math.max(...cols) : 3;
  const ultimoJs = (colUlt + 1) % 7;
  const dow = now.getDay();
  const idxUlt = ORDEN_DIA_SEMANA_LUN_A_DOM.indexOf(ultimoJs);
  const idxNow = ORDEN_DIA_SEMANA_LUN_A_DOM.indexOf(dow);
  if (idxUlt === -1 || idxNow === -1) return 0;
  if (idxNow > idxUlt) return 1;
  if (idxNow === idxUlt) {
    const hayUltimoEnCurso = clases.some(
      (c) => columnaHorarioApiClase(c) === colUlt && getEstado(c) === 'EN CURSO'
    );
    return hayUltimoEnCurso ? 1 : 0;
  }
  return 0;
}

/** Sesión con registro en `sesionMateria` → historial Completado (todas, salvo fechas futuras). */
const sesionListableComoCompletada = (
  _clase: Clase,
  sesion: SesionCompletada,
  ahoraRef: Date
): boolean => {
  if (!sesion.fechaSesion?.trim()) return false;
  const ymd = ymdFromFechaSesion(sesion.fechaSesion);
  if (!ymd) return false;
  const [y, m, d] = ymd.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return false;

  const diaSesion = new Date(y, m - 1, d);
  diaSesion.setHours(0, 0, 0, 0);
  const hoy = new Date(ahoraRef.getFullYear(), ahoraRef.getMonth(), ahoraRef.getDate());
  hoy.setHours(0, 0, 0, 0);

  return diaSesion.getTime() <= hoy.getTime();
};

const sesionValidaEnHistorial = (sesion: SesionCompletada): boolean => {
  if (!ymdFromFechaSesion(sesion.fechaSesion)) return false;
  const n = Number(sesion.numeroSesion);
  return Number.isFinite(n) && n >= 0;
};

type FiltroEstadoHistorial = 'en_curso' | 'pendiente' | 'completado';

const ListaHistorialRAPs: React.FC<Props> = ({ evento, setEvento, idInstructor }) => {
  const navigate = useNavigate();
  const authContext = useAuthContext();
  const { clases: clasesApi, loading: loadingApi, refetch } = useClasesInstructorAsignadas(idInstructor);
  const [clases, setClases] = useState<Clase[]>([]);
  const [historialSesiones, setHistorialSesiones] = useState<
    Array<{ clase: Clase; sesion: SesionCompletada }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FiltroEstadoHistorial>('pendiente');
  const [busquedaLista, setBusquedaLista] = useState('');
  // Estado para actualizar el tiempo en tiempo real y recalcular estados de clases
  const [currentTime, setCurrentTime] = useState(new Date());
  const franjasRefrescadasRef = useRef<Set<string>>(new Set());

  /** Map de ficha_id → metadata (documentos + planeación) */
  const [metaPorFicha, setMetaPorFicha] = useState<Record<number, FichaPlaneacionMeta>>({});
  const [exportandoPlaneacionFichaId, setExportandoPlaneacionFichaId] = useState<number | null>(
    null
  );

  const idContratoUsuario = useMemo(
    () => obtenerIdContratoActivo(authContext?.user?.persona?.contrato),
    [authContext?.user?.persona?.contrato]
  );

  const handleDescargarPlaneacion = useCallback(
    async (fichaId: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const meta = metaPorFicha[fichaId];
      if (!meta || !puedeDescargarPlaneacion(meta, idContratoUsuario)) return;
      try {
        setExportandoPlaneacionFichaId(fichaId);
        await descargarPlaneacionFicha(meta);
      } catch (err) {
        console.error('Error al exportar planeación:', err);
        alert('No se pudo exportar la planeación. Intenta de nuevo.');
      } finally {
        setExportandoPlaneacionFichaId(null);
      }
    },
    [metaPorFicha, idContratoUsuario]
  );

  const queryBusquedaDisplay = useMemo(() => busquedaLista.trim(), [busquedaLista]);
  const termBusquedaFolded = useMemo(
    () => foldBusqueda(queryBusquedaDisplay),
    [queryBusquedaDisplay]
  );

  /** Texto normalizado por id de horario; un solo .includes por tecla. */
  const haystackPorHorario = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of clases) {
      const id = Number(c.idHorarioMateria);
      if (!Number.isFinite(id) || id <= 0) continue;
      const blob = foldBusqueda(textoIndexBusquedaClase(c));
      m.set(id, blob);
    }
    return m;
  }, [clases]);

  /**
   * Normaliza los datos de una clase que llegan del backend,
   * convirtiendo campos que pueden llegar como string a su tipo correcto.
   */
  const normalizarClase = (raw: any): Clase => {
    const toNum = (val: any): number => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const toNumOrNull = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const normalizarSesion = (s: any): SesionCompletada => ({
      id: toNum(s.id),
      numeroSesion: toNum(s.numeroSesion),
      fechaSesion: String(s.fechaSesion ?? ''),
      fechaFormateada: String(s.fechaFormateada ?? ''),
      fechaCorta: String(s.fechaCorta ?? ''),
      estado: String(s.estado ?? ''),
      observacion: s.observacion != null ? String(s.observacion) : null
    });

    const idHorarioMateria = toNum(raw.idHorarioMateria);

    const materiaNombre = String(raw.materia_nombre ?? '');
    const competenciaRaw =
      raw.competencia_nombre != null
        ? String(raw.competencia_nombre).trim()
        : raw.competenciaNombre != null
          ? String(raw.competenciaNombre).trim()
          : '';
    const competencia_nombre =
      competenciaRaw || materiaNombre || String(raw.programa_nombre ?? '');
    const rapSource = raw.rap_nombre ?? raw.rapNombre;
    const rapRaw =
      rapSource != null && rapSource !== '' && String(rapSource).toLowerCase() !== 'null'
        ? String(rapSource).trim()
        : '';
    const rap_nombre = rapRaw.length > 0 ? rapRaw : null;

    const aulaRaw = raw.aula_nombre != null ? String(raw.aula_nombre).trim() : '';
    const aula_nombre = aulaRaw.length > 0 ? aulaRaw : null;

    return {
      ficha_id: toNum(raw.ficha_id),
      ficha_codigo: String(raw.ficha_codigo ?? ''),
      programa_nombre: String(raw.programa_nombre ?? ''),
      materia_nombre: materiaNombre,
      competencia_nombre,
      rap_nombre,
      idMateriaPadre: toNumOrNull(raw.idMateriaPadre),
      jornada_nombre: String(raw.jornada_nombre ?? ''),
      jornada_tipo: String(raw.jornada_tipo ?? ''),
      dia_semana: String(raw.dia_semana ?? ''),
      idDia: toNum(raw.idDia),
      horaInicial: normalizarHoraCampoClaseApi(raw.horaInicial),
      horaFinal: normalizarHoraCampoClaseApi(raw.horaFinal),
      fechaInicial: String(raw.fechaInicial ?? ''),
      fechaFinal: raw.fechaFinal != null ? String(raw.fechaFinal) : null,
      estado: String(raw.estado ?? ''),
      total_sesiones: toNum(raw.total_sesiones),
      sesiones_dadas: toNum(raw.sesiones_dadas),
      sesiones_restantes: toNum(raw.sesiones_restantes),
      sesiones_completadas: dedupeSesionesCompletadasPorId(
        Array.isArray(raw.sesiones_completadas)
          ? raw.sesiones_completadas.map(normalizarSesion)
          : [],
        idHorarioMateria
      ),
      contrato_id: toNum(raw.contrato_id),
      instructor_nombre: String(raw.instructor_nombre ?? ''),
      idGradoPrograma: toNumOrNull(raw.idGradoPrograma),
      grado_nombre: raw.grado_nombre != null ? String(raw.grado_nombre) : null,
      idHorarioMateria,
      idGradoMateria: toNum(raw.idGradoMateria),
      idMateria: toNum(raw.idMateria),
      aula_nombre,
      tipo_asignacion: raw.tipo_asignacion ?? null,
      modalidad_rap: raw.modalidad_rap ?? null,
      asignacion_vigente: !!raw.asignacion_vigente,
      reemplazo_vigente_por_otro: !!raw.reemplazo_vigente_por_otro,
      es_reemplazante: !!raw.es_reemplazante,
      instructores_rap: normalizarInstructoresRapApi(raw.instructores_rap),
    };
  };

  const cargarHistorialSesiones = useCallback(async () => {
    try {
      const items = await fetchHistorialSesionesInstructor(idInstructor);
      setHistorialSesiones(
        items.map((item) => ({
          sesion: {
            id: Number(item.sesion.id),
            numeroSesion: Number(item.sesion.numeroSesion),
            fechaSesion: String(item.sesion.fechaSesion ?? ''),
            fechaFormateada: String(item.sesion.fechaFormateada ?? ''),
            fechaCorta: String(item.sesion.fechaCorta ?? ''),
            estado: String(item.sesion.estado ?? ''),
            observacion: item.sesion.observacion ?? null,
            evaluador_nombre: item.sesion.evaluador_nombre ?? null
          },
          clase: normalizarClase(item.clase) as Clase
        }))
      );
    } catch {
      setHistorialSesiones([]);
    }
  }, [idInstructor]);

  useEffect(() => {
    cargarHistorialSesiones();
  }, [cargarHistorialSesiones]);

  useEffect(() => {
    if (!evento) return;
    Promise.all([refetch(), cargarHistorialSesiones()]).finally(() => setEvento(false));
  }, [evento, setEvento, refetch, cargarHistorialSesiones]);

  useEffect(() => {
    setClases(clasesApi.map((raw) => normalizarClase(raw as Record<string, unknown>)) as Clase[]);
  }, [clasesApi]);

  // Cargar documentos de fichas y programas cuando cambian las clases
  useEffect(() => {
    if (clases.length === 0) return;
    const backUrl = import.meta.env.VITE_APP_BACKEND_URL ?? '';
    // Fichas únicas presentes
    const fichaIdsUnicos = [...new Set(clases.map((c) => c.ficha_id).filter((id) => id > 0))];
    if (fichaIdsUnicos.length === 0) return;

    const fetchDocs = async () => {
      const nuevoMap: Record<number, FichaPlaneacionMeta> = {};
      await Promise.all(
        fichaIdsUnicos.map(async (fichaId) => {
          try {
            const res = await axios.get(`fichas/${fichaId}`);
            const fichaRaw = (res.data?.data?.ficha ?? res.data?.data ?? res.data) as Record<
              string,
              unknown
            >;
            const docProgramaFallback =
              (res.data?.data as { apertura?: { programa?: { documento?: string } } } | undefined)
                ?.apertura?.programa?.documento ?? null;
            if (docProgramaFallback && fichaRaw.asignacion == null) {
              fichaRaw.asignacion = {
                programa: { documento: docProgramaFallback }
              };
            } else if (
              docProgramaFallback &&
              typeof fichaRaw.asignacion === 'object' &&
              fichaRaw.asignacion != null
            ) {
              const asig = fichaRaw.asignacion as { programa?: { documento?: string } };
              if (!asig.programa?.documento) {
                asig.programa = { ...asig.programa, documento: docProgramaFallback };
              }
            }
            nuevoMap[fichaId] = metaPlaneacionDesdeFichaRaw(fichaRaw, fichaId, backUrl);
          } catch {
            nuevoMap[fichaId] = {
              id: fichaId,
              codigo: '',
              docFichaUrl: null,
              docProgramaUrl: null,
              idInstructorLider: null,
              idProyectoFormativo: null
            };
          }
        })
      );
      setMetaPorFicha(nuevoMap);
    };

    fetchDocs();
  }, [clases]);

  useEffect(() => {
    setLoading(loadingApi);
  }, [loadingApi]);

  // Actualizar el tiempo cada segundo para recalcular estados en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /** Al cerrar la franja, el backend crea la sesión: refrescar sin recargar la página. */
  useEffect(() => {
    const ahora = currentTime;
    const ymdHoy = formatYmdLocal(
      new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    );

    for (const clase of clases) {
      const ventana = obtenerVentanaHorariaHoy(clase, ahora);
      if (!ventana || ahora.getTime() <= ventana.fin.getTime()) continue;

      const clave = `${clase.idHorarioMateria}|${ymdHoy}|fin`;
      if (franjasRefrescadasRef.current.has(clave)) continue;
      franjasRefrescadasRef.current.add(clave);

      const sincronizar = () => {
        void refetch();
        void cargarHistorialSesiones();
      };
      sincronizar();
      window.setTimeout(sincronizar, 2500);
    }
  }, [currentTime, clases, refetch, cargarHistorialSesiones]);

  /**
   * Obtiene el estado de la clase en tiempo real
   * Considera tanto el estado del backend como las sesiones completadas individuales
   * Se actualiza automáticamente cada segundo usando currentTime
   */
  const getStatus = (clase: Clase): 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO' => {
    // Usar currentTime en lugar de new Date() para actualización en tiempo real
    const ahora = currentTime;
    const sesionesRestantes =
      typeof clase.sesiones_restantes === 'number' ? clase.sesiones_restantes : null;

    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // Hoy con clase programada: pendiente → en curso → completada (igual que compartida).
    const ventanaHoy = obtenerVentanaHorariaHoy(clase, ahora);
    if (ventanaHoy) {
      const ymdHoy = formatYmdLocal(
        new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      );

      if (
        ahora.getTime() >= ventanaHoy.inicio.getTime() &&
        ahora.getTime() <= ventanaHoy.fin.getTime()
      ) {
        return 'EN CURSO';
      }

      if (ahora.getTime() < ventanaHoy.inicio.getTime()) {
        return 'PENDIENTE';
      }

      // Ya pasó la hora final de hoy
      if (sesionCompletadaEnFecha(clase, ymdHoy)) {
        return 'COMPLETADO';
      }
      const ymdIni = clase.fechaInicial?.split('T')[0] ?? '';
      const ymdFin = (clase.fechaFinal ?? clase.fechaInicial)?.split('T')[0] ?? '';
      if (ymdIni && ymdIni === ymdFin && ymdIni === ymdHoy) {
        return 'COMPLETADO';
      }
      if (sesionesRestantes === 0) {
        return 'COMPLETADO';
      }
      return 'PENDIENTE';
    }

    // PRIMERO: Verificar si ya pasó la fecha final del curso completo.
    // Solo se considera COMPLETADO si no quedan sesiones reales pendientes.
    if (clase.fechaInicial && clase.fechaFinal) {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);
      const fechaFin = parseDate(clase.fechaFinal);
      fechaFin.setHours(0, 0, 0, 0);

      if (fechaFin.getTime() < hoy.getTime()) {
        return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
      }
    }

    // NO usar el estado del backend directamente - calcular siempre en tiempo real
    // El estado del backend puede estar desactualizado, por eso calculamos en tiempo real

    // Si hay sesiones completadas, verificar el estado en tiempo real
    if (clase.sesiones_completadas && clase.sesiones_completadas.length > 0) {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);

      // Verificar si hay una sesión completada hoy o en el pasado (fecha local, sin desfase ISO/UTC)
      const haySesionCompletada = clase.sesiones_completadas.some((sesion) => {
        const fechaSesion = parseSoloFecha(sesion.fechaSesion);
        fechaSesion.setHours(0, 0, 0, 0);
        return fechaSesion.getTime() <= hoy.getTime();
      });

      // Si hay sesiones completadas y todos los datos necesarios, verificar estado en tiempo real
      if (
        haySesionCompletada &&
        clase.fechaInicial &&
        clase.fechaFinal &&
        clase.horaInicial &&
        clase.horaFinal &&
        jsGetDayDesdeApiClase(clase) != null
      ) {
        const hoy = new Date(ahora);
        hoy.setHours(0, 0, 0, 0);
        const fechaInicio = parseDate(clase.fechaInicial);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = parseDate(clase.fechaFinal);
        fechaFin.setHours(0, 0, 0, 0);

        // Verificar si hoy es un día de clase
        const diaNumero = jsGetDayDesdeApiClase(clase);

        if (
          ahora.getDay() === diaNumero &&
          fechaInicio.getTime() <= hoy.getTime() &&
          hoy.getTime() <= fechaFin.getTime()
        ) {
          // Verificar si estamos dentro del rango de horas
          let [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
          let [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

          const horaInicio = new Date(ahora);
          horaInicio.setHours(hIni, mIni, 0, 0);
          const horaFinal = new Date(ahora);
          horaFinal.setHours(hFin, mFin, 0, 0);

          if (horaFinal.getTime() < horaInicio.getTime()) {
            horaFinal.setDate(horaFinal.getDate() + 1);
          }

          // Si estamos dentro del horario de la clase
          if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinal.getTime()) {
            return 'EN CURSO';
          }

          // Si ya pasó la hora final de hoy, marcar como COMPLETADO inmediatamente
          if (ahora.getTime() > horaFinal.getTime()) {
            return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
          }
        }
      }
    }

    // Fallback: calcular básico en tiempo real
    if (!clase.fechaInicial) {
      return 'PENDIENTE';
    }

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;
    const hoy = new Date(ahora);
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    if (fechaFin) {
      fechaFin.setHours(0, 0, 0, 0);
    }

    // Si la clase aún no ha comenzado
    if (fechaInicio.getTime() > hoy.getTime()) {
      return 'PENDIENTE';
    }

    // Si estamos dentro del rango de fechas, verificar si es un día de clase y el horario
    if (clase.fechaInicial && fechaFin && clase.horaInicial && clase.horaFinal) {
      const diaNumero = jsGetDayDesdeApiClase(clase);
      if (diaNumero === null) {
        return 'PENDIENTE';
      }

      // Verificar si hoy es un día de clase (día de la semana coincide Y está en el rango de fechas)
      const esDiaDeClase =
        ahora.getDay() === diaNumero &&
        fechaInicio.getTime() <= hoy.getTime() &&
        hoy.getTime() <= fechaFin.getTime();

      if (esDiaDeClase) {
        // Verificar si estamos dentro del rango de horas
        let [hIni, mIni] = clase.horaInicial.substring(0, 5).split(':').map(Number);
        let [hFin, mFin] = clase.horaFinal.substring(0, 5).split(':').map(Number);

        const horaInicio = new Date(ahora);
        horaInicio.setHours(hIni, mIni, 0, 0);
        const horaFinal = new Date(ahora);
        horaFinal.setHours(hFin, mFin, 0, 0);

        // Si la hora final es menor que la inicial, significa que cruza medianoche
        if (horaFinal.getTime() < horaInicio.getTime()) {
          horaFinal.setDate(horaFinal.getDate() + 1);
        }

        // Si estamos dentro del horario de la clase
        if (ahora.getTime() >= horaInicio.getTime() && ahora.getTime() <= horaFinal.getTime()) {
          return 'EN CURSO';
        }

        // Si ya pasó la hora final de hoy, marcar como COMPLETADO inmediatamente
        if (ahora.getTime() > horaFinal.getTime()) {
          return sesionesRestantes === 0 ? 'COMPLETADO' : 'PENDIENTE';
        }
      }
    }

    return 'PENDIENTE';
  };

  /**
   * Formatea una fecha usando Intl.DateTimeFormat (API nativa de JavaScript)
   * No usa datos hardcodeados, usa la configuración del navegador
   *
   * @param dateString Fecha en formato YYYY-MM-DD
   * @param jornadaTipo Tipo de jornada para mostrar si es hoy
   * @returns String formateado: "Jornada (hoy)" o "Mañana (día, fecha)" o "(día, fecha)"
   */
  const formatDateForGroup = (dateString: string, jornadaTipo: string): string => {
    // Parsear fecha sin problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Verificar si es hoy, mañana o más adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Usar Intl.DateTimeFormat para formatear fecha (sin datos hardcodeados)
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    if (diffDays === 0) {
      // Es hoy - usar la jornada
      return `${jornadaTipo} (hoy)`;
    } else if (diffDays === 1) {
      // Es mañana - mostrar "Mañana" + fecha completa
      const fechaFormateada = formatter.format(date);
      return `Mañana (${fechaFormateada})`;
    } else {
      // Es más adelante - solo mostrar la fecha sin jornada
      const fechaFormateada = formatter.format(date);
      return `(${fechaFormateada})`;
    }
  };

  const getJornadaType = (jornadaTipo: string): string => {
    if (!jornadaTipo) return 'Mañana';

    // Normalizar: convertir a minúsculas para comparar
    const lower = jornadaTipo.toLowerCase().trim();

    // Detectar el tipo basándose en palabras clave
    if (lower.includes('mañana') || lower.includes('manana')) {
      return 'Mañana';
    }
    if (lower.includes('tarde')) {
      return 'Tarde';
    }
    if (lower.includes('noche') || lower.includes('nocturna')) {
      return 'Noche';
    }

    // Si no coincide, devolver el valor original capitalizado
    // Capitalizar solo la primera letra
    return jornadaTipo.charAt(0).toUpperCase() + jornadaTipo.slice(1).toLowerCase();
  };

  /**
   * Convierte hora de formato 24h a formato 12h con AM/PM
   * La jornada NO tiene nada que ver, se usa solo la hora en formato 24h
   *
   * @param timeString Hora en formato HH:MM o HH:MM:SS
   * @returns Hora formateada en 12h con AM/PM (ej: "10:00 AM", "2:30 PM")
   */
  const formatTime12h = (timeString: string): string => {
    if (!timeString) return 'N/A';
    const time = timeString.substring(0, 5); // Obtener HH:MM
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);

    // Determinar AM/PM basado SOLO en la hora (la jornada no tiene nada que ver)
    const esPM = hour24 >= 12;

    // Convertir a formato 12h
    let hour12: number;
    if (hour24 === 0) {
      hour12 = 12; // Medianoche = 12 AM
    } else if (hour24 === 12) {
      hour12 = 12; // Mediodía = 12 PM
    } else if (hour24 < 12) {
      hour12 = hour24; // 1-11 AM
    } else {
      hour12 = hour24 - 12; // 1-11 PM
    }

    return `${hour12}:${minutes} ${esPM ? 'PM' : 'AM'}`;
  };

  /**
   * Obtiene el horario formateado de una clase
   *
   * @param clase Clase con horaInicial y horaFinal
   * @returns String con formato "H:MM AM - H:MM PM" o string vacío si no hay horario
   */
  const getHorario = (clase: Clase): string => {
    if (clase.horaInicial && clase.horaFinal) {
      return textoRangoHorarioClase(clase);
    }
    return '';
  };

  /**
   * Obtiene el formato de sesiones: "X/Y sesiones" donde X = sesiones dadas, Y = total
   */
  const getNumSesiones = (clase: Clase): string => {
    const total = clase.total_sesiones || 0;
    const dadas = clase.sesiones_dadas || 0;
    return `${dadas}/${total} sesiones`;
  };

  /**
   * Calcula la próxima fecha de clase pendiente (Date object)
   * Retorna null si no se puede calcular
   */
  const calcularProximaFechaClase = (clase: Clase): Date | null => {
    if (!clase.fechaInicial) {
      return null;
    }
    const diaNumeroJs = jsGetDayDesdeApiClase(clase);
    if (diaNumeroJs === null) {
      return null;
    }

    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;
    const hoy = new Date(currentTime);
    hoy.setHours(0, 0, 0, 0);

    const diaNumero = diaNumeroJs;

    // Buscar la próxima fecha del día de la semana
    let fechaBusqueda = new Date(hoy);

    // Si la fecha de inicio es futura, empezar desde ahí
    if (fechaInicio.getTime() > hoy.getTime()) {
      fechaBusqueda = new Date(fechaInicio);
      while (fechaBusqueda.getDay() !== diaNumero) {
        fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
      }
    } else {
      // Si la fecha de inicio ya pasó, buscar desde hoy
      while (fechaBusqueda.getDay() !== diaNumero) {
        fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
      }

      // Si la fecha encontrada es antes de la fecha de inicio, buscar desde la fecha de inicio
      if (fechaBusqueda.getTime() < fechaInicio.getTime()) {
        fechaBusqueda = new Date(fechaInicio);
        while (fechaBusqueda.getDay() !== diaNumero) {
          fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
        }
      }
    }

    // Verificar que esté en el rango válido
    if (fechaFin && fechaBusqueda.getTime() > fechaFin.getTime()) {
      return null;
    }

    return fechaBusqueda;
  };

  /**
   * Calcula TODAS las fechas pendientes de una clase (a partir de hoy)
   * teniendo en cuenta:
   * - Rango de fechas (fechaInicial, fechaFinal)
   * - Día de la semana (idDia)
   * - Sesiones completadas (sesiones_completadas)
   * - Límite de sesiones_restantes (para no generar más de las que realmente faltan)
   */
  const getTodasFechasPendientes = (clase: Clase): Date[] => {
    if (!clase.fechaInicial) return [];
    const diaNumero = jsGetDayDesdeApiClase(clase);
    if (diaNumero === null) return [];

    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const fechaInicio = parseDate(clase.fechaInicial);
    const fechaFin = clase.fechaFinal ? parseDate(clase.fechaFinal) : null;

    const hoy = new Date(currentTime);
    hoy.setHours(0, 0, 0, 0);

    // Punto de partida: el máximo entre hoy y fechaInicio
    let cursor = new Date(Math.max(fechaInicio.getTime(), hoy.getTime()));
    cursor.setHours(0, 0, 0, 0);

    // Ajustar cursor al próximo día de clase
    while (cursor.getDay() !== diaNumero) {
      cursor.setDate(cursor.getDate() + 1);
    }

    const completadasSet = new Set<string>();
    if (clase.sesiones_completadas && clase.sesiones_completadas.length > 0) {
      clase.sesiones_completadas.forEach((sesion) => {
        const key = sesion.fechaSesion.split('T')[0];
        completadasSet.add(key);
      });
    }

    const maxPendientes =
      typeof clase.sesiones_restantes === 'number' && clase.sesiones_restantes > 0
        ? clase.sesiones_restantes
        : Number.MAX_SAFE_INTEGER;

    const pendientes: Date[] = [];

    while (true) {
      if (fechaFin && cursor.getTime() > fechaFin.getTime()) break;

      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (!completadasSet.has(key)) {
        pendientes.push(new Date(cursor));
        if (pendientes.length >= maxPendientes) break;
      }

      // Avanzar una semana
      cursor.setDate(cursor.getDate() + 7);
    }

    return pendientes;
  };

  /**
   * Devuelve SOLO la próxima fecha pendiente formateada para mostrar en la tarjeta
   * (se usa en ClaseCard). Internamente reutiliza getTodasFechasPendientes.
   */
  const getProximaClasePendiente = (clase: Clase): string | null => {
    const pendientes = getTodasFechasPendientes(clase);
    if (!pendientes.length) return null;

    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return formatter.format(pendientes[0]);
  };

  /**
   * Navega a la página de detalle de una clase
   *
   * @param clase Clase a visualizar
   */
  const handleNavigateToClase = (clase: Clase): void => {
    if (!clase.idHorarioMateria) {
      return;
    }

    const id = Number(clase.idHorarioMateria);
    if (isNaN(id) || id <= 0) {
      return;
    }

    navigate(`/ambiente-virtual/clase/${id}`, {
      state: {
        returnTo: '/ambiente-virtual/historial-raps',
        vistaCalendario: 'instructor' as const,
        idMateria: clase.idMateria,
        idGradoMateria: clase.idGradoMateria,
        ficha_id: clase.ficha_id,
        materia_nombre: clase.materia_nombre,
        programa_nombre: clase.programa_nombre
      }
    });
  };

  const filteredClases = useMemo(() => {
    let filtered = [...clases];

    if (termBusquedaFolded) {
      filtered = filtered.filter((clase) =>
        claseCoincideBusquedaHistorial(
          Number(clase.idHorarioMateria),
          termBusquedaFolded,
          haystackPorHorario
        )
      );
    }

    const map: Record<FiltroEstadoHistorial, 'EN CURSO' | 'PENDIENTE' | 'COMPLETADO'> = {
      en_curso: 'EN CURSO',
      pendiente: 'PENDIENTE',
      completado: 'COMPLETADO'
    };
    filtered = filtered.filter((clase) => getStatus(clase) === map[selectedFilter]);

    // Ordenar: En Curso primero, luego Pendiente por fecha ascendente, luego Completado por fecha descendente
    // Dentro de cada grupo, ordenar por hora inicial
    filtered.sort((a, b) => {
      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const statusOrder = { 'EN CURSO': 1, PENDIENTE: 2, COMPLETADO: 3 };

      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      const fechaA = a.fechaInicial ? new Date(a.fechaInicial).getTime() : 0;
      const fechaB = b.fechaInicial ? new Date(b.fechaInicial).getTime() : 0;

      // Si las fechas son diferentes, ordenar por fecha
      if (fechaA !== fechaB) {
        if (statusA === 'PENDIENTE') {
          return fechaA - fechaB;
        }
        if (statusA === 'COMPLETADO') {
          return fechaB - fechaA;
        }
        return fechaA - fechaB;
      }

      // Si las fechas son iguales, ordenar por hora inicial
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });

    return filtered;
  }, [clases, termBusquedaFolded, haystackPorHorario, selectedFilter, currentTime]); // Agregar currentTime para actualización en tiempo real

  const classesToday = useMemo(() => {
    const today = filteredClases.filter((clase) => claseOcurreHoy(clase, currentTime));

    // Ordenar por hora inicial
    return today.sort((a, b) => {
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });
  }, [filteredClases]);

  // Separar clases por estado para agrupar
  // IMPORTANTE: Incluir currentTime como dependencia para recalcular en tiempo real
  const clasesEnCurso = useMemo(() => {
    const enCurso = filteredClases.filter((c) => getStatus(c) === 'EN CURSO');
    // Ordenar por fecha y luego por hora inicial
    return enCurso.sort((a, b) => {
      const fechaA = a.fechaInicial ? new Date(a.fechaInicial).getTime() : 0;
      const fechaB = b.fechaInicial ? new Date(b.fechaInicial).getTime() : 0;
      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }
      const horaA = a.horaInicial || '00:00:00';
      const horaB = b.horaInicial || '00:00:00';
      return horaA.localeCompare(horaB);
    });
  }, [filteredClases, currentTime]); // Agregar currentTime para actualización en tiempo real

  const clasesCompletadas = useMemo(() => {
    const completadas = filteredClases.filter((c) => getStatus(c) === 'COMPLETADO');
    // Ordenar por fecha descendente (más reciente primero) y luego por hora final descendente
    return completadas.sort((a, b) => {
      const fechaA = a.fechaInicial ? new Date(a.fechaInicial).getTime() : 0;
      const fechaB = b.fechaInicial ? new Date(b.fechaInicial).getTime() : 0;
      if (fechaA !== fechaB) {
        return fechaB - fechaA; // Descendente (más reciente primero)
      }
      // Si es la misma fecha, ordenar por hora final (la que terminó más tarde primero)
      const horaA = a.horaFinal || '00:00:00';
      const horaB = b.horaFinal || '00:00:00';
      return horaB.localeCompare(horaA); // Descendente
    });
  }, [filteredClases, currentTime]); // Agregar currentTime para actualización en tiempo real

  /**
   * Agrupa todas las sesiones completadas de todas las clases por fecha
   * y las ordena de más reciente a más antigua.
   * Cada sesión se mostrará en su propia tarjeta independiente.
   *
   * IMPORTANTE: Incluye sesiones de TODAS las clases que tengan sesiones completadas,
   * no solo de las clases marcadas como COMPLETADO, para mostrar todas las sesiones
   * que están guardadas en sesionMateria.
   *
   * @returns Objeto con todas las sesiones y agrupación por fecha
   */
  const sesionesCompletadasFuente = useMemo(
    () => fusionarSesionesCompletadasHistorial(historialSesiones, clases),
    [historialSesiones, clases]
  );

  const sesionesCompletadasAgrupadas = useMemo(() => {
    let sesionesFiltradasBusqueda = sesionesCompletadasFuente.filter((item) => {
      if (!sesionValidaEnHistorial(item.sesion)) return false;
      if (!sesionListableComoCompletada(item.clase, item.sesion, currentTime)) return false;
      if (termBusquedaFolded) {
        const id = Number(item.clase.idHorarioMateria);
        const h =
          haystackPorHorario.get(id) ?? foldBusqueda(textoIndexBusquedaClase(item.clase));
        if (!h.includes(termBusquedaFolded)) return false;
      }
      return true;
    });

    // Agrupar sesiones por fecha
    const grupos: { [fecha: string]: Array<{ clase: Clase; sesion: SesionCompletada }> } = {};

    sesionesFiltradasBusqueda.forEach((item) => {
      const fecha = ymdFromFechaSesion(item.sesion.fechaSesion) ?? '';

      if (fecha && fecha.trim() !== '') {
        if (!grupos[fecha]) {
          grupos[fecha] = [];
        }
        grupos[fecha].push(item);
      }
    });

    Object.values(grupos).forEach((items) => {
      items.sort((a, b) => {
        const horaFinA = a.clase.horaFinal || a.clase.horaInicial || '00:00:00';
        const horaFinB = b.clase.horaFinal || b.clase.horaInicial || '00:00:00';
        const porHora = horaFinB.localeCompare(horaFinA);
        if (porHora !== 0) return porHora;
        const porIni = (b.clase.horaInicial || '00:00:00').localeCompare(
          a.clase.horaInicial || '00:00:00'
        );
        if (porIni !== 0) return porIni;
        const na = Number(a.sesion.numeroSesion);
        const nb = Number(b.sesion.numeroSesion);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return nb - na;
        return 0;
      });
    });

    // Ordenar fechas de más reciente a más antigua
    const fechasOrdenadas = Object.keys(grupos)
      .filter((fecha) => {
        // Validar que la fecha sea válida antes de ordenar
        const fechaDate = new Date(fecha);
        return !isNaN(fechaDate.getTime());
      })
      .sort((a, b) => {
        const fechaA = new Date(a).getTime();
        const fechaB = new Date(b).getTime();
        return fechaB - fechaA; // Más reciente primero
      });

    return {
      todasLasSesiones: sesionesFiltradasBusqueda,
      sesionesPorFecha: fechasOrdenadas.map((fecha) => ({
        fecha,
        items: grupos[fecha] || []
      }))
    };
  }, [sesionesCompletadasFuente, currentTime, termBusquedaFolded, haystackPorHorario]);

  /**
   * Obtiene la próxima fecha de clase como string para agrupar
   * Retorna null si no se puede calcular
   * Usa la misma lógica que getProximaClasePendiente
   */
  const getProximaFechaParaAgrupar = (clase: Clase): string | null => {
    return getProximaClasePendiente(clase);
  };

  type ItemPendienteSesion = { clase: Clase; fechaYmd: string };
  type GrupoPendiente = { rowKey: string; labelTitulo: string; items: ItemPendienteSesion[] };

  type SeccionSemanaPendiente = {
    weekOffset: number;
    tituloSemana: string;
    gruposDia: GrupoPendiente[];
  };

  /**
   * Una tarjeta por sesión pendiente (día calendario + franja), alineado con Mi horario.
   * Pendiente = ese día aún no tiene registro en `sesionMateria` y la franja sigue vigente.
   */
  const pendientesPorSemana = useMemo((): SeccionSemanaPendiente[] => {
    let base = clases.filter((c) => claseVisibleEnGrillaHorario(c));
    if (termBusquedaFolded) {
      base = base.filter((clase) =>
        claseCoincideBusquedaHistorial(
          Number(clase.idHorarioMateria),
          termBusquedaFolded,
          haystackPorHorario
        )
      );
    }

    const semanas = seccionesSemanaCalendarioClase(
      base,
      currentTime,
      [0, 1],
      (c, fecha) => {
        if (getStatus(c) === 'EN CURSO') return false;
        const ymd = formatYmdLocal(fecha);
        if (sesionCompletadaEnFecha(c, ymd)) return false;
        return ocurrenciaPendienteEnDiaCalendario(c, fecha, currentTime);
      }
    );

    return semanas.map((s) => ({
      weekOffset: s.weekOffset,
      tituloSemana: s.tituloSemana,
      gruposDia: s.gruposDia.map((g) => ({
        rowKey: g.rowKey,
        labelTitulo: g.labelTitulo,
        items: g.clases.map((clase) => ({
          clase,
          fechaYmd: g.fechaYmd
        }))
      }))
    }));
  }, [clases, currentTime, termBusquedaFolded, haystackPorHorario]);

  const pendientesPorSemanaVistaUnica = useMemo(() => {
    const anchorMin = calcularAnchorMinVistaPendiente(clases, currentTime, getStatus);
    const candidatos = pendientesPorSemana.filter((s) => s.weekOffset >= anchorMin);
    return candidatos.length > 0 ? [candidatos[0]] : [];
  }, [pendientesPorSemana, clases, currentTime]);

  // Función para verificar si hay una clase en curso el mismo día y si esta clase es la siguiente
  const esProximaClase = (clase: Clase): boolean => {
    if (!claseOcurreHoy(clase, currentTime)) {
      return false;
    }

    const status = getStatus(clase);
    if (status !== 'PENDIENTE') {
      return false;
    }

    // Buscar si hay alguna clase en curso el mismo día
    const hayClaseEnCurso = filteredClases.some(
      (c) => claseOcurreHoy(c, currentTime) && getStatus(c) === 'EN CURSO'
    );

    if (!hayClaseEnCurso) {
      return false;
    }

    // Obtener todas las clases de hoy ordenadas por hora
    const clasesHoy = filteredClases
      .filter((c) => claseOcurreHoy(c, currentTime))
      .sort((a, b) => {
        const horaA = a.horaInicial || '00:00:00';
        const horaB = b.horaInicial || '00:00:00';
        return horaA.localeCompare(horaB);
      });

    // Encontrar la clase en curso
    const claseEnCurso = clasesHoy.find((c) => getStatus(c) === 'EN CURSO');
    if (!claseEnCurso) {
      return false;
    }

    // Verificar si esta clase viene después de la clase en curso
    const horaEnCurso = claseEnCurso.horaInicial || '00:00:00';
    const horaEstaClase = clase.horaInicial || '00:00:00';

    return horaEstaClase > horaEnCurso;
  };

  /**
   * Renderiza el badge de estado de una clase
   *
   * @param status Estado de la clase: 'EN CURSO', 'PENDIENTE', 'COMPLETADO'
   * @param clase Clase opcional para verificar si es próxima
   * @returns JSX del badge de estado
   */
  const getStatusBadge = (status: string, clase?: Clase): React.ReactElement | null => {
    const esProxima = clase && esProximaClase(clase);
    const instructoresAsociados = clase?.instructores_rap ?? [];
    const otroInstructor = instructoresAsociados.find((i) => i.idContrato !== clase?.contrato_id);
    const nombreOtroCompartido = otroInstructor?.nombre ?? '';
    const nombreOtroReemplazo = clase ? nombreOtroInstructorReemplazo(clase) : '';

    const modalidadBadge = clase?.modalidad_rap === 'COMPARTIDO'
      ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" title={nombreOtroCompartido ? `Compartido con ${nombreOtroCompartido}` : ''}><i className="ki-outline ki-people text-xs"></i>Compartido{nombreOtroCompartido ? ` — ${nombreOtroCompartido}` : ''}</span>
      : reemplazoActivoEnClase(clase)
        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" title={nombreOtroReemplazo ? (clase?.reemplazo_vigente_por_otro ? `Te reemplaza ${nombreOtroReemplazo}` : `Reemplazando a ${nombreOtroReemplazo}`) : 'Reemplazo'}><i className="ki-outline ki-arrow-right-left text-xs"></i>Reemplazo{nombreOtroReemplazo ? ` — ${nombreOtroReemplazo}` : ''}</span>
        : null;

    switch (status) {
      case 'EN CURSO':
        return (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              <span>En Curso</span>
            </span>
            {modalidadBadge}
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              <span>{esProxima ? 'Próxima' : 'Pendiente'}</span>
            </span>
            {modalidadBadge}
          </span>
        );
      case 'COMPLETADO':
        return (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 shadow-sm">
              <i className="ki-outline ki-check text-xs dark:text-gray-300"></i>
              <span>Completado</span>
            </span>
            {modalidadBadge}
          </span>
        );
      default:
        return null;
    }
  };

  /**
   * Formatear fecha para el separador (ej: "26 de febrero")
   * Maneja casos de fechas inválidas o nulas
   */
  const formatearFechaSeparador = (fechaStr: string): string => {
    if (!fechaStr) {
      return 'Fecha no disponible';
    }

    try {
      // Parsear fechaSesion (formato YYYY-MM-DD) sin problemas de zona horaria
      const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);

      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre'
      ];

      return `${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  /**
   * Formatea la fecha de sesión para mostrar en la tarjeta
   * Usa la misma fecha que se usa para agrupar (fechaSesion) para garantizar consistencia
   */
  const formatearFechaSesion = (fechaSesion: string): string => {
    if (!fechaSesion) {
      return 'Fecha no disponible';
    }

    try {
      // Parsear fechaSesion (formato YYYY-MM-DD) sin problemas de zona horaria
      const [year, month, day] = fechaSesion.split('T')[0].split('-').map(Number);
      const fecha = new Date(year, month - 1, day);

      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }

      // Usar Intl.DateTimeFormat para formatear (sin datos hardcodeados)
      const formatter = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      return formatter.format(fecha);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const renderIconosDocumentosFicha = (fichaId: number) => {
    const meta = metaPorFicha[fichaId];
    const puedePlaneacion = puedeDescargarPlaneacion(meta, idContratoUsuario);
    const exportando = exportandoPlaneacionFichaId === fichaId;

    return (
      <>
        <button
          type="button"
          disabled={!meta?.docProgramaUrl}
          onClick={(e) => {
            e.stopPropagation();
            if (meta?.docProgramaUrl) window.open(meta.docProgramaUrl, '_blank');
          }}
          title={meta?.docProgramaUrl ? 'Ver doc. del programa' : 'Sin doc. de programa'}
          className={`w-9 h-7 rounded flex items-center justify-center border transition-colors ${
            meta?.docProgramaUrl
              ? 'border-purple-300 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer'
              : 'border-gray-200 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <i className="ki-outline ki-book text-xs"></i>
        </button>
        <button
          type="button"
          disabled={!meta?.docFichaUrl}
          onClick={(e) => {
            e.stopPropagation();
            if (meta?.docFichaUrl) window.open(meta.docFichaUrl, '_blank');
          }}
          title={meta?.docFichaUrl ? 'Ver doc. de la ficha' : 'Sin doc. de ficha'}
          className={`w-9 h-7 rounded flex items-center justify-center border transition-colors ${
            meta?.docFichaUrl
              ? 'border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer'
              : 'border-gray-200 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <i className="ki-outline ki-file-down text-xs"></i>
        </button>
        {puedePlaneacion ? (
          <button
            type="button"
            disabled={exportando}
            onClick={(e) => handleDescargarPlaneacion(fichaId, e)}
            title="Descargar planeación (Excel)"
            className="w-9 h-7 rounded flex items-center justify-center border border-orange-300 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {exportando ? (
              <span className="inline-block w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            ) : (
              <i className="ki-outline ki-note-2 text-xs"></i>
            )}
          </button>
        ) : null}
      </>
    );
  };

  /**
   * Componente para renderizar una tarjeta de sesión completada
   * Cada sesión tiene su propia tarjeta independiente
   * Esto permite que en el futuro cada tarjeta pueda tener información específica
   * como lista de asistencia, actividades, etc.
   *
   * @param clase - Información de la clase a la que pertenece la sesión
   * @param sesion - Información específica de la sesión completada
   */
  const SesionCompletadaCard: React.FC<{
    clase: Clase;
    sesion: SesionCompletada;
  }> = ({ clase, sesion }) => {
    const jornadaType = getJornadaType(clase.jornada_tipo || '');
    const horario = getHorario(clase);
    const { competencia: tituloCompetencia, rap: tituloRap } = titulosCompetenciaYRapUi(clase);
    const instructoresAsociados = clase.instructores_rap ?? [];
    const otroInstructor = instructoresAsociados.find((i) => i.idContrato !== clase.contrato_id);
    const nombreOtroCompartido = otroInstructor?.nombre ?? '';
    const nombreOtroReemplazo = nombreOtroInstructorReemplazo(clase);
    const modalidadBadge =
      clase.modalidad_rap === 'COMPARTIDO' ? (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          title={nombreOtroCompartido ? `Compartido con ${nombreOtroCompartido}` : 'Clase compartida'}
        >
          <i className="ki-outline ki-people text-xs"></i>
          Compartido{nombreOtroCompartido ? ` — ${nombreOtroCompartido}` : ''}
        </span>
      ) : reemplazoActivoEnClase(clase) ? (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          title={
            nombreOtroReemplazo
              ? clase.reemplazo_vigente_por_otro
                ? `Te reemplaza ${nombreOtroReemplazo}`
                : `Reemplazando a ${nombreOtroReemplazo}`
              : 'Reemplazo'
          }
        >
          <i className="ki-outline ki-arrow-right-left text-xs"></i>
          Reemplazo{nombreOtroReemplazo ? ` — ${nombreOtroReemplazo}` : ''}
        </span>
      ) : null;

    const calificadoPor = nombresInstructoresCalificacion(clase);

    // Formatear fecha usando fechaSesion directamente para garantizar consistencia con el agrupamiento
    const fechaMostrar = formatearFechaSesion(sesion.fechaSesion);

    return (
      <div
        className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md"
        onClick={() => handleNavigateToClase(clase)}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-green-200 dark:border-green-600 flex items-center justify-center">
              <i className="ki-outline ki-check-circle text-lg text-green-600 dark:text-green-400"></i>
            </div>
            {/* Botones documento debajo del ícono */}
            {renderIconosDocumentosFicha(clase.ficha_id)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2 space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {tituloCompetencia}
              </h3>
              {tituloRap ? (
                <p className="text-xs font-normal text-gray-700 dark:text-gray-300 leading-snug">
                  {tituloRap}
                </p>
              ) : null}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm">
                  <i className="ki-outline ki-check text-xs"></i>
                  <span>Completado</span>
                </span>
                {modalidadBadge}
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sesión {sesion.numeroSesion || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-document text-sm"></i>
                <span>Ficha {clase.ficha_codigo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-sun text-sm"></i>
                <span>{jornadaType}</span>
              </div>
              {horario && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-time text-sm"></i>
                  <span>{horario}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-calendar text-sm"></i>
                <span className="capitalize">{fechaMostrar}</span>
              </div>
              {sesion.evaluador_nombre ? (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <i className="ki-outline ki-user text-sm"></i>
                  <span>Evaluado por: {sesion.evaluador_nombre}</span>
                </div>
              ) : calificadoPor ? (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <i className="ki-outline ki-user text-sm"></i>
                  <span>
                    {clase.modalidad_rap === 'COMPARTIDO' || reemplazoActivoEnClase(clase)
                      ? 'Calificados por: '
                      : 'Calificado por: '}
                    {calificadoPor}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex-shrink-0 pt-1">
            <i className="ki-outline ki-right text-base text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Componente reutilizable para renderizar una tarjeta de clase
   */
  const ClaseCard: React.FC<{
    clase: Clase;
    showProximaFecha?: boolean;
    fechaPendienteYmd?: string;
  }> = ({ clase, showProximaFecha = false, fechaPendienteYmd }) => {
    const status = getStatus(clase);
    const jornadaType = getJornadaType(clase.jornada_tipo || '');
    const horario = getHorario(clase);
    const numSesiones = getNumSesiones(clase);
    const proximaClase = showProximaFecha
      ? fechaPendienteYmd
        ? formatDateForGroup(fechaPendienteYmd, jornadaType)
        : getProximaClasePendiente(clase)
      : null;
    const { competencia: tituloCompetencia, rap: tituloRap } = titulosCompetenciaYRapUi(clase);
    const iconoTarjeta = (
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {status === 'EN CURSO' ? (
          <div className="w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-green-300 dark:border-green-600 flex items-center justify-center">
            <i className="ki-outline ki-time text-lg text-green-600 dark:text-green-400"></i>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-transparent dark:bg-transparent border border-blue-200 dark:border-blue-600 flex items-center justify-center">
            <i className="ki-outline ki-book text-lg text-blue-600 dark:text-blue-400"></i>
          </div>
        )}
        {/* Botones documento debajo del ícono */}
        {renderIconosDocumentosFicha(clase.ficha_id)}
      </div>
    );

    return (
      <div
        className="group relative bg-transparent dark:bg-transparent border border-blue-200 dark:border-gray-600 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md"
        onClick={() => handleNavigateToClase(clase)}
      >
        <div className="flex items-start gap-3">
          {iconoTarjeta}
          <div className="flex-1 min-w-0">
            {/* Título y Badge en líneas separadas para mejor espaciado */}
            <div className="mb-2 space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {tituloCompetencia}
              </h3>
              {tituloRap ? (
                <p className="text-xs font-normal text-gray-700 dark:text-gray-300 leading-snug">
                  {tituloRap}
                </p>
              ) : null}
              <div className="flex items-center pt-0.5">{getStatusBadge(status, clase)}</div>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-document text-sm"></i>
                <span>Ficha {clase.ficha_codigo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-sun text-sm"></i>
                <span>{jornadaType}</span>
              </div>
              {horario && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-time text-sm"></i>
                  <span>{horario}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <i className="ki-outline ki-calendar text-sm"></i>
                <span>{numSesiones}</span>
              </div>
              {proximaClase && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-calendar-tick text-sm"></i>
                  <span>{proximaClase}</span>
                </div>
              )}
              {clase.fechaFinal && (
                <div className="flex items-center gap-1.5">
                  <i className="ki-outline ki-calendar-search text-sm"></i>
                  <span className="capitalize">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Final: </span>
                    {formatearFechaSesion(clase.fechaFinal)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 pt-1">
            <i className="ki-outline ki-right text-base text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando clases...</p>
        </div>
      </div>
    );
  }

  if (clases.length === 0) {
    return (
      <div className="text-center py-12">
        <KeenIcon icon="document" className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          No hay clases disponibles
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Aún no tienes clases asignadas como instructor
        </p>
      </div>
    );
  }

  const showEnCurso = selectedFilter === 'en_curso';
  const showPendiente = selectedFilter === 'pendiente';
  const showCompletado = selectedFilter === 'completado';
  const hayBusqueda = queryBusquedaDisplay.length > 0;
  const sinResultadosBusqueda =
    hayBusqueda &&
    ((showEnCurso && clasesEnCurso.length === 0) ||
      (showPendiente && pendientesPorSemanaVistaUnica.length === 0) ||
      (showCompletado && sesionesCompletadasAgrupadas.todasLasSesiones.length === 0));

  const chips: { id: FiltroEstadoHistorial; label: string }[] = [
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'en_curso', label: 'En Curso' },
    { id: 'completado', label: 'Completado' }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Estado:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {chips.map(({ id, label }) => {
              const active = selectedFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedFilter(id)}
                  className={[
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-gray-600 dark:bg-coal-400 dark:text-slate-200 dark:hover:border-blue-500'
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative w-full lg:max-w-md lg:flex-1 lg:min-w-[260px]">
          <KeenIcon
            icon="magnifier"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={busquedaLista}
            onChange={(e) => setBusquedaLista(e.target.value)}
            placeholder="Buscar por competencia, RAP o ficha..."
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="search"
            aria-label="Buscar por competencia, RAP o número de ficha"
            className="input input-sm h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-10 text-sm dark:border-gray-600 dark:bg-coal-400 dark:text-gray-100"
          />
          {busquedaLista ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
              aria-label="Limpiar búsqueda"
              onClick={() => setBusquedaLista('')}
            >
              <i className="ki-outline ki-cross text-sm leading-none" />
            </button>
          ) : null}
        </div>
      </div>

      {sinResultadosBusqueda ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 py-14 text-center dark:border-gray-600 dark:bg-coal-400/40">
          <KeenIcon icon="magnifier" className="mx-auto mb-3 text-4xl text-slate-300 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            No hay resultados para «{queryBusquedaDisplay}»
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Prueba con competencia, texto del RAP o número de ficha.
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-300 dark:text-gray-100 dark:hover:bg-coal-200"
            onClick={() => setBusquedaLista('')}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          {/* Clases En Curso */}
          {showEnCurso && clasesEnCurso.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay clases en curso en este momento.
            </div>
          )}
          {showEnCurso && clasesEnCurso.length > 0 && (
            <div className="space-y-3">
              {clasesEnCurso.map((clase) => (
                <ClaseCard key={clase.idHorarioMateria} clase={clase} />
              ))}
            </div>
          )}

          {/* Pendientes: próxima sesión única por franja (aún no creada en sesionMateria) */}
          {showPendiente && pendientesPorSemanaVistaUnica.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {hayBusqueda
                ? `No hay resultados para «${queryBusquedaDisplay}».`
                : 'No hay clases pendientes con los datos actuales.'}
            </div>
          )}
          {showPendiente &&
            pendientesPorSemanaVistaUnica.map((semana) => (
              <div key={`sem-${semana.weekOffset}-${semana.tituloSemana}`} className="space-y-4">
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-gray-600" />
                  <span className="px-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {semana.tituloSemana}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-gray-600" />
                </div>
                {semana.gruposDia.map(({ rowKey, labelTitulo, items }) => (
                  <div key={rowKey} className="space-y-3">
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {labelTitulo}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {items.length} {items.length === 1 ? 'clase' : 'clases'}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    {items.map(({ clase, fechaYmd }) => (
                      <ClaseCard
                        key={`${rowKey}-${clase.idHorarioMateria}-${fechaYmd}`}
                        clase={clase}
                        showProximaFecha
                        fechaPendienteYmd={fechaYmd}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}

          {showCompletado && sesionesCompletadasAgrupadas.todasLasSesiones.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {hayBusqueda
                ? `No hay resultados para «${queryBusquedaDisplay}».`
                : 'No hay sesiones completadas registradas.'}
            </div>
          )}

          {/* Clases Completadas - Una tarjeta por cada sesión */}
          {showCompletado && sesionesCompletadasAgrupadas.todasLasSesiones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Clases Completadas
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {sesionesCompletadasAgrupadas.todasLasSesiones.length}{' '}
                    {sesionesCompletadasAgrupadas.todasLasSesiones.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              {sesionesCompletadasAgrupadas.sesionesPorFecha.map((grupo) => (
                <div key={grupo.fecha} className="space-y-3">
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-2">
                      <i className="ki-outline ki-calendar text-sm text-blue-600 dark:text-blue-400"></i>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {formatearFechaSeparador(grupo.fecha)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {grupo.items.length} {grupo.items.length === 1 ? 'sesión' : 'sesiones'}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  {grupo.items.map((item) => (
                    <SesionCompletadaCard
                      key={claveOcurrenciaSesionListado(item.clase, item.sesion)}
                      clase={item.clase}
                      sesion={item.sesion}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ListaHistorialRAPs;
