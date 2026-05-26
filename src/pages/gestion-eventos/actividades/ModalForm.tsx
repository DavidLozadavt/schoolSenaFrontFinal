import { useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface Item {
  id: number;
  nombreItem: string;
  descripcion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  seleccionar: boolean;
  idEvento?: number | null;
  created_at?: string;
}

interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemEditar?: Item | null;
  defaultIdEvento?: number | null;
}

interface EventSelectOption {
  idEvento: number;
  nombre: string;
}

const inputClasses =
  'w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-zinc-700/80 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-300 dark:placeholder:text-zinc-600';

const inputWithIconClasses =
  'w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-zinc-700/80 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-300 dark:placeholder:text-zinc-600';

const labelClasses =
  'flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1.5';

export const ModalForm: React.FC<ModalFormProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  itemEditar, 
  defaultIdEvento 
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const esEdicion = !!itemEditar;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [idEvento, setIdEvento] = useState<number | string>('');
  const [eventos, setEventos] = useState<EventSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      axios
        .get('/eventos-multimedia?per_page=100')
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setEventos(Array.isArray(list) ? list : []);
        })
        .catch((err) => console.error('Error al cargar eventos:', err));

      if (itemEditar) {
        setNombre(itemEditar.nombreItem);
        setDescripcion(itemEditar.descripcion ?? '');
        setHoraInicio(itemEditar.hora_inicio ? itemEditar.hora_inicio.slice(0, 16) : '');
        setHoraFin(itemEditar.hora_fin ? itemEditar.hora_fin.slice(0, 16) : '');
        setIdEvento(itemEditar.idEvento ?? '');
      } else {
        setNombre('');
        setDescripcion('');
        setHoraInicio('');
        setHoraFin('');
        setIdEvento(defaultIdEvento ?? '');
      }
    }
  }, [itemEditar, open, defaultIdEvento]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      enqueueSnackbar('El nombre es obligatorio', { variant: 'warning' });
      return;
    }
    if (horaFin && !horaInicio) {
      enqueueSnackbar('Debes seleccionar hora de inicio', { variant: 'warning' });
      return;
    }
    const inicio = horaInicio ? new Date(horaInicio) : null;
    const fin = horaFin ? new Date(horaFin) : null;
    if (inicio && fin && fin < inicio) {
      enqueueSnackbar('La hora de fin no puede ser menor que la de inicio', { variant: 'error' });
      return;
    }
    if (inicio && fin && (fin.getTime() - inicio.getTime()) / 60000 < 1) {
      enqueueSnackbar('La actividad debe durar mínimo 1 minuto', { variant: 'warning' });
      return;
    }

    const payload = {
      nombreItem: nombre.trim(),
      descripcion: descripcion || null,
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      idEvento: idEvento || null
    };

    try {
      setLoading(true);
      if (esEdicion) {
        const { data } = await axios.put(`/items/${itemEditar!.id}`, payload);
        enqueueSnackbar(data.message ?? 'Actualizado correctamente', { variant: 'success' });
      } else {
        const { data } = await axios.post('/items', payload);
        enqueueSnackbar(data.message ?? 'Creado correctamente', { variant: 'success' });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? 'Error al guardar', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[580px] top-[6%] p-0 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <ModalHeader className="px-7 py-5 border-b border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-950/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/25 transform -rotate-3">
              <KeenIcon icon={esEdicion ? 'notepad-edit' : 'calendar-add'} className="text-lg" />
            </div>
            <div>
              <ModalTitle className="!text-sm !font-black !uppercase !tracking-wide">
                {esEdicion ? 'Editar actividad' : 'Nueva actividad'}
              </ModalTitle>
              <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                {esEdicion ? 'Modifica los datos de la actividad' : 'Completa la información de la actividad'}
              </p>
            </div>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100/80 dark:bg-zinc-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-all duration-200 hover:rotate-90 shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-sm" />
          </button>
        </ModalHeader>

        <ModalBody className="px-6 py-5">
          <div className="flex flex-col gap-6">
            {/* Activity name */}
            <div>
              <label className={labelClasses}>
                Nombre de la actividad
                <span className="text-red-400 text-xs">*</span>
              </label>
              <div className="relative">
                <KeenIcon
                  icon="text-align-left"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Registro de asistentes, Almuerzo, Premiación..."
                  className={inputWithIconClasses}
                />
              </div>
            </div>

            {/* Event association */}
            <div>
              <label className={labelClasses}>
                <KeenIcon icon="calendar" className="text-xs" />
                Asociar a evento
              </label>
              <div className="relative">
                <KeenIcon
                  icon="calendar-tick"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                />
                <select
                  value={idEvento}
                  onChange={(e) => setIdEvento(e.target.value)}
                  className={`${inputWithIconClasses} appearance-none cursor-pointer pr-8`}
                >
                  <option value="">-- Sin evento (Global) --</option>
                  {eventos.map((e) => (
                    <option key={e.idEvento} value={e.idEvento}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
                <KeenIcon
                  icon="down"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClasses}>
                <KeenIcon icon="message-text-2" className="text-xs" />
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe brevemente la actividad…"
                rows={3}
                className={`${inputClasses} resize-none`}
              />
            </div>

            {/* Time section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm transform -rotate-2">
                  <KeenIcon icon="time" className="text-sm" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                  Programación
                </h4>
                <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-9">
                <div>
                  <label className={labelClasses}>
                    Fecha y hora de inicio
                  </label>
                  <div className="relative">
                    <KeenIcon
                      icon="time"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                    />
                    <input
                      type="datetime-local"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className={inputWithIconClasses}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>
                    Fecha y hora de fin
                  </label>
                  <div className="relative">
                    <KeenIcon
                      icon="flag"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                    />
                    <input
                      type="datetime-local"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className={inputWithIconClasses}
                    />
                  </div>
                </div>
              </div>
              {horaInicio && horaFin && (
                <div className="mt-3 pl-0 sm:pl-9">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-info/5 border border-info/10 text-info text-xs font-medium">
                    <KeenIcon icon="timer" className="text-sm" />
                    Duración: {(() => {
                      const mins = Math.round((new Date(horaFin).getTime() - new Date(horaInicio).getTime()) / 60000);
                      if (mins < 0) return 'Inválida';
                      return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800/60">
              <button
                className="px-5 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="flex items-center gap-2 px-6 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300 disabled:opacity-60 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95"
                disabled={loading}
                onClick={handleSubmit}
              >
                <span className="flex items-center gap-2">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <KeenIcon icon={esEdicion ? 'check' : 'plus'} className="text-sm" />
                  )}
                  <span>
                    {loading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear actividad'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
