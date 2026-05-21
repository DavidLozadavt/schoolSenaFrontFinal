import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FormData, FormQuestion } from './formBuilderTypes';
import QuestionCard from './QuestionCard';
import FormResponsesTab from './FormResponsesTab';

const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'respuestas'>('editor');
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
          titulo: 'Encuesta de Satisfacción',
          descripcion: 'Ayúdanos a mejorar nuestros servicios',
          colorTema: '#10b981',
          estado: 'borrador',
          requiereAutenticacion: false,
          preguntas: [
            { id: `q-1`, tipo: 'escala_lineal', titulo: '¿Qué tan satisfecho estás con el servicio?', esObligatoria: true, orden: 1, configuracion: { min: 1, max: 5, minLabel: 'Poco', maxLabel: 'Mucho' }, opciones: [] },
            { id: `q-2`, tipo: 'texto_largo', titulo: 'Comentarios adicionales', esObligatoria: false, orden: 2, opciones: [] }
          ]
        };
        break;
      case 'evaluacion':
        templateData = {
          titulo: 'Evaluación de Evento',
          descripcion: 'Evalúa el evento reciente',
          colorTema: '#3b82f6',
          estado: 'borrador',
          requiereAutenticacion: true,
          preguntas: [
            { id: `q-1`, tipo: 'opcion_multiple', titulo: '¿Asististe al evento?', esObligatoria: true, orden: 1, opciones: [{ id: 'o1', texto: 'Sí', orden: 1 }, { id: 'o2', texto: 'No', orden: 2 }] },
            { id: `q-2`, tipo: 'escala_lineal', titulo: '¿Cómo calificarías la organización?', esObligatoria: true, orden: 2, configuracion: { min: 1, max: 5, minLabel: 'Mala', maxLabel: 'Excelente' }, opciones: [] }
          ]
        };
        break;
      case 'registro':
        templateData = {
          titulo: 'Registro de Evento',
          descripcion: 'Inscríbete en nuestro próximo evento',
          colorTema: '#f59e0b',
          estado: 'borrador',
          requiereAutenticacion: false,
          preguntas: [
            { id: `q-1`, tipo: 'texto_corto', titulo: 'Nombre completo', esObligatoria: true, orden: 1, opciones: [] },
            { id: `q-2`, tipo: 'texto_corto', titulo: 'Correo electrónico', esObligatoria: true, orden: 2, opciones: [] },
            { id: `q-3`, tipo: 'fecha', titulo: 'Fecha de nacimiento', esObligatoria: false, orden: 3, opciones: [] }
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
      const { data } = await axios.get(`/formularios/${id}`);
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
        const { data } = await axios.put(`/formularios/${id}`, dataToSave);
        setFormData(data);
        showToast('Formulario guardado con éxito', 'success');
      } else {
        const { data } = await axios.post('/formularios', dataToSave);
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
    const url = `${window.location.origin}/formulario/${formData.slug}`;
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
    <div className="container-xxl p-0 position-relative pb-20">
      
      {/* Simple Toast */}
      {toast && (
        <div className={`position-fixed bottom-0 end-0 p-5 z-index-3`} style={{ zIndex: 1050 }}>
          <div className={`toast show align-items-center text-white border-0 ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}`} role="alert">
            <div className="d-flex">
              <div className="toast-body fw-bold fs-6">
                <i className={`bi ${toast.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} fs-4 me-2 text-white`}></i>
                {toast.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-6">
        <button className="btn btn-sm btn-light fw-bolder d-flex align-items-center" onClick={() => navigate('/formularios')}>
          <i className="bi bi-arrow-left me-2"></i> Volver a formularios
        </button>

        {formData.estado === 'publicado' && formData.slug && (
          <div className="d-flex align-items-center bg-light-success border border-success border-dashed rounded px-4 py-2 cursor-pointer hover-elevate-up" onClick={copyPublicLink} title="Copiar enlace">
            <i className="bi bi-link-45deg fs-2 text-success me-2"></i>
            <span className="fw-bolder text-success fs-7">Enlace público: /formulario/{formData.slug}</span>
            <i className="bi bi-clipboard fs-6 text-success ms-3"></i>
          </div>
        )}
      </div>

      {/* Main Builder Card */}
      <div className="d-flex flex-column mb-8 shadow-sm bg-body" style={{ borderTop: `10px solid ${formData.colorTema}`, borderRadius: '12px' }}>
        <div className="card border-0 bg-transparent">
          <div className="card-header align-items-center border-bottom-0 pt-6">
            <h3 className="card-title text-gray-800 fw-black fs-2">Editor de Formulario</h3>
            <div className="card-toolbar d-flex flex-wrap gap-2">
              
              {/* Tab Selector inside builder */}
              <div className="d-flex bg-light rounded p-1 me-2">
                <button
                  className={`btn btn-sm fw-bolder px-4 ${activeTab === 'editor' ? 'bg-body text-gray-900 shadow-sm' : 'btn-color-muted'}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <i className="bi bi-ui-checks me-1"></i> Preguntas
                </button>
                <button
                  className={`btn btn-sm fw-bolder px-4 ${activeTab === 'respuestas' ? 'bg-body text-gray-900 shadow-sm' : 'btn-color-muted'}`}
                  onClick={() => setActiveTab('respuestas')}
                  disabled={!id}
                >
                  <i className="bi bi-bar-chart me-1"></i> Respuestas
                </button>
              </div>

              <button className="btn btn-sm btn-light-primary" onClick={() => window.open(`/formulario/${formData.slug || 'preview'}`, '_blank')} disabled={!id} title="Vista previa">
                <i className="bi bi-eye fs-4"></i>
              </button>

              <button 
                className={`btn btn-sm ${formData.estado === 'publicado' ? 'btn-light-success' : 'btn-light-warning'}`} 
                onClick={toggleEstado}
                disabled={saving || !id}
              >
                <i className={`bi ${formData.estado === 'publicado' ? 'bi-globe2' : 'bi-lock'} me-1`}></i>
                {formData.estado === 'publicado' ? 'Publicado' : 'Borrador'}
              </button>

              <button className="btn btn-sm btn-primary fw-bolder d-flex align-items-center" onClick={() => handleSave()} disabled={saving || activeTab !== 'editor'}>
                {saving ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="bi bi-save me-2"></i>
                )}
                Guardar
              </button>
            </div>
          </div>
          
          {activeTab === 'editor' && (
            <div className="card-body pb-10">
              <input
                type="text"
                className="form-control form-control-flush fs-2hx fw-black mb-4 text-body bg-transparent border-0 border-bottom border-transparent hover-border-gray-200 focus-border-primary transition"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título del formulario"
              />
              <textarea
                className="form-control form-control-flush fs-4 mb-8 text-body bg-transparent border-0 border-bottom border-transparent hover-border-gray-200 focus-border-primary transition"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del formulario"
                rows={2}
              ></textarea>
              <div className="row g-5 align-items-center p-5 bg-body border border-dashed border-gray-300 rounded-3">
                 <div className="col-12 col-md-6 d-flex align-items-center">
                   <div className="d-flex align-items-center justify-content-center w-40px h-40px rounded-circle bg-body shadow-sm me-4">
                      <i className="bi bi-palette-fill fs-3" style={{ color: formData.colorTema }}></i>
                   </div>
                   <div className="d-flex flex-column">
                      <label className="fs-6 fw-bold text-body">Color del tema</label>
                      <span className="fs-8 text-muted">Elige el color principal del formulario</span>
                   </div>
                   <input 
                     type="color" 
                     className="form-control form-control-color w-40px h-40px p-0 ms-auto border-0 rounded overflow-hidden shadow-sm cursor-pointer" 
                     value={formData.colorTema} 
                     onChange={(e) => setFormData({ ...formData, colorTema: e.target.value })} 
                   />
                 </div>
                 
                 <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center justify-content-between bg-body p-4 rounded-3 shadow-sm border border-gray-200">
                       <div className="d-flex flex-column">
                          <label className="form-check-label fs-6 fw-bold text-body" htmlFor="reqAuth">
                            Limitar a usuarios registrados
                          </label>
                          <span className="fs-8 text-muted">Requiere iniciar sesión</span>
                       </div>
                       <div className="form-check form-switch form-check-custom form-check-solid">
                         <input 
                           className="form-check-input h-25px w-45px" 
                           type="checkbox" 
                           checked={formData.requiereAutenticacion}
                           onChange={(e) => setFormData({ ...formData, requiereAutenticacion: e.target.checked })}
                           id="reqAuth" 
                         />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="questions-container position-relative">
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
          <div className="d-flex justify-content-center mt-8 mb-10 pb-10">
            <button className="btn btn-primary btn-icon rounded-circle w-60px h-60px shadow-lg hover-elevate-up pulse pulse-white" onClick={addQuestion} title="Agregar pregunta" style={{ backgroundColor: formData.colorTema, borderColor: formData.colorTema }}>
              <i className="bi bi-plus fs-1 text-white"></i>
              <span className="pulse-ring border-5"></span>
            </button>
          </div>
        </div>
      ) : (
        <FormResponsesTab formularioId={id!} />
      )}
    </div>
  );
};

export default FormBuilderPage;
