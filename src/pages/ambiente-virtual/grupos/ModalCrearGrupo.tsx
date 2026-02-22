import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

export interface Grupo {
  id?: number;
  nombreGrupo: string;
  cantidadParticipantes: number;
  descripcion?: string;
  idTipoGrupo?: number;
  tipoGrupo?: { id: number; nombreTipoGrupo: string };
}

interface TipoGrupoOption {
  id: number;
  nombreTipoGrupo: string;
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
  const [idTipoGrupo, setIdTipoGrupo] = useState<number>(0);
  const [tiposGrupo, setTiposGrupo] = useState<TipoGrupoOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!grupoEditar?.id;

  useEffect(() => {
    if (open && idFicha) {
      axios.get(`fichas/${idFicha}/grupos/datos-crear`).then((res) => {
        const tipos = res.data?.tiposGrupo ?? [];
        setTiposGrupo(Array.isArray(tipos) ? tipos : []);
        if (tipos.length > 0 && !idTipoGrupo) {
          setIdTipoGrupo(tipos[0].id);
        }
      }).catch(() => setTiposGrupo([]));
    }
  }, [open, idFicha]);

  useEffect(() => {
    if (open) {
      if (grupoEditar?.id) {
        setNombreGrupo(grupoEditar.nombreGrupo || '');
        setCantidadParticipantes(String(grupoEditar.cantidadParticipantes ?? ''));
        setDescripcion(grupoEditar.descripcion || '');
        if (grupoEditar.idTipoGrupo) setIdTipoGrupo(grupoEditar.idTipoGrupo);
      } else {
        setNombreGrupo('');
        setCantidadParticipantes('');
        setDescripcion('');
      }
      setError('');
    }
  }, [open, grupoEditar]);

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
    if (!idTipoGrupo && tiposGrupo.length > 0) {
      setError('Selecciona un tipo de grupo');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && grupoEditar?.id) {
        await axios.put(`fichas/${idFicha}/grupos/${grupoEditar.id}`, {
          nombreGrupo: nombreGrupo.trim(),
          cantidadParticipantes: cantidad,
          descripcion: descripcion.trim() || '',
          idTipoGrupo: idTipoGrupo || tiposGrupo[0]?.id
        });
      } else {
        await axios.post(`fichas/${idFicha}/grupos`, {
          nombreGrupo: nombreGrupo.trim(),
          cantidadParticipantes: cantidad,
          descripcion: descripcion.trim() || '',
          idTipoGrupo: idTipoGrupo || tiposGrupo[0]?.id
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

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>{isEdit ? 'Actualizar grupo' : 'Crear grupo'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del grupo
              </label>
              <input
                type="text"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                className="input w-full text-sm"
                placeholder="Ej: Grupo 1"
              />
            </div>
            {tiposGrupo.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de grupo
                </label>
                <select
                  value={idTipoGrupo}
                  onChange={(e) => setIdTipoGrupo(Number(e.target.value))}
                  className="input w-full text-sm"
                >
                  {tiposGrupo.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombreTipoGrupo}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad de participantes
              </label>
              <input
                type="number"
                min={1}
                value={cantidadParticipantes}
                onChange={(e) => setCantidadParticipantes(e.target.value)}
                placeholder="Digite el número"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="input w-full text-sm min-h-[80px]"
                placeholder="Descripción opcional del grupo"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <KeenIcon icon="check" className="text-sm" />
                    {isEdit ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalCrearGrupo;
