import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FormData } from '../builder/formBuilderTypes';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Calendar, 
  Clock, 
  Send, 
  RotateCcw, 
  AlertCircle,
  Smile,
  ClipboardCheck,
  UserPlus,
  Layers
} from 'lucide-react';

const FormPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<FormData | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`/formulario-publico/${slug}`);
        setForm(data);
        
        // Initialize respuestas array
        const initialResp = data.preguntas.map((q: any) => ({
          idPregunta: q.id,
          valor: q.tipo === 'casillas' ? [] : ''
        }));
        setRespuestas(initialResp);
      } catch (err: any) {
        setError(err.response?.data?.error || 'No se pudo cargar el formulario. Es posible que el enlace no sea válido o el formulario ya no esté disponible.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [slug]);

  const handleChange = (idPregunta: number | string, valor: any) => {
    setRespuestas(prev => prev.map(r => r.idPregunta === idPregunta ? { ...r, valor } : r));
    // Clear validation error when user interacts
    if (validationErrors.includes(idPregunta as number)) {
      setValidationErrors(prev => prev.filter(id => id !== idPregunta));
    }
  };

  const handleCheckboxChange = (idPregunta: number | string, optionText: string, checked: boolean) => {
    setRespuestas(prev => prev.map(r => {
      if (r.idPregunta === idPregunta) {
        const currentVals = r.valor as string[];
        const newVals = checked 
          ? [...currentVals, optionText] 
          : currentVals.filter(v => v !== optionText);
        return { ...r, valor: newVals };
      }
      return r;
    }));
    if (validationErrors.includes(idPregunta as number)) {
      setValidationErrors(prev => prev.filter(id => id !== idPregunta));
    }
  };

  const handleClearForm = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todas tus respuestas?')) {
      const clearedResp = form?.preguntas.map((q: any) => ({
        idPregunta: q.id,
        valor: q.tipo === 'casillas' ? [] : ''
      })) || [];
      setRespuestas(clearedResp);
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    // Validate required
    const errors: number[] = [];
    form?.preguntas.forEach(q => {
      if (q.esObligatoria) {
        const resp = respuestas.find(r => r.idPregunta === q.id);
        if (!resp || !resp.valor || (Array.isArray(resp.valor) && resp.valor.length === 0)) {
          errors.push(q.id as number);
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setEnviando(false);
      // Find the first error element and scroll to it smoothly
      setTimeout(() => {
        const firstErrorEl = document.getElementById(`question-${errors[0]}`);
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    try {
      await axios.post(`/formulario-publico/${slug}/responder`, { respuestas });
      setEnviado(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al enviar formulario. Por favor, inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-neutral-900 px-10 py-14 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800 border-t-indigo-600 animate-spin" />
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 dark:text-white mt-2">Cargando Formulario</h3>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Preparando tu experiencia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] shadow-2xl border border-red-500/10 w-full max-w-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white">Formulario No Disponible</h2>
          <p className="text-xs text-neutral-500 font-semibold leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  if (enviado) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-lg text-center overflow-hidden"
          style={{ borderTop: `10px solid ${form.colorTema}` }}
        >
          <div className="p-10 md:p-16 flex flex-col items-center gap-6">
            <div
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-2 shadow-lg shadow-black/5 animate-pulse"
              style={{ backgroundColor: `${form.colorTema}10`, color: form.colorTema }}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">{form.titulo}</h1>
            <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">¡Registro Exitoso!</h2>
            <p className="text-xs text-neutral-450 dark:text-neutral-400 font-semibold leading-relaxed">Tu respuesta ha sido registrada y guardada con éxito en nuestra plataforma educativa.</p>

            {!form.requiereAutenticacion && (
              <button
                className="text-white font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all mt-4"
                style={{ backgroundColor: form.colorTema, boxShadow: `0 10px 15px -3px ${form.colorTema}35` }}
                onClick={() => window.location.reload()}
              >
                Enviar otra respuesta
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalRequired = form.preguntas.filter(q => q.esObligatoria).length;
  let answeredRequired = 0;
  if (totalRequired > 0) {
    answeredRequired = form.preguntas.filter(q => {
      if (!q.esObligatoria) return false;
      const resp = respuestas.find(r => r.idPregunta === q.id);
      return resp && resp.valor && (!Array.isArray(resp.valor) || resp.valor.length > 0);
    }).length;
  }
  const progressPercent = totalRequired === 0 ? 100 : Math.round((answeredRequired / totalRequired) * 100);

  // Dynamic header icon based on form title/type
  const getHeaderIconAndBg = () => {
    const titleLower = form.titulo.toLowerCase();
    if (titleLower.includes('satisfac')) {
      return {
        icon: <Smile className="w-8 h-8" />,
        label: 'Encuesta de Satisfacción',
        bg: 'from-emerald-500/10 to-teal-500/5',
        textColor: 'text-emerald-500'
      };
    }
    if (titleLower.includes('evalua') || titleLower.includes('feedback')) {
      return {
        icon: <ClipboardCheck className="w-8 h-8" />,
        label: 'Evaluación del Evento',
        bg: 'from-blue-500/10 to-indigo-500/5',
        textColor: 'text-blue-500'
      };
    }
    if (titleLower.includes('registro') || titleLower.includes('inscrip')) {
      return {
        icon: <UserPlus className="w-8 h-8" />,
        label: 'Registro de Participación',
        bg: 'from-amber-500/10 to-orange-500/5',
        textColor: 'text-amber-500'
      };
    }
    return {
      icon: <Layers className="w-8 h-8" />,
      label: 'Formulario Inteligente',
      bg: 'from-neutral-500/10 to-neutral-400/5',
      textColor: 'text-neutral-500'
    };
  };

  const headerMeta = getHeaderIconAndBg();

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-neutral-950">

      {/* Progress Bar — full viewport width, sticky */}
      {totalRequired > 0 && (
        <div className="sticky top-0 z-30 w-full bg-slate-50/90 dark:bg-neutral-950/90 backdrop-blur-md shadow-sm border-b border-neutral-200/50 dark:border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-neutral-500">
              <span>Progreso: {answeredRequired} de {totalRequired} obligatorias</span>
              <span className="font-extrabold" style={{ color: form.colorTema }}>{progressPercent}% completado</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%`, backgroundColor: form.colorTema }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Centered content column */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-28">
        <form onSubmit={handleSubmit}>
          {/* Main Title Card */}
          <div 
            className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl mb-8 overflow-hidden relative"
            style={{ borderTop: `10px solid ${form.colorTema}` }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: form.colorTema }} />
            
            {/* Dynamic Banner Header */}
            <div className={`flex items-center gap-4 p-6 rounded-[2rem] bg-gradient-to-br ${headerMeta.bg} border border-neutral-100/10 dark:border-white/5 mb-8 shadow-inner`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-neutral-850 shadow-lg ${headerMeta.textColor}`}>
                {headerMeta.icon}
              </div>
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 dark:bg-neutral-800 shadow-sm ${headerMeta.textColor}`}>
                  {headerMeta.label}
                </span>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-bold uppercase tracking-widest mt-1.5">Completa este cuestionario oficial</p>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-4">{form.titulo}</h1>
            {form.descripcion && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed mb-6" style={{ whiteSpace: 'pre-wrap' }}>
                {form.descripcion}
              </p>
            )}
            
            {form.requiereAutenticacion && (
              <div className="flex items-center gap-4 bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl mt-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Acceso Restringido</h5>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Se registrará automáticamente tu dirección de correo institucional.</span>
                </div>
              </div>
            )}
            <div className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-6 pt-4 border-t border-neutral-100 dark:border-white/5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> <span>* Indica que la pregunta es obligatoria</span>
            </div>
          </div>

          {/* Questions */}
          {form.preguntas.map((q, idx) => {
            const resp = respuestas.find(r => r.idPregunta === q.id);
            const isError = validationErrors.includes(q.id as number);
            
            const scaleConfig = q.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' };
            const scaleArray = Array.from({ length: scaleConfig.max - scaleConfig.min + 1 }, (_, i) => scaleConfig.min + i);

            return (
              <div 
                key={q.id} 
                id={`question-${q.id}`}
                className={`bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border mb-6 transition-all duration-300 shadow-xl ${
                  isError 
                    ? 'border-red-500/40 shadow-red-500/[0.02]' 
                    : 'border-neutral-100 dark:border-white/5 hover:shadow-2xl'
                }`}
                style={{ borderLeft: `6px solid ${form.colorTema}30` }}
              >
                <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2 leading-relaxed">
                  {q.titulo} {q.esObligatoria && <span className="text-rose-500 ml-1">*</span>}
                </h3>
                {q.descripcion && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-6">{q.descripcion}</p>}
                
                <div className="mt-6">
                  {/* TEXT CORTO */}
                  {q.tipo === 'texto_corto' && (
                    <input 
                      type="text" 
                      className="w-full max-w-md bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-4 text-xs font-semibold text-neutral-700 dark:text-white rounded-2xl outline-none transition-all"
                      placeholder="Escribe tu respuesta corta..."
                      value={resp?.valor || ''}
                      onChange={(e) => handleChange(q.id!, e.target.value)}
                      onFocus={(e) => {
                        e.target.style.borderColor = form.colorTema;
                        e.target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '';
                        e.target.style.boxShadow = '';
                      }}
                    />
                  )}
                  
                  {/* TEXT LARGO */}
                  {q.tipo === 'texto_largo' && (
                    <textarea 
                      className="w-full bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-4 text-xs font-semibold text-neutral-700 dark:text-white rounded-2xl outline-none transition-all"
                      rows={4} 
                      placeholder="Escribe tu respuesta detallada aquí..."
                      value={resp?.valor || ''}
                      onChange={(e) => handleChange(q.id!, e.target.value)}
                      style={{ resize: 'vertical' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = form.colorTema;
                        e.target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '';
                        e.target.style.boxShadow = '';
                      }}
                    />
                  )}

                  {/* OPCION MULTIPLE */}
                  {q.tipo === 'opcion_multiple' && (
                    <div className="flex flex-col gap-3">
                      {q.opciones.map(opt => {
                        const isSelected = resp?.valor === opt.texto;
                        return (
                          <label 
                            key={opt.id} 
                            className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                              borderColor: isSelected ? form.colorTema : 'rgba(0,0,0,0.06)',
                              backgroundColor: isSelected ? `${form.colorTema}0b` : 'rgba(0,0,0,0.015)',
                              boxShadow: isSelected ? `0 4px 12px ${form.colorTema}15` : 'none'
                            }}
                          >
                            <input 
                              type="radio" 
                              name={`q_${q.id}`} 
                              value={opt.texto}
                              checked={isSelected}
                              onChange={() => handleChange(q.id!, opt.texto)}
                              className="w-4 h-4 transition-all"
                              style={{ accentColor: form.colorTema }}
                            />
                            <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* CASILLAS */}
                  {q.tipo === 'casillas' && (
                    <div className="flex flex-col gap-3">
                      {q.opciones.map(opt => {
                        const isChecked = (resp?.valor as string[])?.includes(opt.texto) || false;
                        return (
                          <label 
                            key={opt.id} 
                            className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                              borderColor: isChecked ? form.colorTema : 'rgba(0,0,0,0.06)',
                              backgroundColor: isChecked ? `${form.colorTema}0b` : 'rgba(0,0,0,0.015)',
                              boxShadow: isChecked ? `0 4px 12px ${form.colorTema}15` : 'none'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(q.id!, opt.texto, e.target.checked)}
                              className="w-4 h-4 rounded transition-all"
                              style={{ accentColor: form.colorTema }}
                            />
                            <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* DESPLEGABLE */}
                  {q.tipo === 'desplegable' && (
                    <div className="w-full max-w-xs">
                      <select 
                        className="w-full bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none transition-all cursor-pointer"
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                        onFocus={(e) => {
                          e.target.style.borderColor = form.colorTema;
                          e.target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }}
                      >
                        <option value="" disabled>Elige una opción...</option>
                        {q.opciones.map(opt => (
                          <option key={opt.id} value={opt.texto}>{opt.texto}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ESCALA LINEAL */}
                  {q.tipo === 'escala_lineal' && (
                    <div className="flex flex-col gap-6 py-6 px-8 bg-neutral-50/50 dark:bg-neutral-850/10 rounded-[2.5rem] border border-neutral-100/50 dark:border-white/5 shadow-inner">
                      <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
                        {scaleArray.map(n => {
                          const isSelected = resp?.valor === String(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleChange(q.id!, String(n))}
                              className="w-12 h-12 rounded-full font-black text-sm flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border"
                              style={{
                                borderColor: isSelected ? form.colorTema : 'rgba(0,0,0,0.08)',
                                backgroundColor: isSelected ? form.colorTema : 'rgba(0,0,0,0.02)',
                                color: isSelected ? '#ffffff' : 'inherit',
                                boxShadow: isSelected ? `0 8px 16px ${form.colorTema}40` : 'none'
                              }}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-between items-center px-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        <span>{scaleConfig.minLabel || 'Bajo'}</span>
                        <span>{scaleConfig.maxLabel || 'Alto'}</span>
                      </div>
                    </div>
                  )}

                  {/* FECHA */}
                  {q.tipo === 'fecha' && (
                    <div 
                      className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/20 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-neutral-800 transition-all"
                      style={{ transition: 'all 0.3s' }}
                      onFocus={(e) => {
                        const target = e.currentTarget;
                        target.style.borderColor = form.colorTema;
                        target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`;
                      }}
                      onBlur={(e) => {
                        const target = e.currentTarget;
                        target.style.borderColor = '';
                        target.style.boxShadow = '';
                      }}
                    >
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <input 
                        type="date" 
                        className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-750 dark:text-white" 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    </div>
                  )}

                  {/* HORA */}
                  {q.tipo === 'hora' && (
                    <div 
                      className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/20 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-neutral-800 transition-all"
                      style={{ transition: 'all 0.3s' }}
                      onFocus={(e) => {
                        const target = e.currentTarget;
                        target.style.borderColor = form.colorTema;
                        target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`;
                      }}
                      onBlur={(e) => {
                        const target = e.currentTarget;
                        target.style.borderColor = '';
                        target.style.boxShadow = '';
                      }}
                    >
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <input 
                        type="time" 
                        className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-750 dark:text-white" 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Validation Error Message */}
                {isError && (
                  <div className="flex items-center gap-2 mt-4 text-rose-500 animate-bounce-short">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Esta pregunta es obligatoria</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 mb-20 gap-6 border-t border-neutral-200/50 dark:border-white/5 pt-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                type="submit" 
                className="text-white font-black uppercase tracking-widest text-[9px] py-4 px-10 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5" 
                disabled={enviando} 
                style={{ 
                  backgroundColor: form.colorTema,
                  boxShadow: `0 10px 15px -3px ${form.colorTema}35`
                }}
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Formulario</span>
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                className="text-neutral-400 hover:text-rose-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-3.5 rounded-2xl hover:bg-rose-500/5 transition-all" 
                onClick={handleClearForm}
                disabled={enviando}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Borrar Formulario</span>
              </button>
            </div>
            
            <div className="text-center sm:text-right text-[9px] font-bold uppercase tracking-widest text-neutral-400 max-w-xs leading-relaxed">
              <span>Nunca envíes información sensible o contraseñas a través de este portal.</span>
            </div>
          </div>
        </form>

        {/* Footer Branding */}
        <div className="text-center pb-12 opacity-40">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-550 mb-1">Creado con VirtualT</h4>
           <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">Sistema avanzado de gestión educativa</p>
        </div>
      </div>
    </div>
  );
};

export default FormPublicPage;
