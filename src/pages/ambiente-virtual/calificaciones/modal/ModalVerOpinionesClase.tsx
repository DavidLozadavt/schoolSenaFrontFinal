import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle, ModalFooter } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface Alumno {
  nombre: string;
  identificacion: string;
  email: string;
  rutaFotoUrl: string | null;
}

interface Calificacion {
  id: number;
  estrellas: number;
  comentarios: string | null;
  fechaCalificacion: string | null;
  alumno: Alumno | null;
}

interface ModalVerOpinionesClaseProps {
  open: boolean;
  onClose: () => void;
  idSesionMateria: number;
  numeroSesion: number;
  materiaNombre: string;
}

const ModalVerOpinionesClase: React.FC<ModalVerOpinionesClaseProps> = ({
  open,
  onClose,
  idSesionMateria,
  numeroSesion,
  materiaNombre,
}) => {
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && idSesionMateria) {
      fetchCalificaciones();
    }
  }, [open, idSesionMateria]);

  const fetchCalificaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`calificacion-sesion/sesion/${idSesionMateria}`);
      setCalificaciones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar calificaciones de sesión:', err);
      setError('No se pudieron cargar las calificaciones de la sesión.');
    } finally {
      setLoading(false);
    }
  };

  const averageStars = calificaciones.length > 0
    ? (calificaciones.reduce((acc, c) => acc + c.estrellas, 0) / calificaciones.length).toFixed(1)
    : null;

  return (
    <Modal open={open} onClose={onClose} closeOnBackdropClick={true}>
      <ModalContent className="max-w-2xl">
        <ModalHeader className="flex justify-between items-center w-full">
          <ModalTitle>Calificaciones y Opiniones de Alumnos</ModalTitle>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon btn-sm btn-light hover:text-primary transition-colors cursor-pointer border-0 bg-transparent focus:outline-none"
            title="Cerrar"
          >
            <KeenIcon icon="cross" className="text-xl" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6 max-h-[500px] overflow-y-auto">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-1">
              {materiaNombre}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Opiniones para la Sesión #{numeroSesion}
            </p>

            {calificaciones.length > 0 && (
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-coal-300 p-4 rounded-xl">
                <div className="text-center border-r border-gray-200 dark:border-gray-700 pr-6">
                  <span className="block text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">
                    {averageStars}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Promedio
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <KeenIcon
                        key={star}
                        icon="star"
                        className={`text-lg ${
                          star <= Math.round(Number(averageStars ?? 0))
                            ? 'text-yellow-400 font-bold fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Basado en {calificaciones.length} {calificaciones.length === 1 ? 'opinión' : 'opiniones'} de alumnos.
                  </span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="text-sm text-gray-500">Cargando opiniones...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-danger text-sm">{error}</div>
          ) : calificaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic">
              Ningún alumno ha calificado esta sesión de clase todavía.
            </div>
          ) : (
            <div className="space-y-4">
              {calificaciones.map((calif) => (
                <div
                  key={calif.id}
                  className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow bg-white dark:bg-coal-400"
                >
                  <div className="flex-shrink-0">
                    {calif.alumno?.rutaFotoUrl ? (
                      <img
                        src={calif.alumno.rutaFotoUrl}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                        {calif.alumno?.nombre?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase leading-tight truncate">
                          {calif.alumno?.nombre || 'Alumno Desconocido'}
                        </h5>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {calif.alumno?.identificacion || 'ID no asignado'}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <KeenIcon
                            key={star}
                            icon="star"
                            className={`text-sm ${
                              star <= calif.estrellas
                                ? 'text-yellow-400 font-bold fill-current'
                                : 'text-gray-200 dark:text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {calif.comentarios ? (
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-coal-300 p-3 rounded-lg border border-gray-100 dark:border-gray-800 break-words">
                        "{calif.comentarios}"
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Sin comentarios adicionales.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs py-2 px-4 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            Cerrar
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalVerOpinionesClase;
