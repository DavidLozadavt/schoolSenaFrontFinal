import React, { useState } from 'react';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div 
      className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-150 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 mb-6 overflow-hidden relative"
      style={{ borderLeft: `8px solid ${accentColor}` }}
    >
      <div className="p-6 md:p-8 flex flex-col gap-6">
        
        {/* Controls row */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-white/5 gap-4">
          <div 
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
          >
            <i className="bi bi-question-circle-fill"></i> Pregunta {index + 1}
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-150 dark:border-white/5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              onClick={() => moveUp(index)} 
              disabled={isFirst} 
              title="Mover arriba"
            >
              <i className="bi bi-arrow-up"></i>
            </button>
            <button 
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-150 dark:border-white/5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              onClick={() => moveDown(index)} 
              disabled={isLast} 
              title="Mover abajo"
            >
              <i className="bi bi-arrow-down"></i>
            </button>
          </div>
        </div>

        {/* Inputs & Type selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Título de la Pregunta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Título de la Pregunta</label>
              <input
                type="text"
                className="w-full bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-base font-bold text-neutral-800 dark:text-white rounded-xl outline-none transition-all"
                style={focusedField === 'title' ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                value={question.titulo || ''}
                onChange={handleTitleChange}
                placeholder="Escribe la pregunta aquí..."
              />
            </div>
            
            {/* Descripción (Opcional) */}
            {question.descripcion !== undefined && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Descripción o Aclaración (Opcional)</label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-600 dark:text-neutral-350 rounded-xl outline-none transition-all"
                  style={focusedField === 'desc' ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
                  onFocus={() => setFocusedField('desc')}
                  onBlur={() => setFocusedField(null)}
                  value={question.descripcion || ''}
                  onChange={handleDescChange}
                  placeholder="Detalles adicionales para guiar al participante..."
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Tipo de Pregunta</label>
            <select 
              className="w-full bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-200 rounded-xl outline-none transition-all cursor-pointer" 
              style={focusedField === 'type' ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
              onFocus={() => setFocusedField('type')}
              onBlur={() => setFocusedField(null)}
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
              <option value="archivo">Subir archivo (PDF o Imagen)</option>
            </select>
          </div>
        </div>

        {/* Dynamic type options / config rendering */}
        <div className="mt-2">
          {['opcion_multiple', 'casillas', 'desplegable'].includes(question.tipo) && (
            <div className="flex flex-col gap-3.5">
              {question.opciones.map((opt, oIdx) => (
                <div key={opt.id || oIdx} className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center shrink-0 w-8 h-8">
                    {question.tipo === 'opcion_multiple' && <i className="bi bi-circle text-neutral-350 dark:text-neutral-600 fs-4"></i>}
                    {question.tipo === 'casillas' && <i className="bi bi-square text-neutral-350 dark:text-neutral-600 fs-4"></i>}
                    {question.tipo === 'desplegable' && <span className="text-xs font-black text-neutral-400 dark:text-neutral-600">{oIdx + 1}.</span>}
                  </div>
                  
                  <input
                    type="text"
                    className="flex-1 bg-neutral-50 dark:bg-neutral-850/10 border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 rounded-xl outline-none transition-all max-w-[650px]"
                    style={focusedField === `option-${oIdx}` ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
                    onFocus={() => setFocusedField(`option-${oIdx}`)}
                    onBlur={() => setFocusedField(null)}
                    value={opt.texto || ''}
                    onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                    placeholder={`Opción ${oIdx + 1}`}
                  />
                  
                  {question.opciones.length > 1 && (
                    <button 
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-50 hover:bg-red-500/10 dark:bg-neutral-800 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" 
                      onClick={() => removeOption(oIdx)}
                      title="Eliminar opción"
                    >
                      <i className="bi bi-x-lg text-xs font-bold"></i>
                    </button>
                  )}
                </div>
              ))}
              
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center justify-center shrink-0 w-8 h-8">
                  {question.tipo === 'opcion_multiple' && <i className="bi bi-circle text-neutral-300 dark:text-neutral-700 fs-4"></i>}
                  {question.tipo === 'casillas' && <i className="bi bi-square text-neutral-300 dark:text-neutral-700 fs-4"></i>}
                  {question.tipo === 'desplegable' && <span className="text-xs font-black text-neutral-400 dark:text-neutral-600">{question.opciones.length + 1}.</span>}
                </div>
                <button 
                  className="text-[10px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all hover:scale-105" 
                  style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                  onClick={addOption}
                >
                  <i className="bi bi-plus-lg text-xs font-bold"></i> Agregar opción
                </button>
              </div>
            </div>
          )}

          {question.tipo === 'escala_lineal' && (
            <div className="bg-neutral-50/50 dark:bg-neutral-850/10 border border-neutral-150 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Mínimo</span>
                    <select 
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-250 rounded-xl outline-none cursor-pointer" 
                      value={scaleConfig.min} 
                      onChange={(e) => handleScaleConfigChange('min', e.target.value)}
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                 </div>
                 
                 <span className="text-xs font-bold text-neutral-400">a</span>
                 
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Máximo</span>
                    <select 
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-250 rounded-xl outline-none cursor-pointer" 
                      value={scaleConfig.max} 
                      onChange={(e) => handleScaleConfigChange('max', e.target.value)}
                    >
                      {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
              </div>
              
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-400 w-6 text-right">{scaleConfig.min}</span>
                    <input 
                      type="text" 
                      className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-250 rounded-xl outline-none transition-all max-w-[300px]" 
                      style={focusedField === 'minLabel' ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
                      onFocus={() => setFocusedField('minLabel')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Etiqueta para valor mínimo (opcional)" 
                      value={scaleConfig.minLabel || ''} 
                      onChange={(e) => handleScaleConfigChange('minLabel', e.target.value)} 
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-400 w-6 text-right">{scaleConfig.max}</span>
                    <input 
                      type="text" 
                      className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-250 rounded-xl outline-none transition-all max-w-[300px]" 
                      style={focusedField === 'maxLabel' ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}20` } : {}}
                      onFocus={() => setFocusedField('maxLabel')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Etiqueta para valor máximo (opcional)" 
                      value={scaleConfig.maxLabel || ''} 
                      onChange={(e) => handleScaleConfigChange('maxLabel', e.target.value)} 
                    />
                 </div>
              </div>
              
              {/* Radio buttons visualization */}
              <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-white/5 max-w-[500px] mx-auto w-full">
                 {scaleArray.map(n => (
                    <div key={n} className="flex flex-col items-center gap-1.5">
                       <span className="text-[10px] font-bold text-neutral-400">{n}</span>
                       <div 
                         className="w-5 h-5 rounded-full border flex items-center justify-center"
                         style={{ borderColor: accentColor }}
                       >
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `${accentColor}25` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {question.tipo === 'texto_corto' && (
            <input 
              type="text" 
              className="bg-transparent border-0 border-b border-dashed border-neutral-300 dark:border-neutral-700 px-1 py-2 text-sm text-neutral-400 outline-none w-full max-w-[300px]" 
              placeholder="Texto de respuesta corta (vista previa)" 
              disabled 
            />
          )}
          {question.tipo === 'texto_largo' && (
            <textarea 
              className="bg-transparent border-0 border-b border-dashed border-neutral-300 dark:border-neutral-700 px-1 py-2 text-sm text-neutral-400 outline-none w-full max-w-[500px]" 
              rows={2} 
              placeholder="Texto de respuesta larga (vista previa)" 
              disabled
            ></textarea>
          )}
          {question.tipo === 'fecha' && (
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-850/30 border border-neutral-150 dark:border-neutral-800 px-4 py-2.5 rounded-xl w-fit">
               <input type="date" className="bg-transparent border-0 text-sm text-neutral-450 outline-none cursor-not-allowed" disabled />
               <i className="bi bi-calendar-event text-neutral-400"></i>
            </div>
          )}
          {question.tipo === 'hora' && (
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-850/30 border border-neutral-150 dark:border-neutral-800 px-4 py-2.5 rounded-xl w-fit">
               <input type="time" className="bg-transparent border-0 text-sm text-neutral-450 outline-none cursor-not-allowed" disabled />
               <i className="bi bi-clock text-neutral-400"></i>
            </div>
          )}
          {question.tipo === 'archivo' && (
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-850/30 border border-neutral-150 dark:border-neutral-800 px-4 py-2.5 rounded-xl w-fit">
               <i className="bi bi-cloud-upload text-neutral-400 fs-5"></i>
               <span className="text-xs text-neutral-400">Subir archivo (PDF o Imagen) (vista previa)</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-5 mt-4 border-t border-neutral-100 dark:border-white/5 flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <button 
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${question.descripcion !== undefined ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 text-neutral-400 hover:text-neutral-600'}`} 
              onClick={toggleDescription} 
              title="Descripción"
            >
              <i className="bi bi-card-text fs-5"></i>
            </button>
            <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1"></div>
            <button 
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 text-neutral-400 hover:text-neutral-600 transition-all" 
              onClick={() => duplicateQuestion(index)} 
              title="Duplicar"
            >
              <i className="bi bi-files fs-5"></i>
            </button>
            <button 
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-neutral-50 hover:bg-red-500/10 dark:bg-neutral-850 text-neutral-400 hover:text-red-500 transition-all" 
              onClick={() => removeQuestion(index)} 
              title="Eliminar"
            >
              <i className="bi bi-trash fs-5"></i>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden sm:block"></div>
            
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Obligatoria</span>
              <input 
                type="checkbox"
                className="sr-only"
                checked={question.esObligatoria}
                onChange={(e) => updateQuestion(index, { ...question, esObligatoria: e.target.checked })}
              />
              <div 
                className="w-10 h-6 rounded-full p-0.5 transition-colors duration-200 relative cursor-pointer"
                style={{ backgroundColor: question.esObligatoria ? accentColor : '#e4e4e7' }}
              >
                <div 
                  className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200"
                  style={{ transform: question.esObligatoria ? 'translateX(16px)' : 'translateX(0px)' }}
                ></div>
              </div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuestionCard;
