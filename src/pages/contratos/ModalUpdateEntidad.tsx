import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  tipo: 'pension' | 'salud' | null;
  nombre: string;
  contrato: any;
  onSave: () => void;
}

const ModalUpdateEntidad = ({ open, onClose, tipo, nombre, contrato, onSave }: ModalProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [entidades, setEntidades] = useState<any[]>([]);
  const [selectedEntidad, setSelectedEntidad] = useState<number | ''>('');

  const fetchEntidades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('entidades_seguridad_social');
      const todas = response.data;

      let filtradas: any[] = [];
      if (tipo === 'pension') {
        filtradas = todas.filter((e: any) => e.tipo?.toUpperCase() === 'PENSION');
      } else if (tipo === 'salud') {
        filtradas = todas.filter(
          (e: any) => e.tipo?.toUpperCase() === 'EPS' || e.tipo?.toUpperCase() === 'SALUD'
        );
      } else {
        filtradas = todas;
      }

      setEntidades(filtradas);
    } catch (err) {
      setError(`Error al cargar las entidades: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    if (open) {
      fetchEntidades();
      setSelectedEntidad('');
    }
  }, [fetchEntidades, open]);

  const handleSave = async () => {
    if (!selectedEntidad || !contrato?.id || !tipo) return;

    try {
      setLoading(true);

      await axios.post(`actualizar_entidad/${contrato.id}`, {
        entidad_id: selectedEntidad,
        tipo: tipo.toUpperCase()
      });

      onSave();

      onClose();
    } catch (error) {
      console.error('Error al actualizar la entidad:', error);
      setError('No se pudo actualizar la entidad.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Actualizar entidad {tipo === 'pension' ? 'Pensión' : 'Salud'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="px-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Entidad actual:</label>
            <input
              type="text"
              value={nombre || 'N/A'}
              readOnly
              className="input cursor-not-allowed"
            />
          </div>

          <div className="px-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Seleccione la nueva entidad de <span>{tipo === 'pension' ? 'pensión' : 'salud'}</span>
              :
            </label>

            {loading ? (
              <p className="text-sm text-gray-500">Cargando entidades...</p>
            ) : entidades.length === 0 ? (
              <p className="text-sm text-gray-500">No hay entidades disponibles para este tipo.</p>
            ) : (
              <select
                className="w-full select"
                value={selectedEntidad}
                onChange={(e) => setSelectedEntidad(Number(e.target.value))}
              >
                <option value="">Seleccione una opción</option>
                {entidades.map((entidad) => (
                  <option key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 🔹 Botones */}
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={!selectedEntidad}
            >
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalUpdateEntidad };
