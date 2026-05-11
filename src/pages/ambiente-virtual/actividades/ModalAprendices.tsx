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

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={110}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <ModalHeader>
            <ModalTitle>Aprendices</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="flex-1 overflow-hidden flex flex-col min-h-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate" title={titulo}>
              {titulo}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {aprendices.length > 0 && (
                <div className="w-full min-w-[220px] max-w-md">
                  <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
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
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="input text-sm py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="todos">TODOS LOS APRENDICES</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ENVIADO">Enviado</option>
                <option value="CORRECCION_SOLICITADA">Corrección solicitada</option>
                <option value="CALIFICADO">Calificado</option>
              </select>
              {esActividadGrupal && gruposEnActividad.length > 0 && (
                <>
                  <select
                    value={filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                    className="input text-sm py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-lg min-w-[140px]"
                  >
                    <option value="todos">Todos los grupos</option>
                    {gruposEnActividad.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre} ({aprendices.filter((a) => a.idGrupo === g.id).length})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400 self-center">Calificar por grupos:</span>
                  {idGrupoParaCalificar && (
                    <button
                      type="button"
                      onClick={() => setModalCalificarGrupoOpen(true)}
                      className="btn btn-sm btn-primary flex items-center gap-1.5 rounded-lg"
                    >
                      <KeenIcon icon="users" className="text-sm" />
                      Calificar grupo ({integrantesGrupo.length} integrantes)
                    </button>
                  )}
                </>
              )}
              {filtrados.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={toggleSeleccionTodos}
                    className="btn btn-sm btn-light flex items-center gap-1 rounded-lg"
                  >
                    {todosSeleccionados ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </button>
                  {seleccionados.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setModalCalificarMasivaOpen(true)}
                      className="btn btn-sm btn-primary flex items-center gap-1.5 rounded-lg"
                    >
                      <KeenIcon icon="check-squared" className="text-sm" />
                      Calificar seleccionados ({seleccionados.size})
                    </button>
                  )}
                </>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : filtrados.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                No hay aprendices asignados a esta actividad.
              </p>
            ) : (
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 border border-gray-200 dark:border-gray-600 rounded-lg">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 dark:bg-coal-500/50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-10">
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={toggleSeleccionTodos}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-16">Código</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Aprendiz</th>
                      {esActividadGrupal && (
                        <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-28">Grupo</th>
                      )}
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-24">Identificación</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-16">Cal. Num.</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Cal. Estándar</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-24">Estado</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((a) => (
                      <tr
                        key={a.idCalificacionActividad}
                        id={`aprendiz-row-${a.idCalificacionActividad}`}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-coal-400/30"
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(a.idCalificacionActividad)}
                            onChange={() => toggleSeleccion(a.idCalificacionActividad)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{a.idCalificacionActividad}</td>
                        <td className="py-2 px-3 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => setZoomFoto({ src: getFotoUrl(a.rutaFoto ?? undefined), alt: a.nombreAprendiz })}
                              className="shrink-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <img
                                src={getFotoUrl(a.rutaFoto ?? undefined)}
                                alt={a.nombreAprendiz}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </button>
                            <span className="text-gray-900 dark:text-white truncate block" title={a.nombreAprendiz}>{a.nombreAprendiz}</span>
                          </div>
                        </td>
                        {esActividadGrupal && (
                          <td className="py-2 px-3 overflow-hidden">
                            <span className="text-gray-600 dark:text-gray-400 truncate block" title={a.nombreGrupo || `Grupo ${a.idGrupo}`}>
                              {a.nombreGrupo || (a.idGrupo ? `Grupo ${a.idGrupo}` : '-')}
                            </span>
                          </td>
                        )}
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300 truncate" title={a.identificacion || ''}>{a.identificacion || '-'}</td>
                        <td className="py-2 px-3">
                          {a.calificacionNumerica != null && a.calificacionNumerica !== '' ? (
                            (() => {
                              const nota = parseFloat(String(a.calificacionNumerica));
                              const esRojo = nota <= 3.5;
                              const esAmarillo = nota > 3.5 && nota < 4.0;
                              const esVerde = nota >= 4.0;
                              const clase = esRojo
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : esAmarillo
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : esVerde
                                ? 'text-green-600 dark:text-green-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 font-medium';
                              return <span className={clase}>{a.calificacionNumerica}</span>;
                            })()
                          ) : (
                            <span className="text-red-600 dark:text-red-400">Sin calificar</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 overflow-hidden">
                          <span className="truncate block" title={a.calificacionEstandart || 'Sin configuración de calificaciones'}>
                            {a.calificacionEstandart || 'Sin configuración'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.estado === 'CALIFICADO'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : a.estado === 'ENVIADO'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : a.estado === 'CORRECCION_SOLICITADA'
                                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {a.estado === 'CORRECCION_SOLICITADA' ? 'CORRECCIÓN' : a.estado}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleVerYCalificar(a)}
                              className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                              title="Ver respuesta y calificar"
                            >
                              <KeenIcon icon="eye" className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ModalBody>
        </ModalContent>
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
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setModalCalificarGrupoOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setModalCalificarMasivaOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
