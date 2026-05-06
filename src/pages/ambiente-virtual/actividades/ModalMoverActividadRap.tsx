import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

export interface RapOpcion {
  id: number;
  nombreMateria?: string;
  codigo?: string | null;
}

interface ModalMoverActividadRapProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
  idFicha: number;
  /** id de `horarioMateria` de la clase (ruta), para alinear planeación con el backend. */
  idHorarioMateria?: number;
  onSave: () => void;
  onSuccess?: (message: string) => void;
}

const ModalMoverActividadRap: React.FC<ModalMoverActividadRapProps> = ({
  open,
  onClose,
  actividad,
  idFicha,
  idHorarioMateria,
  onSave,
  onSuccess
}) => {
  const [opcionesRap, setOpcionesRap] = useState<RapOpcion[]>([]);
  const [idDestino, setIdDestino] = useState<number>(0);
  const [loadingRaps, setLoadingRaps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nombreRapActual =
    actividad?.materia?.nombreMateria?.trim() ||
    (actividad?.idMateria ? `RAP ID ${actividad.idMateria}` : '—');

  useEffect(() => {
    if (!open || idFicha <= 0) return;
    setError('');
    setIdDestino(0);
    setLoadingRaps(true);
    // Solo RAPs con horarios de esta ficha (misma API que valida el backend).
    axios
      .get<RapOpcion[]>(`fichas/${idFicha}/raps-horario-actividades`)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setOpcionesRap(raw.filter((r) => r && typeof r.id === 'number'));
      })
      .catch(() => {
        setOpcionesRap([]);
        setError('No se pudieron cargar los RAP de la ficha.');
      })
      .finally(() => setLoadingRaps(false));
  }, [open, idFicha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!actividad?.id || idFicha <= 0) {
      setError('Faltan datos de actividad o ficha.');
      return;
    }
    if (!idDestino || idDestino === actividad.idMateria) {
      setError('Selecciona un RAP destino distinto al actual.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, number> = {
        idFicha,
        idRapDestino: idDestino
      };
      if (idHorarioMateria && idHorarioMateria > 0) {
        payload.id_horario_materia = idHorarioMateria;
      }
      await axios.put(`actividades/${actividad.id}/mover-rap`, payload);
      onSuccess?.('Actividad movida correctamente al RAP seleccionado.');
      onSave();
      onClose();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { error?: string; message?: string; errors?: Record<string, string[]> } } };
      const errs = ex.response?.data?.errors;
      const firstField =
        errs && typeof errs === 'object'
          ? Object.values(errs).find((v) => Array.isArray(v) && v.length)?.[0]
          : undefined;
      const msg =
        ex.response?.data?.error ||
        ex.response?.data?.message ||
        firstField ||
        ex.response?.data?.errors?.idRapDestino?.[0] ||
        'No se pudo mover la actividad. Verifica el RAP seleccionado.';
      setError(typeof msg === 'string' ? msg : 'No se pudo mover la actividad. Verifica el RAP seleccionado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={120}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Mover actividad</ModalTitle>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear text-red-600 hover:text-red-700"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actividad</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{actividad?.tituloActividad || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">RAP actual</p>
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{nombreRapActual}</p>
            </div>
            <div>
              <label htmlFor="rap-destino" className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                RAP destino
              </label>
              <select
                id="rap-destino"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-coal-500 dark:text-white"
                value={idDestino || ''}
                onChange={(ev) => setIdDestino(Number(ev.target.value) || 0)}
                disabled={loadingRaps || saving}
              >
                <option value="">{loadingRaps ? 'Cargando…' : 'Seleccione un RAP'}</option>
                {opcionesRap.map((r) => {
                  const label = [r.codigo, r.nombreMateria].filter(Boolean).join(' — ') || `RAP ${r.id}`;
                  const disabled = actividad?.idMateria != null && r.id === actividad.idMateria;
                  return (
                    <option key={r.id} value={r.id} disabled={disabled}>
                      {label}
                      {disabled ? ' (actual)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !idDestino}>
                {saving ? 'Moviendo…' : 'Mover actividad'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalMoverActividadRap;
