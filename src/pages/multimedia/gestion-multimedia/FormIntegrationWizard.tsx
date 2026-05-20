import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { 
  FileCode, 
  Globe, 
  Link, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  PlusCircle, 
  Calendar,
  Search,
  Info
} from 'lucide-react';

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PROVIDERS = [
  { id: 'google', name: 'Google Forms', color: '#673AB7', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Google_Forms_2020_Logo.svg' },
  { id: 'microsoft', name: 'Microsoft Forms', color: '#0078D4', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Microsoft_Office_Microsoft_Forms_icon_%282019-present%29.svg' },
  { id: 'typeform', name: 'Typeform', color: '#000000', icon: 'https://www.vectorlogo.zone/logos/typeform/typeform-icon.svg' },
  { id: 'tally', name: 'Tally', color: '#000000', icon: 'https://raw.githubusercontent.com/TallySo/tally-logos/main/tally-mark.svg' },
  { id: 'jotform', name: 'Jotform', color: '#FA8900', icon: 'https://www.vectorlogo.zone/logos/jotform/jotform-icon.svg' },
  { id: 'other', name: 'Otro / Externo', color: '#6B7280', icon: null },
];

const ProviderIcon = ({ provider }: { provider: typeof PROVIDERS[0] }) => {
  const [error, setError] = useState(false);

  if (!provider.icon || error) {
    return (
      <div className="flex flex-col items-center justify-center">
        <FileCode style={{ color: provider.color }} className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  return (
    <img 
      src={provider.icon} 
      alt={provider.name} 
      className="w-full h-full object-contain" 
      onError={() => setError(true)}
    />
  );
};

export const FormIntegrationWizard = ({ open, onClose, onSave }: WizardProps) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    provider: 'google',
    url: '',
    eventId: '' as string | number
  });

  useEffect(() => {
    if (open && step === 3) {
      fetchEvents();
    }
  }, [open, step]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('eventos-multimedia?per_page=50');
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const filteredEvents = events.filter(e => 
    e.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    if (step === 2 && !formData.url) {
      enqueueSnackbar('Por favor ingresa la URL del formulario', { variant: 'warning' });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleFinalize = async () => {
    if (!formData.eventId) {
      enqueueSnackbar('Selecciona un evento o crea uno nuevo', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`eventos-multimedia/${formData.eventId}`, {
        formUrl: formData.url,
        formProvider: formData.provider,
        _method: 'POST'
      });
      enqueueSnackbar('Formulario vinculado correctamente', { variant: 'success' });
      onSave();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error al vincular el formulario', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewEvent = () => {
    onClose();
    navigate('/multimedia/eventos/nuevo', { 
      state: { 
        prefilledForm: {
          formUrl: formData.url,
          formProvider: formData.provider
        } 
      } 
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">¿Qué plataforma usarás?</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Selecciona el proveedor de tu formulario</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setFormData({ ...formData, provider: p.id });
                    handleNext();
                  }}
                  className={`relative p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group overflow-hidden ${
                    formData.provider === p.id 
                      ? 'border-orange-500 bg-orange-500/5 shadow-xl shadow-orange-500/10' 
                      : 'border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-orange-200 dark:hover:border-white/10 hover:shadow-lg'
                  }`}
                >
                  {formData.provider === p.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                       <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-2xl shadow-md group-hover:scale-110 transition-transform p-3">
                    <ProviderIcon provider={p} />
                  </div>
                  <span className="text-[10px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">Enlace del Formulario</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Pega la URL de compartir de {formData.provider}</p>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500">
                <Link className="h-6 w-6 text-neutral-300" />
              </div>
              <input
                type="url"
                autoFocus
                className="input pl-16 py-6 text-sm font-bold bg-neutral-50 dark:bg-white/[0.02] border-2 border-neutral-100 dark:border-white/5 rounded-2xl focus:border-orange-500/50 focus:bg-white dark:focus:bg-neutral-900 transition-all shadow-inner"
                placeholder="https://..."
                value={formData.url}
                style={{ textTransform: 'none' }}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div className="bg-orange-500/5 p-6 rounded-[2rem] border border-orange-500/10 flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <Info className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Dato importante</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
                    No necesitas el código iframe, solo la <span className="font-bold text-neutral-700 dark:text-neutral-200 underline">URL directa de compartir</span>. Nosotros nos encargamos de que se vea integrado perfectamente.
                  </p>
               </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <button onClick={handleBack} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <button 
                onClick={handleNext} 
                className="px-10 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">Vincular a Evento</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">¿A qué evento pertenece este formulario?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option: Create New */}
              <button
                onClick={handleCreateNewEvent}
                className="relative p-8 rounded-[2rem] border-2 border-dashed border-orange-200 dark:border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-all flex flex-col items-center gap-4 group overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Crear Nuevo</h4>
                  <p className="text-[11px] text-neutral-400 font-bold mt-1">Abre el editor completo</p>
                </div>
              </button>

              {/* Option: Assign Existing */}
              <div className="flex flex-col gap-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-orange-500 transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 h-12 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 rounded-2xl text-[11px] font-bold focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none"
                    placeholder="BUSCAR EVENTO..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-[180px] overflow-y-auto pr-2 space-y-2 custom-scrollbar scroll-smooth">
                  {filteredEvents.map(e => (
                    <button
                      key={e.idEvento}
                      onClick={() => setFormData({ ...formData, eventId: e.idEvento })}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                        formData.eventId === e.idEvento
                          ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/5'
                          : 'border-neutral-50 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-orange-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        formData.eventId === e.idEvento ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-neutral-50 dark:bg-white/5 text-neutral-400'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-tight truncate ${formData.eventId === e.idEvento ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {e.nombre}
                        </p>
                        <p className="text-[9px] font-bold text-neutral-400 mt-0.5">{e.fechaInicial}</p>
                      </div>
                      {formData.eventId === e.idEvento && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 opacity-40">
                       <Search className="w-8 h-8 mx-auto mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Sin resultados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-neutral-100 dark:border-white/5">
              <button onClick={handleBack} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <button 
                onClick={handleFinalize} 
                disabled={loading || !formData.eventId}
                className={`relative px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden group/btn ${
                  loading || !formData.eventId 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed' 
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                {loading ? 'Procesando...' : 'Finalizar Integración'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open}>
      <ModalContent className="w-full max-w-[640px] top-[5%] p-0 overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-zoom-in">
        <ModalHeader className="bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 border-b border-neutral-100 dark:border-white/5 p-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500" />
          <ModalTitle className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 transform -rotate-3">
              <FileCode className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-2xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase italic">Asistente de Integración</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-500/20">
                  Paso {step} de 3
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                  {step === 1 ? 'Selección de Plataforma' : step === 2 ? 'Configuración de URL' : 'Vinculación Final'}
                </span>
              </div>
            </div>
          </ModalTitle>
          <button 
            className="absolute top-8 right-8 p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 transition-all hover:rotate-90" 
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-xl" />
          </button>
        </ModalHeader>

        <ModalBody className="p-10">
          <div className="min-h-[360px] flex flex-col justify-center">
            {renderStep()}
          </div>
        </ModalBody>

        <div className="px-10 py-6 bg-neutral-50/50 dark:bg-black/20 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
           <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-orange-500' : 'w-4 bg-neutral-200 dark:bg-neutral-800'}`} />
              ))}
           </div>
           <span>Integración Segura v2.0</span>
        </div>
      </ModalContent>
    </Modal>
  );
};
