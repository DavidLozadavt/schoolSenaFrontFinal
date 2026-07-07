import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, ImageZoomModal } from '@/components';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
  filterOptionNormalized
} from '@/components/forms/compactReactSelect';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';
import ModalVerRespuestaYCalificar from './ModalVerRespuestaYCalificar';

const AVATAR_DEFAULT = '/media/avatars/blank.png';

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const getFotoUrl = (rutaFoto: string | undefined): string => {
  if (!rutaFoto) return AVATAR_DEFAULT;
  const url = getDocumentUrl(rutaFoto);
  return url || AVATAR_DEFAULT;
};

export interface AprendizCalificacion {
  idCalificacionActividad: number;
  idAMartriculaAcademica: number;
  idMatricula: number;
  idGrupo: number | null;
  nombreGrupo?: string | null;
  nombreAprendiz: string;
  identificacion: string;
  rutaFoto: string | null;
  calificacionNumerica: string | number | null;
  calificacionEstandart: string | null;
  ComentarioDocente: string | null;
  ComentarioEstudiante: string | null;
  archivo: string | null;
  fechaCalificacion: string | null;
  estado: 'PENDIENTE' | 'ENVIADO' | 'CALIFICADO' | 'CORRECCION_SOLICITADA';
  fechaFinal?: string | null;
  email?: string | null;
}

interface ModalAprendicesProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  actividad: Actividad | null;
  idFicha: number;
  tituloActividad?: string;
}

