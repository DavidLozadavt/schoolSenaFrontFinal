import { useEffect, useState, useRef } from 'react';
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
  onSuccess: (newItem?: any) => void;
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

  const [isOpenEventSelect, setIsOpenEventSelect] = useState(false);
  const eventSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventSelectRef.current && !eventSelectRef.current.contains(event.target as Node)) {
        setIsOpenEventSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      let savedItem = null;
      if (esEdicion) {
        const { data } = await axios.put(`/items/${itemEditar!.id}`, payload);
        enqueueSnackbar(data.message ?? 'Actualizado correctamente', { variant: 'success' });
        savedItem = data.data;
      } else {
        const { data } = await axios.post('/items', payload);
        enqueueSnackbar(data.message ?? 'Creado correctamente', { variant: 'success' });
        savedItem = data.data;
      }
      onSuccess(savedItem);
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? 'Error al guardar', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[580px] p-0 rounded-2xl overflow-visible border border-gray-100 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <ModalHeader className="px-7 py-5 border-b border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-950/20 rounded-t-2xl">
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

        <ModalBody className="px-6 py-5 overflow-y-auto max-h-[68vh] pr-2 no-scrollbar">
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
            <div ref={eventSelectRef} className="relative">
              <label className={labelClasses}>
                <KeenIcon icon="calendar" className="text-xs" />
                Asociar a evento
              </label>
              <div className="relative">
                <KeenIcon
                  icon="calendar-tick"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => setIsOpenEventSelect(!isOpenEventSelect)}
                  className={`${inputWithIconClasses} text-left appearance-none cursor-pointer pr-10 flex items-center justify-between`}
                >
                  <span className="truncate">
                    {idEvento 
                      ? eventos.find(e => String(e.idEvento) === String(idEvento))?.nombre || '-- Sin evento (Global) --'
                      : '-- Sin evento (Global) --'}
                  </span>
                </button>
                <KeenIcon
                  icon="down"
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none transition-transform duration-200 ${isOpenEventSelect ? 'rotate-180' : ''}`}
                />
              </div>

              {isOpenEventSelect && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800/80 shadow-2xl max-h-48 overflow-y-auto no-scrollbar animate-fade-in">
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIdEvento('');
                        setIsOpenEventSelect(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all duration-150 ${
                        idEvento === ''
                          ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      -- Sin evento (Global) --
                    </button>
                    {eventos.map((e) => (
                      <button
                        key={e.idEvento}
                        type="button"
                        onClick={() => {
                          setIdEvento(e.idEvento);
                          setIsOpenEventSelect(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all duration-150 truncate ${
                          String(idEvento) === String(e.idEvento)
                            ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold'
                            : 'text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        {e.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              
              <div className="flex flex-col gap-5 pl-0 sm:pl-9">
                {/* Inicio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">
                      Inicio de la Actividad
                    </span>
                  </div>
                  <div>
                    <label className={labelClasses}>Fecha</label>
                    <div className="relative">
                      <KeenIcon
                        icon="calendar"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                      />
                      <input
                        type="date"
                        value={horaInicio ? horaInicio.split('T')[0] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const timePart = horaInicio && horaInicio.includes('T') ? horaInicio.split('T')[1] : '00:00';
                          setHoraInicio(val ? `${val}T${timePart}` : '');
                        }}
                        className={inputWithIconClasses}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Hora</label>
                    <div className="relative">
                      <KeenIcon
                        icon="time"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                      />
                      <input
                        type="time"
                        value={horaInicio && horaInicio.includes('T') ? horaInicio.split('T')[1] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const datePart = horaInicio ? horaInicio.split('T')[0] : new Date().toISOString().split('T')[0];
                          setHoraInicio(val ? `${datePart}T${val}` : '');
                        }}
                        className={inputWithIconClasses}
                      />
                    </div>
                  </div>
                </div>

                {/* Fin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-150 dark:border-zinc-800/80">
                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">
                      Fin de la Actividad
                    </span>
                  </div>
                  <div>
                    <label className={labelClasses}>Fecha</label>
                    <div className="relative">
                      <KeenIcon
                        icon="calendar"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                      />
                      <input
                        type="date"
                        value={horaFin ? horaFin.split('T')[0] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const timePart = horaFin && horaFin.includes('T') ? horaFin.split('T')[1] : '00:00';
                          setHoraFin(val ? `${val}T${timePart}` : '');
                        }}
                        className={inputWithIconClasses}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Hora</label>
                    <div className="relative">
                      <KeenIcon
                        icon="time"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                      />
                      <input
                        type="time"
                        value={horaFin && horaFin.includes('T') ? horaFin.split('T')[1] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const datePart = horaFin ? horaFin.split('T')[0] : new Date().toISOString().split('T')[0];
                          setHoraFin(val ? `${datePart}T${val}` : '');
                        }}
                        className={inputWithIconClasses}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {horaInicio && horaFin && (
                <div className="mt-4 pl-0 sm:pl-9">
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
