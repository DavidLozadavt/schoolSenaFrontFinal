import { useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface CrearJornadaMateriasProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CrearJornadaMaterias: React.FC<CrearJornadaMateriasProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const [nombreJornada, setNombreJornada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [horaInicial, setHoraInicial] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDia = (dia: string) => {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const limpiarFormulario = () => {
    setNombreJornada('');
    setDescripcion('');
    setDias([]);
    setHoraInicial('');
    setHoraFinal('');
  };

  const calcularHoras = () => {
    if (!horaInicial || !horaFinal) return null;

    const [hIni, mIni] = horaInicial.split(':').map(Number);
    const [hFin, mFin] = horaFinal.split(':').map(Number);

    let inicio = hIni * 60 + mIni;
    let fin = hFin * 60 + mFin;

    const cruzaMedianoche = fin <= inicio;
    if (cruzaMedianoche) {
      fin += 24 * 60;
    }

    const minutos = fin - inicio;
    const horasPorDia = minutos / 60;

    let tipoJornada = 'Mañana';
    let icono = 'sun';
    let color = 'text-yellow-600';

    if (cruzaMedianoche || hIni >= 18) {
      tipoJornada = 'Nocturna';
      icono = 'moon';
      color = 'text-indigo-500';
    } else if (hIni >= 12) {
      tipoJornada = 'Tarde';
      icono = 'sunset';
      color = 'text-orange-500';
    }

    return {
      horasPorDia: Number(horasPorDia.toFixed(2)),
      horasTotales: Number((horasPorDia * dias.length).toFixed(2)),
      tipoJornada,
      icono,
      color,
      cruzaMedianoche
    };
  };

  const resumenHoras = calcularHoras();

  const handleSubmit = async () => {
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
        nombreJornada,
        descripcion,
        dias,
        horaInicial,
        horaFinal
      };

      const res = await axios.post('jornadas/crear_jornada_materias', payload);

      enqueueSnackbar(res.data?.message ?? 'Jornada creada correctamente', {
        variant: 'success'
      });

      limpiarFormulario();
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message ?? 'Error al crear la jornada', {
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
          <ModalTitle>Crear Jornada de Materias</ModalTitle>
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

          {/* RESUMEN */}
          {resumenHoras && dias.length > 0 && (
            <div className="p-4 rounded-md border bg-gray-50 dark:bg-zinc-900 text-sm space-y-2">
              <div className={`flex items-center gap-2 font-semibold ${resumenHoras.color}`}>
                <KeenIcon icon={resumenHoras.icono} />
                Jornada {resumenHoras.tipoJornada}
              </div>

              <p className="flex items-center gap-2">
                <KeenIcon icon="time" />
                Horas por día: <strong>{resumenHoras.horasPorDia} h</strong>
              </p>

              <p className="flex items-center gap-2">
                <KeenIcon icon="calendar" />
                Total ({dias.length} días): <strong>{resumenHoras.horasTotales} h</strong>
              </p>

              {resumenHoras.cruzaMedianoche && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <KeenIcon icon="warning-2" />
                  La jornada cruza medianoche
                </p>
              )}
            </div>
          )}

          {/* BOTONES */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                limpiarFormulario();
                onClose();
              }}
            >
              Cancelar
            </button>

            <button className="btn btn-sm btn-primary" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Creando...' : 'Crear jornada'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CrearJornadaMaterias;