const ModalAprendices: React.FC<ModalAprendicesProps> = ({
  open,
  onClose,
  onSuccess,
  actividad,
  idFicha,
  tituloActividad
}) => {
  const [aprendices, setAprendices] = useState<AprendizCalificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroGrupo, setFiltroGrupo] = useState<number | 'todos'>('todos');
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState<AprendizCalificacion | null>(null);
  const [modalCalificarOpen, setModalCalificarOpen] = useState(false);
  const [modalCalificarGrupoOpen, setModalCalificarGrupoOpen] = useState(false);
  const [notaGrupo, setNotaGrupo] = useState('');
  const [comentarioGrupo, setComentarioGrupo] = useState('');
  const [guardandoGrupo, setGuardandoGrupo] = useState(false);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modalCalificarMasivaOpen, setModalCalificarMasivaOpen] = useState(false);
  const [notaMasiva, setNotaMasiva] = useState('');
  const [comentarioMasivo, setComentarioMasivo] = useState('');
  const [guardandoMasiva, setGuardandoMasiva] = useState(false);

  const idActividad = actividad?.id;

  const esActividadGrupal = React.useMemo(() => {
    const conGrupo = aprendices.filter((a) => a.idGrupo != null);
    return conGrupo.length > 0;
  }, [aprendices]);

  const gruposEnActividad = React.useMemo(() => {
    const conGrupo = aprendices.filter((a) => a.idGrupo != null);
    const map = new Map<number, string>();
    conGrupo.forEach((a) => {
      if (a.idGrupo != null && !map.has(a.idGrupo)) {
        map.set(a.idGrupo, a.nombreGrupo || `Grupo ${a.idGrupo}`);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [aprendices]);

  const idGrupoParaCalificar = React.useMemo(() => {
    if (filtroGrupo === 'todos') return gruposEnActividad.length === 1 ? gruposEnActividad[0].id : null;
    return filtroGrupo as number;
  }, [filtroGrupo, gruposEnActividad]);

  const integrantesGrupo = React.useMemo(() => {
    if (!idGrupoParaCalificar) return [];
    return aprendices.filter((a) => a.idGrupo === idGrupoParaCalificar);
  }, [aprendices, idGrupoParaCalificar]);

  useEffect(() => {
    if (!open || !idActividad || !idFicha) {
      setAprendices([]);
      setFiltroGrupo('todos');
      setSeleccionados(new Set());
      return;
    }
    setFiltroGrupo('todos');
    setLoading(true);
    axios
      .get(`actividades/${idActividad}/fichas/${idFicha}/aprendices`)
      .then((r) => setAprendices(r.data?.data ?? []))
      .catch(() => setAprendices([]))
      .finally(() => setLoading(false));
  }, [open, idActividad, idFicha]);

  const filtrados = React.useMemo(() => {
    let list = aprendices;
    if (filtroGrupo !== 'todos') {
      list = list.filter((a) => a.idGrupo === filtroGrupo);
    }
    if (filtroEstado !== 'todos') {
      list = list.filter((a) => a.estado === filtroEstado);
    }
    return list;
  }, [aprendices, filtroEstado, filtroGrupo]);

  const handleBusquedaAprendizSelect = (opt: SingleValue<AprendizCalificacion>) => {
    if (!opt) return;
    const el = document.getElementById(`aprendiz-row-${opt.idCalificacionActividad}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleVerYCalificar = (aprendiz: AprendizCalificacion) => {
    setAprendizSeleccionado(aprendiz);
    setModalCalificarOpen(true);
  };

  const handleCalificado = () => {
    if (!idActividad || !idFicha) return;
    setLoading(true);
    axios
      .get(`actividades/${idActividad}/fichas/${idFicha}/aprendices`)
      .then((r) => setAprendices(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    setModalCalificarOpen(false);
    setAprendizSeleccionado(null);
  };

  const handleCalificarGrupo = async () => {
    if (!idActividad || !idGrupoParaCalificar) return;
    const nota = parseFloat(notaGrupo);
    if (isNaN(nota) || nota < 0) {
      alert('Ingresa una calificación válida (0 o mayor).');
      return;
    }
    setGuardandoGrupo(true);
    try {
      await axios.post('calificaciones/por-grupo', {
        idActividad,
        idGrupo: idGrupoParaCalificar,
        calificacionNumerica: nota,
        ComentarioDocente: comentarioGrupo.trim() || null
      });
      onSuccess?.('Calificación aplicada al grupo correctamente');
      handleCalificado();
      setModalCalificarGrupoOpen(false);
      setNotaGrupo('');
      setComentarioGrupo('');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al calificar el grupo');
    } finally {
      setGuardandoGrupo(false);
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const todosSeleccionados = filtrados.length > 0 && filtrados.every((a) => seleccionados.has(a.idCalificacionActividad));
  const toggleSeleccionTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filtrados.map((a) => a.idCalificacionActividad)));
    }
  };

  const handleCalificarMasiva = async () => {
    const nota = parseFloat(notaMasiva);
    if (isNaN(nota) || nota < 0) {
      alert('Ingresa una calificación válida (0 o mayor).');
      return;
    }
    const ids = Array.from(seleccionados);
    if (ids.length === 0) {
      alert('Selecciona al menos un aprendiz.');
      return;
    }
    setGuardandoMasiva(true);
    let ok = 0;
    let fail = 0;
    for (const idCa of ids) {
      try {
        await axios.post('calificacion-actividad/calificar', {
          idCalificacionActividad: idCa,
          calificacionNumerica: nota,
          ComentarioDocente: comentarioMasivo.trim() || null
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setGuardandoMasiva(false);
    setModalCalificarMasivaOpen(false);
    setNotaMasiva('');
    setComentarioMasivo('');
    setSeleccionados(new Set());
    if (ok > 0) onSuccess?.(`Calificación aplicada a ${ok} aprendiz(es)`);
    handleCalificado();
    if (fail > 0) {
      alert(`Calificados: ${ok}. No se pudo calificar: ${fail} (pueden requerir evidencia previa).`);
    }
  };

  const titulo = tituloActividad || actividad?.tituloActividad || 'Actividad';

  const clsLabelFiltro =
    'text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1 block';

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={110}>
        <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:px-5 sm:py-10 box-border pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-5xl xl:max-w-6xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ModalContent className="!flex w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 sm:min-w-0 max-h-[min(94dvh,960px)]">
              <ModalHeader className="!shrink-0 border-b border-gray-100 dark:border-gray-600/80 px-5 sm:px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <ModalTitle className="text-gray-900 dark:text-white">Aprendices</ModalTitle>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate" title={titulo}>
                    {titulo}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                  onClick={onClose}
                  title="Cerrar"
                >
                  <KeenIcon icon="cross" />
                </button>
              </ModalHeader>
              <ModalBody className="!flex !min-h-0 !flex-1 !flex-col !gap-0 !overflow-hidden !p-0">
                <div className="shrink-0 border-b border-gray-100 dark:border-gray-600/50 px-5 sm:px-6 py-4 space-y-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
                    {aprendices.length > 0 && (
                      <div className="w-full xl:flex-1 xl:min-w-[240px] xl:max-w-md">
                        <label className={clsLabelFiltro} htmlFor="buscar-aprendiz-actividad">
                          Buscar aprendiz
                        </label>
                        <Select<AprendizCalificacion, false>
                    inputId="buscar-aprendiz-actividad"
                    instanceId="buscar-aprendiz-actividad"
                    options={aprendices}
                    placeholder="Nombre, documento o correo..."
                    isClearable
                    isSearchable
                    classNamePrefix="react-select-aprendiz-act"
                    classNames={compactReactSelectClassNames}
                    getOptionValue={(a) => String(a.idCalificacionActividad)}
                    getOptionLabel={(a) => a.nombreAprendiz}
                    formatOptionLabel={(a) => (
                      <div className="py-0.5">
                        <div className="font-medium leading-tight">{a.nombreAprendiz}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                          {a.identificacion}
                          {a.email ? ` · ${a.email}` : ''}
                        </div>
                      </div>
                    )}
                    filterOption={(option, raw) => {
                      const a = option.data;
                      return filterOptionNormalized([a.nombreAprendiz, a.identificacion, a.email], raw);
                    }}
                    onChange={handleBusquedaAprendizSelect}
                          noOptionsMessage={compactReactSelectNoOptions}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-end gap-2.5">
                      <div>
                        <label className={clsLabelFiltro} htmlFor="filtro-estado-aprendices">
                          Estado
                        </label>
                        <select
                          id="filtro-estado-aprendices"
                          value={filtroEstado}
                          onChange={(e) => setFiltroEstado(e.target.value)}
                          className="select select-sm min-w-[10.5rem]"
                        >
                          <option value="todos">Todos los aprendices</option>
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="ENVIADO">Enviado</option>
                          <option value="CORRECCION_SOLICITADA">Corrección solicitada</option>
                          <option value="CALIFICADO">Calificado</option>
                        </select>
                      </div>
                      {esActividadGrupal && gruposEnActividad.length > 0 && (
                        <div>
                          <label className={clsLabelFiltro} htmlFor="filtro-grupo-aprendices">
                            Grupo
                          </label>
                          <select
                            id="filtro-grupo-aprendices"
                            value={filtroGrupo}
                            onChange={(e) =>
                              setFiltroGrupo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                            }
                            className="select select-sm min-w-[9.5rem]"
                          >
                            <option value="todos">Todos los grupos</option>
                            {gruposEnActividad.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.nombre} ({aprendices.filter((a) => a.idGrupo === g.id).length})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {esActividadGrupal && gruposEnActividad.length > 0 && idGrupoParaCalificar && (
                      <button
                        type="button"
                        onClick={() => setModalCalificarGrupoOpen(true)}
                        className="btn btn-sm btn-primary"
                      >
                        <KeenIcon icon="users" className="me-1" />
                        Calificar grupo ({integrantesGrupo.length})
                      </button>
                    )}
                    {filtrados.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={toggleSeleccionTodos}
                          className="btn btn-sm btn-light"
                        >
                          {todosSeleccionados ? 'Desmarcar todos' : 'Seleccionar todos'}
                        </button>
                        {seleccionados.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalCalificarMasivaOpen(true)}
                            className="btn btn-sm btn-primary"
                          >
                            <KeenIcon icon="check-squared" className="me-1" />
                            Calificar seleccionados ({seleccionados.size})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col px-5 sm:px-6 py-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                    </div>
                  ) : filtrados.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
                      <KeenIcon icon="users" className="text-4xl text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        No hay aprendices asignados
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        No hay aprendices asignados a esta actividad con el filtro actual.
                      </p>
                    </div>
                  ) : (
                    <div className="card card-grid min-w-full flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="card-body !p-0 flex-1 min-h-0 flex flex-col">
                        <div className="scrollable-y-auto flex-1 min-h-0 max-h-[min(55dvh,520px)] [scrollbar-gutter:stable]">
                          <table className="w-full min-w-0 table-fixed" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: 44 }} />
                              <col style={{ width: esActividadGrupal ? '26%' : '32%' }} />
                              {esActividadGrupal && <col style={{ width: '11%' }} />}
                              <col style={{ width: esActividadGrupal ? '14%' : '16%' }} />
                              <col style={{ width: esActividadGrupal ? '10%' : '12%' }} />
                              <col style={{ width: esActividadGrupal ? '16%' : '20%' }} />
                              <col style={{ width: esActividadGrupal ? '12%' : '14%' }} />
                              <col style={{ width: '6.5rem' }} />
                            </colgroup>
                            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-coal-500/90 backdrop-blur-sm">
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2.5 px-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={todosSeleccionados}
                                    onChange={toggleSeleccionTodos}
                                    className="checkbox checkbox-sm"
                                    aria-label="Seleccionar todos"
                                  />
                                </th>
                                <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Aprendiz
                                </th>
                                {esActividadGrupal && (
                                  <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                    Grupo
                                  </th>
                                )}
                                <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Documento
                                </th>
                                <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Calificación
                                </th>
                                <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Estándar
                                </th>
                                <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Estado
                                </th>
                                <th className="text-center py-2.5 px-2 sm:px-3 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {filtrados.map((a) => (
                                <tr
                                  key={a.idCalificacionActividad}
                                  id={`aprendiz-row-${a.idCalificacionActividad}`}
                                  className="hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors"
                                >
                                  <td className="py-3 px-2 align-middle text-center">
                                    <input
                                      type="checkbox"
                                      checked={seleccionados.has(a.idCalificacionActividad)}
                                      onChange={() => toggleSeleccion(a.idCalificacionActividad)}
                                      className="checkbox checkbox-sm"
                                      aria-label={`Seleccionar ${a.nombreAprendiz}`}
                                    />
                                  </td>
                                  <td className="py-3 px-2 sm:px-3 align-middle min-w-0 overflow-hidden">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setZoomFoto({
                                            src: getFotoUrl(a.rutaFoto ?? undefined),
                                            alt: a.nombreAprendiz
                                          })
                                        }
                                        className="shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                      >
                                        <img
                                          src={getFotoUrl(a.rutaFoto ?? undefined)}
                                          alt={a.nombreAprendiz}
                                          className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                                        />
                                      </button>
                                      <span
                                        className="text-sm font-medium text-gray-900 dark:text-white truncate block"
                                        title={a.nombreAprendiz}
                                      >
                                        {a.nombreAprendiz}
                                      </span>
                                    </div>
                                  </td>
                                  {esActividadGrupal && (
                                    <td className="py-3 px-2 sm:px-3 align-middle min-w-0 overflow-hidden">
                                      <span
                                        className="text-sm text-gray-600 dark:text-gray-400 truncate block"
                                        title={a.nombreGrupo || `Grupo ${a.idGrupo}`}
                                      >
                                        {a.nombreGrupo || (a.idGrupo ? `Grupo ${a.idGrupo}` : '-')}
                                      </span>
                                    </td>
                                  )}
                                  <td
                                    className="py-3 px-2 sm:px-3 align-middle text-sm text-gray-700 dark:text-gray-300 truncate"
                                    title={a.identificacion || ''}
                                  >
                                    {a.identificacion || '-'}
                                  </td>
                                  <td className="py-3 px-2 sm:px-3 align-middle text-sm">
                                    {a.calificacionNumerica != null && a.calificacionNumerica !== '' ? (
                                      (() => {
                                        const nota = parseFloat(String(a.calificacionNumerica));
                                        const esRojo = nota <= 3.5;
                                        const esAmarillo = nota > 3.5 && nota < 4.0;
                                        const esVerde = nota >= 4.0;
                                        const clase = esRojo
                                          ? 'text-red-600 dark:text-red-400 font-semibold'
                                          : esAmarillo
                                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                            : esVerde
                                              ? 'text-green-600 dark:text-green-400 font-semibold'
                                              : 'text-gray-600 dark:text-gray-400 font-semibold';
                                        return <span className={clase}>{a.calificacionNumerica}</span>;
                                      })()
                                    ) : (
                                      <span className="text-red-600 dark:text-red-400 font-medium">Sin calificar</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-2 sm:px-3 align-middle min-w-0 overflow-hidden">
                                    <span
                                      className="text-sm text-gray-600 dark:text-gray-400 truncate block"
                                      title={a.calificacionEstandart || 'Sin configuración de calificaciones'}
                                    >
                                      {a.calificacionEstandart || 'Sin configuración'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 sm:px-3 align-middle">
                                    <span
                                      className={`inline-flex max-w-full px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        a.estado === 'CALIFICADO'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                          : a.estado === 'ENVIADO'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            : a.estado === 'CORRECCION_SOLICITADA'
                                              ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200'
                                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                      }`}
                                    >
                                      {a.estado === 'CORRECCION_SOLICITADA' ? 'Corrección' : a.estado}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 sm:px-3 align-middle text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleVerYCalificar(a)}
                                      className="btn btn-sm btn-icon btn-clear btn-primary"
                                      title="Ver respuesta y calificar"
                                    >
                                      <KeenIcon icon="eye" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
            </ModalContent>
          </div>
        </div>
      </Modal>
      <ModalVerRespuestaYCalificar
        open={modalCalificarOpen}
        onClose={() => {
          setModalCalificarOpen(false);
          setAprendizSeleccionado(null);
        }}
        aprendiz={aprendizSeleccionado}
        onCalificado={handleCalificado}
        onSuccess={onSuccess}
        tipoActividad={actividad?.tipoActividad}
      />
      {modalCalificarGrupoOpen && (
        <Modal open={modalCalificarGrupoOpen} onClose={() => setModalCalificarGrupoOpen(false)} zIndex={120}>
          <ModalContent className="max-w-lg">
            <ModalHeader>
              <ModalTitle>
                Calificar {idGrupoParaCalificar && gruposEnActividad.find((g) => g.id === idGrupoParaCalificar)?.nombre || 'grupo'} ({integrantesGrupo.length} integrantes)
              </ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={() => setModalCalificarGrupoOpen(false)}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                La misma calificación se aplicará a todos los integrantes del grupo.
              </p>
              {integrantesGrupo.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Integrantes del grupo</p>
                  <ul className="space-y-1 text-sm">
                    {integrantesGrupo.map((a) => (
                      <li key={a.idCalificacionActividad} className="flex items-center gap-2">
                        <span className={a.estado === 'ENVIADO' || a.estado === 'CALIFICADO' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                          {a.estado === 'ENVIADO' || a.estado === 'CALIFICADO' ? '✓' : '○'} {a.nombreAprendiz}
                        </span>
                        {a.estado === 'ENVIADO' && (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">(entregó)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calificación (0-5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={notaGrupo}
                  onChange={(e) => setNotaGrupo(e.target.value)}
                  placeholder="Ej: 4.0"
                  className="input w-full max-w-[120px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario (opcional)</label>
                <textarea
                  value={comentarioGrupo}
                  onChange={(e) => setComentarioGrupo(e.target.value.slice(0, 2000))}
                  placeholder="Observaciones para todo el grupo..."
                  className="input w-full text-sm min-h-[60px]"
                  maxLength={2000}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setModalCalificarGrupoOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleCalificarGrupo}
                  disabled={guardandoGrupo}
                >
                  {guardandoGrupo ? 'Guardando...' : 'Aplicar a todos'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {modalCalificarMasivaOpen && (
        <Modal open={modalCalificarMasivaOpen} onClose={() => setModalCalificarMasivaOpen(false)} zIndex={120}>
          <ModalContent className="max-w-md">
            <ModalHeader>
              <ModalTitle>Calificar seleccionados ({seleccionados.size})</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={() => setModalCalificarMasivaOpen(false)}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Se aplicará la misma calificación a los {seleccionados.size} aprendiz(es) seleccionado(s). Las actividades con evidencia requieren entrega previa.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calificación (0-5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={notaMasiva}
                  onChange={(e) => setNotaMasiva(e.target.value)}
                  placeholder="Ej: 4.0"
                  className="input w-full max-w-[120px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario (opcional)</label>
                <textarea
                  value={comentarioMasivo}
                  onChange={(e) => setComentarioMasivo(e.target.value.slice(0, 2000))}
                  placeholder="Observaciones..."
                  className="input w-full text-sm min-h-[60px]"
                  maxLength={2000}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setModalCalificarMasivaOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleCalificarMasiva}
                  disabled={guardandoMasiva}
                >
                  {guardandoMasiva ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {zoomFoto && (
        <ImageZoomModal
          open={!!zoomFoto}
          onClose={() => setZoomFoto(null)}
          src={zoomFoto.src}
          alt={zoomFoto.alt}
          title={zoomFoto.alt}
        />
      )}
    </>
  );
};

export default ModalAprendices;
