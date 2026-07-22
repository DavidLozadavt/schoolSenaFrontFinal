import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FormData, FormQuestion } from './formBuilderTypes';
import QuestionCard from './QuestionCard';
import FormResponsesTab from './FormResponsesTab';
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ListTodo, 
  Eye, 
  BarChart2, 
  Globe, 
  Lock, 
  Save, 
  Palette, 
  Plus, 
  UploadCloud 
} from 'lucide-react';

const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'respuestas' | 'vista_previa'>(
    window.history.state?.usr?.activeTab || 'editor'
  );

  useEffect(() => {
    if (window.history.state?.usr?.activeTab) {
      setActiveTab(window.history.state.usr.activeTab as any);
    }
  }, [id]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    titulo: 'Formulario sin título',
    descripcion: '',
    colorTema: '#6366f1',
    estado: 'borrador',
    requiereAutenticacion: false,
    preguntas: [
      {
        id: `new-q-${Date.now()}`,
        tipo: 'opcion_multiple',
        titulo: 'Pregunta sin título',
        esObligatoria: false,
        orden: 1,
        opciones: [{ id: `new-o-${Date.now()}`, texto: 'Opción 1', orden: 1 }]
      }
    ]
  });

  useEffect(() => {
    if (id) {
      fetchForm();
    } else if (window.history.state?.usr?.template) {
      applyTemplate(window.history.state.usr.template);
    }
  }, [id]);

  const applyTemplate = (templateId: string) => {
    let templateData: any = null;
    switch (templateId) {
      case 'satisfaccion':
        templateData = {
          titulo: '🌟 Encuesta de Satisfacción de Usuario',
          descripcion: '¡Tu opinión es sumamente valiosa para nosotros! Por favor, tómate unos minutos para evaluar tu experiencia y ayudarnos a perfeccionar continuamente la calidad de nuestros servicios y procesos académicos.',
          colorTema: '#10b981', // Emerald Green
          estado: 'borrador',
          requiereAutenticacion: false,
          preguntas: [
            { 
              id: `q-1`, 
              tipo: 'escala_lineal', 
              titulo: '⭐ ¿Qué tan satisfecho estás con la atención recibida por nuestro personal?', 
              descripcion: 'Califica de 1 a 5 tu interacción en general con nuestro equipo.',
              esObligatoria: true, 
              orden: 1, 
              configuracion: { min: 1, max: 5, minLabel: 'Muy insatisfecho 😞', maxLabel: 'Excelente servicio 😄' }, 
              opciones: [] 
            },
            { 
              id: `q-2`, 
              tipo: 'opcion_multiple', 
              titulo: '✨ ¿Recomendarías nuestros programas o servicios a un amigo o colega?', 
              descripcion: 'Tu recomendación es el reflejo de nuestro compromiso.',
              esObligatoria: true, 
              orden: 2, 
              opciones: [
                { id: 'o1', texto: 'Sí, definitivamente 💖', orden: 1 }, 
                { id: 'o2', texto: 'Probablemente sí 👍', orden: 2 }, 
                { id: 'o3', texto: 'Tal vez, con ciertas mejoras 🤔', orden: 3 },
                { id: 'o4', texto: 'No, por el momento ❌', orden: 4 }
              ] 
            },
            { 
              id: `q-3`, 
              tipo: 'casillas', 
              titulo: '🛠️ ¿Qué aspectos de nuestro servicio destacarías positivamente? (Selecciona todas las opciones aplicables)', 
              descripcion: 'Selecciona las áreas donde sientas que sobresalimos.',
              esObligatoria: false, 
              orden: 3, 
              opciones: [
                { id: 'o5', texto: 'Amabilidad, respeto y trato profesional del personal 👤', orden: 1 }, 
                { id: 'o6', texto: 'Rapidez de respuesta y solución efectiva de dudas ⚡', orden: 2 }, 
                { id: 'o7', texto: 'Calidad, estructura y utilidad del servicio formativo 💎', orden: 3 }, 
                { id: 'o8', texto: 'Comodidad, tecnología y accesibilidad de las instalaciones 🏢', orden: 4 }
              ] 
            },
            { 
              id: `q-4`, 
              tipo: 'texto_largo', 
              titulo: '💬 ¿Tienes alguna sugerencia específica o comentario adicional para mejorar?', 
              descripcion: 'Tu feedback es el motor que impulsa nuestro crecimiento continuo.',
              esObligatoria: false, 
              orden: 4, 
              opciones: [] 
            }
          ]
        };
        break;
      case 'evaluacion':
        templateData = {
          titulo: '📊 Evaluación y Feedback de Evento',
          descripcion: '¡Muchas gracias por acompañarnos en este evento! Te agradecemos de corazón que completes esta breve evaluación académica y logística, la cual nos permitirá seguir diseñando espacios de formación de altísimo impacto para ti.',
          colorTema: '#3b82f6', // Bright Blue
          estado: 'borrador',
          requiereAutenticacion: false,
          preguntas: [
            { 
              id: `q-1`, 
              tipo: 'opcion_multiple', 
              titulo: '🎯 ¿El contenido expuesto en el evento cumplió con tus expectativas iniciales?', 
              descripcion: 'Indica si los temas abordados se alinearon con los objetivos propuestos.',
              esObligatoria: true, 
              orden: 1, 
              opciones: [
                { id: 'o1', texto: 'Totalmente de acuerdo ⭐⭐⭐⭐⭐', orden: 1 }, 
                { id: 'o2', texto: 'De acuerdo ⭐⭐⭐', orden: 2 }, 
                { id: 'o3', texto: 'En desacuerdo ⭐⭐', orden: 3 },
                { id: 'o4', texto: 'Totalmente en desacuerdo ⭐', orden: 4 }
              ] 
            },
            { 
              id: `q-2`, 
              tipo: 'escala_lineal', 
              titulo: '⏱️ ¿Cómo calificarías la organización logística y el cumplimiento del cronograma?', 
              descripcion: 'Valora la puntualidad de los ponentes, la fluidez técnica y el soporte del evento.',
              esObligatoria: true, 
              orden: 2, 
              configuracion: { min: 1, max: 5, minLabel: 'Logística deficiente ⚠️', maxLabel: 'Logística impecable 💯' }, 
              opciones: [] 
            },
            { 
              id: `q-3`, 
              tipo: 'casillas', 
              titulo: '💡 ¿Qué módulos o dinámicas te resultaron más útiles e interesantes?', 
              descripcion: 'Puedes marcar varias opciones según tu experiencia en la jornada.',
              esObligatoria: false, 
              orden: 3, 
              opciones: [
                { id: 'o5', texto: 'Conferencias magistrales y ponencias teóricas 🎙️', orden: 1 }, 
                { id: 'o6', texto: 'Talleres prácticos, laboratorios e interacción en vivo 💻', orden: 2 }, 
                { id: 'o7', texto: 'Espacio participativo de debate, preguntas y respuestas 🗣️', orden: 3 }, 
                { id: 'o8', texto: 'Material didáctico interactivo, diapositivas y guías de apoyo 📄', orden: 4 }
              ] 
            },
            { 
              id: `q-4`, 
              tipo: 'texto_largo', 
              titulo: '🚀 ¿Qué temáticas adicionales o áreas de interés te gustaría que abordáramos en próximos eventos?', 
              descripcion: 'Escribe libremente los temas académicos o tecnológicos de tu preferencia.',
              esObligatoria: false, 
              orden: 4, 
              opciones: [] 
            }
          ]
        };
        break;
      case 'registro':
        templateData = {
          titulo: '📝 Formulario de Inscripción y Registro Oficial',
          descripcion: '¡Asegura tu cupo de forma inmediata! Completa este registro para reservar tu plaza en nuestra próxima actividad formativa. El enlace de acceso y el cronograma del evento te serán enviados a tu correo electrónico.',
          colorTema: '#f59e0b', // Amber Orange
          estado: 'borrador',
          requiereAutenticacion: false,
          preguntas: [
            { 
              id: `q-1`, 
              tipo: 'texto_corto', 
              titulo: '👤 Nombre completo del participante', 
              descripcion: 'Por favor, escribe tu nombre tal como deseas que figure en tu certificado digital.',
              esObligatoria: true, 
              orden: 1, 
              opciones: [] 
            },
            { 
              id: `q-2`, 
              tipo: 'desplegable', 
              titulo: '🪪 Tipo de documento de identidad', 
              descripcion: 'Selecciona tu tipo de documento.',
              esObligatoria: true, 
              orden: 2, 
              opciones: [
                { id: 'dt1', texto: 'Cédula de Ciudadanía (CC)', orden: 1 },
                { id: 'dt2', texto: 'Tarjeta de Identidad (TI)', orden: 2 },
                { id: 'dt3', texto: 'Registro Civil (RC)', orden: 3 },
                { id: 'dt4', texto: 'Cédula de Extranjería (CE)', orden: 4 },
                { id: 'dt5', texto: 'Permiso Especial de Permanencia (PEP)', orden: 5 }
              ] 
            },
            { 
              id: `q-3`, 
              tipo: 'texto_corto', 
              titulo: '🔢 Número de documento', 
              descripcion: 'Escribe tu número de identificación sin puntos ni espacios.',
              esObligatoria: true, 
              orden: 3, 
              opciones: [] 
            },
            { 
              id: `q-4`, 
              tipo: 'texto_corto', 
              titulo: '📧 Correo electrónico institucional o personal de contacto', 
              descripcion: 'Aquí te enviaremos las credenciales de acceso a la sala virtual y memorias del evento.',
              esObligatoria: true, 
              orden: 4, 
              opciones: [] 
            },
            { 
              id: `q-5`, 
              tipo: 'texto_corto', 
              titulo: '📞 Teléfono de contacto', 
              descripcion: 'Escribe tu número telefónico o celular principal.',
              esObligatoria: true, 
              orden: 5, 
              opciones: [] 
            },
            { 
              id: `q-6`, 
              tipo: 'casillas', 
              titulo: '📢 ¿Cómo te enteraste de la convocatoria para este evento?', 
              descripcion: 'Nos ayuda a saber qué medios de comunicación son más efectivos.',
              esObligatoria: false, 
              orden: 6, 
              opciones: [
                { id: 'o5', texto: 'Publicación oficial en Redes Sociales (Facebook, Instagram, LinkedIn) 📱', orden: 1 }, 
                { id: 'o6', texto: 'Boletín de novedades enviado por Correo Electrónico ✉️', orden: 2 }, 
                { id: 'o7', texto: 'Recomendación directa de un colega, familiar o amigo 👥', orden: 3 }, 
                { id: 'o8', texto: 'Anuncio destacado en nuestro Portal Web VirtualT 🌐', orden: 4 }
              ] 
            },
            { 
              id: `q-7`, 
              tipo: 'opcion_multiple', 
              titulo: '🔞 ¿Eres menor de edad (menor de 18 años)?', 
              descripcion: 'Si eres menor de edad, requerimos obligatoriamente la información de tu tutor.',
              esObligatoria: true, 
              orden: 7, 
              opciones: [
                { id: 'me1', texto: 'Sí', orden: 1 },
                { id: 'me2', texto: 'No', orden: 2 }
              ] 
            },
            { 
              id: `q-8`, 
              tipo: 'texto_corto', 
              titulo: '👤 Nombre completo del tutor / acudiente', 
              descripcion: 'Nombre completo de la persona adulta responsable.',
              esObligatoria: true, 
              orden: 8, 
              opciones: [] 
            },
            { 
              id: `q-9`, 
              tipo: 'texto_corto', 
              titulo: '🔢 Documento de identidad del tutor / acudiente', 
              descripcion: 'Número de documento de identidad del acudiente.',
              esObligatoria: true, 
              orden: 9, 
              opciones: [] 
            },
            { 
              id: `q-10`, 
              tipo: 'texto_corto', 
              titulo: '📧 Correo electrónico del tutor / acudiente', 
              descripcion: 'Dirección de correo electrónico de tu tutor o acudiente.',
              esObligatoria: true, 
              orden: 10, 
              opciones: [] 
            },
            { 
              id: `q-11`, 
              tipo: 'texto_corto', 
              titulo: '📞 Teléfono del tutor / acudiente', 
              descripcion: 'Número celular o de contacto de tu acudiente.',
              esObligatoria: true, 
              orden: 11, 
              opciones: [] 
            },
            { 
              id: `q-12`, 
              tipo: 'archivo', 
              titulo: '📂 Cargar certificados de estudio', 
              descripcion: 'Sube tu último certificado de estudios o documentos necesarios en formato PDF o Imagen.',
              esObligatoria: true, 
              orden: 12, 
              opciones: [] 
            }
          ]
        };
        break;
    }
    if (templateData) {
      setFormData(templateData);
    }
  };

  const fetchForm = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`formularios/${id}`);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching form', error);
      showToast('Error al cargar el formulario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (estado?: string) => {
    setSaving(true);
    const dataToSave = { ...formData };
    if (estado) {
      dataToSave.estado = estado;
    }

    try {
      if (id) {
        const { data } = await axios.put(`formularios/${id}`, dataToSave);
        setFormData(data);
        showToast('Formulario guardado con éxito', 'success');
      } else {
        const { data } = await axios.post('formularios', dataToSave);
        showToast('Formulario creado con éxito', 'success');
        navigate(`/formularios/builder/${data.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving form', error);
      showToast('Error al guardar el formulario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = () => {
    const nuevoEstado = formData.estado === 'borrador' ? 'publicado' : 'borrador';
    setFormData({ ...formData, estado: nuevoEstado });
    handleSave(nuevoEstado);
  };

  const addQuestion = () => {
    const newQ: FormQuestion = {
      id: `new-q-${Date.now()}`,
      tipo: 'opcion_multiple',
      titulo: 'Pregunta',
      esObligatoria: false,
      orden: formData.preguntas.length + 1,
      opciones: [{ id: `new-o-${Date.now()}`, texto: 'Opción 1', orden: 1 }]
    };
    setFormData({ ...formData, preguntas: [...formData.preguntas, newQ] });
  };

  const updateQuestion = (index: number, updatedQuestion: FormQuestion) => {
    const newQuestions = [...formData.preguntas];
    newQuestions[index] = updatedQuestion;
    setFormData({ ...formData, preguntas: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = formData.preguntas.filter((_, i) => i !== index);
    setFormData({ ...formData, preguntas: newQuestions });
  };

  const duplicateQuestion = (index: number) => {
    const qToDuplicate = formData.preguntas[index];
    const newQ: FormQuestion = {
      ...qToDuplicate,
      id: `new-q-${Date.now()}`,
      orden: formData.preguntas.length + 1,
      opciones: qToDuplicate.opciones.map((o, idx) => ({ ...o, id: `new-o-${Date.now()}-${idx}` }))
    };
    const newQuestions = [...formData.preguntas];
    newQuestions.splice(index + 1, 0, newQ);
    setFormData({ ...formData, preguntas: newQuestions });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...formData.preguntas];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index - 1];
    newQuestions[index - 1] = temp;
    // update orden values
    newQuestions.forEach((q, i) => q.orden = i + 1);
    setFormData({ ...formData, preguntas: newQuestions });
  };

  const moveDown = (index: number) => {
    if (index === formData.preguntas.length - 1) return;
    const newQuestions = [...formData.preguntas];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + 1];
    newQuestions[index + 1] = temp;
    // update orden values
    newQuestions.forEach((q, i) => q.orden = i + 1);
    setFormData({ ...formData, preguntas: newQuestions });
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/formulario/${id}`;
    navigator.clipboard.writeText(url);
    showToast('Enlace copiado al portapapeles', 'success');
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center h-400px">
      <div className="spinner-border text-primary" role="status"></div>
      <span className="ms-3 fw-bolder fs-5">Cargando formulario...</span>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 pb-20">
      
      {/* Simple Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform scale-100 border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 backdrop-blur-xl animate-bounce-short">
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-black uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button className="btn btn-sm btn-light font-black uppercase tracking-widest text-[9px] py-3.5 px-6 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all border border-neutral-150 dark:border-white/5" onClick={() => navigate('/formularios')}>
          <ArrowLeft className="w-4 h-4" /> Volver a formularios
        </button>

        {formData.estado === 'publicado' && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-dashed border-emerald-500/25 rounded-2xl px-5 py-3 cursor-pointer hover:scale-[1.01] transition-all text-emerald-600 dark:text-emerald-400" onClick={copyPublicLink} title="Copiar enlace">
            <LinkIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Enlace público: /formulario/{id}</span>
            <Copy className="w-4 h-4 ms-2" />
          </div>
        )}
      </div>

      {/* Main Builder Card */}
      <div className="flex flex-col mb-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl overflow-hidden relative" style={{ borderTop: `10px solid ${formData.colorTema}` }}>
        <div className="p-8 md:p-12 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-neutral-100 dark:border-white/5 pb-6 mb-2 gap-4">
            <h3 className="text-xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">Editor de Formulario</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Tab Selector inside builder */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200/20 shadow-inner">
                <button
                  className={`btn btn-sm font-black uppercase tracking-widest text-[9px] py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'editor' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-700'}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <ListTodo className="w-3.5 h-3.5" /> Preguntas
                </button>
                <button
                  className={`btn btn-sm font-black uppercase tracking-widest text-[9px] py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'vista_previa' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-700'}`}
                  onClick={() => setActiveTab('vista_previa')}
                >
                  <Eye className="w-3.5 h-3.5" /> Vista Previa
                </button>
                <button
                  className={`btn btn-sm font-black uppercase tracking-widest text-[9px] py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'respuestas' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-700'}`}
                  onClick={() => setActiveTab('respuestas')}
                  disabled={!id}
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Respuestas
                </button>
              </div>

              <button 
                className="btn btn-sm btn-light hover:scale-105 active:scale-95 transition-all text-neutral-500 hover:text-blue-500 py-3 px-4 rounded-xl border border-neutral-100 dark:border-white/5" 
                onClick={() => window.open(`/formulario/${id || 'preview'}`, '_blank')} 
                disabled={!id} 
                title="Vista previa"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button 
                className={`btn btn-sm hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[9px] py-3 px-6 rounded-xl border flex items-center gap-1.5 ${formData.estado === 'publicado' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`} 
                onClick={toggleEstado}
                disabled={saving || !id}
              >
                {formData.estado === 'publicado' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{formData.estado === 'publicado' ? 'Publicado' : 'Borrador'}</span>
              </button>

              <button 
                className="btn btn-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest text-[9px] py-3 px-6 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20" 
                onClick={() => handleSave()} 
                disabled={saving || activeTab === 'respuestas'}
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Guardar</span>
              </button>
            </div>
          </div>
          
          {activeTab === 'editor' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 mb-4">
                
                {/* Título del Formulario */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Título del Formulario</label>
                  <input
                    type="text"
                    className="w-full bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-4 text-lg font-black text-neutral-800 dark:text-white rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Escribe el título oficial del formulario..."
                  />
                </div>

                {/* Descripción del Formulario */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Descripción o Instrucciones</label>
                  <textarea
                    className="w-full bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-4 text-sm font-semibold text-neutral-850 dark:text-neutral-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={formData.descripcion || ''}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Escribe una breve descripción o instrucciones para guiar a los participantes..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
                
              </div>

              {/* Tema y Configuración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-neutral-50/50 dark:bg-neutral-800/10 border border-dashed border-neutral-250 dark:border-white/5 rounded-3xl">
                 <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 shadow-sm">
                        <Palette className="w-5 h-5" style={{ color: formData.colorTema }} />
                     </div>
                     <div className="flex flex-col">
                        <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white">Color del tema</label>
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Elige el color principal</span>
                     </div>
                   </div>
                   <input 
                     type="color" 
                     className="w-10 h-10 p-0 border-0 rounded-xl cursor-pointer overflow-hidden shadow-sm shrink-0" 
                     value={formData.colorTema} 
                     onChange={(e) => setFormData({ ...formData, colorTema: e.target.value })} 
                   />
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col">
                       <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white" htmlFor="reqAuth">
                         Limitar a usuarios
                       </label>
                       <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Requiere iniciar sesión</span>
                    </div>
                    <div className="form-check form-switch form-check-custom form-check-solid flex items-center">
                      <input 
                        className="form-check-input h-[24px] w-[44px] cursor-pointer" 
                        type="checkbox" 
                        checked={formData.requiereAutenticacion}
                        onChange={(e) => setFormData({ ...formData, requiereAutenticacion: e.target.checked })}
                        id="reqAuth" 
                      />
                    </div>
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="questions-container relative">
          {formData.preguntas.map((q, idx) => (
            <QuestionCard
              key={q.id}
              index={idx}
              question={q}
              isFirst={idx === 0}
              isLast={idx === formData.preguntas.length - 1}
              accentColor={formData.colorTema}
              updateQuestion={updateQuestion}
              removeQuestion={removeQuestion}
              duplicateQuestion={duplicateQuestion}
              moveUp={moveUp}
              moveDown={moveDown}
            />
          ))}

          {/* Floating action button for new question */}
          <div className="flex justify-center mt-8 mb-10 pb-10">
            <button className="w-14 h-14 rounded-full shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-300" onClick={addQuestion} title="Agregar pregunta" style={{ backgroundColor: formData.colorTema }}>
              <Plus className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'vista_previa' && (
        <FormPreviewSection data={formData} />
      )}

      {activeTab === 'respuestas' && (
        <FormResponsesTab formularioId={id!} />
      )}
    </div>
  );
};

const FormPreviewSection: React.FC<{ data: FormData }> = ({ data }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[760px] mx-auto px-4 pb-20">
      {/* Title Card */}
      <div 
        className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl relative overflow-hidden"
        style={{ borderTop: `10px solid ${data.colorTema}` }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: data.colorTema }} />
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            Vista Previa en Tiempo Real
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-4">{data.titulo || 'Formulario sin título'}</h1>
        {data.descripcion && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
            {data.descripcion}
          </p>
        )}
      </div>

      {/* Questions list */}
      {data.preguntas.map((q, idx) => {
        const scaleConfig = q.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' };
        const scaleArray = Array.from({ length: scaleConfig.max - scaleConfig.min + 1 }, (_, i) => scaleConfig.min + i);

        const isTutorQ = q.titulo?.toLowerCase().includes('tutor') || q.titulo?.toLowerCase().includes('acudiente');
        return (
          <div 
            key={q.id || idx}
            className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-lg"
            style={{ borderLeft: `6px solid ${data.colorTema}30` }}
          >
            <h3 className="text-xs font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2 leading-relaxed flex items-center flex-wrap gap-2">
              <span>{q.titulo || 'Pregunta sin título'}</span>
              {q.esObligatoria && <span className="text-rose-500">*</span>}
              {isTutorQ && (
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                  Condicional Tutor
                </span>
              )}
            </h3>
            {q.descripcion && <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-4">{q.descripcion}</p>}
            
            <div className="mt-4">
              {q.tipo === 'texto_corto' && (
                <input 
                  type="text" 
                  disabled
                  className="w-full max-w-md bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 text-xs font-semibold rounded-2xl outline-none text-neutral-800 dark:text-white"
                  placeholder="Respuesta corta..."
                />
              )}

              {q.tipo === 'texto_largo' && (
                <textarea 
                  disabled
                  className="w-full bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 text-xs font-semibold rounded-2xl outline-none text-neutral-800 dark:text-white"
                  rows={3}
                  placeholder="Respuesta larga..."
                />
              )}

              {q.tipo === 'opcion_multiple' && (
                <div className="flex flex-col gap-2">
                  {(q.opciones || []).map(opt => (
                    <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50/50 dark:bg-coal-400 border border-neutral-100/50">
                      <input type="radio" disabled className="w-4 h-4" style={{ accentColor: data.colorTema }} />
                      <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.tipo === 'casillas' && (
                <div className="flex flex-col gap-2">
                  {(q.opciones || []).map(opt => (
                    <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50/50 dark:bg-coal-400 border border-neutral-100/50">
                      <input type="checkbox" disabled className="w-4 h-4" style={{ accentColor: data.colorTema }} />
                      <span className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.tipo === 'desplegable' && (
                <select disabled className="w-full max-w-xs bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white">
                  <option>Selecciona una opción...</option>
                  {(q.opciones || []).map(opt => (
                    <option key={opt.id}>{opt.texto}</option>
                  ))}
                </select>
              )}

              {q.tipo === 'escala_lineal' && (
                <div className="flex flex-col gap-4 py-4 px-6 bg-neutral-50/50 dark:bg-coal-400 rounded-2xl border border-neutral-100/50 dark:border-white/5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {scaleArray.map(n => (
                      <button
                        key={n}
                        type="button"
                        disabled
                        className="w-10 h-10 rounded-full font-black text-xs flex items-center justify-center border border-neutral-200/50 bg-white dark:bg-coal-300 text-neutral-800 dark:text-white"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase text-neutral-400">
                    <span>{scaleConfig.minLabel || 'Bajo'}</span>
                    <span>{scaleConfig.maxLabel || 'Alto'}</span>
                  </div>
                </div>
              )}

              {q.tipo === 'fecha' && (
                <input 
                  type="date" 
                  disabled
                  className="bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white"
                />
              )}

              {q.tipo === 'archivo' && (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-coal-200 rounded-3xl cursor-not-allowed bg-neutral-50/20 dark:bg-coal-400/20">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-coal-300 flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6 text-neutral-400" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 dark:text-white">Cargar archivo adjunto (PDF o Imagen)</span>
                  <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-widest mt-1">Arrastra aquí o haz clic (Máx 5MB)</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormBuilderPage;
