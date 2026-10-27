import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Select from 'react-select';
import { KeenIcon, Toast } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  compactReactSelectNoOptions,
  compactReactSelectWrapClassNames,
  filterOptionNormalized,
} from '@/components/forms/compactReactSelect';
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
  ...compactReactSelectWrapClassNames,
  control: (state: { isFocused: boolean }) =>
    `${compactReactSelectWrapClassNames.control()} dark:text-white ${
      state.isFocused ? '!border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
    }`,
  singleValue: () => `${compactReactSelectWrapClassNames.singleValue()} dark:!text-white`,
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm whitespace-normal',
  menu: () => `${compactReactSelectWrapClassNames.menu()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectWrapClassNames.option(state)} dark:!text-white ${state.isSelected ? '!text-white' : ''}`,
};

const formatMateriaOption = (option: { label: string }) => (
  <span className="block whitespace-normal break-words leading-snug">{option.label}</span>
);

const etiquetaMateria = (item?: { codigo?: string | null; nombreMateria?: string | null } | null) => {
  if (!item) return '—';
  if (item.codigo && item.nombreMateria) return `${item.codigo} · ${item.nombreMateria}`;
  return item.nombreMateria || item.codigo || '—';
};

const tipoLabel = (tipo?: string | null) => {
  if (!tipo) return '—';
  if (tipo === 'cuestionario') return 'Cuestionario';
  if (tipo === 'con evidencia') return 'Con evidencia';
  if (tipo === 'sin evidencia') return 'Sin evidencia';
  return tipo;
};

/** En modo oscuro gray-200 del tema es un gris oscuro (#26272F); el texto de tabla debe ser blanco. */
const CELDA = 'py-2.5 px-2 align-middle overflow-hidden min-w-0 max-w-0';
const TEXTO_PRINCIPAL = 'text-gray-900 dark:text-white';
const TEXTO_SECUNDARIO = 'text-gray-700 dark:text-white';

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

const filterOptionMateria = (
  option: { label?: string; value?: unknown },
  input: string
): boolean => filterOptionNormalized([option.label, option.value], input);

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
        label: etiquetaMateria(c),
      })),
    [competencias]
  );

  const opcionesRap = useMemo(
    () =>
      rapsFiltrados.map((r) => ({
        value: r.id,
        label: etiquetaMateria(r),
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
        label: etiquetaMateria(r),
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
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 min-w-0">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                Competencia
              </label>
              <Select
                isClearable
                placeholder="Todas las competencias"
                options={opcionesCompetencia}
                value={opcionesCompetencia.find((o) => o.value === idCompetencia) ?? null}
                onChange={(opt) => setIdCompetencia(opt?.value ?? null)}
                classNames={selectClassNames}
                filterOption={filterOptionMateria}
                formatOptionLabel={formatMateriaOption}
                noOptionsMessage={compactReactSelectNoOptions}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                RAP
              </label>
              <Select
                isClearable
                placeholder="Todos los RAP"
                options={opcionesRap}
                value={opcionesRap.find((o) => o.value === idRap) ?? null}
                onChange={(opt) => setIdRap(opt?.value ?? null)}
                classNames={selectClassNames}
                filterOption={filterOptionMateria}
                formatOptionLabel={formatMateriaOption}
                noOptionsMessage={() =>
                  filtrosError
                    ? filtrosError
                    : idCompetencia
                      ? 'No hay RAP para esta competencia.'
                      : compactReactSelectNoOptions()
                }
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                Buscar
              </label>
              <input
                type="text"
                className="input w-full dark:bg-[#111827] dark:text-white dark:border-gray-600"
                placeholder="Buscar por título, autor, RAP o entregables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" className="btn btn-light text-sm" onClick={() => abrirCrear('cuestionario')}>
              <KeenIcon icon="notepad" className="text-sm mr-1.5" />
              Crear cuestionario
            </button>
            <button type="button" className="btn btn-primary text-sm" onClick={() => abrirCrear('actividad')}>
              <KeenIcon icon="plus" className="text-sm mr-1.5" />
              Crear actividad
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] table-fixed">
            <colgroup>
              <col className="w-[7%]" />
              <col className="w-[18%]" />
              <col className="w-[9%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {['Código', 'Título', 'Tipo', 'Competencia', 'RAP', 'Entregables', 'Fichas asignadas', 'Acciones'].map(
                  (h) => (
                    <th
                      key={h}
                      className={`py-2.5 text-xs font-semibold text-gray-600 dark:text-white ${
                        h === 'Acciones' ? 'text-right pl-2 pr-5' : 'text-left px-2 first:pl-3'
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
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
                  return (
                  <tr
                    key={row.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <td className={`${CELDA} pl-3 text-xs tabular-nums ${TEXTO_SECUNDARIO}`}>
                      <span className="block truncate" title={row.codigo}>{row.codigo}</span>
                    </td>
                    <td className={CELDA}>
                      <CeldaClamp texto={row.tituloActividad} principal title={row.tituloActividad} />
                    </td>
                    <td className={`${CELDA} text-xs ${TEXTO_SECUNDARIO}`}>
                      <span className="block truncate" title={tipoLabel(row.tipoActividad)}>
                        {tipoLabel(row.tipoActividad)}
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
                    <td className="py-2.5 pl-2 pr-5 align-middle text-right">
                      <button
                        type="button"
                        data-id="gestion-actividades-acciones-btn"
                        aria-haspopup="menu"
                        aria-expanded={accionesMenu?.id === row.id}
                        className="inline-flex items-center gap-1 btn btn-sm btn-light text-[11px] font-semibold dark:text-white"
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
        <div className={`flex flex-wrap items-center justify-between gap-2 pl-3 pr-5 py-2 border-t border-gray-200 dark:border-gray-700 text-xs ${TEXTO_SECUNDARIO}`}>
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
          <ModalContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <ModalHeader className="shrink-0">
              <ModalTitle>{crearTipo === 'cuestionario' ? 'Crear cuestionario' : 'Crear actividad'}</ModalTitle>
            </ModalHeader>
            <ModalBody className="min-h-0 overflow-y-auto">
              <p className="text-xs text-gray-600 dark:text-white mb-3 leading-relaxed">
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
                    placeholder={filtrosLoading ? 'Cargando competencias...' : 'Seleccione una competencia'}
                    isLoading={filtrosLoading}
                    isDisabled={filtrosLoading || Boolean(filtrosError)}
                    options={opcionesCompetencia}
                    value={opcionesCompetencia.find((o) => o.value === competenciaCrear) ?? null}
                    onChange={(opt) => {
                      setCompetenciaCrear(opt?.value ?? null);
                      setRapCrear(null);
                    }}
                    classNames={selectClassNames}
                    filterOption={filterOptionMateria}
                    formatOptionLabel={formatMateriaOption}
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
                    isDisabled={!competenciaCrear || filtrosLoading}
                    isLoading={Boolean(competenciaCrear) && filtrosLoading}
                    placeholder={competenciaCrear ? 'Seleccione un RAP' : 'Seleccione una competencia primero'}
                    options={opcionesRapCrear}
                    value={opcionesRapCrear.find((o) => o.value === rapCrear) ?? null}
                    onChange={(opt) => setRapCrear(opt?.value ?? null)}
                    classNames={selectClassNames}
                    filterOption={filterOptionMateria}
                    formatOptionLabel={formatMateriaOption}
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
