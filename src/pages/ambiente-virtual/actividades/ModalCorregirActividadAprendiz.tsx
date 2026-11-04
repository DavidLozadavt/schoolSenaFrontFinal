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

interface ModalCorregirActividadAprendizProps {
  open: boolean;
  onClose: () => void;
  aprendiz: AprendizCalificacion | null;
  /** Tras solicitud exitosa (refresco de lista) */
  onSaved?: () => void;
  onSuccess?: (message: string) => void;
}

const ModalCorregirActividadAprendiz: React.FC<ModalCorregirActividadAprendizProps> = ({
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
      title="Corregir actividad"
      fechaLabel="Nueva fecha límite"
      descripcionLabel="Motivo de corrección (opcional)"
      descripcionPlaceholder="Indique qué debe corregir el aprendiz..."
      initialFecha={initialFecha}
      submitButtonText="CONFIRMAR CORRECCIÓN"
      savingButtonText="Guardando..."
      onSubmit={async (fechaLimite: string, comentario: string) => {
        if (!aprendiz) throw new Error('No hay datos del aprendiz');
        const texto = comentario.trim();
        try {
          await axios.post('calificacion-actividad/solicitar-correccion', {
            idCalificacionActividad: aprendiz.idCalificacionActividad,
            comentario: texto === '' ? null : texto,
            fechaLimite
          });
        } catch (e: unknown) {
          const ax = e as { response?: { data?: { error?: string; message?: string; errors?: Record<string, string[]> } } };
          const d = ax.response?.data;
          const fallback = 'No se pudo enviar la solicitud de corrección';
          throw new Error(typeof d?.error === 'string' ? d.error : typeof d?.message === 'string' ? d.message : fallback);
        }
        onSuccess?.('Actividad enviada a corrección correctamente.');
        onSaved?.();
        onClose();
      }}
    />
  );
};

export default ModalCorregirActividadAprendiz;
