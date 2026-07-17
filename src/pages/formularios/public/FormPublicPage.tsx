import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { FormData } from '../builder/formBuilderTypes';
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
  Layers,
  ArrowLeft,
  Upload,
  File,
  FileText,
  X,
  Eye
} from 'lucide-react';

const FormPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromEventId = location.state?.fromEventId;
  const searchParams = new URLSearchParams(window.location.search);
  const isEmbed = searchParams.get('embed') === 'true';
  const emailParam = searchParams.get('email') || '';
  const [form, setForm] = useState<FormData | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [uploadingFileId, setUploadingFileId] = useState<number | string | null>(null);
  const [filePreviews, setFilePreviews] = useState<{ [preguntaId: number | string]: { name: string; url: string }[] }>({});
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
  const [yaInscrito, setYaInscrito] = useState(false);
  const [respuestaAnterior, setRespuestaAnterior] = useState<any[]>([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [registradoEn, setRegistradoEn] = useState<string | null>(null);
  const [editadoEn, setEditadoEn] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ text: string; tipo: 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ text: string; onConfirm: () => void } | null>(null);

  const buildEmptyRespuestas = (preguntas: any[]) =>
    preguntas.map((q: any) => ({ idPregunta: q.id, valor: q.tipo === 'casillas' ? [] : '' }));

  const buildFilePreviews = (preguntas: any[], prevRespList: any[]) => {
    const previews: { [preguntaId: number | string]: { name: string; url: string }[] } = {};
    preguntas.forEach((q: any) => {
      if (q.tipo === 'archivo') {
        const matched = prevRespList.find((r: any) => r.idPregunta === q.id);
        if (matched?.valor) {
          const urls = typeof matched.valor === 'string' ? matched.valor.split(',').filter(Boolean) : [];
          previews[q.id] = urls.map((url: string) => ({ name: url.split('/').pop() || 'archivo', url }));
        }
      }
    });
    return previews;
  };

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const params: Record<string, string> = {};
        if (isEmbed) params.embed = 'true';
        if (emailParam) params.email = emailParam;
        const { data } = await axios.get(`formulario-publico/${slug}`, { params });
        setForm(data);
        setRespuestas(buildEmptyRespuestas(data.preguntas));
        setFilePreviews({});

        if (data.ultima_respuesta?.respuestas) {
          setRespuestaAnterior(data.ultima_respuesta.respuestas);
          setRegistradoEn(data.ultima_respuesta.created_at || null);
          setEditadoEn(data.ultima_respuesta.updated_at || null);
          setYaInscrito(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'No se pudo cargar el formulario. Es posible que el enlace no sea válido o el formulario ya no esté disponible.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [slug]);

  const entrarModoEdicion = () => {
    if (!form) return;
    const prefilled = form.preguntas.map((q: any) => {
      const matched = respuestaAnterior.find((r: any) => r.idPregunta === q.id);
      return { idPregunta: q.id, valor: matched ? matched.valor : (q.tipo === 'casillas' ? [] : '') };
    });
    setRespuestas(prefilled);
    setFilePreviews(buildFilePreviews(form.preguntas, respuestaAnterior));
    setYaInscrito(false);
    setModoEdicion(true);
  };

  const isIdentificationField = (titulo: string): boolean => {
    const t = titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const isDoc = (t.includes('numero') || (t.includes('documento') && !t.includes('tipo')) || t.includes('identificacion'))
      && !t.includes('tutor') && !t.includes('acudiente');
    const isEmail = (t.includes('correo') || t.includes('email') || t.includes('e-mail'))
      && !t.includes('tutor') && !t.includes('acudiente');
    return isDoc || isEmail;
  };

  const handleChange = (idPregunta: number | string, valor: any) => {
    setRespuestas(prev => prev.map(r => r.idPregunta === idPregunta ? { ...r, valor } : r));
    // Clear validation error when user interacts
    if (validationErrors.includes(idPregunta as number)) {
      setValidationErrors(prev => prev.filter(id => id !== idPregunta));
    }
  };

  // Handle public multiple files upload
  const handleMultipleFilesUpload = async (preguntaId: number | string, filesList: FileList) => {
    const files = Array.from(filesList);
    let accumulated = filePreviews[preguntaId] || [];

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
        setFileError(`El archivo "${file.name}" no es válido. Solo se permiten PDF, Word o imágenes (JPG, PNG).`);
        setTimeout(() => setFileError(null), 5000);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setFileError(`El archivo "${file.name}" supera el tamaño máximo permitido de 20MB.`);
        setTimeout(() => setFileError(null), 5000);
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
          accumulated = [...accumulated, { name: file.name, url: data.url }];
          const urlsStr = accumulated.map(f => f.url).join(',');
          handleChange(preguntaId, urlsStr);
          setFilePreviews(prev => ({ ...prev, [preguntaId]: accumulated }));
        }
      } catch (err: any) {
        setAlertMsg({ text: `Error al subir el archivo "${file.name}".`, tipo: 'error' });
      } finally {
        setUploadingFileId(null);
      }
    }
  };

  const handleRemoveFile = (preguntaId: number | string, index: number) => {
    const current = filePreviews[preguntaId] || [];
    const updated = current.filter((_, idx) => idx !== index);
    const urlsStr = updated.map(f => f.url).join(',');
    handleChange(preguntaId, urlsStr);
    setFilePreviews(prev => {
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[preguntaId];
      } else {
        next[preguntaId] = updated;
      }
      return next;
    });
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
    setConfirmDialog({
      text: '¿Estás seguro de que quieres borrar todas tus respuestas?',
      onConfirm: () => {
        const clearedResp = form?.preguntas.map((q: any) => ({
          idPregunta: q.id,
          valor: q.tipo === 'casillas' ? [] : ''
        })) || [];
        setRespuestas(clearedResp);
        setValidationErrors([]);
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    // Validate required
    const errors: number[] = [];
    form?.preguntas.forEach(q => {
      if (q.esObligatoria) {
        const isTutorQ = q.titulo.toLowerCase().includes('tutor') || q.titulo.toLowerCase().includes('acudiente');
        let shouldValidate = true;
        if (isTutorQ) {
          const menorEdadQ = form.preguntas.find(pq => pq.titulo.toLowerCase().includes('menor de edad') || pq.titulo.toLowerCase().includes('menor de 18'));
          const menorEdadResp = menorEdadQ ? respuestas.find(r => r.idPregunta === menorEdadQ.id)?.valor : null;
          if (menorEdadResp !== 'Sí' && menorEdadResp !== 'si' && menorEdadResp !== 'SI') {
            shouldValidate = false;
          }
        }
        
        if (shouldValidate) {
          const resp = respuestas.find(r => r.idPregunta === q.id);
          if (!resp || !resp.valor || (Array.isArray(resp.valor) && resp.valor.length === 0)) {
            errors.push(q.id as number);
          }
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
      // Email en body Y en query params — doble vía para garantizar que nexiEmail se guarde
      const postParams: Record<string, string> = {};
      if (isEmbed) { postParams.embed = 'true'; if (emailParam) postParams.email = emailParam; }

      await axios.post(
        `formulario-publico/${slug}/responder`,
        {
          respuestas,
          ...(isEmbed ? { embed: true } : {}),
          ...(isEmbed && emailParam ? { nexiEmail: emailParam } : {}),
          ...(modoEdicion ? { forzar_actualizacion: true } : {}),
        },
        { params: postParams },
      );

      // Si el formulario se abrió desde un evento, inscribir automáticamente al usuario
      if (fromEventId) {
        try {
          await axios.post(`eventos-multimedia/${fromEventId}/register`);
        } catch (regErr) {
          console.error('Error registering user to event after response submission:', regErr);
        }
      }

      setModoEdicion(false);
      setEnviado(true);
      window.scrollTo(0, 0);
      if (isEmbed) {
        window.parent.postMessage({ type: 'nexiservice:form-submitted' }, '*');
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.ya_inscrito) {
        const d = err.response.data;
        if (d.mismo_login && d.respuesta_anterior) {
          // Mismo login: mostrar sus datos con opción de editar
          setRespuestaAnterior(d.respuesta_anterior);
          setRegistradoEn(d.registrado_en || null);
          setEditadoEn(d.editado_en || null);
          setYaInscrito(true);
        } else {
          // Otro login: bloquear sin mostrar datos ajenos
          setAlertMsg({ text: d.mensaje || 'Estos datos ya están registrados por otra persona.', tipo: 'info' });
        }
        setEnviando(false);
        return;
      }
      setAlertMsg({ text: err.response?.data?.error || 'Error al enviar formulario. Por favor, inténtalo de nuevo.', tipo: 'error' });
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
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-white font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/', { state: { openEventId: fromEventId } })}
              className="flex-1 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  if (yaInscrito) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-lg text-center overflow-hidden"
          style={{ borderTop: `10px solid ${form.colorTema}` }}
        >
          <div className="p-10 md:p-14 flex flex-col items-center gap-5">
            <div
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-1 shadow-lg shadow-black/5"
              style={{ backgroundColor: `${form.colorTema}10`, color: form.colorTema }}
            >
              <ClipboardCheck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white text-center">{form.titulo}</h1>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: form.colorTema }}>
              Ya estás inscrito
            </h2>
            <p className="text-xs text-neutral-450 dark:text-neutral-400 font-semibold leading-relaxed text-center">
              Tu inscripción está registrada. Si necesitas actualizar tus datos puedes editar tu inscripción — el documento y el correo no se pueden modificar.
            </p>

            {/* Timestamps */}
            <div className="w-full flex flex-col sm:flex-row gap-3 mt-1">
              {registradoEn && (
                <div className="flex-1 flex flex-col gap-1 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl px-4 py-3 border border-neutral-100 dark:border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Inscrito el</span>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-250">
                    {new Date(registradoEn).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
              )}
              {editadoEn && editadoEn !== registradoEn && (
                <div className="flex-1 flex flex-col gap-1 bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-4 py-3 border border-amber-200/60 dark:border-amber-700/30">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Última edición</span>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-250">
                    {new Date(editadoEn).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2 justify-center">
              <button
                className="text-white font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: form.colorTema }}
                onClick={entrarModoEdicion}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Editar inscripción
              </button>
              {!isEmbed && (
                <button
                  className="text-neutral-700 dark:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={() => navigate('/', { state: { openEventId: fromEventId } })}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 justify-center">
              {!form.requiereAutenticacion && !isEmbed && (
                <button
                  className="text-white font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: form.colorTema, boxShadow: `0 10px 15px -3px ${form.colorTema}35` }}
                  onClick={() => window.location.reload()}
                >
                  Enviar otra respuesta
                </button>
              )}
              {!isEmbed && (
                <button
                  className="text-neutral-700 dark:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={() => navigate('/', { state: { openEventId: fromEventId } })}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              )}
            </div>
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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-neutral-950" data-no-uppercase>

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
        
        {/* Back Button */}
        {!isEmbed && (
          <button
            type="button"
            onClick={() => {
              navigate('/', { state: { openEventId: fromEventId } });
            }}
            className="group mb-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[9px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] w-fit cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Dashboard</span>
          </button>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main Title Card */}
          <div 
            className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl mb-8 overflow-hidden relative"
            style={{ borderTop: `10px solid ${form.colorTema}` }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: form.colorTema }} />
            
            {/* Dynamic Banner Header */}
            <div className={`flex items-center gap-4 p-6 rounded-[2rem] bg-gradient-to-br ${headerMeta.bg} border border-neutral-100/10 dark:border-white/5 mb-8 shadow-inner`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-coal-300 shadow-lg ${headerMeta.textColor}`}>
                {headerMeta.icon}
              </div>
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 dark:bg-neutral-800 shadow-sm ${headerMeta.textColor}`}>
                  {headerMeta.label}
                </span>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-bold uppercase tracking-widest mt-1.5">Completa este cuestionario oficial</p>
              </div>
            </div>

            {modoEdicion && (
              <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Editando respuesta anterior — los cambios reemplazarán tu registro previo
                </span>
              </div>
            )}
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
          {form.preguntas.map((q) => {
            // Check if this is a tutor/acudiente question
            const isTutorQ = q.titulo.toLowerCase().includes('tutor') || q.titulo.toLowerCase().includes('acudiente');
            if (isTutorQ) {
              const menorEdadQ = form.preguntas.find(pq => pq.titulo.toLowerCase().includes('menor de edad') || pq.titulo.toLowerCase().includes('menor de 18'));
              const menorEdadResp = menorEdadQ ? respuestas.find(r => r.idPregunta === menorEdadQ.id)?.valor : null;
              if (menorEdadResp !== 'Sí' && menorEdadResp !== 'si' && menorEdadResp !== 'SI') {
                return null; // Skip rendering tutor questions if not a minor
              }
            }

            const resp = respuestas.find(r => r.idPregunta === q.id);
            const isError = validationErrors.includes(q.id as number);
            const isLocked = modoEdicion && isIdentificationField(q.titulo);

            const scaleConfig = q.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' };
            const scaleArray = Array.from({ length: scaleConfig.max - scaleConfig.min + 1 }, (_, i) => scaleConfig.min + i);

            return (
              <div
                key={q.id}
                id={`question-${q.id}`}
                className={`bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border mb-6 transition-all duration-300 shadow-xl ${
                  isError
                    ? 'border-red-500/40 shadow-red-500/[0.02]'
                    : isLocked
                    ? 'border-neutral-200 dark:border-white/10 opacity-70'
                    : 'border-neutral-100 dark:border-white/5 hover:shadow-2xl'
                }`}
                style={{ borderLeft: `6px solid ${isLocked ? '#9ca3af' : form.colorTema + '30'}` }}
              >
                <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2 leading-relaxed flex items-center gap-2">
                  {q.titulo} {q.esObligatoria && <span className="text-rose-500 ml-1">*</span>}
                  {isLocked && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 ml-1">
                      No editable
                    </span>
                  )}
                </h3>
                {q.descripcion && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-6">{q.descripcion}</p>}
                
                <div className="mt-6">
                  {/* TEXT CORTO */}
                  {q.tipo === 'texto_corto' && (
                    <input
                      type="text"
                      className={`w-full max-w-md border px-5 py-4 text-xs font-semibold rounded-2xl outline-none transition-all ${
                        isLocked
                          ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-250 dark:border-neutral-700 text-neutral-700 dark:text-white'
                      }`}
                      placeholder="Escribe tu respuesta corta..."
                      value={resp?.valor || ''}
                      readOnly={isLocked}
                      onChange={(e) => !isLocked && handleChange(q.id!, e.target.value)}
                      onFocus={(e) => {
                        if (!isLocked) { e.target.style.borderColor = form.colorTema; e.target.style.boxShadow = `0 0 0 4px ${form.colorTema}20`; }
                      }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    />
                  )}
                  
                  {/* TEXT LARGO */}
                  {q.tipo === 'texto_largo' && (
                    <textarea
                      className={`w-full border px-5 py-4 text-xs font-semibold rounded-2xl outline-none transition-all ${
                        isLocked
                          ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-250 dark:border-neutral-700 text-neutral-700 dark:text-white'
                      }`}
                      rows={4}
                      placeholder="Escribe tu respuesta detallada aquí..."
                      value={resp?.valor || ''}
                      readOnly={isLocked}
                      onChange={(e) => !isLocked && handleChange(q.id!, e.target.value)}
                      style={{ resize: isLocked ? 'none' : 'vertical' }}
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
                        className="w-full bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none transition-all cursor-pointer text-neutral-700 dark:text-white"
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
                    <div className="flex flex-col gap-6 py-6 px-8 bg-neutral-50/50 dark:bg-coal-400 rounded-[2.5rem] border border-neutral-100/50 dark:border-white/5 shadow-inner">
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

                           {q.tipo === 'fecha' && (
                    <div 
                      className="flex items-center gap-3 bg-neutral-50 dark:bg-coal-400 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-coal-200 transition-all"
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
                        className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-700 dark:text-white" 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    </div>
                  )}
 
                  {/* HORA */}
                  {q.tipo === 'hora' && (
                    <div 
                      className="flex items-center gap-3 bg-neutral-50 dark:bg-coal-400 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-coal-200 transition-all"
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
                        className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-700 dark:text-white" 
                        value={resp?.valor || ''}
                        onChange={(e) => handleChange(q.id!, e.target.value)}
                      />
                    </div>
                  )}
                  {/* ARCHIVO */}
                  {q.tipo === 'archivo' && (
                    <div className="mt-2 w-full max-w-md flex flex-col gap-4">
                      {(() => {
                        const files = filePreviews[q.id!] || [];
                        return (
                          <>
                            {files.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {files.map((fileInfo, idx) => {
                                  const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(fileInfo.url);
                                  const isWord = /\.(doc|docx)$/i.test(fileInfo.url);
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-white/5 shadow-inner">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div 
                                          className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center border border-neutral-200/20 ${isImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                          onClick={() => isImage && setActiveLightboxUrl(fileInfo.url)}
                                        >
                                          {isImage ? (
                                            <img src={fileInfo.url} alt="Archivo" className="w-full h-full object-cover" />
                                          ) : isWord ? (
                                            <FileText className="w-5 h-5 text-blue-500" />
                                          ) : (
                                            <File className="w-5 h-5 text-rose-500" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate max-w-[100px]">{fileInfo.name}</h4>
                                          <a href={fileInfo.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-1">
                                            <Eye className="w-3 h-3" /> Ver
                                          </a>
                                        </div>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveFile(q.id!, idx)}
                                        className="w-8 h-8 rounded-full hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-coal-100 rounded-2xl cursor-pointer hover:border-indigo-500 transition-colors">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx,image/*"
                                multiple
                                onChange={(e) => e.target.files && handleMultipleFilesUpload(q.id!, e.target.files)}
                                disabled={uploadingFileId === q.id!}
                              />
                              <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                                {uploadingFileId === q.id! ? (
                                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 text-neutral-450" />
                                )}
                              </div>
                              <span className="text-xs font-bold text-neutral-850 dark:text-neutral-250">Seleccionar archivos</span>
                              <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-widest mt-1">PDF, Word o Imagen (Máx 20MB)</span>
                            </label>
                            {fileError && (
                              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{fileError}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
                    <span>{modoEdicion ? 'Actualizar Inscripción' : 'Enviar Formulario'}</span>
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
        <div className="text-center pb-12 mt-8 flex flex-col items-center gap-1.5 opacity-80">
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
      </div>

      {/* Confirm dialog estilizado — reemplaza window.confirm() */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-white/5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-rose-500" />
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-neutral-800 dark:text-white leading-relaxed">
                {confirmDialog.text}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert estilizado — reemplaza alert() nativo */}
      {alertMsg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border overflow-hidden"
            style={{ borderColor: alertMsg.tipo === 'error' ? '#ef444430' : `${form?.colorTema}30` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Franja superior de color */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: alertMsg.tipo === 'error' ? '#ef4444' : (form?.colorTema ?? '#6366f1') }}
            />
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: alertMsg.tipo === 'error' ? '#ef444415' : `${form?.colorTema}15`,
                  color: alertMsg.tipo === 'error' ? '#ef4444' : (form?.colorTema ?? '#6366f1'),
                }}
              >
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
                  {alertMsg.tipo === 'error' ? 'Error' : 'Aviso'}
                </p>
                <p className="text-sm font-bold text-neutral-800 dark:text-white leading-relaxed">
                  {alertMsg.text}
                </p>
              </div>
              <button
                onClick={() => setAlertMsg(null)}
                className="mt-1 px-8 py-3 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all"
                style={{
                  backgroundColor: alertMsg.tipo === 'error' ? '#ef4444' : (form?.colorTema ?? '#6366f1'),
                  boxShadow: `0 8px 20px ${alertMsg.tipo === 'error' ? '#ef444440' : `${form?.colorTema ?? '#6366f1'}40`}`,
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

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

export default FormPublicPage;
