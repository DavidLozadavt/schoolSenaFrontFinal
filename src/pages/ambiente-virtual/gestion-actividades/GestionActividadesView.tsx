import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Select from 'react-select';
import { KeenIcon, Toast } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
} from '@/components/forms/compactReactSelect';
import {
  etiquetaAcademica,
  propsSelectAcademico,
  selectStylesBiblioteca,
} from '@/pages/ambiente-virtual/actividades/etiquetaAcademicaSelect';
import ModalCrearActividad from '@/pages/ambiente-virtual/actividades/ModalCrearActividad';
import ModalCrearCuestionario from '@/pages/ambiente-virtual/actividades/ModalCrearCuestionario';
import ModalVerActividad from '@/pages/ambiente-virtual/actividades/ModalVerActividad';
import { esCuestionario } from '@/pages/ambiente-virtual/actividades/cuestionarioAsignacion';
import type { Actividad } from '@/pages/ambiente-virtual/actividades/ModalCrearActividad';
import ModalAsignarActividad from '@/pages/ambiente-virtual/actividades/ModalAsignarActividad';
import { gestionActividadesService } from './gestionActividadesService';
import ModalAsignarActividadFichas from './ModalAsignarActividadFichas';
import type {
  ActividadCatalogo,
  CatalogoMeta,
  CompetenciaFiltro,
  FichaCatalogo,
  RapFiltro,
} from './gestionActividades.types';

const PAGE_SIZE = 30;

