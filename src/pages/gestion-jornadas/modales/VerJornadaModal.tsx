import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import React from 'react';
import clsx from 'clsx';

interface Jornada {
  grupoJornada: number;
  nombreJornada: string;
  descripcion: string;
  horaInicial: string;
  horaFinal: string;
  numeroHoras: number;
  tipoHorario: 'Mañana' | 'Tarde' | 'Nocturna';
  dias: string[];
  estado: string;
}

interface VerJornadaModalProps {
  jornada: Jornada | null;
  open: boolean;
  onClose: () => void;
}

const getImagen = (tipo: Jornada['tipoHorario']) => {
  switch (tipo) {
    case 'Mañana':
      return '/public/media/images/jornadas/dia.jpg';
    case 'Tarde':
      return '/public/media/images/jornadas/tarde.jpg';
    case 'Nocturna':
      return '/public/media/images/jornadas/noche.jpg';
    default:
      return '/public/media/images/jornadas/dia.jpg';
  }
};

const getColorTipo = (tipo: Jornada['tipoHorario']) => {
  switch (tipo) {
    case 'Mañana':
      return 'bg-yellow-500';
    case 'Tarde':
      return 'bg-orange-500';
    case 'Nocturna':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-400';
  }
};

const VerJornadaModal: React.FC<VerJornadaModalProps> = ({ jornada, open, onClose }) => {
  if (!jornada) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[650px] top-[10%] p-4">
        {/* Imagen superior */}
        <div className="relative h-48 w-full">
          <img
            src={getImagen(jornada.tipoHorario)}
            alt={jornada.nombreJornada}
            className="object-cover w-full h-full brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

          {/* Tipo de jornada */}
          <span
            className={clsx(
              'absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md',
              getColorTipo(jornada.tipoHorario)
            )}
          >
            {jornada.tipoHorario}
          </span>

          {/* Botón cerrar */}
          <button
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-white" />
          </button>
        </div>

        {/* Contenido */}
        <ModalBody className="p-6 space-y-3 text-gray-800 dark:text-neutral-300">
          <h3 className="font-bold text-lg">{jornada.nombreJornada.toUpperCase()}</h3>

          <div>
            <span className="font-semibold">Descripción:</span> {jornada.descripcion}
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <span className="font-semibold">Hora inicial:</span>{' '}
              {new Date(`1970-01-01T${jornada.horaInicial}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div>
              <span className="font-semibold">Hora final:</span>{' '}
              {new Date(`1970-01-01T${jornada.horaFinal}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div>
              <span className="font-semibold">Número de horas:</span> {jornada.numeroHoras}
            </div>
          </div>

          <div>
            <span className="font-semibold">Días:</span> {jornada.dias.join(', ')}
          </div>

          <div>
            <span className="font-semibold">Estado:</span> {jornada.estado}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VerJornadaModal;
