import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { useClasesInstructorAsignadas } from '@/hooks/useClasesInstructorAsignadas';
import {
  claseVisibleEnGrillaHorario,
  titulosCompetenciaYRapUi
} from '@/utils/clasesAsignadasLogica';
import {
  cambiarEstadoPlaneacion,
  createPlaneacion,
  downloadPlaneacionPdf,
  enviarPlaneacion,
  ESTADO_CLASS,
  ESTADO_LABEL,
  getPlaneacion,
  secuenciaVacia,
  toDatetimeLocal,
  updatePlaneacion,
  type EstadoPlaneacion,
  type NivelPlaneacion,
  type PlaneacionClase,
  type PlaneacionPedagogica,
  type SecuenciaItem,
  viernesDeSemana,
  GRADOS_PRIMARIA,
  GRADOS_BACHILLER,
  normalizarGrado,
  lunesDeSemana
} from '@/services/planeacionPedagogicaService';
import {
  AREA_BADGE,
  AREA_LABEL,
  aplicarPlantillaSiVacio,
  detectarAreaMateria,
  obtenerPlantillaMateria
} from '@/utils/plantillasMateriaPlaneacion';
import axios from 'axios';
import {
  ModalCrearActividad,
  ModalAsignarActividad,
  ModalAprendices,
  type Actividad
} from '@/pages/ambiente-virtual/actividades';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

const DIAS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo'
};

const DIAS_LABORALES = [
  { id: 1, label: 'Lunes', corto: 'Lun', icon: 'calendar' },
  { id: 2, label: 'Martes', corto: 'Mar', icon: 'calendar' },
  { id: 3, label: 'Miércoles', corto: 'Mié', icon: 'calendar' },
  { id: 4, label: 'Jueves', corto: 'Jue', icon: 'calendar' },
  { id: 5, label: 'Viernes', corto: 'Vie', icon: 'calendar' }
] as const;

const SUB_PASOS = [
  { id: 'clases', label: 'Clases' },
  { id: 'talleres', label: 'Talleres' },
  { id: 'envio', label: 'Envío' }
] as const;

type SubPasoId = (typeof SUB_PASOS)[number]['id'];
type FaseId = 'semana' | 'dia';

function horaCorta(v?: string | null): string {
  if (!v) return '';
  const m = String(v).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(v).slice(0, 5);
}

