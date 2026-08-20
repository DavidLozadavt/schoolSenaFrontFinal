import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface ModalCalificarSesionProps {
  open: boolean;
  onClose: () => void;
  sesion: {
    idSesionMateria?: number;
    fecha: string;
    numeroSesion: number;
    materia_nombre: string;
    profesor_nombre: string;
  };
  onSuccess: (msg: string) => void;
}

const ModalCalificarSesion: React.FC<ModalCalificarSesionProps> = ({
  open,
  onClose,
  sesion,
  onSuccess,
}) => {
  const [estrellas, setEstrellas] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!sesion.idSesionMateria) {
      setErrorMsg('Error: Esta sesión no tiene un ID registrado y no se puede calificar.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await axios.post('calificacion-sesion', {
        idSesionMateria: sesion.idSesionMateria,
        estrellas,
        comentarios: comentario,
      });
      onSuccess('¡Clase calificada con éxito!');
      onClose();
    } catch (err: any) {
      console.error('Error al calificar la sesión:', err);
      const msg = err?.response?.data?.message || 'Error al guardar la calificación. Intenta nuevamente.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} closeOnBackdropClick={true}>
      <ModalContent className="max-w-md">
        <ModalHeader className="flex justify-between items-center w-full">
          <ModalTitle>Calificar Clase / Sesión</ModalTitle>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon btn-sm btn-light hover:text-primary transition-colors cursor-pointer border-0 bg-transparent focus:outline-none"
            title="Cerrar"
          >
            <KeenIcon icon="cross" className="text-xl" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="text-center mb-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-1">
              {sesion.materia_nombre}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sesión #{sesion.numeroSesion} - Instructor: {sesion.profesor_nombre}
            </p>

            <div className="flex justify-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEstrellas(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="transition-transform duration-100 active:scale-95 cursor-pointer focus:outline-none bg-transparent border-0"
                >
                  <KeenIcon
                    icon="star"
                    className={`text-3xl ${
                      star <= (hoverRating ?? estrellas)
                        ? 'text-yellow-400 font-bold fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(hoverRating ?? estrellas) === 5 ? '¡Excelente!' :
               (hoverRating ?? estrellas) === 4 ? 'Muy Buena' :
               (hoverRating ?? estrellas) === 3 ? 'Aceptable' :
               (hoverRating ?? estrellas) === 2 ? 'Regular' : 'Mala'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
              Comentarios sobre la clase
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué te pareció la explicación, las actividades, el trato?..."
              className="form-control w-full min-h-[100px] text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-300 focus:outline-none focus:border-yellow-400"
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary text-xs py-2 px-4 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary text-xs py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              disabled={submitting || !sesion.idSesionMateria}
            >
              {submitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalCalificarSesion;
