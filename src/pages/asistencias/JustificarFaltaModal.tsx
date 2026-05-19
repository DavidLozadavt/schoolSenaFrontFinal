import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

export interface RegistroParaJustificar {
  idAsistencia: number;
  fecha: string;
  nombreArea: string;
}

interface JustificarFaltaModalProps {
  open: boolean;
  registro: RegistroParaJustificar | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS_EXCUSA = [
  'FUERZA MAYOR',
  'PERMISO ESTUDIANTIL',
  'PERMISO LABORAL',
  'PERMISO MEDICO'
] as const;

const validFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const maxFileSize = 5 * 1024 * 1024;

const JustificarFaltaModal: React.FC<JustificarFaltaModalProps> = ({
  open,
  registro,
  onClose,
  onSuccess
}) => {
  const [tipoExcusa, setTipoExcusa] = useState<string>(TIPOS_EXCUSA[0]);
  const [observacion, setObservacion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTipoExcusa(TIPOS_EXCUSA[0]);
      setObservacion('');
      setArchivo(null);
      setError(null);
    }
  }, [open, registro?.idAsistencia]);

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return fecha.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setArchivo(null);
      return;
    }
    if (!validFileTypes.includes(file.type)) {
      setError('Solo se permiten archivos PDF, JPG, JPEG o PNG.');
      e.target.value = '';
      return;
    }
    if (file.size > maxFileSize) {
      setError('El archivo no debe superar los 5 MB.');
      e.target.value = '';
      return;
    }
    setError(null);
    setArchivo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registro?.idAsistencia) return;

    if (!observacion.trim()) {
      setError('Describe el motivo de la inasistencia.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idAsistencia', String(registro.idAsistencia));
      formData.append('tipoExcusa', tipoExcusa);
      formData.append('observacionExcusa', observacion.trim());
      if (archivo) {
        formData.append('archivoSoporte', archivo);
      }

      await axios.post('solicitar-justificacion-asistencia', formData, {
        headers: { Accept: 'application/json' }
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          'No se pudo enviar la justificación. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open || !registro) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[520px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Justificar inasistencia</ModalTitle>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
            disabled={loading}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody>
          <div className="mb-4 rounded-lg bg-gray-50 dark:bg-coal-300 px-3 py-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-white">Fecha:</span>{' '}
              {formatearFecha(registro.fecha)}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium text-gray-800 dark:text-white">Área:</span>{' '}
              {registro.nombreArea}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Tipo de excusa
              </label>
              <select
                value={tipoExcusa}
                onChange={(e) => setTipoExcusa(e.target.value)}
                className="select select-sm w-full"
                disabled={loading}
              >
                {TIPOS_EXCUSA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0) + tipo.slice(1).toLowerCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Observación <span className="text-red-500">*</span>
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Describe el motivo de tu inasistencia..."
                rows={4}
                className="textarea textarea-sm w-full resize-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Documento de soporte
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="file-input file-input-sm w-full"
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                PDF, JPG o PNG. Máximo 5 MB. Recomendado para permisos médicos o estudiantiles.
              </p>
              {archivo && (
                <p className="mt-1 text-xs text-green-600 font-medium truncate">✓ {archivo.name}</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Tu instructor recibirá una notificación para aprobar o denegar esta justificación.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-sm btn-light" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar justificación'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default JustificarFaltaModal;
