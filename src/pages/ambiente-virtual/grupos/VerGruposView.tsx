import React, { useState, useEffect, useCallback } from 'react';
import { KeenIcon, ImageZoomModal } from '@/components';
import { Modal } from '@/components/modal';
import axios from 'axios';
import ModalCrearGrupo, { type Grupo } from './ModalCrearGrupo';

const AVATAR_DEFAULT = '/media/brand-logos/user.svg';

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

interface Integrante {
  idMatricula: number;
  rutaFoto: string | null;
  identificacion: string;
  nombreCompleto: string;
}

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
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);

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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium mx-auto transition-colors shadow-sm"
          >
            <KeenIcon icon="plus" className="text-sm" />
            Crear grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((grupo, idx) => {
            const barColors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
            const barColor = barColors[idx % barColors.length];
            return (
              <div
                key={grupo.id}
                className="group relative flex overflow-hidden bg-white dark:bg-coal-400 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 shrink-0 ${barColor}`} />
                <div className="flex-1 min-w-0 pl-4 pr-4 py-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white break-words mb-1">
                    {grupo.nombreGrupo}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Máx. {grupo.cantidadParticipantes ?? grupo.cantidadEstudiantes ?? 0} participante{(grupo.cantidadParticipantes ?? grupo.cantidadEstudiantes ?? 0) !== 1 ? 's' : ''}
                  </p>
                  {grupo.descripcion && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-4">
                      {grupo.descripcion}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        setGrupoVer(grupo);
                        setModalVerOpen(true);
                        setLoadingIntegrantes(true);
                        setIntegrantes([]);
                        if (grupo.id) {
                          axios.get(`fichas/${idFicha}/grupos/${grupo.id}/integrantes`)
                            .then((r) => setIntegrantes(r.data?.data ?? []))
                            .catch(() => setIntegrantes([]))
                            .finally(() => setLoadingIntegrantes(false));
                        } else {
                          setLoadingIntegrantes(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-coal-500 hover:bg-gray-200 dark:hover:bg-coal-600 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      Ver integrantes
                    </button>
                    <button
                      onClick={() => handleEditar(grupo)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(grupo)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
            <div className="relative bg-white dark:bg-coal-400 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <KeenIcon icon="users" className="text-blue-600 dark:text-blue-400 text-lg" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{grupoVer.nombreGrupo}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setModalVerOpen(false); setGrupoVer(null); }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-500 text-gray-500 dark:text-gray-400 transition-colors"
                  aria-label="Cerrar"
                >
                  <KeenIcon icon="cross" className="text-lg" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {integrantes.length} participante{integrantes.length !== 1 ? 's' : ''}
                  </span>
                  {grupoVer.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{grupoVer.descripcion}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Integrantes</p>
                  {loadingIntegrantes ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : integrantes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No hay integrantes</p>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {integrantes.map((i) => (
                        <div key={i.idMatricula} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-coal-500/30 hover:bg-gray-100 dark:hover:bg-coal-500/50 transition-colors">
                          <button
                            type="button"
                            onClick={() => setZoomFoto({ src: getFotoUrl(i.rutaFoto ?? undefined), alt: i.nombreCompleto })}
                            className="relative shrink-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            <img src={getFotoUrl(i.rutaFoto ?? undefined)} alt={i.nombreCompleto} className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-coal-400 rounded-full" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{i.nombreCompleto}</p>
                            {i.identificacion && <p className="text-xs text-gray-500 dark:text-gray-400">{i.identificacion}</p>}
                            <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">● activo</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!grupoVer?.id || !window.confirm(`¿Eliminar a ${i.nombreCompleto} del grupo?`)) return;
                              try {
                                await axios.delete(`fichas/${idFicha}/grupos/${grupoVer.id}/integrantes/${i.idMatricula}`);
                                const r = await axios.get(`fichas/${idFicha}/grupos/${grupoVer.id}/integrantes`);
                                setIntegrantes(r.data?.data ?? []);
                              } catch (e: any) {
                                alert(e.response?.data?.error || 'Error al eliminar integrante');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            title="Eliminar del grupo"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-coal-500/20">
                <button
                  onClick={() => setModalVerOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-coal-500 hover:bg-gray-300 dark:hover:bg-coal-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setModalVerOpen(false);
                    handleEditar(grupoVer);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <KeenIcon icon="pencil" className="text-sm" />
                  Actualizar
                </button>
                <button
                  onClick={() => {
                    setModalVerOpen(false);
                    handleEliminar(grupoVer);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <KeenIcon icon="trash" className="text-sm" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default VerGruposView;