const selectClassNames = {
  ...compactReactSelectClassNames,
  control: (state: { isFocused: boolean }) =>
    `${compactReactSelectClassNames.control()} h-9 min-h-9 overflow-hidden dark:text-white ${
      state.isFocused ? '!border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
    }`,
  valueContainer: () => 'text-gray-900 dark:text-white text-sm overflow-hidden min-w-0',
  singleValue: () =>
    'text-gray-900 dark:!text-white text-sm !whitespace-nowrap overflow-hidden text-ellipsis max-w-full',
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm truncate',
  input: () => 'text-gray-900 dark:!text-white text-sm',
  menu: () => `${compactReactSelectClassNames.menu()} dark:text-white`,
  menuList: () => `${compactReactSelectClassNames.menuList()} dark:text-white max-h-[20rem]`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option(state)} dark:!text-white !whitespace-normal break-words leading-snug py-1.5 ${
      state.isSelected ? '!text-white' : ''
    }`,
  dropdownIndicator: () =>
    'text-gray-500 dark:!text-white hover:text-gray-700 dark:hover:!text-white/80',
  clearIndicator: () =>
    'text-gray-400 dark:!text-white/80 hover:text-gray-600 dark:hover:!text-white',
};

const propsSelectGestion = {
  ...propsSelectAcademico,
  maxMenuHeight: 320,
  styles: selectStylesBiblioteca,
  classNames: selectClassNames,
};

const etiquetaMateria = (item?: { codigo?: string | null; nombreMateria?: string | null } | null) => {
  if (!item) return '—';
  return etiquetaAcademica(item.codigo, item.nombreMateria) || '—';
};

const tipoLabel = (tipo?: string | null) => {
  if (!tipo) return '—';
  if (tipo === 'cuestionario') return 'Cuestionario';
  if (tipo === 'con evidencia') return 'Con evidencia';
  if (tipo === 'sin evidencia') return 'Sin evidencia';
  return tipo;
};

const tipoActividadVisual = (tipo?: string | null) => {
  switch (String(tipo ?? '')) {
    case 'cuestionario':
      return {
        label: 'Cuestionario',
        icon: 'notepad',
        iconClass: 'text-violet-600 dark:text-violet-300',
        badgeClass:
          'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800/60',
      };
    case 'con evidencia':
      return {
        label: 'Con evidencia',
        icon: 'document',
        iconClass: 'text-blue-600 dark:text-blue-300',
        badgeClass:
          'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60',
      };
    case 'sin evidencia':
      return {
        label: 'Sin evidencia',
        icon: 'notepad-edit',
        iconClass: 'text-emerald-600 dark:text-emerald-300',
        badgeClass:
          'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60',
      };
    default:
      return {
        label: tipoLabel(tipo),
        icon: 'document',
        iconClass: 'text-gray-400 dark:text-gray-500',
        badgeClass:
          'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700',
      };
  }
};

/** En modo oscuro gray-200 del tema es un gris oscuro (#26272F); el texto de tabla debe ser blanco. */
const CELDA = 'py-2 px-2 align-middle overflow-hidden min-w-0 max-w-0';
const TEXTO_PRINCIPAL = 'text-gray-900 dark:text-white';
const TEXTO_SECUNDARIO = 'text-gray-700 dark:text-gray-200';
const clsLabelFiltro =
  'text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block';
const clsTh =
  'text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300';

const compactarEntregables = (value?: string | null): { visible: string; completo: string } => {
  const completo = (value || '').trim() || '—';
  const visible = completo
    .replace(/[\r\n]+/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  return { visible: visible || '—', completo };
};

const actividadEsInactiva = (row: ActividadCatalogo): boolean => {
  if (Number(row.idEstado) === 2) return true;
  return String(row.estado || '').trim().toUpperCase() === 'INACTIVO';
};

const rapPerteneceACompetencia = (rap: RapFiltro | undefined, idCompetencia: number | null): boolean => {
  if (!rap || !idCompetencia) return false;
  return Number(rap.idCompetencia) === Number(idCompetencia);
};

type AccionesMenuState = { id: number; top: number; left: number };

const CeldaClamp: React.FC<{ texto: string; principal?: boolean; title?: string }> = ({
  texto,
  principal = false,
  title,
}) => (
  <span
    className={`min-w-0 overflow-hidden break-words line-clamp-2 leading-snug ${
      principal ? `text-sm font-medium ${TEXTO_PRINCIPAL}` : `text-xs ${TEXTO_SECUNDARIO}`
    }`}
    title={title || texto}
  >
    {texto}
  </span>
);

const GestionActividadesView: React.FC = () => {
  const [competencias, setCompetencias] = useState<CompetenciaFiltro[]>([]);
  const [raps, setRaps] = useState<RapFiltro[]>([]);
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null);
  const [idRap, setIdRap] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [pagina, setPagina] = useState(1);
  const [items, setItems] = useState<ActividadCatalogo[]>([]);
  const [meta, setMeta] = useState<CatalogoMeta>({
    current_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtrosLoading, setFiltrosLoading] = useState(true);
  const [filtrosError, setFiltrosError] = useState<string | null>(null);

  const [crearTipo, setCrearTipo] = useState<'actividad' | 'cuestionario' | null>(null);
  const [competenciaCrear, setCompetenciaCrear] = useState<number | null>(null);
  const [rapCrear, setRapCrear] = useState<number | null>(null);
  const [accionesMenu, setAccionesMenu] = useState<AccionesMenuState | null>(null);
  const [actividadEliminar, setActividadEliminar] = useState<ActividadCatalogo | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalCuestionarioOpen, setModalCuestionarioOpen] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<Actividad | null>(null);
  const [actividadVer, setActividadVer] = useState<Actividad | null>(null);
  const [actividadAsignar, setActividadAsignar] = useState<ActividadCatalogo | null>(null);
  const [fichaPublicar, setFichaPublicar] = useState<FichaCatalogo | null>(null);
  const [modalFichasOpen, setModalFichasOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalPublicarOpen, setModalPublicarOpen] = useState(false);
  const [fichasConsulta, setFichasConsulta] = useState<FichaCatalogo[]>([]);
  const [fichasTitulo, setFichasTitulo] = useState('');
  const [loadingFichas, setLoadingFichas] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setFiltrosLoading(true);
      setFiltrosError(null);
      try {
        const res = await gestionActividadesService.filtros();
        if (!mounted) return;
        setCompetencias(res.competencias);
        setRaps(res.raps);
      } catch (err) {
        if (!mounted) return;
        setCompetencias([]);
        setRaps([]);
        setFiltrosError(gestionActividadesService.errorMessage(err, 'No se pudieron cargar competencias y RAP.'));
      } finally {
        if (mounted) setFiltrosLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rapsFiltrados = useMemo(() => {
    if (!idCompetencia) return raps;
    return raps.filter((rap) => Number(rap.idCompetencia) === Number(idCompetencia));
  }, [raps, idCompetencia]);

  useEffect(() => {
    if (!idRap) return;
    const actual = raps.find((rap) => Number(rap.id) === Number(idRap));
    if (idCompetencia && actual && Number(actual.idCompetencia) !== Number(idCompetencia)) {
      setIdRap(null);
    }
  }, [idCompetencia, idRap, raps]);

  const cargarCatalogo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await gestionActividadesService.catalogo({
        page: pagina,
        per_page: PAGE_SIZE,
        search: searchDebounced,
        idCompetencia,
        idRap,
      });
      setItems(res.data);
      setMeta(res.meta);
      if (res.meta.current_page !== pagina) {
        setPagina(res.meta.current_page);
      }
    } catch (err) {
      setItems([]);
      setError(gestionActividadesService.errorMessage(err, 'No se pudieron cargar las actividades.'));
    } finally {
      setLoading(false);
    }
  }, [pagina, searchDebounced, idCompetencia, idRap]);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  useEffect(() => {
    setPagina(1);
  }, [searchDebounced, idCompetencia, idRap]);

  const opcionesCompetencia = useMemo(
    () =>
      competencias.map((c) => ({
        value: c.id,
        label: etiquetaAcademica(c.codigo, c.nombreMateria),
        codigo: c.codigo ?? undefined,
        nombre: c.nombreMateria ?? undefined,
      })),
    [competencias]
  );

  const opcionesRap = useMemo(
    () =>
      rapsFiltrados.map((r) => ({
        value: r.id,
        label: etiquetaAcademica(r.codigo, r.nombreMateria),
        codigo: r.codigo ?? undefined,
        nombre: r.nombreMateria ?? undefined,
      })),
    [rapsFiltrados]
  );

  const rapsCrearFiltrados = useMemo(() => {
    if (!competenciaCrear) return [];
    return raps.filter((rap) => Number(rap.idCompetencia) === Number(competenciaCrear));
  }, [raps, competenciaCrear]);

  const opcionesRapCrear = useMemo(
    () =>
      rapsCrearFiltrados.map((r) => ({
        value: r.id,
        label: etiquetaAcademica(r.codigo, r.nombreMateria),
        codigo: r.codigo ?? undefined,
        nombre: r.nombreMateria ?? undefined,
      })),
    [rapsCrearFiltrados]
  );

  const rapCrearValido = useMemo(() => {
    if (!competenciaCrear || !rapCrear) return false;
    const rap = raps.find((item) => Number(item.id) === Number(rapCrear));
    return rapPerteneceACompetencia(rap, competenciaCrear);
  }, [competenciaCrear, rapCrear, raps]);

  const abrirCrear = (tipo: 'actividad' | 'cuestionario') => {
    setCrearTipo(tipo);
    setCompetenciaCrear(null);
    setRapCrear(null);
    setActividadEditar(null);
  };

  const confirmarRapCrear = () => {
    if (!competenciaCrear || !rapCrearValido) {
      showToast('Selecciona una competencia y un RAP de esa competencia.', 'warning');
      return;
    }
    if (crearTipo === 'cuestionario') setModalCuestionarioOpen(true);
    else setModalCrearOpen(true);
    setCrearTipo(null);
  };

  const abrirVer = async (row: ActividadCatalogo) => {
    setAccionesMenu(null);
    try {
      const { data } = await axios.get(`actividades/${row.id}`);
      setActividadVer(data);
    } catch {
      setActividadVer(gestionActividadesService.toActividadModal(row));
    }
  };

  const abrirEditar = async (row: ActividadCatalogo) => {
    setAccionesMenu(null);
    setCompetenciaCrear(null);
    const base = gestionActividadesService.toActividadModal(row);
    if (esCuestionario(row.tipoActividad)) {
      try {
        const { data } = await axios.get(`actividades/${row.id}`);
        setActividadEditar(data);
      } catch {
        setActividadEditar(base);
      }
      setRapCrear(row.idMateria);
      setModalCuestionarioOpen(true);
      return;
    }
    setActividadEditar(base);
    setRapCrear(row.idMateria);
    setModalCrearOpen(true);
  };

  const abrirFichasAsignadas = async (row: ActividadCatalogo) => {
    if (Number(row.fichasAsignadas) <= 0) return;
    setFichasTitulo(row.tituloActividad);
    setModalFichasOpen(true);
    setLoadingFichas(true);
    try {
      setFichasConsulta(await gestionActividadesService.fichasAsignadas(row.id));
    } catch (err) {
      setFichasConsulta([]);
      showToast(gestionActividadesService.errorMessage(err, 'No se pudieron cargar las fichas asignadas.'), 'error');
    } finally {
      setLoadingFichas(false);
    }
  };

  const abrirAsignar = (row: ActividadCatalogo) => {
    setAccionesMenu(null);
    setActividadAsignar(row);
    setModalAsignarOpen(true);
  };

  const cerrarAsignar = () => {
    setModalAsignarOpen(false);
    setActividadAsignar(null);
    setFichaPublicar(null);
    setModalPublicarOpen(false);
  };

  const continuarPublicacion = (ficha: FichaCatalogo) => {
    setFichaPublicar(ficha);
    setModalAsignarOpen(false);
    setModalPublicarOpen(true);
  };

  const puedeEliminarFila = (row: ActividadCatalogo): boolean => {
    return Boolean(row.puedeEliminar) && Number(row.fichasAsignadas) === 0 && actividadEsInactiva(row);
  };

  const motivoNoEliminarFila = (row: ActividadCatalogo): string => {
    if (Number(row.fichasAsignadas) > 0) {
      return 'La actividad no puede eliminarse porque se encuentra asignada a una ficha.';
    }
    if (!actividadEsInactiva(row)) {
      return 'La actividad debe estar inactiva antes de eliminarse.';
    }
    return row.motivoNoEliminar || 'Esta actividad no se puede eliminar.';
  };

  const abrirMenuAcciones = (row: ActividadCatalogo, button: HTMLButtonElement) => {
    const menuWidth = 200;
    const menuHeight = 196;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setAccionesMenu({ id: row.id, top, left });
  };

  const confirmarEliminar = async () => {
    if (!actividadEliminar || !puedeEliminarFila(actividadEliminar)) {
      showToast(actividadEliminar ? motivoNoEliminarFila(actividadEliminar) : 'No se puede eliminar esta actividad.', 'warning');
      setActividadEliminar(null);
      return;
    }
    setEliminando(true);
    try {
      await axios.delete(`actividades/${actividadEliminar.id}`);
      setActividadEliminar(null);
      setAccionesMenu(null);
      showToast('Actividad eliminada.');
      if (items.length === 1 && pagina > 1) {
        setPagina((p) => Math.max(1, p - 1));
      } else {
        void cargarCatalogo();
      }
    } catch (err) {
      showToast(gestionActividadesService.errorMessage(err, 'No se pudo eliminar la actividad.'), 'error');
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    if (!accionesMenu) return;
    const onWindowChange = () => setAccionesMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccionesMenu(null);
    };
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-id="gestion-actividades-acciones-menu"]')) return;
      if (target.closest('[data-id="gestion-actividades-acciones-btn"]')) return;
      setAccionesMenu(null);
    };
    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [accionesMenu]);

  const idMateriaModal = rapCrear || actividadEditar?.idMateria || 0;
  const idCompetenciaModal = competenciaCrear || null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:px-4 sm:py-3 dark:border-gray-700 dark:bg-coal-400">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.15fr)_minmax(15rem,1.15fr)_minmax(12rem,1.5fr)] gap-3 flex-1 min-w-0">
            <div className="min-w-0">
              <label className={clsLabelFiltro}>Competencia</label>
              <div className="relative">
                <KeenIcon
                  icon="book"
                  className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                />
                <Select
                  {...propsSelectGestion}
                  isClearable
                  placeholder="Todas las competencias"
                  options={opcionesCompetencia}
                  value={opcionesCompetencia.find((o) => o.value === idCompetencia) ?? null}
                  onChange={(opt) => setIdCompetencia(opt?.value ?? null)}
                  classNames={{
                    ...selectClassNames,
                    control: (state) => `${selectClassNames.control(state)} !pl-7`,
                  }}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className={clsLabelFiltro}>RAP</label>
              <div className="relative">
                <KeenIcon
                  icon="notepad"
                  className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                />
                <Select
                  {...propsSelectGestion}
                  isClearable
                  placeholder="Todos los RAP"
                  options={opcionesRap}
                  value={opcionesRap.find((o) => o.value === idRap) ?? null}
                  onChange={(opt) => setIdRap(opt?.value ?? null)}
                  classNames={{
                    ...selectClassNames,
                    control: (state) => `${selectClassNames.control(state)} !pl-7`,
                  }}
                  noOptionsMessage={() =>
                    filtrosError
                      ? filtrosError
                      : idCompetencia
                        ? 'No hay RAP para esta competencia.'
                        : compactReactSelectNoOptions()
                  }
                />
              </div>
            </div>
            <div className="sm:col-span-2 xl:col-span-1 min-w-0">
              <label className={`${clsLabelFiltro} xl:opacity-0 xl:select-none`}>Buscar</label>
              <div className="relative">
                <KeenIcon
                  icon="magnifier"
                  className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                />
                <input
                  type="search"
                  className="input h-9 w-full pl-9 dark:bg-[#111827] dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                  placeholder="Buscar por título, autor, RAP o entregables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
            <button
              type="button"
              className="btn btn-light h-9 text-sm"
              onClick={() => abrirCrear('cuestionario')}
            >
              <KeenIcon icon="notepad" className="text-sm mr-1.5" />
              Crear cuestionario
            </button>
            <button
              type="button"
              className="btn btn-primary h-9 text-sm"
              onClick={() => abrirCrear('actividad')}
            >
              <KeenIcon icon="plus" className="text-sm mr-1.5" />
              Crear actividad
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Actividades registradas ({meta.total})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] table-fixed">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-coal-500/30">
                <th className={`${clsTh} pl-3`}>Código</th>
                <th className={clsTh}>Título</th>
                <th className={clsTh}>Tipo</th>
                <th className={clsTh}>Competencia</th>
                <th className={clsTh}>RAP</th>
                <th className={clsTh}>Entregables</th>
                <th className={clsTh}>Fichas asignadas</th>
                <th className={`${clsTh} text-right pl-2 pr-4`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className={`text-xs mt-2 ${TEXTO_SECUNDARIO}`}>Cargando actividades...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-red-600 dark:text-red-300">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-8 text-center text-sm ${TEXTO_SECUNDARIO}`}>
                    No hay actividades para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const competenciaTxt = etiquetaMateria(row.competencia);
                  const rapTxt = etiquetaMateria(row.rap);
                  const entregables = compactarEntregables(row.entregables);
                  const visual = tipoActividadVisual(row.tipoActividad);
                  return (
                  <tr
                    key={row.id}
                    className="h-14 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className={`${CELDA} pl-3 text-xs tabular-nums ${TEXTO_SECUNDARIO}`}>
                      <span className="block truncate" title={row.codigo}>{row.codigo}</span>
                    </td>
                    <td className={CELDA}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-coal-500/60 ${visual.iconClass}`}
                          aria-hidden
                        >
                          <KeenIcon icon={visual.icon} className="text-sm" />
                        </span>
                        <span className={`block min-w-0 flex-1 truncate text-sm font-medium ${TEXTO_PRINCIPAL}`} title={row.tituloActividad}>
                          {row.tituloActividad}
                        </span>
                      </div>
                    </td>
                    <td className={`${CELDA} text-xs`}>
                      <span
                        className={`inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[11px] font-medium ${visual.badgeClass}`}
                        title={visual.label}
                      >
                        {visual.label}
                      </span>
                    </td>
                    <td className={CELDA}>
                      <CeldaClamp texto={competenciaTxt} title={competenciaTxt} />
                    </td>
                    <td className={CELDA}>
                      <CeldaClamp texto={rapTxt} title={rapTxt} />
                    </td>
                    <td className={CELDA}>
                      <CeldaClamp texto={entregables.visible} title={entregables.completo} />
                    </td>
                    <td className={`${CELDA} text-xs`}>
                      {Number(row.fichasAsignadas) > 0 ? (
                        <button
                          type="button"
                          className="text-primary hover:underline tabular-nums font-semibold"
                          onClick={() => void abrirFichasAsignadas(row)}
                          title="Ver fichas asignadas"
                        >
                          {row.fichasAsignadas}
                        </button>
                      ) : (
                        <span className={`tabular-nums ${TEXTO_SECUNDARIO}`}>{row.fichasAsignadas}</span>
                      )}
                    </td>
                    <td className="py-2 pl-2 pr-4 align-middle text-right">
                      <button
                        type="button"
                        data-id="gestion-actividades-acciones-btn"
                        aria-haspopup="menu"
                        aria-expanded={accionesMenu?.id === row.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                        onClick={(e) => {
                          if (accionesMenu?.id === row.id) {
                            setAccionesMenu(null);
                            return;
                          }
                          abrirMenuAcciones(row, e.currentTarget);
                        }}
                      >
                        Acciones
                        <KeenIcon icon="down" className="text-[10px]" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 text-xs ${TEXTO_SECUNDARIO}`}>
          <span>
            Mostrando {meta.from}-{meta.to} de {meta.total} actividades.
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-sm btn-light" disabled={meta.current_page <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
              Anterior
            </button>
            <span className="px-2">Página {meta.current_page} de {meta.last_page}</span>
            <button
              type="button"
              className="btn btn-sm btn-light"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {accionesMenu
        ? createPortal(
            (() => {
              const active = items.find((row) => row.id === accionesMenu.id);
              if (!active) return null;
              const puedeBorrar = puedeEliminarFila(active);
              const itemCls =
                'block w-full text-left px-3 py-2 text-sm rounded text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-400';
              return (
                <div
                  data-id="gestion-actividades-acciones-menu"
                  role="menu"
                  className="fixed z-[9999] min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1"
                  style={{ top: accionesMenu.top, left: accionesMenu.left }}
                >
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-white border-b border-gray-100 dark:border-gray-600">
                    Acciones
                  </p>
                  <button type="button" role="menuitem" className={itemCls} onClick={() => void abrirVer(active)}>
                    Ver
                  </button>
                  <button type="button" role="menuitem" className={itemCls} onClick={() => void abrirEditar(active)}>
                    Editar
                  </button>
                  <button type="button" role="menuitem" className={itemCls} onClick={() => abrirAsignar(active)}>
                    Asignar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!puedeBorrar}
                    title={puedeBorrar ? 'Eliminar actividad' : motivoNoEliminarFila(active)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded ${
                      puedeBorrar
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!puedeBorrar) return;
                      setAccionesMenu(null);
                      setActividadEliminar(active);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              );
            })(),
            document.body
          )
        : null}

      {crearTipo ? (
        <Modal open onClose={() => setCrearTipo(null)}>
          <ModalContent className="w-[95vw] max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
            <ModalHeader className="shrink-0">
              <ModalTitle>{crearTipo === 'cuestionario' ? 'Crear cuestionario' : 'Crear actividad'}</ModalTitle>
            </ModalHeader>
            <ModalBody className="min-h-0 overflow-y-auto overflow-x-hidden">
              <p className="text-xs text-gray-600 dark:text-white mb-3 leading-snug">
                Selecciona primero la competencia y luego el RAP. La actividad queda asociada al RAP y, por esa
                relación, a su competencia. No se asigna automáticamente a ninguna ficha.
              </p>
              {filtrosError ? (
                <p className="text-sm text-red-600 dark:text-red-300 mb-3">{filtrosError}</p>
              ) : null}
              <div className="space-y-4">
                <div className="min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                    Competencia *
                  </label>
                  <Select
                    {...propsSelectGestion}
                    placeholder={filtrosLoading ? 'Cargando competencias...' : 'Seleccione una competencia'}
                    isLoading={filtrosLoading}
                    isDisabled={filtrosLoading || Boolean(filtrosError)}
                    options={opcionesCompetencia}
                    value={opcionesCompetencia.find((o) => o.value === competenciaCrear) ?? null}
                    onChange={(opt) => {
                      setCompetenciaCrear(opt?.value ?? null);
                      setRapCrear(null);
                    }}
                    noOptionsMessage={() =>
                      filtrosError ? filtrosError : 'No hay competencias disponibles para tu usuario.'
                    }
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                    RAP *
                  </label>
                  <Select
                    {...propsSelectGestion}
                    isDisabled={!competenciaCrear || filtrosLoading}
                    isLoading={Boolean(competenciaCrear) && filtrosLoading}
                    placeholder={competenciaCrear ? 'Seleccione un RAP' : 'Seleccione una competencia primero'}
                    options={opcionesRapCrear}
                    value={opcionesRapCrear.find((o) => o.value === rapCrear) ?? null}
                    onChange={(opt) => setRapCrear(opt?.value ?? null)}
                    noOptionsMessage={() => {
                      if (!competenciaCrear) return 'Seleccione una competencia primero.';
                      if (filtrosError) return filtrosError;
                      return 'No hay RAP disponibles para esta competencia.';
                    }}
                  />
                  {competenciaCrear && !filtrosLoading && !filtrosError && opcionesRapCrear.length === 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
                      Esta competencia no tiene RAP accesibles con tu asignación actual.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 mt-5">
                <button type="button" className="btn btn-light" onClick={() => setCrearTipo(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" disabled={!rapCrearValido} onClick={confirmarRapCrear}>
                  Continuar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      ) : null}

      <ModalAsignarActividadFichas
        open={modalAsignarOpen}
        actividad={actividadAsignar}
        onClose={cerrarAsignar}
        onElegirFicha={continuarPublicacion}
      />

      <ModalAsignarActividad
        open={modalPublicarOpen && Boolean(fichaPublicar) && Boolean(actividadAsignar)}
        onClose={cerrarAsignar}
        onSave={() => {
          cerrarAsignar();
          void cargarCatalogo();
        }}
        onSuccess={(msg) => {
          showToast(msg);
          cerrarAsignar();
          void cargarCatalogo();
        }}
        idFicha={fichaPublicar?.id ?? 0}
        actividad={actividadAsignar ? gestionActividadesService.toActividadModal(actividadAsignar) : null}
      />

      {modalFichasOpen ? (
        <Modal open onClose={() => setModalFichasOpen(false)}>
          <ModalContent className="max-w-lg">
            <ModalHeader>
              <ModalTitle>Fichas asignadas</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p className="text-xs text-gray-600 dark:text-white mb-3">{fichasTitulo}</p>
              {loadingFichas ? (
                <div className="py-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : fichasConsulta.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-white">Esta actividad aún no está asignada a ninguna ficha.</p>
              ) : (
                <ul className="space-y-2">
                  {fichasConsulta.map((f) => (
                    <li
                      key={f.id}
                      className="text-sm text-gray-800 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{f.codigo || `Ficha ${f.id}`}</span>
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          {f.estadoPublicacion || 'Publicada'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-white mt-1">
                        {[f.programa, f.jornada, f.estado].filter(Boolean).join(' · ') || 'Sin datos académicos adicionales'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      ) : null}

      {actividadEliminar ? (
        <Modal open onClose={() => !eliminando && setActividadEliminar(null)}>
          <ModalContent className="max-w-lg">
            <ModalHeader>
              <ModalTitle>Eliminar actividad</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-gray-800 dark:text-white">
                ¿Está seguro de que desea eliminar esta actividad?
              </p>
              <p className="text-xs text-gray-600 dark:text-white mt-2">Esta acción no se puede deshacer.</p>
              <p className="text-xs text-gray-700 dark:text-white mt-2 font-medium">{actividadEliminar.tituloActividad}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-light" disabled={eliminando} onClick={() => setActividadEliminar(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" disabled={eliminando} onClick={() => void confirmarEliminar()}>
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      ) : null}

      <ModalCrearActividad
        open={modalCrearOpen}
        onClose={() => {
          setModalCrearOpen(false);
          setActividadEditar(null);
        }}
        onSave={() => void cargarCatalogo()}
        onSuccess={(msg) => {
          showToast(msg);
          void cargarCatalogo();
        }}
        actividadEditar={actividadEditar && !esCuestionario(actividadEditar.tipoActividad) ? actividadEditar : null}
        idMateria={idMateriaModal || undefined}
        idCompetencia={!actividadEditar ? (idCompetenciaModal || undefined) : undefined}
      />
      <ModalCrearCuestionario
        open={modalCuestionarioOpen}
        onClose={() => {
          setModalCuestionarioOpen(false);
          setActividadEditar(null);
        }}
        onSave={() => void cargarCatalogo()}
        onSuccess={(msg) => {
          showToast(msg);
          void cargarCatalogo();
        }}
        idMateria={idMateriaModal || undefined}
        idCompetencia={!actividadEditar ? (idCompetenciaModal || undefined) : undefined}
        cuestionarioEditar={
          actividadEditar && esCuestionario(actividadEditar.tipoActividad)
            ? (actividadEditar as unknown as { id: number; tituloActividad?: string; descripcionActividad?: string; autor?: string; idMateria?: number })
            : null
        }
      />
      <ModalVerActividad open={Boolean(actividadVer)} onClose={() => setActividadVer(null)} actividad={actividadVer} />
      <Toast isOpen={toastOpen} message={toastMessage} type={toastType} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default GestionActividadesView;
