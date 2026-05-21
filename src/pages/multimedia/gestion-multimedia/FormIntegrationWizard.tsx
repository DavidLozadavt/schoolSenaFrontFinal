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
  Info,
  Layers,
  Zap,
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
    return <div className="flex flex-col items-center justify-center"><FileCode style={{ color: provider.color }} className="w-8 h-8 opacity-40" /></div>;
  }
  return <img src={provider.icon} alt={provider.name} className="w-full h-full object-contain" onError={() => setError(true)} />;
};

/** Total steps per mode:
 *  external: 0 (type) → 1 (provider) → 2 (url) → 3 (event)
 *  internal: 0 (type) → 4 (form picker) → 3 (event)
 */

export const FormIntegrationWizard = ({ open, onClose, onSave }: WizardProps) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // 0 = type selection, 1 = provider, 2 = url, 3 = event, 4 = internal form picker
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [internalForms, setInternalForms] = useState<any[]>([]);
  const [searchEvent, setSearchEvent] = useState('');
  const [searchForm, setSearchForm] = useState('');
  const [mode, setMode] = useState<'external' | 'internal' | null>(null);

  const [formData, setFormData] = useState({
    provider: 'google',
    url: '',
    eventId: '' as string | number,
    internalFormId: '' as string | number,
  });

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setMode(null);
      setFormData({ provider: 'google', url: '', eventId: '', internalFormId: '' });
      setSearchEvent('');
      setSearchForm('');
    }
  }, [open]);

  useEffect(() => {
    if (open && step === 3) fetchEvents();
  }, [open, step]);

  useEffect(() => {
    if (open && step === 4) {
      fetchEvents();
      fetchInternalForms();
    }
  }, [open, step]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('eventos-multimedia?per_page=50');
      setEvents(response.data.data || []);
    } catch { /* silent */ }
  };

  const fetchInternalForms = async () => {
    try {
      const response = await axios.get('formularios');
      setInternalForms(response.data || []);
    } catch { /* silent */ }
  };

  const filteredEvents = events.filter(e =>
    e.nombre.toLowerCase().includes(searchEvent.toLowerCase())
  );

  const filteredForms = internalForms.filter(f =>
    f.titulo.toLowerCase().includes(searchForm.toLowerCase())
  );

  // Step title helpers
  const totalSteps = mode === 'internal' ? 3 : 4;
  const currentStepNum = step === 0 ? 1 : step === 1 ? 2 : step === 2 ? 3 : step === 4 ? 2 : 3;
  const stepLabel =
    step === 0 ? 'Tipo de Formulario' :
    step === 1 ? 'Selección de Plataforma' :
    step === 2 ? 'Configuración de URL' :
    step === 4 ? 'Seleccionar Formulario' :
    'Vinculación Final';

  const handleBack = () => {
    if (step === 1 || step === 4) setStep(0);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(mode === 'internal' ? 4 : 2);
  };

  const handleNext = () => {
    if (step === 2 && !formData.url) {
      enqueueSnackbar('Por favor ingresa la URL del formulario', { variant: 'warning' });
      return;
    }
    if (step === 4 && !formData.internalFormId) {
      enqueueSnackbar('Selecciona un formulario interno', { variant: 'warning' });
      return;
    }
    if (step === 0) return; // handled inline
    if (step === 2) { setStep(3); return; }
    if (step === 4) { setStep(3); return; }
    setStep(prev => prev + 1);
  };

  const handleFinalize = async () => {
    if (!formData.eventId) {
      enqueueSnackbar('Selecciona un evento o crea uno nuevo', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'internal') {
        // Use the existing POST route directly (no _method spoofing needed for JSON)
        await axios.post(`eventos-multimedia/${formData.eventId}`, {
          idFormularioInterno: formData.internalFormId,
        });
        enqueueSnackbar('Formulario interno vinculado correctamente al evento', { variant: 'success' });
      } else {
        await axios.post(`eventos-multimedia/${formData.eventId}`, {
          formUrl: formData.url,
          formProvider: formData.provider,
        });
        enqueueSnackbar('Formulario externo vinculado correctamente', { variant: 'success' });
      }
      onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al vincular el formulario', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewEvent = () => {
    onClose();
    navigate('/multimedia/eventos/nuevo', {
      state: {
        prefilledForm: mode === 'internal'
          ? { idFormularioInterno: formData.internalFormId }
          : { formUrl: formData.url, formProvider: formData.provider }
      }
    });
  };

  const renderStep = () => {
    switch (step) {
      /* ─── STEP 0: TYPE SELECTION ─── */
      case 0:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">¿Qué tipo de formulario?</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Elige cómo quieres integrar el formulario al evento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* External */}
              <button
                onClick={() => { setMode('external'); setStep(1); }}
                className="relative p-8 rounded-[2rem] border-2 border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-orange-300 dark:hover:border-orange-500/30 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-5 group overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 bg-orange-500 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-[11px] font-black text-neutral-800 dark:text-white uppercase tracking-widest">Formulario Externo</h4>
                  <p className="text-[10px] text-neutral-400 font-bold mt-2 leading-relaxed">
                    Google Forms, Microsoft Forms, Typeform u otro proveedor externo.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-500">
                  Usar URL externa <ArrowRight className="w-3 h-3" />
                </div>
              </button>

              {/* Internal */}
              <button
                onClick={() => { setMode('internal'); setStep(4); }}
                className="relative p-8 rounded-[2rem] border-2 border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-5 group overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 bg-indigo-500 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-[11px] font-black text-neutral-800 dark:text-white uppercase tracking-widest">Formulario Interno</h4>
                  <p className="text-[10px] text-neutral-400 font-bold mt-2 leading-relaxed">
                    Usa un formulario creado en la plataforma VirtualT. Control total de respuestas.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                  <Zap className="w-3 h-3" /> Recomendado · Sin salir de VirtualT
                </div>
              </button>
            </div>
          </div>
        );

      /* ─── STEP 1: PROVIDER (external) ─── */
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
                  onClick={() => { setFormData({ ...formData, provider: p.id }); setStep(2); }}
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
            <div className="flex justify-start pt-2">
              <button onClick={handleBack} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            </div>
          </div>
        );

      /* ─── STEP 2: URL (external) ─── */
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

      /* ─── STEP 4: INTERNAL FORM PICKER ─── */
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">Formulario Interno</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Selecciona el formulario de VirtualT que deseas vincular</p>
            </div>

            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-indigo-500 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                className="w-full pl-11 pr-4 h-12 bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 rounded-2xl text-[11px] font-bold focus:bg-white dark:focus:bg-neutral-800 transition-all outline-none focus:border-indigo-500/40"
                placeholder="BUSCAR FORMULARIO..."
                value={searchForm}
                onChange={(e) => setSearchForm(e.target.value)}
              />
            </div>

            {/* Form list */}
            <div className="max-h-[240px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredForms.map(f => {
                const isSelected = formData.internalFormId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormData({ ...formData, internalFormId: f.id })}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5'
                        : 'border-neutral-100 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-indigo-200 dark:hover:border-indigo-500/20'
                    }`}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: f.colorTema ? `${f.colorTema}20` : '#6366f120' }}
                    >
                      <Layers className="w-5 h-5" style={{ color: f.colorTema || '#6366f1' }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {f.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                          f.estado === 'publicado'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : f.estado === 'borrador'
                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>{f.estado}</span>
                        {f.preguntas_count != null && (
                          <span className="text-[9px] text-neutral-400 font-bold">{f.preguntas_count} preguntas</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredForms.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <Layers className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin formularios encontrados</p>
                </div>
              )}
            </div>

            {/* Create new form shortcut */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <PlusCircle className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-neutral-500 font-bold flex-1">
                ¿No tienes un formulario aún?{' '}
                <button
                  className="text-indigo-500 underline font-black"
                  onClick={() => { onClose(); navigate('/formularios'); }}
                >
                  Crear uno en Formularios
                </button>
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={handleBack} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.internalFormId}
                className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  !formData.internalFormId
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        );

      /* ─── STEP 3: EVENT PICKER (shared by both modes) ─── */
      case 3:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-neutral-800 dark:text-white uppercase tracking-tight italic">Vincular a Evento</h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest mt-1">¿A qué evento pertenece este formulario?</p>
            </div>

            {/* Selected form reminder (internal mode) */}
            {mode === 'internal' && formData.internalFormId && (() => {
              const f = internalForms.find(x => x.id === formData.internalFormId);
              return f ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${f.colorTema || '#6366f1'}20` }}>
                    <Layers className="w-4 h-4" style={{ color: f.colorTema || '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight truncate">{f.titulo}</p>
                    <p className="text-[9px] text-neutral-400 font-bold">Formulario seleccionado</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>
              ) : null;
            })()}

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
                    value={searchEvent}
                    onChange={(e) => setSearchEvent(e.target.value)}
                  />
                </div>
                <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2 custom-scrollbar scroll-smooth">
                  {filteredEvents.map(ev => {
                    const linkedForm = ev.formulario_interno || ev.formularioInterno;
                    const hasExternalForm = !!ev.formUrl;
                    const isSelected = formData.eventId === ev.idEvento;
                    return (
                      <button
                        key={ev.idEvento}
                        onClick={() => setFormData({ ...formData, eventId: ev.idEvento })}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-start gap-4 text-left ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/5'
                            : linkedForm
                            ? 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-500/[0.03] hover:border-orange-200'
                            : 'border-neutral-50 dark:border-white/5 bg-white dark:bg-neutral-800/20 hover:border-orange-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-neutral-50 dark:bg-white/5 text-neutral-400'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-tight truncate ${
                            isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-700 dark:text-neutral-300'
                          }`}>{ev.nombre}</p>
                          <p className="text-[9px] font-bold text-neutral-400 mt-0.5">{ev.fechaInicial}</p>
                          {linkedForm ? (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[120px]"
                                style={{ color: linkedForm.colorTema || '#6366f1' }}>
                                {linkedForm.titulo}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">Cambiar</span>
                            </div>
                          ) : hasExternalForm ? (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Externo vinculado</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">Cambiar</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Sin formulario</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
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

  const accentColor = mode === 'internal' ? '#6366f1' : '#f97316';

  return (
    <Modal open={open}>
      <ModalContent className="w-full max-w-[640px] top-[5%] p-0 overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-zoom-in">
        <ModalHeader className="bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 border-b border-neutral-100 dark:border-white/5 p-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500" />
          <ModalTitle className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-2xl transform -rotate-3 transition-colors duration-300"
              style={{ backgroundColor: accentColor, boxShadow: `0 8px 24px ${accentColor}60` }}
            >
              {mode === 'internal' ? <Layers className="w-8 h-8" /> : <FileCode className="w-8 h-8" />}
            </div>
            <div>
              <span className="block text-2xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase italic">Asistente de Integración</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors duration-300"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}>
                  {step === 0 ? 'Inicio' : `Paso ${currentStepNum} de ${totalSteps}`}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">{stepLabel}</span>
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
            {/* Progress dots adapted to mode */}
            {mode === 'internal'
              ? [0, 4, 3].map((s, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === s || (step > s && s !== 3) || (step === 3 && i === 2) ? 'w-8' : 'w-4 bg-neutral-200 dark:bg-neutral-800'}`}
                    style={{ backgroundColor: step === s || (i === 0 && step > 0) || (i === 1 && (step === 4 || step === 3)) || (i === 2 && step === 3) ? accentColor : undefined }}
                  />
                ))
              : [0, 1, 2, 3].map((s, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8' : 'w-4 bg-neutral-200 dark:bg-neutral-800'}`}
                    style={{ backgroundColor: step >= s ? accentColor : undefined }}
                  />
                ))
            }
          </div>
          <span>Integración Segura v2.0</span>
        </div>
      </ModalContent>
    </Modal>
  );
};
