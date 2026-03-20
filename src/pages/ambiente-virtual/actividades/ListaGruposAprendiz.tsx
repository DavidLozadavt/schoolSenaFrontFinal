import React, { useState, useEffect } from 'react';
import { KeenIcon, ImageZoomModal } from '@/components';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

interface Integrante {
  idMatricula: number;
  rutaFoto: string | null;
  identificacion: string;
  nombreCompleto: string;
}

interface Grupo {
  id: number;
  nombreGrupo: string;
  descripcion?: string;
  cantidadParticipantes: number;
  integrantesActuales: number;
  estado: string;
  yaUnido: boolean;
  tipoGrupo?: { nombreTipoGrupo: string };
}

interface FichaGrupos {
  idFicha: number;
  idMatricula: number;
  codigoFicha?: string;
  grupos: Grupo[];
}

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

const ListaGruposAprendiz: React.FC = () => {
  const [fichas, setFichas] = useState<FichaGrupos[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniriendo, setUniriendo] = useState<number | null>(null);
  const [saliendo, setSaliendo] = useState<number | null>(null);
  const [modalIntegrantesOpen, setModalIntegrantesOpen] = useState(false);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<{ idFicha: number; grupo: Grupo } | null>(null);
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);

  const recargar = () => {
    axios.get('grupos-estudiante').then((r) => setFichas(r.data?.data || [])).catch(() => setFichas([]));
  };

  useEffect(() => {
    axios.get('grupos-estudiante').then((r) => setFichas(r.data?.data || [])).catch(() => setFichas([])).finally(() => setLoading(false));
  }, []);

  const handleUnirse = async (idFicha: number, idGrupo: number, idMatricula: number) => {
    setUniriendo(idGrupo);
    try {
      await axios.post(`fichas/${idFicha}/grupos/${idGrupo}/unirse`, { idMatricula });
      recargar();
    } catch (e: any) {
      alert(e.response?.data?.error || e.response?.data?.errors?.idMatricula?.[0] || 'Error al unirse');
    } finally {
      setUniriendo(null);
    }
  };

  const handleSalir = async (idFicha: number, idGrupo: number, idMatricula: number) => {
    if (!window.confirm('¿Salir de este grupo?')) return;
    setSaliendo(idGrupo);
    try {
      await axios.post(`fichas/${idFicha}/grupos/${idGrupo}/salir`, { idMatricula });
      recargar();
      if (grupoSeleccionado?.grupo.id === idGrupo) {
        setModalIntegrantesOpen(false);
        setGrupoSeleccionado(null);
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al salir');
    } finally {
      setSaliendo(null);
    }
  };

  const verIntegrantes = (idFicha: number, grupo: Grupo) => {
    setGrupoSeleccionado({ idFicha, grupo });
    setModalIntegrantesOpen(true);
    setLoadingIntegrantes(true);
    axios
      .get(`fichas/${idFicha}/grupos/${grupo.id}/integrantes`)
      .then((r) => setIntegrantes(r.data?.data ?? []))
      .catch(() => setIntegrantes([]))
      .finally(() => setLoadingIntegrantes(false));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  const totalGrupos = fichas.reduce((acc, f) => acc + f.grupos.length, 0);
  if (totalGrupos === 0) {
    return (
      <div className="text-center py-8">
        <KeenIcon icon="users" className="text-4xl text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">No hay grupos disponibles</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Los grupos de tus fichas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fichas.map((ficha) => (
        <div key={ficha.idFicha} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-coal-400">
          <div className="px-4 py-3 bg-gray-50 dark:bg-coal-500/50 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ficha {ficha.codigoFicha || ficha.idFicha}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {ficha.grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50/50 dark:bg-coal-500/30 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{grupo.nombreGrupo}</p>
                  {grupo.descripcion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{grupo.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {grupo.integrantesActuales}/{grupo.cantidadParticipantes} integrantes
                    </span>
                    {grupo.tipoGrupo && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {grupo.tipoGrupo.nombreTipoGrupo}
                      </span>
                    )}
                    {grupo.yaUnido && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Ya eres miembro
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => verIntegrantes(ficha.idFicha, grupo)}
                    className="p-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300"
                    title="Ver integrantes"
                  >
                    <KeenIcon icon="users" className="text-sm" />
                  </button>
                  {grupo.estado === 'ACTIVO' && grupo.yaUnido && (
                    <button
                      onClick={() => handleSalir(ficha.idFicha, grupo.id, ficha.idMatricula)}
                      disabled={saliendo === grupo.id}
                      className="btn btn-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      {saliendo === grupo.id ? 'Saliendo...' : 'Salir'}
                    </button>
                  )}
                  {grupo.estado === 'ACTIVO' && !grupo.yaUnido && grupo.integrantesActuales < grupo.cantidadParticipantes && (
                    <button
                      onClick={() => handleUnirse(ficha.idFicha, grupo.id, ficha.idMatricula)}
                      disabled={uniriendo === grupo.id}
                      className="btn btn-sm btn-primary"
                    >
                      {uniriendo === grupo.id ? 'Uniendo...' : 'Unirse'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={modalIntegrantesOpen} onClose={() => { setModalIntegrantesOpen(false); setGrupoSeleccionado(null); }} zIndex={110}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Integrantes {grupoSeleccionado?.grupo.nombreGrupo}</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={() => { setModalIntegrantesOpen(false); setGrupoSeleccionado(null); }}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody>
            {loadingIntegrantes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : integrantes.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No hay integrantes</p>
            ) : (
              <div className="space-y-2">
                {integrantes.map((i) => (
                  <div key={i.idMatricula} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-coal-500/30">
                    <button
                      type="button"
                      onClick={() => setZoomFoto({ src: getFotoUrl(i.rutaFoto ?? undefined), alt: i.nombreCompleto })}
                      className="shrink-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <img
                        src={getFotoUrl(i.rutaFoto ?? undefined)}
                        alt={i.nombreCompleto}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{i.nombreCompleto}</p>
                      {i.identificacion && <p className="text-xs text-gray-500 dark:text-gray-400">{i.identificacion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
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

export default ListaGruposAprendiz;
