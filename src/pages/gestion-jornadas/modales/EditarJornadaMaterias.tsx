import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface EditarJornadaMateriasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jornada: {
    grupoJornada: number;
    nombreJornada: string;
    descripcion: string;
    dias: string[];
    horaInicial: string;
    horaFinal: string;
  } | null;
}

const EditarJornadaMaterias: React.FC<EditarJornadaMateriasProps> = ({
  open,
  onClose,
  onSuccess,
  jornada
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const [nombreJornada, setNombreJornada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [horaInicial, setHoraInicial] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicializar formulario al abrir modal
  useEffect(() => {
    if (jornada) {
      setNombreJornada(jornada.nombreJornada);
      setDescripcion(jornada.descripcion);
      setDias(jornada.dias);
      setHoraInicial(jornada.horaInicial); // 🔹 Mantener crudo
      setHoraFinal(jornada.horaFinal); // 🔹 Mantener crudo
    }
  }, [jornada]);

  const toggleDia = (dia: string) => {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const handleSubmit = async () => {
    if (!jornada) return;

    if (!nombreJornada.trim()) {
      enqueueSnackbar('Ingresa el nombre de la jornada', { variant: 'warning' });
      return;
    }

    if (dias.length === 0) {
      enqueueSnackbar('Selecciona al menos un día', { variant: 'warning' });
      return;
    }

    if (!horaInicial || !horaFinal) {
      enqueueSnackbar('Completa el horario de la jornada', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        grupoJornada: jornada.grupoJornada,
        nombreJornada,
        descripcion,
        dias,
        horaInicial: horaInicial.slice(0, 5), // Asegura "HH:mm"
        horaFinal: horaFinal.slice(0, 5) // Asegura "HH:mm"
      };

      const res = await axios.put('jornadas/actualizar', payload);

      // Detectar cambios en días
      const diasOriginales = jornada.dias;
      const diasAgregados = dias.filter((d) => !diasOriginales.includes(d));
      const diasEliminados = diasOriginales.filter((d) => !dias.includes(d));

      if (diasAgregados.length > 0) {
        enqueueSnackbar(`Se agregaron días: ${diasAgregados.join(', ')}`, { variant: 'info' });
      }
      if (diasEliminados.length > 0) {
        enqueueSnackbar(`Se eliminaron días: ${diasEliminados.join(', ')}`, { variant: 'warning' });
      }

      enqueueSnackbar(res.data?.message ?? 'Jornada actualizada correctamente', {
        variant: 'success'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error?.response?.data?.message ?? 'Error al actualizar la jornada', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[650px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Editar Jornada de Materias</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {/* NOMBRE */}
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre de la jornada</label>
            <input
              type="text"
              value={nombreJornada}
              onChange={(e) => setNombreJornada(e.target.value)}
              className="input w-full p-2 border rounded-md"
              placeholder="Ej: Jornada Mañana"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block mb-1 text-sm font-medium">Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="input w-full p-2 border rounded-md resize-none"
            />
          </div>

          {/* DÍAS */}
          <div>
            <label className="block mb-2 text-sm font-medium">Días de la jornada</label>
            <div className="grid grid-cols-3 gap-2">
              {diasSemana.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-2 rounded-md border text-sm transition ${
                    dias.includes(dia)
                      ? 'bg-primary-light text-primary border-primary'
                      : 'bg-gray-100 dark:bg-zinc-900 border-gray-300'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          {/* HORAS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Hora inicio</label>
              <input
                type="time"
                value={horaInicial}
                onChange={(e) => setHoraInicial(e.target.value)}
                className="input w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Hora fin</label>
              <input
                type="time"
                value={horaFinal}
                onChange={(e) => setHoraFinal(e.target.value)}
                className="input w-full p-2 border rounded-md"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button className="btn btn-sm btn-primary" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Actualizando...' : 'Actualizar jornada'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditarJornadaMaterias;
