import React, { useState, useEffect, useCallback } from 'react';
import { KeenIcon } from '@/components';
import { Modal } from '@/components/modal';
import axios from 'axios';
import ModalCrearGrupo, { type Grupo } from './ModalCrearGrupo';

interface VerGruposViewProps {
  idFicha: string;
  fechaFinalClases?: string;
}

const VerGruposView: React.FC<VerGruposViewProps> = ({ idFicha, fechaFinalClases }) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [grupoEditar, setGrupoEditar] = useState<Grupo | null>(null);
  const [grupoVer, setGrupoVer] = useState<Grupo | null>(null);
  const [modalVerOpen, setModalVerOpen] = useState(false);

  const fetchGrupos = useCallback(async () => {
    if (!idFicha) return;
    setLoading(true);
    try {
      const res = await axios.get(`fichas/${idFicha}/grupos`);
      const data = res.data?.data ?? res.data;
      setGrupos(Array.isArray(data) ? data : []);
    } catch {
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha]);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditar = (g: Grupo) => {
    setGrupoEditar(g);
    setModalCrearOpen(true);
  };

  const handleEliminar = async (g: Grupo) => {
    if (!g.id || !window.confirm('¿Eliminar este grupo?')) return;
    try {
      await axios.delete(`fichas/${idFicha}/grupos/${g.id}`);
      fetchGrupos();
      if (grupoVer?.id === g.id) {
        setGrupoVer(null);
        setModalVerOpen(false);
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {fechaFinalClases && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los grupos activos hasta: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(fechaFinalClases)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setGrupoEditar(null);
            setModalCrearOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
        >
          <KeenIcon icon="plus" className="text-sm" />
          Crear grupo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="text-center py-12">
          <KeenIcon icon="users" className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No hay grupos</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Crea un grupo para organizar a los estudiantes
          </p>
          <button
            onClick={() => setModalCrearOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium mx-auto"
          >
            <KeenIcon icon="plus" className="text-sm" />
            Crear grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="bg-gray-50 dark:bg-coal-300 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white break-words mb-2">
                {grupo.nombreGrupo}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Máx. {grupo.cantidadParticipantes ?? grupo.cantidadEstudiantes ?? 0} participante{(grupo.cantidadParticipantes ?? grupo.cantidadEstudiantes ?? 0) !== 1 ? 's' : ''}
              </p>
              {grupo.descripcion && (
                <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-3">
                  {grupo.descripcion}
                </p>
              )}
              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    setGrupoVer(grupo);
                    setModalVerOpen(true);
                  }}
                  className="p-1.5 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300"
                  title="Ver"
                >
                  <KeenIcon icon="eye" className="text-sm" />
                </button>
                <button
                  onClick={() => handleEditar(grupo)}
                  className="p-1.5 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300"
                  title="Actualizar"
                >
                  <KeenIcon icon="pencil" className="text-sm" />
                </button>
                <button
                  onClick={() => handleEliminar(grupo)}
                  className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                  title="Eliminar"
                >
                  <KeenIcon icon="trash" className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalCrearGrupo
        open={modalCrearOpen}
        onClose={() => {
          setModalCrearOpen(false);
          setGrupoEditar(null);
        }}
        onSave={fetchGrupos}
        idFicha={Number(idFicha)}
        grupoEditar={grupoEditar}
      />

      {grupoVer && (
        <Modal open={modalVerOpen} onClose={() => { setModalVerOpen(false); setGrupoVer(null); }}>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setModalVerOpen(false); setGrupoVer(null); }} />
            <div className="relative bg-white dark:bg-coal-300 rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{grupoVer.nombreGrupo}</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500 dark:text-gray-400">Cantidad de participantes:</span> {grupoVer.cantidadParticipantes ?? grupoVer.cantidadEstudiantes}</p>
                {grupoVer.descripcion && (
                  <p><span className="text-gray-500 dark:text-gray-400">Descripción:</span> {grupoVer.descripcion}</p>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setModalVerOpen(false)}
                  className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setModalVerOpen(false);
                    handleEditar(grupoVer);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                >
                  <KeenIcon icon="pencil" className="text-sm" />
                  Actualizar
                </button>
                <button
                  onClick={() => {
                    setModalVerOpen(false);
                    handleEliminar(grupoVer);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
                >
                  <KeenIcon icon="trash" className="text-sm" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VerGruposView;
