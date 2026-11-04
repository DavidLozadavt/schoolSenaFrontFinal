import React from 'react';
import axios from 'axios';
import ModalActividadFechaMotivo from './ModalActividadFechaMotivo';
import type { Actividad } from './ModalCrearActividad';

interface ModalAmpliarActividadProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
  idFicha: number;
  onSave: () => void;
  onSuccess?: (message: string) => void;
}

const ModalAmpliarActividad: React.FC<ModalAmpliarActividadProps> = ({ open, onClose, actividad, idFicha, onSave, onSuccess }) => {
  return (
    <ModalActividadFechaMotivo
      open={open}
      onClose={onClose}
      zIndex={120}
      title="Ampliar actividad"
      fechaLabel="Nueva fecha"
      descripcionLabel="Descripción de la extensión"
      descripcionPlaceholder="Indique el motivo de la extensión..."
      submitButtonText="+ ACEPTAR"
      savingButtonText="Guardando..."
      onSubmit={async (nuevaFecha, descripcionExtension) => {
        if (!actividad?.id || !idFicha) throw new Error('Faltan datos de actividad o ficha');
        try {
          await axios.post('calificacion-actividad/ampliar', {
            idActividad: actividad.id,
            idFicha,
            fechaFinal: nuevaFecha,
            descripcionExtension: descripcionExtension.trim() || undefined
          });
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { error?: string; errors?: Record<string, string[]> } } };
          const msg =
            ax.response?.data?.error ||
            ax.response?.data?.errors?.fechaFinal?.[0] ||
            'Error al ampliar la actividad';
          throw new Error(typeof msg === 'string' ? msg : 'Error al ampliar la actividad');
        }
        onSuccess?.('Actividad ampliada correctamente');
        onSave();
        onClose();
      }}
    />
  );
};

export default ModalAmpliarActividad;