function detectNivel(programa: string): NivelPlaneacion {
  const p = programa.toUpperCase();
  if (p.includes('PRIMARIA') || p.includes('PREESCOLAR')) return 'PRIMARIA';
  return 'BACHILLER';
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
      {/* Reserva siempre la misma altura de hint para alinear inputs en grillas */}
      <span className="mt-0.5 block min-h-[14px] text-[10px] leading-snug text-slate-500">
        {hint || '\u00A0'}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 normal-case';
const areaCls = inputCls + ' min-h-[64px] resize-y leading-relaxed';

const btnSm =
  'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50';
const btnGhost = `${btnSm} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const btnSky = `${btnSm} bg-sky-600 text-white hover:bg-sky-700`;
const btnEmerald = `${btnSm} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`;
const btnAmber = `${btnSm} border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`;
const panelCls = 'rounded-lg border border-slate-200 bg-white p-3 space-y-3';
const hintBox =
  'rounded-md border border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50 px-2.5 py-2 text-[11px] text-slate-700 leading-snug';

const PlaneacionPedagogicaEditorPage = () => {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const planId = id && id !== 'nueva' ? Number(id) : null;

  const { clases: clasesHorario, loading: loadingHorario } = useClasesInstructorAsignadas();
  const [fase, setFase] = useState<FaseId>('semana');
  const [subPaso, setSubPaso] = useState<SubPasoId>('clases');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!planId);

  const [semanaInicio, setSemanaInicio] = useState(lunesDeSemana());
  const [nivel, setNivel] = useState<NivelPlaneacion>('PRIMARIA');
  const [grado, setGrado] = useState('');
  const [periodo, setPeriodo] = useState('Segundo periodo');
  const [proposito, setProposito] = useState('');
  const [temaIntegrador, setTemaIntegrador] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [reflexion, setReflexion] = useState('');
  const [emailCoord, setEmailCoord] = useState('');
  const [idFicha, setIdFicha] = useState<number | null>(null);
  const [clases, setClases] = useState<PlaneacionClase[]>([]);
  const [claseAbierta, setClaseAbierta] = useState(0);
  const [estado, setEstado] = useState<EstadoPlaneacion>('BORRADOR');
  const [motivoIncompleta, setMotivoIncompleta] = useState('');
  const [savedId, setSavedId] = useState<number | null>(planId);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);

  /** Índice de clase activa para modales de taller/actividad. */
  const [tallerIdx, setTallerIdx] = useState<number | null>(null);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalTraerOpen, setModalTraerOpen] = useState(false);
  const [modalEntregasOpen, setModalEntregasOpen] = useState(false);
  const [actividadModal, setActividadModal] = useState<Actividad | null>(null);
  const [fichaAsignar, setFichaAsignar] = useState<number | null>(null);
  const [actsBanco, setActsBanco] = useState<Actividad[]>([]);
  const [actsBuscar, setActsBuscar] = useState('');
  const [loadingActs, setLoadingActs] = useState(false);
  const [diaActivo, setDiaActivo] = useState(1);
  const [diasListos, setDiasListos] = useState<Record<number, boolean>>({});
  /** Planeación de una sola clase/materia (llega con ?horario=). */
  const [modoIndividual, setModoIndividual] = useState(() => Boolean(search.get('horario')));
  const [nuevoLimitePlan, setNuevoLimitePlan] = useState('');
  const [nuevoLimiteTaller, setNuevoLimiteTaller] = useState('');
  const [prorrogando, setProrrogando] = useState(false);

  const semanaFin = useMemo(() => viernesDeSemana(semanaInicio), [semanaInicio]);

  const visibles = useMemo(
    () => clasesHorario.filter((c) => claseVisibleEnGrillaHorario(c)),
    [clasesHorario]
  );

  const clasesDelDia = useMemo(
    () =>
      clases
        .map((c, idx) => ({ c, idx }))
        .filter(({ c }) => Number(c.idDia) === diaActivo),
    [clases, diaActivo]
  );

  useEffect(() => {
    if (fase !== 'dia') return;
    const tieneDia = clases.some((c) => Number(c.idDia) === diaActivo);
    if (tieneDia) return;
    const primero = DIAS_LABORALES.find((d) => clases.some((c) => Number(c.idDia) === d.id));
    if (primero) setDiaActivo(primero.id);
  }, [fase, clases, diaActivo]);

  const diasConClase = useMemo(
    () => DIAS_LABORALES.filter((d) => clases.some((c) => Number(c.idDia) === d.id)),
    [clases]
  );

  /** Individual = una sola clase (o un solo día con una clase). Semanal = varios días/clases. */
  const esIndividual = useMemo(() => {
    if (modoIndividual) return true;
    if (clases.length <= 1) return true;
    return diasConClase.length <= 1 && clases.length <= 1;
  }, [modoIndividual, clases.length, diasConClase.length]);

  useEffect(() => {
    if (search.get('horario')) setModoIndividual(true);
  }, [search]);

  useEffect(() => {
    if (clases.length === 1) setModoIndividual(true);
  }, [clases.length]);

  const irADia = (idDia: number, paso: SubPasoId = 'clases') => {
    setFase('dia');
    setDiaActivo(idDia);
    setSubPaso(paso);
    const first = clases.findIndex((c) => Number(c.idDia) === idDia);
    if (first >= 0) setClaseAbierta(first);
  };

  const continuarDesdeSemana = () => {
    if (!proposito.trim()) {
      enqueueSnackbar('Escribe el propósito de la semana', { variant: 'warning' });
      return;
    }
    const primero = diasConClase[0]?.id ?? 1;
    irADia(primero, 'clases');
  };

  const continuarSubPaso = () => {
    if (subPaso === 'clases') {
      setSubPaso('talleres');
      return;
    }
    if (subPaso === 'talleres') {
      setSubPaso('envio');
      return;
    }
    // Envío del día
    setDiasListos((prev) => ({ ...prev, [diaActivo]: true }));

    // Individual: no hay más días; queda en envío para PDF/coordinador
    if (esIndividual) {
      enqueueSnackbar('Planeación individual lista. Puedes guardar o enviar el PDF.', {
        variant: 'success'
      });
      setSubPaso('envio');
      return;
    }

    const idxActual = diasConClase.findIndex((d) => d.id === diaActivo);
    const siguiente = diasConClase[idxActual + 1];
    if (siguiente) {
      enqueueSnackbar(
        `${DIAS_LABORALES.find((d) => d.id === diaActivo)?.label} listo. Sigue ${siguiente.label}.`,
        { variant: 'success' }
      );
      irADia(siguiente.id, 'clases');
      return;
    }
    enqueueSnackbar('Semana completa. Ya puedes enviar el PDF a coordinación.', {
      variant: 'success'
    });
    setSubPaso('envio');
  };

  const fichasOpts = useMemo(() => {
    const map = new Map<number, { ficha: string; programa: string; nivel: NivelPlaneacion }>();
    for (const c of visibles) {
      const fid = Number(c.ficha_id ?? 0);
      if (!fid || map.has(fid)) continue;
      const programa = String(c.programa_nombre ?? '');
      map.set(fid, {
        ficha: String(c.ficha_codigo ?? ''),
        programa,
        nivel: detectNivel(programa)
      });
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [visibles]);

  const seedFromHorario = useCallback(
    (fichaId: number | null, nivelSel: NivelPlaneacion, soloHorarioId?: number | null) => {
      const filtered = visibles.filter((c) => {
        if (soloHorarioId && Number(c.idHorarioMateria) !== soloHorarioId) return false;
        if (fichaId && Number(c.ficha_id) !== fichaId) return false;
        if (soloHorarioId) return true;
        const n = detectNivel(String(c.programa_nombre ?? ''));
        return n === nivelSel || !fichaId;
      });

      const source =
        filtered.length > 0
          ? filtered
          : soloHorarioId
            ? []
            : visibles.filter((c) => detectNivel(String(c.programa_nombre ?? '')) === nivelSel);

      // Semana laboral: lunes a viernes
      const sourceLaboral = source.filter((c) => {
        const d = Number(c.idDia ?? 0);
        return d >= 1 && d <= 5;
      });

      const seeded: PlaneacionClase[] = sourceLaboral
        .slice()
        .sort(
          (a, b) =>
            Number(a.idDia ?? 0) - Number(b.idDia ?? 0) ||
            horaCorta(String(a.horaInicial)).localeCompare(horaCorta(String(b.horaInicial)))
        )
        .map((c, i) => {
          const { competencia, rap } = titulosCompetenciaYRapUi(c);
          const nivelClase = detectNivel(String(c.programa_nombre ?? '')) || nivelSel;
          const base: PlaneacionClase = {
            idHorarioMateria: Number(c.idHorarioMateria ?? 0) || null,
            idDia: Number(c.idDia ?? 0) || null,
            diaNombre: DIAS[Number(c.idDia ?? 0)] ?? String(c.dia_semana ?? ''),
            asignatura: competencia,
            horaInicial: horaCorta(String(c.horaInicial ?? '')),
            horaFinal: horaCorta(String(c.horaFinal ?? '')),
            tema: rap || competencia,
            competencia,
            idMateria: Number((c as { idMateria?: number }).idMateria ?? 0) || null,
            orden: i
          };
          return aplicarPlantillaSiVacio(base, nivelClase, true);
        });

      if (seeded.length) {
        setClases(seeded);
        setClaseAbierta(0);
        const g = sourceLaboral[0]?.grado_nombre;
        if (g) {
          const niv =
            detectNivel(String(sourceLaboral[0]?.programa_nombre ?? '')) || nivelSel;
          setGrado(normalizarGrado(String(g), niv));
        }
        if (soloHorarioId && sourceLaboral[0]) {
          setNivel(detectNivel(String(sourceLaboral[0].programa_nombre ?? '')));
          setIdFicha(Number(sourceLaboral[0].ficha_id ?? 0) || null);
        }
      }

      setMetodologia(
        nivelSel === 'PRIMARIA'
          ? 'Cada área con su propia secuencia (juego, exploración, concreto)'
          : 'Cada área con su propia secuencia (análisis, debate, proyectos)'
      );
    },
    [visibles]
  );

  useEffect(() => {
    if (planId) return;
    const fichaQ = search.get('ficha');
    const nivelQ = search.get('nivel') as NivelPlaneacion | null;
    if (nivelQ === 'PRIMARIA' || nivelQ === 'BACHILLER') setNivel(nivelQ);
    if (fichaQ) setIdFicha(Number(fichaQ));
  }, [planId, search]);

  useEffect(() => {
    if (planId || loadingHorario || clases.length > 0) return;
    if (visibles.length === 0) return;
    const hmQ = search.get('horario');
    const soloHm = hmQ ? Number(hmQ) : null;
    const ficha = idFicha ?? (soloHm ? null : fichasOpts[0]?.id ?? null);
    const niv = nivel || fichasOpts[0]?.nivel || 'PRIMARIA';
    if (ficha) setIdFicha(ficha);
    seedFromHorario(ficha, niv, soloHm);
  }, [planId, loadingHorario, visibles, fichasOpts, idFicha, nivel, clases.length, seedFromHorario, search]);

  useEffect(() => {
    if (!planId) return;
    // Ya tenemos los datos en memoria (p. ej. tras guardar sin remount)
    if (savedId === planId && clases.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const p = await getPlaneacion(planId);
        if (cancelled) return;
        hydrate(p);
      } catch {
        if (cancelled) return;
        enqueueSnackbar('No se pudo cargar la planeación', { variant: 'error' });
        navigate('/ambiente-virtual/planeacion-pedagogica');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const hydrate = (p: PlaneacionPedagogica) => {
    setSavedId(p.id);
    setSemanaInicio(String(p.semanaInicio).slice(0, 10));
    setNivel(p.nivel);
    setGrado(normalizarGrado(p.grado || '', p.nivel));
    setPeriodo(p.periodo || '');
    setProposito(p.proposito || '');
    setTemaIntegrador(p.temaIntegrador || '');
    setMetodologia(p.metodologia || '');
    setReflexion(p.reflexionDocente || '');
    setEmailCoord(p.coordinadorEmail || '');
    setIdFicha(p.idFicha ?? null);
    setEstado(p.estado);
    setMotivoIncompleta(p.motivoIncompleta || '');
    setClases(
      (p.clases || []).map((c) => ({
        ...c,
        secuencia: c.secuencia?.length ? c.secuencia : secuenciaVacia(),
        tallerInicio: toDatetimeLocal(c.tallerInicio),
        tallerFin: toDatetimeLocal(c.tallerFin)
      }))
    );
  };

  const updateClase = (idx: number, patch: Partial<PlaneacionClase>) => {
    setClases((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const enlazarActividadAClase = (idx: number, act: Actividad) => {
    const patch: Partial<PlaneacionClase> = {
      idActividad: act.id ?? null,
      idMateria: act.idMateria || clases[idx]?.idMateria || null,
      tallerTitulo: act.tituloActividad || clases[idx]?.tallerTitulo || '',
      tallerContenido: act.descripcionActividad || clases[idx]?.tallerContenido || '',
      tallerEstrategia: act.estrategia || clases[idx]?.tallerEstrategia || '',
      tallerEntregables: act.entregables || clases[idx]?.tallerEntregables || ''
    };
    const next = clases.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setClases(next);
    void guardar(true, next);
  };

  const resolverIdMateria = (c: PlaneacionClase): number | undefined => {
    if (c.idMateria && c.idMateria > 0) return c.idMateria;
    const hm = Number(c.idHorarioMateria ?? 0);
    if (!hm) return undefined;
    const row = visibles.find((v) => Number(v.idHorarioMateria) === hm) as
      | { idMateria?: number }
      | undefined;
    const id = Number(row?.idMateria ?? 0);
    return id > 0 ? id : undefined;
  };

  const resolverIdFichaClase = (c: PlaneacionClase): number | null => {
    if (idFicha && idFicha > 0) return idFicha;
    const hm = Number(c.idHorarioMateria ?? 0);
    if (!hm) return null;
    const row = visibles.find((v) => Number(v.idHorarioMateria) === hm);
    const fid = Number(row?.ficha_id ?? 0);
    return fid > 0 ? fid : null;
  };

  const abrirCrearTaller = (idx: number) => {
    const c = clases[idx];
    setTallerIdx(idx);
    setActividadModal(null);
    setModalCrearOpen(true);
    if (!resolverIdMateria(c)) {
      enqueueSnackbar('No se encontró la materia de esta clase. Revisa el horario.', {
        variant: 'warning'
      });
    }
  };

  const abrirTraerTaller = async (idx: number) => {
    const ficha = resolverIdFichaClase(clases[idx]);
    if (!ficha) {
      enqueueSnackbar('Selecciona el grupo/ficha en Semana primero', { variant: 'warning' });
      return;
    }
    setTallerIdx(idx);
    setFichaAsignar(ficha);
    setModalTraerOpen(true);
    setLoadingActs(true);
    setActsBuscar('');
    try {
      const { data } = await axios.get(`fichas/${ficha}/asignacion-actividades/datos`);
      const list = Array.isArray(data?.actividades) ? data.actividades : [];
      setActsBanco(list as Actividad[]);
    } catch {
      setActsBanco([]);
      enqueueSnackbar('No se pudieron cargar las actividades creadas', { variant: 'error' });
    } finally {
      setLoadingActs(false);
    }
  };

  const abrirAsignarTaller = async (idx: number) => {
    const c = clases[idx];
    const ficha = resolverIdFichaClase(c);
    if (!ficha) {
      enqueueSnackbar('Selecciona el grupo/ficha en Semana (o una clase con ficha)', {
        variant: 'warning'
      });
      return;
    }
    if (!c.idActividad) {
      enqueueSnackbar('Crea o trae una actividad antes de asignarla a estudiantes', {
        variant: 'warning'
      });
      return;
    }
    setTallerIdx(idx);
    setFichaAsignar(ficha);
    let act: Actividad = {
      id: Number(c.idActividad),
      tituloActividad: c.tallerTitulo || 'Actividad',
      descripcionActividad: c.tallerContenido || '',
      tipoActividad: 'sin evidencia',
      idMateria: resolverIdMateria(c) || 0,
      idEstado: 1,
      idCompany: 0,
      estrategia: c.tallerEstrategia || '',
      entregables: c.tallerEntregables || ''
    };
    try {
      const { data } = await axios.get(`actividades/${c.idActividad}`);
      const raw = data?.data ?? data;
      if (raw?.id) {
        act = {
          ...act,
          ...raw,
          id: Number(raw.id),
          tituloActividad: raw.tituloActividad || act.tituloActividad,
          idMateria: Number(raw.idMateria || act.idMateria) || 0
        };
      }
    } catch {
      // Usa datos locales del taller
    }
    setActividadModal(act);
    setModalAsignarOpen(true);
  };

  const plazoVencido = (c: PlaneacionClase): boolean => {
    if (!c.tallerFin) return false;
    const fin = new Date(c.tallerFin);
    return !Number.isNaN(fin.getTime()) && fin.getTime() < Date.now();
  };

  const planVencido = useMemo(() => {
    if (!semanaFin) return false;
    const fin = new Date(semanaFin + 'T23:59:59');
    return !Number.isNaN(fin.getTime()) && fin.getTime() < Date.now();
  }, [semanaFin]);

  const abrirEntregasTaller = (idx: number) => {
    const c = clases[idx];
    const ficha = resolverIdFichaClase(c);
    if (!ficha || !c.idActividad) {
      enqueueSnackbar('La actividad debe estar asignada para ver entregas', { variant: 'warning' });
      return;
    }
    if (!plazoVencido(c)) {
      enqueueSnackbar('Las entregas se muestran cuando vence la fecha de entrega', {
        variant: 'info'
      });
      return;
    }
    setTallerIdx(idx);
    setFichaAsignar(ficha);
    setActividadModal({
      id: Number(c.idActividad),
      tituloActividad: c.tallerTitulo || 'Actividad',
      descripcionActividad: c.tallerContenido || '',
      tipoActividad: 'sin evidencia',
      idMateria: resolverIdMateria(c) || 0,
      idEstado: 1,
      idCompany: 0,
      estrategia: c.tallerEstrategia || '',
      entregables: c.tallerEntregables || ''
    });
    setModalEntregasOpen(true);
  };

  const updateSecuencia = (idx: number, sIdx: number, patch: Partial<SecuenciaItem>) => {
    setClases((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const secuencia = [...(c.secuencia || secuenciaVacia())];
        secuencia[sIdx] = { ...secuencia[sIdx], ...patch };
        return { ...c, secuencia };
      })
    );
  };

  const buildPayload = (clasesOverride?: PlaneacionClase[]) => {
    const lista = clasesOverride ?? clases;
    return {
      semanaInicio,
      semanaFin,
      nivel,
      idFicha,
      grado: grado || null,
      periodo: periodo || null,
      proposito: proposito || null,
      temaIntegrador: temaIntegrador || null,
      metodologia: metodologia || null,
      reflexionDocente: reflexion || null,
      clases: lista.map((c) => ({
        ...c,
        tallerInicio: c.tallerInicio || null,
        tallerFin: c.tallerFin || null
      }))
    };
  };

  const onCambiarEstado = async (nuevo: 'EN_EJECUCION' | 'CERRADA' | 'INCOMPLETA') => {
    if (!savedId) {
      enqueueSnackbar('Guarda la planeación primero', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const p = await cambiarEstadoPlaneacion(savedId, {
        estado: nuevo,
        motivoIncompleta:
          nuevo === 'INCOMPLETA' ? motivoIncompleta.trim() || 'Sin motivo' : undefined
      });
      hydrate(p);
      setMostrarMotivo(false);
      enqueueSnackbar(
        nuevo === 'CERRADA'
          ? 'Marcada como finalizada'
          : nuevo === 'INCOMPLETA'
            ? motivoIncompleta.trim()
              ? 'Marcada como incompleta'
              : 'Marcada incompleta sin motivo'
            : 'Marcada en curso',
        { variant: 'success' }
      );
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'No se pudo cambiar el estado', {
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const prorrogarPlaneacionYActividades = async () => {
    if (!savedId) {
      enqueueSnackbar('Guarda la planeación primero', { variant: 'warning' });
      return;
    }
    if (!nuevoLimitePlan && !nuevoLimiteTaller) {
      enqueueSnackbar('Indica al menos una nueva fecha límite (plan o talleres)', {
        variant: 'warning'
      });
      return;
    }
    setProrrogando(true);
    try {
      let lunes = semanaInicio;
      if (nuevoLimitePlan) {
        lunes = lunesDeSemana(new Date(nuevoLimitePlan + 'T12:00:00'));
        setSemanaInicio(lunes);
      }
      const nextClases = clases.map((c) => ({
        ...c,
        tallerFin: nuevoLimiteTaller
          ? toDatetimeLocal(nuevoLimiteTaller.includes('T') ? nuevoLimiteTaller : `${nuevoLimiteTaller}T23:59`)
          : c.tallerFin
      }));
      setClases(nextClases);

      // Reabrir como en curso
      await cambiarEstadoPlaneacion(savedId, { estado: 'EN_EJECUCION' });

      const payload = {
        semanaInicio: lunes,
        semanaFin: viernesDeSemana(lunes),
        nivel,
        idFicha,
        grado: grado || null,
        periodo: periodo || null,
        proposito: proposito || null,
        temaIntegrador: temaIntegrador || null,
        metodologia: metodologia || null,
        reflexionDocente: reflexion || null,
        motivoIncompleta: null,
        estado: 'EN_EJECUCION' as const,
        clases: nextClases.map((c) => ({
          ...c,
          tallerInicio: c.tallerInicio || null,
          tallerFin: c.tallerFin || null
        }))
      };
      const p = await updatePlaneacion(savedId, payload);
      hydrate(p);

      // Ampliar plazos de actividades ya asignadas en aula virtual
      if (nuevoLimiteTaller) {
        const fechaFinalIso = nuevoLimiteTaller.includes('T')
          ? nuevoLimiteTaller
          : `${nuevoLimiteTaller}T23:59:00`;
        for (const c of nextClases) {
          if (!c.idActividad) continue;
          const ficha = resolverIdFichaClase(c);
          if (!ficha) continue;
          try {
            await axios.post('calificacion-actividad/ampliar', {
              idActividad: c.idActividad,
              idFicha: ficha,
              fechaFinal: fechaFinalIso,
              descripcionExtension: 'Prórroga desde planeación pedagógica'
            });
          } catch {
            // Continúa con las demás
          }
        }
      }

      setMotivoIncompleta('');
      setNuevoLimitePlan('');
      setNuevoLimiteTaller('');
      enqueueSnackbar('Planeación reabierta con nuevos plazos', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'No se pudo prorrogar', { variant: 'error' });
    } finally {
      setProrrogando(false);
    }
  };

  const guardar = async (silent = false, clasesOverride?: PlaneacionClase[]) => {
    const lista = clasesOverride ?? clases;
    if (!proposito.trim()) {
      enqueueSnackbar('Escribe el propósito de la semana', { variant: 'warning' });
      setFase('semana');
      return null;
    }
    if (lista.length === 0) {
      enqueueSnackbar('Agrega al menos una clase desde tu horario', { variant: 'warning' });
      return null;
    }
    setSaving(true);
    try {
      let p: PlaneacionPedagogica;
      if (savedId) {
        p = await updatePlaneacion(savedId, buildPayload(lista));
      } else {
        p = await createPlaneacion(buildPayload(lista));
        setSavedId(p.id);
        // No remount al descargar/enviar: solo actualiza la URL sin recargar el editor
        window.history.replaceState(
          null,
          '',
          `/ambiente-virtual/planeacion-pedagogica/${p.id}`
        );
      }
      hydrate(p);
      if (!silent) enqueueSnackbar('Planeación guardada', { variant: 'success' });
      return p;
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'Error al guardar', { variant: 'error' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const onPdf = async () => {
    const p = (await guardar(true)) || (savedId ? { id: savedId } : null);
    if (!p?.id) {
      enqueueSnackbar('Guarda la planeación antes de descargar el PDF', { variant: 'warning' });
      return;
    }
    try {
      await downloadPlaneacionPdf(p.id);
      enqueueSnackbar('PDF descargado', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'No se pudo generar el PDF', { variant: 'error' });
    }
  };

  const onEnviar = async () => {
    if (!emailCoord.includes('@')) {
      enqueueSnackbar('Indica el correo del coordinador', { variant: 'warning' });
      return;
    }
    const p = await guardar(true);
    if (!p?.id) return;
    setSaving(true);
    try {
      const updated = await enviarPlaneacion(p.id, {
        coordinadorEmail: emailCoord.trim(),
        reflexionDocente: reflexion
      });
      hydrate(updated);
      enqueueSnackbar('Enviada al coordinador (PDF adjunto)', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'No se pudo enviar', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const completitudClase = (c: PlaneacionClase) => {
    const keys = [
      c.tema,
      c.aprendizajeEsperado,
      c.preguntaProblematizadora,
      c.evidencia,
      c.criterios
    ];
    const ok = keys.filter((k) => String(k || '').trim()).length;
    return Math.round((ok / keys.length) * 100);
  };

  if (loading) {
    return (
      <Container>
        <div className="py-10 text-center text-xs text-slate-500">Cargando planeación…</div>
      </Container>
    );
  }

  return (
    <Container>
      <div data-no-uppercase className="pb-6 max-w-5xl">
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              className="mb-1 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-700"
              onClick={() => navigate('/ambiente-virtual/planeacion-pedagogica')}
            >
              <KeenIcon icon="left" className="w-3.5 h-3.5 leading-none" />
              Volver
            </button>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              {savedId ? 'Editar planeación' : 'Nueva planeación semanal'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
              <span className="rounded border border-sky-100 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                {nivel === 'PRIMARIA' ? 'Primaria' : 'Bachillerato'}
              </span>
              <span className="tabular-nums">
                {semanaInicio} – {semanaFin}
              </span>
              {savedId && (
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ESTADO_CLASS[estado]}`}
                >
                  {ESTADO_LABEL[estado]}
                </span>
              )}
            </div>
            {estado === 'INCOMPLETA' && motivoIncompleta && (
              <p className="mt-1 max-w-xl rounded-md border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
                Motivo: {motivoIncompleta}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={btnGhost}
              disabled={saving || estado === 'CERRADA'}
              onClick={() => guardar()}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className={btnEmerald} disabled={saving} onClick={onPdf}>
              PDF
            </button>
          </div>
        </div>

        {/* Estado */}
        {savedId && (
          <div className="mb-3 space-y-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] font-medium text-slate-500">Estado:</span>
              <button
                type="button"
                className={`${btnSm} border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100`}
                disabled={saving || estado === 'EN_EJECUCION' || estado === 'ENVIADA'}
                onClick={() => onCambiarEstado('EN_EJECUCION')}
              >
                En curso
              </button>
              <button
                type="button"
                className={`${btnSm} bg-emerald-600 text-white hover:bg-emerald-700`}
                disabled={saving || estado === 'CERRADA'}
                onClick={() => onCambiarEstado('CERRADA')}
              >
                Finalizada
              </button>
              <button
                type="button"
                className={btnAmber}
                disabled={saving}
                onClick={() => {
                  setMostrarMotivo(true);
                  if (!motivoIncompleta.trim() && planVencido) {
                    setMotivoIncompleta('Sin motivo');
                  }
                }}
              >
                Incompleta
              </button>
              {planVencido && estado !== 'CERRADA' && estado !== 'INCOMPLETA' && (
                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                  Semana vencida → se marcará incompleta sin motivo
                </span>
              )}
            </div>

            {(mostrarMotivo || estado === 'INCOMPLETA') && (
              <div className="space-y-2 border-t border-slate-100 pt-2">
                <Field
                  label="Motivo de incompleta"
                  hint="Si no escribes nada, queda como «Sin motivo» y puedes editarlo después"
                >
                  <textarea
                    className={areaCls}
                    value={motivoIncompleta}
                    onChange={(e) => setMotivoIncompleta(e.target.value)}
                    placeholder="Ej.: No se alcanzó el tema por suspensión de clases…"
                  />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={`${btnSm} bg-amber-600 text-white hover:bg-amber-700`}
                    disabled={saving}
                    onClick={() => onCambiarEstado('INCOMPLETA')}
                  >
                    Guardar como incompleta
                  </button>
                  {estado === 'INCOMPLETA' && (
                    <button
                      type="button"
                      className={btnSky}
                      disabled={saving}
                      onClick={() => onCambiarEstado('EN_EJECUCION')}
                    >
                      Reabrir en curso
                    </button>
                  )}
                </div>

                {estado === 'INCOMPLETA' && (
                  <div className="rounded-md border border-sky-100 bg-sky-50/60 p-2.5 space-y-2">
                    <p className="text-[11px] font-semibold text-sky-900">
                      Prorrogar plazos (planeación + actividades)
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Field label="Nuevo fin de semana (plan)" hint="Se ajusta al viernes de esa semana">
                        <input
                          type="date"
                          className={inputCls}
                          value={nuevoLimitePlan}
                          onChange={(e) => setNuevoLimitePlan(e.target.value)}
                        />
                      </Field>
                      <Field label="Nuevo fin de entrega (talleres)" hint="Aplica a talleres y aula virtual">
                        <input
                          type="datetime-local"
                          className={inputCls}
                          value={nuevoLimiteTaller}
                          onChange={(e) => setNuevoLimiteTaller(e.target.value)}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      className={btnEmerald}
                      disabled={prorrogando || saving}
                      onClick={() => void prorrogarPlaneacionYActividades()}
                    >
                      {prorrogando ? 'Prorrogando…' : 'Aplicar prórroga y reabrir'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div className="mb-3 space-y-2">
          {esIndividual ? (
            <nav className="grid grid-cols-4 gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(
                [
                  { id: 'semana' as const, label: 'Semana', n: 1 },
                  { id: 'clases' as const, label: 'Clases', n: 2 },
                  { id: 'talleres' as const, label: 'Talleres', n: 3 },
                  { id: 'envio' as const, label: 'Envío', n: 4 }
                ] as const
              ).map((p) => {
                const active =
                  (p.id === 'semana' && fase === 'semana') ||
                  (p.id !== 'semana' && fase === 'dia' && subPaso === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id === 'semana') {
                        setFase('semana');
                        return;
                      }
                      if (!proposito.trim()) {
                        enqueueSnackbar('Completa la semana (propósito) primero', {
                          variant: 'warning'
                        });
                        return;
                      }
                      setFase('dia');
                      setSubPaso(p.id);
                    }}
                    className={`flex h-8 items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition ${
                      active
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span className="text-[9px] font-bold opacity-80">{p.n}</span>
                    {p.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <>
              <nav className="grid grid-cols-2 gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setFase('semana')}
                  className={`flex h-8 items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition ${
                    fase === 'semana'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : proposito.trim()
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                    {proposito.trim() && fase !== 'semana' ? '✓' : '1'}
                  </span>
                  Semana completa
                </button>
                <button
                  type="button"
                  onClick={() => continuarDesdeSemana()}
                  className={`flex h-8 items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition ${
                    fase === 'dia'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                    2
                  </span>
                  Planeación por día
                </button>
              </nav>

              {fase === 'dia' && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-3 sm:px-4">
                    <p className="mb-2 text-center text-[10px] text-slate-500">
                      Orden: clases → talleres → envío de cada día, luego el siguiente
                    </p>
                    <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
                      {DIAS_LABORALES.map((d, i) => {
                        const count = clases.filter((c) => Number(c.idDia) === d.id).length;
                        const active = diaActivo === d.id;
                        const listo = !!diasListos[d.id];
                        const disponible = count > 0;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            disabled={!disponible}
                            onClick={() => disponible && irADia(d.id, subPaso)}
                            className="relative flex min-w-[56px] flex-1 flex-col items-center gap-1 px-0.5 disabled:opacity-40"
                          >
                            {i < DIAS_LABORALES.length - 1 && (
                              <span
                                className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-0.5 ${
                                  listo ? 'bg-emerald-300' : 'bg-slate-200'
                                }`}
                                aria-hidden
                              />
                            )}
                            <span
                              className={`relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                                active
                                  ? 'border-sky-600 bg-sky-600 text-white shadow'
                                  : listo
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-500'
                              }`}
                            >
                              {listo && !active ? '✓' : i + 1}
                            </span>
                            <span
                              className={`text-center text-[10px] font-semibold leading-tight ${
                                active ? 'text-sky-800' : 'text-slate-600'
                              }`}
                            >
                              {d.label}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {count ? `${count} clase${count > 1 ? 's' : ''}` : 'Sin clase'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <nav className="grid grid-cols-3 gap-0.5 rounded-lg border border-sky-100 bg-sky-50/50 p-0.5">
                    {SUB_PASOS.map((p, i) => {
                      const active = subPaso === p.id;
                      const done =
                        (p.id === 'clases' &&
                          clases
                            .filter((c) => Number(c.idDia) === diaActivo)
                            .every((c) => completitudClase(c) >= 60) &&
                          clases.some((c) => Number(c.idDia) === diaActivo)) ||
                        (p.id === 'talleres' &&
                          clases
                            .filter((c) => Number(c.idDia) === diaActivo)
                            .some((c) =>
                              String(c.tallerTitulo || c.tallerContenido || '').trim()
                            )) ||
                        (p.id === 'envio' && !!diasListos[diaActivo]);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSubPaso(p.id)}
                          className={`flex h-8 items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition ${
                            active
                              ? 'bg-sky-600 text-white shadow-sm'
                              : done
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="text-[9px] font-bold opacity-80">{i + 1}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </nav>
                </>
              )}
            </>
          )}

          {/* Subpasos también en individual cuando ya pasó la semana */}
          {esIndividual && fase === 'dia' && (
            <p className="text-center text-[10px] text-slate-500">
              Planeación individual · orden: clases → talleres → envío
            </p>
          )}
        </div>

        {fase === 'semana' && (
          <div className={panelCls}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Inicio (lunes)" hint="Semana laboral lun–vie">
                <input
                  type="date"
                  data-no-uppercase
                  className={inputCls}
                  value={semanaInicio}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSemanaInicio(v ? lunesDeSemana(new Date(v + 'T12:00:00')) : lunesDeSemana());
                  }}
                />
              </Field>
              <Field label="Fin (viernes)">
                <input type="date" data-no-uppercase className={inputCls} value={semanaFin} readOnly />
              </Field>
              <Field label="Nivel">
                <select
                  data-no-uppercase
                  className={inputCls}
                  value={nivel}
                  onChange={(e) => {
                    const n = e.target.value as NivelPlaneacion;
                    setNivel(n);
                    setGrado((prev) => normalizarGrado(prev, n));
                    seedFromHorario(idFicha, n);
                  }}
                >
                  <option value="PRIMARIA">Primaria (1°–5°)</option>
                  <option value="BACHILLER">Bachillerato (6°–11°)</option>
                </select>
              </Field>
              <Field label="Grupo / ficha">
                <select
                  data-no-uppercase
                  className={inputCls}
                  value={idFicha ?? ''}
                  onChange={(e) => {
                    const fid = e.target.value ? Number(e.target.value) : null;
                    setIdFicha(fid);
                    const opt = fichasOpts.find((f) => f.id === fid);
                    if (opt) {
                      setNivel(opt.nivel);
                      seedFromHorario(fid, opt.nivel);
                    }
                  }}
                >
                  <option value="">Todas del nivel</option>
                  {fichasOpts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.ficha} — {f.programa}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Grado">
                <select
                  data-no-uppercase
                  className={inputCls}
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {(nivel === 'PRIMARIA' ? GRADOS_PRIMARIA : GRADOS_BACHILLER).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Periodo">
                <input
                  data-no-uppercase
                  className={inputCls}
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Metodología"
              hint="Describe con detalle cómo trabajarán las áreas esta semana"
            >
              <textarea
                data-no-uppercase
                className={areaCls + ' min-h-[96px]'}
                value={metodologia}
                onChange={(e) => setMetodologia(e.target.value)}
                placeholder="Cada área con su propia secuencia…"
              />
            </Field>

            <Field
              label="Propósito de la semana"
              hint="Qué habilidades fortalecerás esta semana."
            >
              <textarea
                data-no-uppercase
                className={areaCls}
                value={proposito}
                onChange={(e) => setProposito(e.target.value)}
              />
            </Field>
            <Field label="Tema integrador" hint="Hilo común entre asignaturas.">
              <input
                data-no-uppercase
                className={inputCls}
                value={temaIntegrador}
                onChange={(e) => setTemaIntegrador(e.target.value)}
                placeholder="Ej. Interpretación de información"
              />
            </Field>

            <div className={hintBox}>
              Las clases salen de tu <strong>Horario</strong>. Cada materia trae su propia plantilla.
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <th className="px-2.5 py-1.5 font-semibold">Día</th>
                    <th className="px-2.5 py-1.5 font-semibold">Asignatura</th>
                    <th className="px-2.5 py-1.5 font-semibold">Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {clases.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-2.5 py-1.5 text-slate-700">{c.diaNombre}</td>
                      <td className="px-2.5 py-1.5 font-medium text-slate-900">{c.asignatura}</td>
                      <td className="px-2.5 py-1.5 tabular-nums text-slate-600">
                        {c.horaInicial}–{c.horaFinal}
                      </td>
                    </tr>
                  ))}
                  {clases.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-2.5 py-4 text-center text-slate-400">
                        Sin clases lun–vie para este grupo
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button type="button" className={btnSky} onClick={continuarDesdeSemana}>
              {esIndividual ? 'Continuar: clases' : 'Continuar: clases del primer día'}
            </button>
          </div>
        )}

        {fase === 'dia' && subPaso === 'clases' && (
          <div className="space-y-3">
            <div className={hintBox}>
              {esIndividual ? (
                <>
                  Completa la clase. Luego siguen los talleres y el envío.
                </>
              ) : (
                <>
                  <strong>
                    {DIAS_LABORALES.find((d) => d.id === diaActivo)?.label}:
                  </strong>{' '}
                  completa las clases de este día. Luego siguen los talleres y el envío del mismo
                  día.
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {clasesDelDia.map(({ c, idx }) => {
                const area = detectarAreaMateria(c.asignatura, c.tema);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setClaseAbierta(idx)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
                      claseAbierta === idx
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : AREA_BADGE[area]
                    }`}
                  >
                    {AREA_LABEL[area]} · {c.horaInicial}
                  </button>
                );
              })}
            </div>

            {clasesDelDia.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
                No hay clases este día. Elige otro paso o revisa el horario.
              </div>
            )}

            {clases.map((c, idx) => {
              if (Number(c.idDia) !== diaActivo) return null;
              const pct = completitudClase(c);
              const open = claseAbierta === idx;
              const area = detectarAreaMateria(c.asignatura, c.tema);
              const plantilla = obtenerPlantillaMateria(c.asignatura, nivel, c.tema);
              if (!open) {
                return (
                  <button
                    key={idx}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left hover:border-sky-300 hover:bg-sky-50/40"
                    onClick={() => setClaseAbierta(idx)}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {c.diaNombre} · {c.asignatura}
                        </p>
                        <span
                          className={`rounded border px-1 py-0.5 text-[9px] font-semibold ${AREA_BADGE[area]}`}
                        >
                          {AREA_LABEL[area]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {c.horaInicial}–{c.horaFinal} · {c.tema || 'Sin tema'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                        pct === 100
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {pct}%
                    </span>
                  </button>
                );
              }

              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-lg border border-sky-200 bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50/70 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-900">
                          {c.diaNombre} · {c.asignatura}
                        </p>
                        <span
                          className={`rounded border px-1 py-0.5 text-[9px] font-semibold ${AREA_BADGE[area]}`}
                        >
                          {AREA_LABEL[area]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-600 line-clamp-1">
                        {plantilla.hints.aprendizaje}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        if (
                          !confirm(
                            `¿Reemplazar los campos con la plantilla de ${AREA_LABEL[area]}?`
                          )
                        ) {
                          return;
                        }
                        setClases((prev) =>
                          prev.map((row, i) =>
                            i === idx ? aplicarPlantillaSiVacio(row, nivel, true) : row
                          )
                        );
                        enqueueSnackbar(`Sugerencias de ${AREA_LABEL[area]} aplicadas`, {
                          variant: 'success'
                        });
                      }}
                    >
                      Aplicar sugerencias
                    </button>
                  </div>

                  <div className="space-y-2.5 p-2.5">
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      <Field label="Asignatura">
                        <input
                          className={inputCls}
                          value={c.asignatura || ''}
                          onChange={(e) => updateClase(idx, { asignatura: e.target.value })}
                        />
                      </Field>
                      <Field label="Tema / eje">
                        <input
                          className={inputCls}
                          value={c.tema || ''}
                          onChange={(e) => updateClase(idx, { tema: e.target.value })}
                        />
                      </Field>
                      <Field label="Instrumento">
                        <input
                          className={inputCls}
                          value={c.instrumento || ''}
                          onChange={(e) => updateClase(idx, { instrumento: e.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Aprendizaje esperado" hint={plantilla.hints.aprendizaje}>
                      <textarea
                        className={areaCls}
                        value={c.aprendizajeEsperado || ''}
                        onChange={(e) => updateClase(idx, { aprendizajeEsperado: e.target.value })}
                      />
                    </Field>
                    <Field label="Pregunta problematizadora">
                      <textarea
                        className={areaCls}
                        value={c.preguntaProblematizadora || ''}
                        onChange={(e) =>
                          updateClase(idx, { preguntaProblematizadora: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Saberes previos">
                      <textarea
                        className={areaCls}
                        value={c.saberesPrevios || ''}
                        onChange={(e) => updateClase(idx, { saberesPrevios: e.target.value })}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                      <Field label="Estándar">
                        <textarea
                          className={areaCls}
                          value={c.estandar || ''}
                          onChange={(e) => updateClase(idx, { estandar: e.target.value })}
                        />
                      </Field>
                      <Field label="DBA">
                        <textarea
                          className={areaCls}
                          value={c.dba || ''}
                          onChange={(e) => updateClase(idx, { dba: e.target.value })}
                        />
                      </Field>
                      <Field label="Competencia">
                        <textarea
                          className={areaCls}
                          value={c.competencia || ''}
                          onChange={(e) => updateClase(idx, { competencia: e.target.value })}
                        />
                      </Field>
                    </div>

                    <div>
                      <p className="mb-0.5 text-[10px] font-semibold text-slate-600">
                        Secuencia didáctica
                      </p>
                      <p className="mb-1.5 text-[10px] text-slate-500">{plantilla.hints.secuencia}</p>
                      <div className="space-y-1.5">
                        {(c.secuencia || secuenciaVacia()).map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="grid grid-cols-1 items-start gap-1.5 md:grid-cols-12"
                          >
                            <input
                              className={inputCls + ' md:col-span-2'}
                              value={s.momento}
                              onChange={(e) =>
                                updateSecuencia(idx, sIdx, { momento: e.target.value })
                              }
                            />
                            <textarea
                              className={areaCls + ' md:col-span-8 min-h-[52px]'}
                              placeholder={`Actividades de ${AREA_LABEL[area]}`}
                              value={s.actividad}
                              onChange={(e) =>
                                updateSecuencia(idx, sIdx, { actividad: e.target.value })
                              }
                            />
                            <input
                              className={inputCls + ' md:col-span-2'}
                              value={s.tiempo}
                              onChange={(e) =>
                                updateSecuencia(idx, sIdx, { tiempo: e.target.value })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Field label="Actividad práctica">
                      <textarea
                        className={areaCls}
                        value={c.actividadPractica || ''}
                        onChange={(e) => updateClase(idx, { actividadPractica: e.target.value })}
                      />
                    </Field>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      <Field label="Evidencia" hint={plantilla.hints.evidencia}>
                        <textarea
                          className={areaCls}
                          value={c.evidencia || ''}
                          onChange={(e) => updateClase(idx, { evidencia: e.target.value })}
                        />
                      </Field>
                      <Field label="Criterios">
                        <textarea
                          className={areaCls}
                          value={c.criterios || ''}
                          onChange={(e) => updateClase(idx, { criterios: e.target.value })}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                      <Field label="Recursos">
                        <textarea
                          className={areaCls}
                          value={c.recursos || ''}
                          onChange={(e) => updateClase(idx, { recursos: e.target.value })}
                        />
                      </Field>
                      <Field label="Refuerzo">
                        <textarea
                          className={areaCls}
                          value={c.refuerzo || ''}
                          onChange={(e) => updateClase(idx, { refuerzo: e.target.value })}
                        />
                      </Field>
                      <Field label="Profundización">
                        <textarea
                          className={areaCls}
                          value={c.profundizacion || ''}
                          onChange={(e) => updateClase(idx, { profundizacion: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              );
            })}

            {clases.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
                No hay clases lun–vie. Revisa Horario o cambia el grupo.
              </div>
            )}

            <button type="button" className={btnSky} onClick={continuarSubPaso}>
              Continuar a talleres de{' '}
              {DIAS_LABORALES.find((d) => d.id === diaActivo)?.label || 'hoy'}
            </button>
          </div>
        )}

        {fase === 'dia' && subPaso === 'talleres' && (
          <div className="space-y-3">
            <div className={hintBox}>
              <strong>
                Talleres de {DIAS_LABORALES.find((d) => d.id === diaActivo)?.label}:
              </strong>{' '}
              crea, trae o asigna actividades del aula virtual solo para este día.
            </div>

            {clases.map((c, idx) => {
              if (Number(c.idDia) !== diaActivo) return null;
              const area = detectarAreaMateria(c.asignatura, c.tema);
              const enlazada = Boolean(c.idActividad);
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50/80 to-emerald-50/50 p-3 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {c.diaNombre} · {c.asignatura}
                      </p>
                      <span
                        className={`rounded border px-1 py-0.5 text-[9px] font-semibold ${AREA_BADGE[area]}`}
                      >
                        {AREA_LABEL[area]}
                      </span>
                      {enlazada ? (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                          En aula virtual #{c.idActividad}
                        </span>
                      ) : (
                        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                          Sin publicar
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        className={btnSky}
                        onClick={() => abrirCrearTaller(idx)}
                      >
                        <KeenIcon icon="plus" className="text-[11px]" />
                        Crear
                      </button>
                      <button
                        type="button"
                        className={btnEmerald}
                        onClick={() => abrirTraerTaller(idx)}
                      >
                        <KeenIcon icon="entrance-right" className="text-[11px]" />
                        Traer
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        onClick={() => abrirAsignarTaller(idx)}
                        disabled={!c.idActividad || !idFicha}
                      >
                        <KeenIcon icon="check" className="text-[11px]" />
                        Asignar
                      </button>
                      {plazoVencido(c) && c.idActividad && (
                        <button
                          type="button"
                          className={btnAmber}
                          onClick={() => abrirEntregasTaller(idx)}
                        >
                          <KeenIcon icon="people" className="text-[11px]" />
                          Quién envió
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-sky-200/80 bg-white overflow-hidden">
                    <table className="w-full table-fixed text-left text-[11px]">
                      <thead className="bg-sky-100/80 text-sky-900">
                        <tr>
                          <th className="w-[38%] px-2.5 py-1.5 font-semibold">Nombre actividad</th>
                          <th className="w-[32%] px-2.5 py-1.5 font-semibold">Entregables</th>
                          <th className="w-[15%] px-2.5 py-1.5 font-semibold whitespace-nowrap">Inicio</th>
                          <th className="w-[15%] px-2.5 py-1.5 font-semibold whitespace-nowrap">Fin entrega</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-sky-100 align-top">
                          <td className="px-2.5 py-2 text-slate-800 font-medium break-words whitespace-normal [overflow-wrap:anywhere]">
                            {c.tallerTitulo || (
                              <span className="text-slate-400 font-normal">Sin título</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 break-words whitespace-normal [overflow-wrap:anywhere]">
                            {c.tallerEntregables || (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 whitespace-nowrap">
                            {c.tallerInicio
                              ? c.tallerInicio.replace('T', ' ').slice(0, 16)
                              : '—'}
                          </td>
                          <td className="px-2.5 py-2 text-slate-700 whitespace-nowrap">
                            {c.tallerFin ? c.tallerFin.replace('T', ' ').slice(0, 16) : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {plazoVencido(c) && c.idActividad && (
                      <div className="border-t border-amber-100 bg-amber-50/80 px-2.5 py-1.5 text-[10px] text-amber-900">
                        Plazo vencido. Usa <strong>Quién envió</strong> para ver quién entregó y quién no.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    <Field label="Título del taller / actividad">
                      <textarea
                        className={areaCls + ' min-h-[44px] break-words [overflow-wrap:anywhere]'}
                        rows={2}
                        value={c.tallerTitulo || ''}
                        onChange={(e) => {
                          updateClase(idx, { tallerTitulo: e.target.value });
                          const ta = e.target;
                          ta.style.height = 'auto';
                          ta.style.height = `${Math.max(ta.scrollHeight, 44)}px`;
                        }}
                      />
                    </Field>
                    <Field label="Entregables">
                      <textarea
                        className={areaCls + ' min-h-[44px] break-words [overflow-wrap:anywhere]'}
                        rows={2}
                        value={c.tallerEntregables || ''}
                        onChange={(e) => {
                          updateClase(idx, { tallerEntregables: e.target.value });
                          const ta = e.target;
                          ta.style.height = 'auto';
                          ta.style.height = `${Math.max(ta.scrollHeight, 44)}px`;
                        }}
                        placeholder="Qué deben entregar los estudiantes"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Field label="Inicio (deja el taller)" hint="Desde cuándo pueden entrar">
                      <input
                        type="datetime-local"
                        className={inputCls}
                        value={c.tallerInicio || ''}
                        onChange={(e) => updateClase(idx, { tallerInicio: e.target.value })}
                      />
                    </Field>
                    <Field label="Fin de entrega" hint="Plazo límite">
                      <input
                        type="datetime-local"
                        className={inputCls}
                        value={c.tallerFin || ''}
                        onChange={(e) => updateClase(idx, { tallerFin: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Descripción / instrucciones"
                    hint="Textos largos visibles; se usan al crear la actividad"
                  >
                    <textarea
                      className={areaCls + ' min-h-[120px]'}
                      value={c.tallerContenido || ''}
                      onChange={(e) => updateClase(idx, { tallerContenido: e.target.value })}
                      placeholder={
                        nivel === 'PRIMARIA'
                          ? '1. Lee el problema…\n2. Subraya los datos…\n3. Resuelve…'
                          : 'Contexto, consignas y criterios…'
                      }
                    />
                  </Field>

                  <Field label="Estrategia pedagógica">
                    <textarea
                      className={areaCls + ' min-h-[72px]'}
                      value={c.tallerEstrategia || ''}
                      onChange={(e) => updateClase(idx, { tallerEstrategia: e.target.value })}
                      placeholder="Cómo se va a desarrollar el taller"
                    />
                  </Field>
                </div>
              );
            })}

            {clases.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
                No hay clases lun–vie. Revisa Horario o cambia el grupo.
              </div>
            )}

            <button type="button" className={btnSky} onClick={continuarSubPaso}>
              Continuar a envío de{' '}
              {DIAS_LABORALES.find((d) => d.id === diaActivo)?.label || 'hoy'}
            </button>
          </div>
        )}

        {fase === 'dia' && subPaso === 'envio' && (
          <div className={`${panelCls} max-w-xl`}>
            <div className={hintBox}>
              <p className="font-semibold text-slate-900">
                Envío — {DIAS_LABORALES.find((d) => d.id === diaActivo)?.label}
              </p>
              <p className="mt-0.5 text-slate-600">
                Cierra este día y continúa con el siguiente. Al terminar el viernes puedes enviar el
                PDF de toda la semana al coordinador.
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700">
              Clases del día:{' '}
              <strong>
                {clases.filter((c) => Number(c.idDia) === diaActivo).length}
              </strong>
              {' · '}
              Talleres con actividad:{' '}
              <strong>
                {
                  clases.filter(
                    (c) => Number(c.idDia) === diaActivo && c.idActividad
                  ).length
                }
              </strong>
            </div>
            <Field label="Reflexión del docente (semana)">
              <textarea
                data-no-uppercase
                className={areaCls}
                value={reflexion}
                onChange={(e) => setReflexion(e.target.value)}
                placeholder="Aprendizajes, dificultades, ajustes…"
              />
            </Field>
            <Field label="Correo del coordinador">
              <input
                type="email"
                data-no-uppercase
                className={inputCls}
                value={emailCoord}
                onChange={(e) => setEmailCoord(e.target.value)}
                placeholder="coordinacion@colegio.edu.co"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={btnGhost}
                disabled={saving}
                onClick={() => guardar()}
              >
                Guardar
              </button>
              <button type="button" className={btnEmerald} disabled={saving} onClick={onPdf}>
                PDF semana
              </button>
              {esIndividual ||
              diasConClase[diasConClase.length - 1]?.id === diaActivo ? (
                <button
                  type="button"
                  className={btnSky}
                  disabled={saving}
                  onClick={() => {
                    setDiasListos((prev) => ({ ...prev, [diaActivo]: true }));
                    void onEnviar();
                  }}
                >
                  {esIndividual
                    ? 'Enviar al coordinador'
                    : 'Enviar semana al coordinador'}
                </button>
              ) : (
                <button type="button" className={btnSky} onClick={continuarSubPaso}>
                  Día listo → siguiente día
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ModalCrearActividad
        open={modalCrearOpen}
        onClose={() => {
          setModalCrearOpen(false);
          setTallerIdx(null);
        }}
        onSave={() => undefined}
        onSuccess={(msg) => enqueueSnackbar(msg, { variant: 'success' })}
        idMateria={
          tallerIdx != null ? resolverIdMateria(clases[tallerIdx] || {}) : undefined
        }
        initialValues={
          tallerIdx != null
            ? {
                tituloActividad: clases[tallerIdx]?.tallerTitulo || '',
                descripcionActividad: clases[tallerIdx]?.tallerContenido || '',
                estrategia: clases[tallerIdx]?.tallerEstrategia || '',
                entregables: clases[tallerIdx]?.tallerEntregables || ''
              }
            : null
        }
        onCreated={(act) => {
          if (tallerIdx == null) return;
          enlazarActividadAClase(tallerIdx, act);
          enqueueSnackbar('Taller enlazado. Ahora puedes asignarlo a estudiantes.', {
            variant: 'success'
          });
        }}
      />

      <ModalAsignarActividad
        open={modalAsignarOpen && !!fichaAsignar && !!actividadModal?.id}
        onClose={() => {
          setModalAsignarOpen(false);
          setActividadModal(null);
          setFichaAsignar(null);
          setTallerIdx(null);
        }}
        onSave={() => undefined}
        onSuccess={(msg) => enqueueSnackbar(msg, { variant: 'success' })}
        idFicha={fichaAsignar || 0}
        actividad={actividadModal}
        fechaInicialDefault={
          tallerIdx != null ? clases[tallerIdx]?.tallerInicio || null : null
        }
        fechaFinalDefault={tallerIdx != null ? clases[tallerIdx]?.tallerFin || null : null}
        onAssigned={({ fechaInicial, fechaFinal }) => {
          if (tallerIdx == null) return;
          const patch = {
            tallerInicio: fechaInicial
              ? toDatetimeLocal(fechaInicial)
              : clases[tallerIdx]?.tallerInicio,
            tallerFin: fechaFinal ? toDatetimeLocal(fechaFinal) : clases[tallerIdx]?.tallerFin
          };
          const next = clases.map((c, i) => (i === tallerIdx ? { ...c, ...patch } : c));
          setClases(next);
          void guardar(true, next);
        }}
      />

      <ModalAprendices
        open={modalEntregasOpen && !!fichaAsignar && !!actividadModal}
        onClose={() => {
          setModalEntregasOpen(false);
          setActividadModal(null);
          setFichaAsignar(null);
          setTallerIdx(null);
        }}
        onSuccess={(msg) => enqueueSnackbar(msg, { variant: 'success' })}
        actividad={actividadModal}
        idFicha={fichaAsignar || 0}
        tituloActividad={actividadModal?.tituloActividad}
      />

      <Modal open={modalTraerOpen} onClose={() => setModalTraerOpen(false)} zIndex={110}>
        <ModalContent className="max-w-[640px] top-[8%] max-h-[85vh] overflow-hidden flex flex-col p-4">
          <ModalHeader>
            <ModalTitle>Traer actividad creada</ModalTitle>
            <button
              type="button"
              className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
              onClick={() => setModalTraerOpen(false)}
            >
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="px-0 py-3 flex flex-col gap-3 min-h-0 overflow-hidden">
            <p className="text-[11px] text-slate-600">
              Reutiliza una actividad del banco. Luego asígnala al grado/grupo con nuevas fechas.
            </p>
            <input
              className={inputCls}
              value={actsBuscar}
              onChange={(e) => setActsBuscar(e.target.value)}
              placeholder="Buscar por título o entregables…"
            />
            <div className="overflow-y-auto rounded-md border border-slate-200 max-h-[50vh] divide-y divide-slate-100">
              {loadingActs && (
                <p className="px-3 py-4 text-xs text-slate-500">Cargando actividades…</p>
              )}
              {!loadingActs &&
                actsBanco
                  .filter((a) => {
                    const q = actsBuscar.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(a.tituloActividad || '')
                        .toLowerCase()
                        .includes(q) ||
                      String(a.entregables || '')
                        .toLowerCase()
                        .includes(q) ||
                      String(a.descripcionActividad || '')
                        .toLowerCase()
                        .includes(q)
                    );
                  })
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-sky-50 transition"
                      onClick={() => {
                        if (tallerIdx == null) return;
                        enlazarActividadAClase(tallerIdx, a);
                        setModalTraerOpen(false);
                        enqueueSnackbar('Actividad traída al taller. Asígnala a estudiantes.', {
                          variant: 'success'
                        });
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {a.tituloActividad}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        {a.entregables || a.descripcionActividad || 'Sin entregables'}
                      </p>
                    </button>
                  ))}
              {!loadingActs && actsBanco.length === 0 && (
                <p className="px-3 py-4 text-xs text-slate-500">
                  No hay actividades creadas aún. Usa «Crear».
                </p>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default PlaneacionPedagogicaEditorPage;
