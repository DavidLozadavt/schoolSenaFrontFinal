import React from 'react';
import { FormQuestion, QuestionType } from './formBuilderTypes';

interface Props {
  question: FormQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  accentColor: string;
  updateQuestion: (index: number, updated: FormQuestion) => void;
  removeQuestion: (index: number) => void;
  duplicateQuestion: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

const QuestionCard: React.FC<Props> = ({ 
  question, 
  index, 
  isFirst, 
  isLast, 
  accentColor, 
  updateQuestion, 
  removeQuestion, 
  duplicateQuestion, 
  moveUp, 
  moveDown 
}) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion(index, { ...question, titulo: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion(index, { ...question, descripcion: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuestion(index, { ...question, tipo: e.target.value as QuestionType });
  };

  const handleOptionChange = (optIndex: number, value: string) => {
    const newOptions = [...question.opciones];
    newOptions[optIndex].texto = value;
    updateQuestion(index, { ...question, opciones: newOptions });
  };

  const addOption = () => {
    const newOptions = [
      ...question.opciones,
      { id: `new-opt-${Date.now()}`, texto: `Opción ${question.opciones.length + 1}`, orden: question.opciones.length + 1 }
    ];
    updateQuestion(index, { ...question, opciones: newOptions });
  };

  const removeOption = (optIndex: number) => {
    const newOptions = question.opciones.filter((_, i) => i !== optIndex);
    updateQuestion(index, { ...question, opciones: newOptions });
  };

  const toggleDescription = () => {
    if (question.descripcion !== undefined) {
      const { descripcion, ...rest } = question;
      updateQuestion(index, rest as FormQuestion);
    } else {
      updateQuestion(index, { ...question, descripcion: '' });
    }
  };

  const handleScaleConfigChange = (field: 'min' | 'max' | 'minLabel' | 'maxLabel', value: any) => {
    const config = { ...(question.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' }) };
    config[field] = field === 'min' || field === 'max' ? parseInt(value) : value;
    updateQuestion(index, { ...question, configuracion: config });
  };

  const scaleConfig = question.configuracion || { min: 1, max: 5, minLabel: '', maxLabel: '' };
  const scaleArray = Array.from({ length: scaleConfig.max - scaleConfig.min + 1 }, (_, i) => scaleConfig.min + i);

  return (
    <div className="card mb-6 shadow-sm border-0 position-relative" style={{ borderLeft: `6px solid ${accentColor}` }}>
      <div className="card-body p-8">
        
        {/* Controls row (move, indicator) */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div className="badge badge-light-primary fw-bolder fs-7 px-3 py-2" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            Pregunta {index + 1}
          </div>
          <div className="d-flex align-items-center">
             <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => moveUp(index)} disabled={isFirst} title="Mover arriba">
                <i className="bi bi-arrow-up"></i>
             </button>
             <button className="btn btn-icon btn-sm btn-light" onClick={() => moveDown(index)} disabled={isLast} title="Mover abajo">
                <i className="bi bi-arrow-down"></i>
             </button>
          </div>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-6 gap-4">
          <div className="w-100">
            <input
              type="text"
              className="form-control form-control-lg fs-4 fw-bolder mb-3 text-body bg-transparent border-0 border-bottom border-transparent hover-border-gray-200 focus-border-primary transition px-2"
              value={question.titulo}
              onChange={handleTitleChange}
              placeholder="Pregunta sin título"
            />
            {question.descripcion !== undefined && (
              <input
                type="text"
                className="form-control fs-6 mb-3 text-body bg-transparent border-0 border-bottom border-transparent hover-border-gray-200 focus-border-primary transition px-2"
                value={question.descripcion}
                onChange={handleDescChange}
                placeholder="Descripción (opcional)"
              />
            )}
          </div>
          <select 
            className="form-select form-select-solid form-select-lg w-md-250px flex-shrink-0 border-0" 
            value={question.tipo} 
            onChange={handleTypeChange}
          >
            <option value="texto_corto">Respuesta corta</option>
            <option value="texto_largo">Párrafo</option>
            <option value="opcion_multiple">Varias opciones</option>
            <option value="casillas">Casillas</option>
            <option value="desplegable">Desplegable</option>
            <option value="escala_lineal">Escala lineal</option>
            <option value="fecha">Fecha</option>
            <option value="hora">Hora</option>
          </select>
        </div>

        {/* Renderizado de opciones según el tipo */}
        <div className="mb-6 ps-2">
          {['opcion_multiple', 'casillas', 'desplegable'].includes(question.tipo) && (
            <div>
              {question.opciones.map((opt, oIdx) => (
                <div key={opt.id || oIdx} className="d-flex align-items-center mb-3 group">
                  {question.tipo === 'opcion_multiple' && <i className="bi bi-circle fs-4 text-muted me-4"></i>}
                  {question.tipo === 'casillas' && <i className="bi bi-square fs-4 text-muted me-4"></i>}
                  {question.tipo === 'desplegable' && <span className="fs-5 fw-bold text-muted me-4 w-20px">{oIdx + 1}.</span>}
                  
                  <input
                    type="text"
                    className="form-control border-0 border-bottom border-transparent hover-border-primary rounded-0 px-2 bg-transparent text-body transition-all"
                    value={opt.texto}
                    onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                    placeholder={`Opción ${oIdx + 1}`}
                  />
                  {question.opciones.length > 1 && (
                    <button className="btn btn-icon btn-sm btn-active-light-danger ms-2 opacity-50 hover-opacity-100" onClick={() => removeOption(oIdx)}>
                      <i className="bi bi-x fs-2"></i>
                    </button>
                  )}
                </div>
              ))}
              <div className="d-flex align-items-center mt-4">
                 {question.tipo === 'opcion_multiple' && <i className="bi bi-circle fs-4 text-muted me-4"></i>}
                 {question.tipo === 'casillas' && <i className="bi bi-square fs-4 text-muted me-4"></i>}
                 {question.tipo === 'desplegable' && <span className="fs-5 fw-bold text-muted me-4 w-20px">{question.opciones.length + 1}.</span>}
                <button className="btn btn-sm btn-light-primary" onClick={addOption}>
                  <i className="bi bi-plus me-1"></i> Agregar opción
                </button>
              </div>
            </div>
          )}

          {question.tipo === 'escala_lineal' && (
            <div className="bg-body border border-gray-200 rounded p-5">
              <div className="d-flex align-items-center mb-5 gap-3">
                 <select className="form-select form-select-sm form-select-solid w-100px" value={scaleConfig.min} onChange={(e) => handleScaleConfigChange('min', e.target.value)}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                 </select>
                 <span className="fw-bold text-muted">a</span>
                 <select className="form-select form-select-sm form-select-solid w-100px" value={scaleConfig.max} onChange={(e) => handleScaleConfigChange('max', e.target.value)}>
                    {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                 </select>
              </div>
              <div className="d-flex flex-column gap-3 mb-5">
                 <div className="d-flex align-items-center gap-3">
                    <span className="fw-bolder w-20px text-end">{scaleConfig.min}</span>
                    <input type="text" className="form-control form-control-sm form-control-solid" placeholder="Etiqueta (opcional)" value={scaleConfig.minLabel || ''} onChange={(e) => handleScaleConfigChange('minLabel', e.target.value)} />
                 </div>
                 <div className="d-flex align-items-center gap-3">
                    <span className="fw-bolder w-20px text-end">{scaleConfig.max}</span>
                    <input type="text" className="form-control form-control-sm form-control-solid" placeholder="Etiqueta (opcional)" value={scaleConfig.maxLabel || ''} onChange={(e) => handleScaleConfigChange('maxLabel', e.target.value)} />
                 </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-6 pt-6 border-top border-gray-300 w-75 mx-auto">
                 {scaleArray.map(n => (
                    <div key={n} className="d-flex flex-column align-items-center gap-2">
                       <span className="fw-bold text-muted">{n}</span>
                       <div className="form-check form-check-custom form-check-solid">
                          <input className="form-check-input w-20px h-20px" type="radio" disabled />
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {question.tipo === 'texto_corto' && (
            <input type="text" className="form-control form-control-solid border-0 border-bottom border-gray-300 rounded-0 bg-transparent px-2 w-50" placeholder="Texto de respuesta corta" disabled />
          )}
          {question.tipo === 'texto_largo' && (
            <textarea className="form-control form-control-solid border-0 border-bottom border-gray-300 rounded-0 bg-transparent px-2 w-75" rows={2} placeholder="Texto de respuesta larga" disabled></textarea>
          )}
          {question.tipo === 'fecha' && (
            <div className="d-flex align-items-center">
               <input type="date" className="form-control form-control-solid w-200px" disabled />
               <i className="bi bi-calendar fs-2 ms-3 text-muted"></i>
            </div>
          )}
          {question.tipo === 'hora' && (
            <div className="d-flex align-items-center">
               <input type="time" className="form-control form-control-solid w-200px" disabled />
               <i className="bi bi-clock fs-2 ms-3 text-muted"></i>
            </div>
          )}
        </div>

        {/* Footer de la tarjeta */}
        <div className="d-flex justify-content-end align-items-center pt-5 mt-2 border-top border-gray-200">
          <button className={`btn btn-icon btn-sm me-2 ${question.descripcion !== undefined ? 'btn-light-primary' : 'btn-active-light-primary'}`} onClick={toggleDescription} title="Descripción">
            <i className="bi bi-card-text fs-4"></i>
          </button>
          <div className="vr h-20px mx-2 opacity-25"></div>
          <button className="btn btn-icon btn-sm btn-active-light-primary me-2" onClick={() => duplicateQuestion(index)} title="Duplicar">
            <i className="bi bi-files fs-4"></i>
          </button>
          <button className="btn btn-icon btn-sm btn-active-light-danger me-4" onClick={() => removeQuestion(index)} title="Eliminar">
            <i className="bi bi-trash fs-4"></i>
          </button>
          
          <div className="vr h-20px me-4 opacity-25"></div>
          
          <div className="form-check form-switch form-check-custom form-check-solid">
            <input 
              className="form-check-input h-20px w-40px" 
              type="checkbox" 
              checked={question.esObligatoria}
              onChange={(e) => updateQuestion(index, { ...question, esObligatoria: e.target.checked })}
              id={`required-${index}`} 
            />
            <label className="form-check-label fw-bold text-body ms-3" htmlFor={`required-${index}`}>
              Obligatoria
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
