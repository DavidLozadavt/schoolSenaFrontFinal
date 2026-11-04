import React, { useMemo } from 'react';
import axios from 'axios';
import ModalActividadFechaMotivo from './ModalActividadFechaMotivo';
import type { AprendizCalificacion } from './ModalAprendices';

function sqlOrIsoToDatetimeLocal(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ModalAmpliarPlazoAprendizProps {
  open: boolean;
  onClose: () => void;
  aprendiz: AprendizCalificacion | null;
  onSaved?: () => void;
  onSuccess?: (message: string) => void;
}

const ModalAmpliarPlazoAprendiz: React.FC<ModalAmpliarPlazoAprendizProps> = ({
  open,
  onClose,
  aprendiz,
  onSaved,
  onSuccess
}) => {
  const initialFecha = useMemo(() => sqlOrIsoToDatetimeLocal(aprendiz?.fechaFinal ?? null), [aprendiz?.fechaFinal]);

  return (
    <ModalActividadFechaMotivo
      open={open && !!aprendiz}
      onClose={onClose}
      zIndex={130}
      title="Ampliar plazo del aprendiz"
      fechaLabel="Nueva fecha límite"
      descripcionLabel="Descripción de la extensión (opcional)"
      descripcionPlaceholder="Indique el motivo de la ampliación..."
      initialFecha={initialFecha}
      submitButtonText="+ ACEPTAR"
      savingButtonText="Guardando..."
      onSubmit={async (fechaLimite: string, descripcionExtension: string) => {
        if (!aprendiz) throw new Error('No hay datos del aprendiz');
        try {
          await axios.post('calificacion-actividad/ampliar-plazo-individual', {
            idCalificacionActividad: aprendiz.idCalificacionActividad,
            fechaLimite,
            descripcionExtension: descripcionExtension.trim() || undefined
          });
        } catch (e: unknown) {
          const ax = e as { response?: { data?: { error?: string; errors?: Record<string, string[]> } } };
          const d = ax.response?.data;
          const fallback = 'No se pudo ampliar el plazo individual';
          throw new Error(typeof d?.error === 'string' ? d.error : fallback);
        }
        onSuccess?.('Plazo individual actualizado correctamente.');
        onSaved?.();
        onClose();
      }}
    />
  );
};

export default ModalAmpliarPlazoAprendiz;
