import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

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

export interface Grupo {
  id?: number;
  nombreGrupo: string;
  cantidadParticipantes: number;
  /** Algunas APIs devuelven cantidadEstudiantes como alternativa */
  cantidadEstudiantes?: number;
  descripcion?: string;
  idTipoGrupo?: number;
  tipoGrupo?: { id: number; nombreTipoGrupo: string };
}

interface Integrante {
  idMatricula: number;
  rutaFoto: string | null;
  identificacion: string;
  nombreCompleto: string;
}

interface ModalCrearGrupoProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  idFicha: number;
  grupoEditar?: Grupo | null;
}

const ModalCrearGrupo: React.FC<ModalCrearGrupoProps> = ({
  open,
  onClose,
  onSave,
  idFicha,
  grupoEditar
}) => {
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [cantidadParticipantes, setCantidadParticipantes] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);

  const isEdit = !!grupoEditar?.id;

  useEffect(() => {
    if (open) {
      if (grupoEditar?.id) {
        setNombreGrupo(grupoEditar.nombreGrupo || '');
        setCantidadParticipantes(String(grupoEditar.cantidadParticipantes ?? ''));
        setDescripcion(grupoEditar.descripcion || '');
        setLoadingIntegrantes(true);
        setIntegrantes([]);
        axios.get(`fichas/${idFicha}/grupos/${grupoEditar.id}/integrantes`)
          .then((r) => setIntegrantes(r.data?.data ?? []))
          .catch(() => setIntegrantes([]))
          .finally(() => setLoadingIntegrantes(false));
      } else {
        setNombreGrupo('');
        setCantidadParticipantes('');
        setDescripcion('');
        setIntegrantes([]);
      }
      setError('');
    }
  }, [open, grupoEditar, idFicha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombreGrupo.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }
    const cantidad = parseInt(String(cantidadParticipantes).trim(), 10);
    if (isNaN(cantidad) || cantidad < 1) {
      setError('La cantidad de participantes debe ser un número mayor a 0');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && grupoEditar?.id) {
        await axios.put(`fichas/${idFicha}/grupos/${grupoEditar.id}`, {
          nombreGrupo: nombreGrupo.trim(),
          cantidadParticipantes: cantidad,
          descripcion: descripcion.trim() || ''
        });
      } else {
        await axios.post(`fichas/${idFicha}/grupos`, {
          nombreGrupo: nombreGrupo.trim(),
          cantidadParticipantes: cantidad,
          descripcion: descripcion.trim() || ''
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.error
        || data?.message
        || (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(' ') : null)
        || err.message
        || 'Error al guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarGrupo = async () => {
    if (!grupoEditar?.id || !window.confirm('¿Eliminar este grupo?')) return;
    try {
      await axios.delete(`fichas/${idFicha}/grupos/${grupoEditar.id}`);
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleEliminarIntegrante = async (i: Integrante) => {
    if (!grupoEditar?.id || !window.confirm(`¿Eliminar a ${i.nombreCompleto} del grupo?`)) return;
    try {
      await axios.delete(`fichas/${idFicha}/grupos/${grupoEditar.id}/integrantes/${i.idMatricula}`);
      const r = await axios.get(`fichas/${idFicha}/grupos/${grupoEditar.id}/integrantes`);
      setIntegrantes(r.data?.data ?? []);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al eliminar integrante');
    }
  };

  const titulo = isEdit ? (grupoEditar?.nombreGrupo ?? 'Actualizar grupo') : 'Crear grupo';

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-lg rounded-2xl shadow-xl overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <KeenIcon icon="users" className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-500 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
        </div>

        <ModalBody className="px-6 py-4 space-y-4">
          {isEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {integrantes.length} participante{integrantes.length !== 1 ? 's' : ''}
              </span>
              {descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{descripcion}</p>
              )}
            </div>
          )}

          {isEdit && integrantes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Integrantes</p>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {integrantes.map((i) => (
                  <div key={i.idMatricula} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-coal-500/30 hover:bg-gray-100 dark:hover:bg-coal-500/50 transition-colors">
                    <div className="relative shrink-0 rounded-full">
                      <img src={getFotoUrl(i.rutaFoto ?? undefined)} alt={i.nombreCompleto} className="w-10 h-10 rounded-full object-cover" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-coal-400 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{i.nombreCompleto}</p>
                      {i.identificacion && <p className="text-xs text-gray-500 dark:text-gray-400">{i.identificacion}</p>}
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">● activo</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarIntegrante(i)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                      title="Eliminar del grupo"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEdit && loadingIntegrantes && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          <form id="modal-crear-grupo-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre del grupo
              </label>
              <input
                type="text"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: Grupo 1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cantidad de participantes
              </label>
              <input
                type="number"
                min={1}
                value={cantidadParticipantes}
                onChange={(e) => setCantidadParticipantes(e.target.value)}
                placeholder="Digite el número"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px]"
                placeholder="Descripción opcional del grupo"
                rows={3}
              />
            </div>
          </form>
        </ModalBody>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-coal-500/20">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-coal-500 hover:bg-gray-300 dark:hover:bg-coal-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="submit"
            form="modal-crear-grupo-form"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Guardando...
              </>
            ) : (
              <>
                <KeenIcon icon="check" className="text-sm" />
                {isEdit ? 'Actualizar' : 'Crear'}
              </>
            )}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleEliminarGrupo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <KeenIcon icon="trash" className="text-sm" />
              Eliminar
            </button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ModalCrearGrupo;
