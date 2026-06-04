import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Users, 
  FileText, 
  CheckCircle, 
  Lock, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  File, 
  AlertCircle,
  X,
  Eye,
  Calendar,
  Phone,
  Mail,
  FileSpreadsheet
} from 'lucide-react';

interface Pregunta {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: string; // 'texto_corto', 'texto_largo', 'opcion_multiple', 'casillas', 'desplegable', 'escala_lineal', 'fecha', 'hora'
  esObligatoria: boolean;
  opciones: { id: number; texto: string }[];
}

interface Formulario {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  colorTema: string;
  preguntas: Pregunta[];
}

const StudentInscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [respuestas, setRespuestas] = useState<{ [preguntaId: number]: any }>({});
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  
  // File upload state
  const [uploadingFileId, setUploadingFileId] = useState<number | null>(null);
  const [filePreviews, setFilePreviews] = useState<{ [preguntaId: number]: { name: string; url: string }[] }>({});
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);

  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  const formSlug = 'inscripcion-estudiantes';

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`formulario-publico/${formSlug}`);
        setForm(data);
        
        // Initialize responses, prefilled with previous response if available
        const prevRespList = data.ultima_respuesta?.respuestas || [];
        const initialResp: { [preguntaId: number]: any } = {};
        data.preguntas.forEach((q: Pregunta) => {
          const matched = prevRespList.find((r: any) => r.idPregunta === q.id);
          initialResp[q.id] = matched ? matched.valor : (q.tipo === 'casillas' ? [] : '');
        });
        setRespuestas(initialResp);

        // Populate file previews if any files were previously uploaded
        const initialFilePreviews: { [preguntaId: number]: { name: string; url: string }[] } = {};
        data.preguntas.forEach((q: Pregunta) => {
          if (q.tipo === 'archivo') {
            const matched = prevRespList.find((r: any) => r.idPregunta === q.id);
            if (matched && matched.valor) {
              const urls = typeof matched.valor === 'string' ? matched.valor.split(',').filter(Boolean) : [];
              initialFilePreviews[q.id] = urls.map((url: string) => {
                const name = url.split('/').pop() || 'archivo';
                return { name, url };
              });
            }
          }
        });
        setFilePreviews(initialFilePreviews);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 
          'El formulario de inscripciones no está disponible o aún no ha sido creado con el slug "inscripcion-estudiantes".'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-neutral-900 px-10 py-14 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800 border-t-indigo-600 animate-spin" />
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 dark:text-white mt-2">Cargando Sistema</h3>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Preparando Inscripción...</p>
        </div>
      </div>
    );
  }

  // Handle closed / restricted state
  if (error || (form && form.estado !== 'publicado')) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 p-10 md:p-14 rounded-[2.5rem] shadow-2xl border border-red-500/10 w-full max-w-lg text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mb-2 animate-pulse shadow-lg">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">Inscripciones Cerradas</h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-400 font-semibold leading-relaxed max-w-md">
            Las inscripciones públicas para la institución se encuentran cerradas temporalmente en este momento. Por favor, comunícate con la coordinación académica o intenta más tarde.
          </p>
          {!isEmbed && (
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-8 py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Inicio</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Segment questions into logical steps dynamically
  const getStepQuestions = (currentStep: number) => {
    return form.preguntas.filter(q => {
      const titleLower = q.titulo.toLowerCase();
      const descLower = (q.descripcion || '').toLowerCase();
      
      // Step 3: Documents and Files (Certificados, etc.)
      const isDocument = q.tipo === 'texto_largo' && (
        titleLower.includes('certificado') || 
        titleLower.includes('archivo') || 
        titleLower.includes('documento') ||
        titleLower.includes('soporte') ||
        descLower.includes('suba') ||
        descLower.includes('cargue')
      ) || titleLower.includes('certificado') || titleLower.includes('documento de identidad');

      // Step 2: Guardian/Tutor
      const isTutor = !isDocument && (
        titleLower.includes('tutor') || 
        titleLower.includes('acudiente') || 
        titleLower.includes('madre') || 
        titleLower.includes('padre') || 
        titleLower.includes('representante')
      );

      // Step 1: Student (Everything else)
      const isStudent = !isDocument && !isTutor;

      if (currentStep === 1) return isStudent;
      if (currentStep === 2) return isTutor;
      if (currentStep === 3) return isDocument;
      return false;
    });
  };

  const step1Questions = getStepQuestions(1);
  const step2Questions = getStepQuestions(2);
  const step3Questions = getStepQuestions(3);

  const handleInputChange = (preguntaId: number, valor: any) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
    if (validationErrors.includes(preguntaId)) {
      setValidationErrors(prev => prev.filter(id => id !== preguntaId));
    }
  };

  const handleCheckboxChange = (preguntaId: number, optionText: string, checked: boolean) => {
    const current = (respuestas[preguntaId] as string[]) || [];
    const updated = checked 
      ? [...current, optionText] 
      : current.filter(v => v !== optionText);
    
    handleInputChange(preguntaId, updated);
  };

  // Handle public multiple files upload
  const handleMultipleFilesUpload = async (preguntaId: number, filesList: FileList) => {
    const files = Array.from(filesList);
    for (const file of files) {
      const allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(`El archivo "${file.name}" no es válido. Solo se permiten PDF, Word o imágenes (JPG, PNG).`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo "${file.name}" supera el tamaño máximo permitido de 5MB.`);
        continue;
      }

      setUploadingFileId(preguntaId);
      const formData = new FormData();
      formData.append('archivo', file);

      try {
        const { data } = await axios.post('formulario-publico/upload-adjunto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (data.success) {
          setFilePreviews(prev => {
            const current = prev[preguntaId] || [];
            const updated = [...current, { name: file.name, url: data.url }];
            const urlsStr = updated.map(f => f.url).join(',');
            handleInputChange(preguntaId, urlsStr);
            return {
              ...prev,
              [preguntaId]: updated
            };
          });
        }
      } catch (err: any) {
        alert(`Error al subir el archivo "${file.name}".`);
      } finally {
        setUploadingFileId(null);
      }
    }
  };

  const handleRemoveFile = (preguntaId: number, index: number) => {
    setFilePreviews(prev => {
      const current = prev[preguntaId] || [];
      const updated = current.filter((_, idx) => idx !== index);
      const urlsStr = updated.map(f => f.url).join(',');
      handleInputChange(preguntaId, urlsStr);
      
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[preguntaId];
      } else {
        next[preguntaId] = updated;
      }
      return next;
    });
  };

  const validateStep = (currentStep: number) => {
    const questions = getStepQuestions(currentStep);
    const errors: number[] = [];

    questions.forEach(q => {
      if (q.esObligatoria) {
        const val = respuestas[q.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          errors.push(q.id);
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    // Map responses to backend format: array of { idPregunta, valor }
    const payload = Object.keys(respuestas).map(key => ({
      idPregunta: parseInt(key),
      valor: respuestas[parseInt(key)]
    }));

    try {
      setLoading(true);
      await axios.post(`formulario-publico/${formSlug}/responder`, { respuestas: payload });
      setStep(5); // Success step
    } catch (err: any) {
      alert(err.response?.data?.error || 'Hubo un error al enviar tu inscripción.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (q: Pregunta) => {
    const value = respuestas[q.id] || '';
    const hasError = validationErrors.includes(q.id);

    // Render specialized premium upload for documents step
    if (step === 3) {
      const files = filePreviews[q.id] || [];
      return (
        <div className="mt-4 flex flex-col gap-4">
          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((fileInfo, idx) => {
                const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(fileInfo.url);
                const isWord = /\.(doc|docx)$/i.test(fileInfo.url);
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-white/5 shadow-inner">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center border border-neutral-200/20 ${isImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={() => isImage && setActiveLightboxUrl(fileInfo.url)}
                      >
                        {isImage ? (
                          <img src={fileInfo.url} alt="Archivo" className="w-full h-full object-cover" />
                        ) : isWord ? (
                          <FileText className="w-6 h-6 text-blue-500" />
                        ) : (
                          <File className="w-6 h-6 text-rose-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate max-w-[120px]">{fileInfo.name}</h4>
                        <a href={fileInfo.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1">
                          <Eye className="w-3 h-3" /> Ver
                        </a>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFile(q.id, idx)}
                      className="w-8 h-8 rounded-full hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx,image/*"
              multiple
              onChange={(e) => e.target.files && handleMultipleFilesUpload(q.id, e.target.files)}
              disabled={uploadingFileId === q.id}
            />
            <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center mb-3">
              {uploadingFileId === q.id ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-neutral-400" />
              )}
            </div>
            <span className="text-xs font-bold text-neutral-800 dark:text-white">Cargar archivos adjuntos</span>
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest mt-1">PDF, Word o Imagen (Máx 5MB)</span>
          </label>
        </div>
      );
    }

    switch (q.tipo) {
      case 'texto_corto':
        return (
          <input 
            type="text"
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            className={`w-full bg-neutral-50 dark:bg-neutral-800/20 border ${hasError ? 'border-rose-500' : 'border-neutral-250 dark:border-neutral-800'} px-5 py-4 text-xs font-semibold rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all`}
            placeholder="Ingresa la respuesta..."
          />
        );
      case 'texto_largo':
        return (
          <textarea 
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            className={`w-full bg-neutral-50 dark:bg-neutral-800/20 border ${hasError ? 'border-rose-500' : 'border-neutral-250 dark:border-neutral-800'} px-5 py-4 text-xs font-semibold rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all`}
            rows={4}
            placeholder="Describe en detalle aquí..."
          />
        );
      case 'opcion_multiple':
        return (
          <div className="flex flex-col gap-3">
            {q.opciones.map(opt => {
              const isSelected = value === opt.texto;
              return (
                <label 
                  key={opt.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.005]"
                  style={{
                    borderColor: isSelected ? form.colorTema : 'rgba(0,0,0,0.06)',
                    backgroundColor: isSelected ? `${form.colorTema}0b` : 'rgba(0,0,0,0.015)'
                  }}
                >
                  <input 
                    type="radio"
                    name={`q_${q.id}`}
                    checked={isSelected}
                    onChange={() => handleInputChange(q.id, opt.texto)}
                    className="w-4 h-4"
                    style={{ accentColor: form.colorTema }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                </label>
              );
            })}
          </div>
        );
      case 'desplegable':
        return (
          <select 
            value={value}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            className={`w-full max-w-xs bg-neutral-50 dark:bg-neutral-800/20 border ${hasError ? 'border-rose-500' : 'border-neutral-250 dark:border-neutral-800'} px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none cursor-pointer`}
          >
            <option value="" disabled>Selecciona una opción...</option>
            {q.opciones.map(opt => (
              <option key={opt.id} value={opt.texto}>{opt.texto}</option>
            ))}
          </select>
        );
      case 'fecha':
        return (
          <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/20 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-neutral-800">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input 
              type="date"
              value={value}
              onChange={(e) => handleInputChange(q.id, e.target.value)}
              className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-800 dark:text-white"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-neutral-950 flex flex-col justify-between" data-no-uppercase>
      
      {/* Header Banner */}
      <div className="w-full bg-white dark:bg-neutral-900 border-b border-neutral-200/50 dark:border-white/5 py-5 px-6 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-800 dark:text-white">School</h2>
              <p className="text-[9px] text-neutral-450 dark:text-neutral-400 font-bold uppercase tracking-widest">Admisiones y Matrículas</p>
            </div>
          </div>

          {/* Stepper Progress */}
          {step < 5 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((num) => (
                <div 
                  key={num} 
                  className={`w-8 h-8 rounded-xl font-black text-[10px] flex items-center justify-center transition-all ${
                    step >= num 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-grow">
        
        {/* STEP 1, 2, 3: Inputs rendering */}
        {step <= 3 && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 bg-indigo-600" />
              <div className="flex items-center gap-3 mb-4">
                {step === 1 && <User className="w-6 h-6 text-indigo-600" />}
                {step === 2 && <Users className="w-6 h-6 text-indigo-600" />}
                {step === 3 && <FileText className="w-6 h-6 text-indigo-600" />}
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  Paso {step} de 4
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">
                {step === 1 && "Información del Estudiante"}
                {step === 2 && "Datos del Tutor / Acudiente"}
                {step === 3 && "Certificados e Historial Académico"}
              </h1>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-widest mt-1">
                {step === 1 && "Completa los datos personales y demográficos del alumno."}
                {step === 2 && "Registra al representante legal o contacto de emergencia."}
                {step === 3 && "Adjunta los documentos de estudio previos si eres nuevo."}
              </p>
            </div>

            {/* Questions list */}
            <div className="flex flex-col gap-4">
              {getStepQuestions(step).map(q => (
                <div 
                  key={q.id}
                  className={`bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[2rem] border transition-all shadow-lg ${
                    validationErrors.includes(q.id) 
                      ? 'border-rose-500/40 shadow-rose-500/[0.01]' 
                      : 'border-neutral-100 dark:border-white/5'
                  }`}
                >
                  <h3 className="text-xs font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2 leading-relaxed">
                    {q.titulo} {q.esObligatoria && <span className="text-rose-500 ml-0.5">*</span>}
                  </h3>
                  {q.descripcion && (
                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-4">
                      {q.descripcion}
                    </p>
                  )}
                  {renderInput(q)}
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-6">
              {step > 1 ? (
                <button 
                  onClick={handleBack}
                  className="px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Atrás</span>
                </button>
              ) : <div />}

              <button 
                onClick={handleNext}
                className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-lg shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Summary & Confirm */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 bg-indigo-600" />
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  Paso 4 de 4
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">Resumen de Inscripción</h1>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold uppercase tracking-widest mt-1">Por favor verifica los datos antes del envío.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Summary categories */}
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-lg">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" /> Datos del Estudiante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {step1Questions.map(q => (
                    <div key={q.id} className="border-b border-neutral-100 dark:border-white/5 pb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{q.titulo}</span>
                      <p className="text-xs font-bold text-neutral-800 dark:text-white mt-1">{String(respuestas[q.id] || 'No proporcionado')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-lg">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Datos del Tutor / Acudiente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {step2Questions.map(q => (
                    <div key={q.id} className="border-b border-neutral-100 dark:border-white/5 pb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{q.titulo}</span>
                      <p className="text-xs font-bold text-neutral-800 dark:text-white mt-1">{String(respuestas[q.id] || 'No proporcionado')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {step3Questions.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-lg">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documentación
                  </h3>
                  <div className="flex flex-col gap-4">
                    {step3Questions.map(q => {
                      const files = filePreviews[q.id] || [];
                      return (
                        <div key={q.id} className="flex flex-col gap-3 pb-4 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{q.titulo}</span>
                            <p className="text-xs font-bold text-neutral-800 dark:text-white mt-1">
                              {files.length > 0 ? `${files.length} archivo(s) cargado(s)` : 'No cargado'}
                            </p>
                          </div>
                          {files.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {files.map((fileInfo, idx) => {
                                const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(fileInfo.url);
                                const isWord = /\.(doc|docx)$/i.test(fileInfo.url);
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div 
                                        className={`w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0 ${isImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                        onClick={() => isImage && setActiveLightboxUrl(fileInfo.url)}
                                      >
                                        {isImage ? (
                                          <img src={fileInfo.url} alt="Archivo" className="w-full h-full object-cover" />
                                        ) : isWord ? (
                                          <FileText className="w-4 h-4 text-blue-500" />
                                        ) : (
                                          <File className="w-4 h-4 text-rose-500" />
                                        )}
                                      </div>
                                      <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-350 truncate max-w-[120px]">{fileInfo.name}</span>
                                    </div>
                                    <a href={fileInfo.url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors">
                                      Ver
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <button 
                onClick={handleBack}
                className="px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Atrás</span>
              </button>

              <button 
                onClick={handleSubmit}
                className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-lg shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirmar e Inscribirse</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success screen */}
        {step === 5 && (
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-white/5 text-center overflow-hidden">
            <div className="p-10 md:p-16 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 shadow-lg">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">¡Inscripción Enviada!</h1>
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tu registro ha sido procesado</h2>
              <p className="text-xs text-neutral-450 dark:text-neutral-400 font-semibold leading-relaxed max-w-md">
                Tu solicitud de inscripción ha sido registrada con éxito en el sistema. Pronto nuestro equipo de admisiones se pondrá en contacto contigo.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-8 py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all"
              >
                Enviar otra inscripción
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full text-center py-8 border-t border-neutral-200/50 dark:border-white/5 flex flex-col items-center gap-1.5 opacity-80 mt-12 bg-neutral-950/20">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/20 backdrop-blur-md shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 text-transparent bg-clip-text">
            Creado con VirtualT
          </h4>
        </div>
        <p className="text-[7.5px] font-black uppercase tracking-[0.25em] text-amber-500/50">
          Sistema avanzado de gestión educativa
        </p>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-300 animate-fade-in"
          onClick={() => setActiveLightboxUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
            onClick={() => setActiveLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] relative p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeLightboxUrl} 
              alt="Ampliada" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10 animate-scale-up" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInscriptionPage;
