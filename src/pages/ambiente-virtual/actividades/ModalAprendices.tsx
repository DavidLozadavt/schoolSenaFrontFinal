import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
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
  nombreAprendiz: string;
  identificacion: string;
  rutaFoto: string | null;
  calificacionNumerica: string | number | null;
  calificacionEstandart: string | null;
  ComentarioDocente: string | null;
  ComentarioEstudiante: string | null;
  archivo: string | null;
  fechaCalificacion: string | null;
  estado: 'PENDIENTE' | 'ENVIADO' | 'CALIFICADO';
}

interface ModalAprendicesProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
  idFicha: number;
  tituloActividad?: string;
}

const ModalAprendices: React.FC<ModalAprendicesProps> = ({
  open,
  onClose,
  actividad,
  idFicha,
  tituloActividad
}) => {
  const [aprendices, setAprendices] = useState<AprendizCalificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState<AprendizCalificacion | null>(null);
  const [modalCalificarOpen, setModalCalificarOpen] = useState(false);

  const idActividad = actividad?.id;

  useEffect(() => {
    if (!open || !idActividad || !idFicha) {
      setAprendices([]);
      return;
    }
    setLoading(true);
    axios
      .get(`actividades/${idActividad}/fichas/${idFicha}/aprendices`)
      .then((r) => setAprendices(r.data?.data ?? []))
      .catch(() => setAprendices([]))
      .finally(() => setLoading(false));
  }, [open, idActividad, idFicha]);

  const filtrados = React.useMemo(() => {
    if (filtroEstado === 'todos') return aprendices;
    return aprendices.filter((a) => a.estado === filtroEstado);
  }, [aprendices, filtroEstado]);

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
            <div className="flex items-center gap-2 mb-3">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="input text-sm py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="todos">TODOS LOS APRENDICES</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ENVIADO">Enviado</option>
                <option value="CALIFICADO">Calificado</option>
              </select>
              <KeenIcon icon="search" className="text-gray-400 text-sm" />
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
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-coal-500/50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Código</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Aprendiz</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Identificación</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Cal. Numérica</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Cal. Estándar</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((a) => (
                      <tr key={a.idCalificacionActividad} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-coal-400/30">
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{a.idCalificacionActividad}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={getFotoUrl(a.rutaFoto ?? undefined)}
                              alt={a.nombreAprendiz}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-gray-900 dark:text-white">{a.nombreAprendiz}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{a.identificacion || '-'}</td>
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
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {a.calificacionEstandart || 'Sin configuración de calificaciones'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.estado === 'CALIFICADO'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : a.estado === 'ENVIADO'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {a.estado}
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
        tipoActividad={actividad?.tipoActividad}
      />
    </>
  );
};

export default ModalAprendices;
