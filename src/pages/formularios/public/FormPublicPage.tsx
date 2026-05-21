import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FormData } from '../builder/formBuilderTypes';

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
        const { data } = await axios.get(`/api/formulario-publico/${slug}`);
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
      await axios.post(`/api/formulario-publico/${slug}/responder`, { respuestas });
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
      <div className="container mt-20 d-flex justify-content-center">
        <div className="card shadow-sm border-0 w-100 max-w-600px py-20 text-center">
          <div className="spinner-border text-primary mb-4 mx-auto" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <h3 className="text-gray-800 fw-bold">Cargando formulario...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-20 d-flex justify-content-center">
        <div className="card shadow-sm border-0 w-100 max-w-600px border-top border-danger border-4">
          <div className="card-body p-10 text-center">
             <i className="bi bi-exclamation-triangle text-danger fs-5x mb-5 d-block"></i>
             <h2 className="fw-bolder text-gray-900 mb-4">Error</h2>
             <p className="fs-5 text-gray-600 mb-0">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  if (enviado) {
    return (
      <div className="container mt-10 mb-20 d-flex justify-content-center px-4" style={{ maxWidth: '800px' }}>
        <div className="card shadow-sm border-0 w-100" style={{ borderTop: `10px solid ${form.colorTema}`, borderRadius: '12px' }}>
          <div className="card-body p-10 p-md-15 text-center">
            <h1 className="fw-black mb-10 text-gray-900 fs-2x">{form.titulo}</h1>
            <i className="bi bi-check-circle-fill d-block mb-6" style={{ fontSize: '5rem', color: form.colorTema }}></i>
            <h2 className="fs-1 fw-bold text-gray-800 mb-4">¡Gracias!</h2>
            <p className="fs-4 text-gray-600 mb-10">Tu respuesta ha sido registrada con éxito.</p>
            {!form.requiereAutenticacion && (
              <button 
                className="btn btn-lg fw-bolder px-8 text-white hover-elevate-up" 
                style={{ backgroundColor: form.colorTema }}
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

  return (
    <div className="container-fluid bg-light py-10 min-vh-100">
      <div className="container px-2 px-md-4" style={{ maxWidth: '800px' }}>
        
        {/* Progress Bar (Sticky) */}
        {totalRequired > 0 && (
          <div className="position-sticky top-0 z-index-3 bg-light pt-2 pb-4 mb-4">
             <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                <span className="fs-7 fw-bold text-muted">Progreso: {answeredRequired} de {totalRequired} obligatorias</span>
                <span className="fs-7 fw-bolder" style={{ color: form.colorTema }}>{progressPercent}%</span>
             </div>
             <div className="progress h-6px w-100 bg-gray-200 rounded">
                <div className="progress-bar rounded" role="progressbar" style={{ width: `${progressPercent}%`, backgroundColor: form.colorTema }}></div>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card shadow-sm mb-6 border-0" style={{ borderTop: `10px solid ${form.colorTema}`, borderRadius: '12px' }}>
            <div className="card-body p-8 p-md-12">
              <h1 className="fw-black mb-5 text-gray-900" style={{ fontSize: '2.5rem' }}>{form.titulo}</h1>
              {form.descripcion && <p className="fs-4 text-gray-700 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{form.descripcion}</p>}
              
              {form.requiereAutenticacion && (
                <div className="d-flex align-items-center bg-light-info rounded p-4 mt-8 border border-info border-dashed">
                  <i className="bi bi-shield-lock text-info fs-1 me-4"></i>
                  <div>
                    <h5 className="text-info fw-bolder mb-1">Registro restringido</h5>
                    <span className="text-info fs-7">Se requiere iniciar sesión. Tu correo será registrado con tu respuesta.</span>
                  </div>
                </div>
              )}
              <div className="text-danger fs-7 fw-bold mt-6 pt-4 border-top border-gray-200">
                 * Indica que la pregunta es obligatoria
              </div>
            </div>
          </div>

          {form.preguntas.map((q, idx) => {
            const resp = respuestas.find(r => r.idPregunta === q.id);
            const isError = validationErrors.includes(q.id as number);
            
            const scaleConfig = q.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' };
            const scaleArray = Array.from({ length: scaleConfig.max - scaleConfig.min + 1 }, (_, i) => scaleConfig.min + i);

            return (
              <div 
                key={q.id} 
                id={`question-${q.id}`}
                className={`card shadow-sm mb-6 border-0 transition ${isError ? 'border border-danger border-2' : ''}`}
                style={{ borderRadius: '12px' }}
              >
                <div className="card-body p-8 p-md-10">
                  <h3 className="fs-3 fw-bolder text-gray-900 mb-3" style={{ lineHeight: '1.4' }}>
                    {q.titulo} {q.esObligatoria && <span className="text-danger ms-1">*</span>}
                  </h3>
                  {q.descripcion && <p className="text-gray-600 fs-6 mb-6">{q.descripcion}</p>}
                  
                  <div className="mt-6">
                    {q.tipo === 'texto_corto' && (
                      <input 
                        type="text" 
                        className={`form-control form-control-solid form-control-lg border-0 border-bottom rounded-0 px-3 bg-light ${isError ? 'border-danger' : 'border-gray-300 focus-border-primary'}`} 
                        placeholder="Tu respuesta"
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                        style={{ maxWidth: '50%' }}
                      />
                    )}
                    
                    {q.tipo === 'texto_largo' && (
                      <textarea 
                        className={`form-control form-control-solid form-control-lg border-0 border-bottom rounded-0 px-3 bg-light ${isError ? 'border-danger' : 'border-gray-300 focus-border-primary'}`} 
                        rows={3} 
                        placeholder="Tu respuesta"
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    )}

                    {q.tipo === 'opcion_multiple' && (
                      <div className="d-flex flex-column gap-3">
                        {q.opciones.map(opt => (
                          <label key={opt.id} className="d-flex align-items-center cursor-pointer p-2 rounded hover-bg-light transition">
                            <div className="form-check form-check-custom form-check-solid form-check-sm me-3">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name={`q_${q.id}`} 
                                value={opt.texto}
                                checked={resp?.valor === opt.texto}
                                onChange={() => handleChange(q.id!, opt.texto)}
                                style={{ accentColor: form.colorTema }}
                              />
                            </div>
                            <span className="fs-5 text-gray-800">{opt.texto}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.tipo === 'casillas' && (
                      <div className="d-flex flex-column gap-3">
                        {q.opciones.map(opt => (
                          <label key={opt.id} className="d-flex align-items-center cursor-pointer p-2 rounded hover-bg-light transition">
                            <div className="form-check form-check-custom form-check-solid form-check-sm me-3">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={(resp?.valor as string[])?.includes(opt.texto) || false}
                                onChange={(e) => handleCheckboxChange(q.id!, opt.texto, e.target.checked)}
                              />
                            </div>
                            <span className="fs-5 text-gray-800">{opt.texto}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.tipo === 'desplegable' && (
                      <div className="w-100 w-md-50">
                        <select 
                          className={`form-select form-select-solid form-select-lg ${isError ? 'border-danger' : ''}`}
                          value={resp?.valor || ''}
                          onChange={(e) => handleChange(q.id!, e.target.value)}
                        >
                          <option value="" disabled>Elige una opción</option>
                          {q.opciones.map(opt => (
                            <option key={opt.id} value={opt.texto}>{opt.texto}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {q.tipo === 'escala_lineal' && (
                      <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 py-4 px-2 bg-light rounded-3">
                         {scaleConfig.minLabel && <span className="fw-bold text-muted text-center text-md-end w-100px">{scaleConfig.minLabel}</span>}
                         <div className="d-flex flex-wrap justify-content-center gap-4 gap-md-6">
                            {scaleArray.map(n => (
                               <label key={n} className="d-flex flex-column align-items-center cursor-pointer gap-2">
                                  <span className="fs-5 fw-bold text-gray-800">{n}</span>
                                  <div className="form-check form-check-custom form-check-solid">
                                     <input 
                                       className="form-check-input w-25px h-25px shadow-sm" 
                                       type="radio" 
                                       name={`q_${q.id}`}
                                       checked={resp?.valor === String(n)}
                                       onChange={() => handleChange(q.id!, String(n))}
                                     />
                                  </div>
                               </label>
                            ))}
                         </div>
                         {scaleConfig.maxLabel && <span className="fw-bold text-muted text-center text-md-start w-100px">{scaleConfig.maxLabel}</span>}
                      </div>
                    )}

                    {q.tipo === 'fecha' && (
                      <input 
                        type="date" 
                        className={`form-control form-control-solid form-control-lg w-100 w-md-250px ${isError ? 'border-danger' : ''}`} 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    )}

                    {q.tipo === 'hora' && (
                      <input 
                        type="time" 
                        className={`form-control form-control-solid form-control-lg w-100 w-md-250px ${isError ? 'border-danger' : ''}`} 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    )}
                  </div>

                  {/* Validation Error Message */}
                  {isError && (
                    <div className="d-flex align-items-center mt-4 text-danger animate-fade-in">
                      <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                      <span className="fw-bold fs-6">Esta pregunta es obligatoria</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer Actions */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-8 mb-15 gap-6">
            <div className="d-flex align-items-center gap-4 w-100 w-md-auto">
              <button 
                type="submit" 
                className="btn btn-lg text-white fw-bolder px-10 shadow-sm hover-elevate-up w-100 w-md-auto" 
                disabled={enviando} 
                style={{ backgroundColor: form.colorTema }}
              >
                {enviando ? (
                  <><span className="spinner-border spinner-border-sm me-3"></span>Enviando...</>
                ) : 'Enviar'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-active-light-danger btn-color-muted fw-bold px-6 bg-transparent border-0" 
                onClick={handleClearForm}
                disabled={enviando}
              >
                Borrar formulario
              </button>
            </div>
            
            <div className="text-center text-md-end text-muted">
              <span className="fs-7 fw-bold d-block mb-1">Nunca envíes contraseñas a través de este formulario.</span>
            </div>
          </div>
        </form>

        {/* Footer Branding */}
        <div className="text-center pb-10 opacity-50">
           <h4 className="fs-5 fw-bolder text-gray-500 mb-1">Creado con VirtualT</h4>
           <p className="fs-8 text-gray-400 mb-0">Sistema avanzado de gestión educativa</p>
        </div>
      </div>
    </div>
  );
};

export default FormPublicPage;
