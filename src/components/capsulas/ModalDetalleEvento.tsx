import React from 'react';
import { Modal, ModalContent, ModalBody } from '@/components/modal';
import { KeenIcon } from '@/components';
import { Calendar, Clock, MapPin, ExternalLink, X, Info, Video, Users } from 'lucide-react';

interface ModalDetalleEventoProps {
  open: boolean;
  onClose: () => void;
  evento: any;
}

export const ModalDetalleEvento = ({ open, onClose, evento }: ModalDetalleEventoProps) => {
  if (!evento) return null;

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  const localDate = React.useMemo(() => {
    const [year, month, day] = evento.fechaInicial.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [evento.fechaInicial]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="w-full max-w-[600px] top-[10%] p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl animate-fade-in-up">
        <ModalBody className="p-0 relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Image */}
          <div className="relative h-64 w-full overflow-hidden">
            {evento.url ? (
              <img 
                src={getImageUrl(evento.url)} 
                className="w-full h-full object-cover" 
                alt={evento.nombre} 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-coal-400 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-6">
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${evento.tipoEvento === 'VIRTUAL' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                 {evento.tipoEvento}
               </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 pt-4 bg-white dark:bg-coal-400">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-2">
                {evento.nombre}
              </h2>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-coal-500 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {localDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-coal-500 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  {evento.hora} {evento.hora_final ? `- ${evento.hora_final}` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Ubicación / Área</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {evento.area?.nombre || 'Área General'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
                      {evento.tipoEvento === 'VIRTUAL' ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Modalidad</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {evento.tipoEvento}
                      </p>
                    </div>
                  </div>
               </div>

               <div className="bg-gray-50 dark:bg-coal-500/50 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3 text-emerald-500" /> Sobre el evento
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic break-words">
                    {evento.descripcion || 'No hay descripción adicional disponible para este evento.'}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-4">
              {evento.linkRegistro && (
                <a 
                  href={evento.linkRegistro} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 btn btn-primary rounded-2xl h-12 font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  Registrarme Ahora <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button 
                onClick={onClose}
                className={`btn btn-light rounded-2xl h-12 font-black uppercase tracking-widest ${!evento.linkRegistro ? 'flex-1' : ''}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
