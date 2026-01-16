import React, { useState } from 'react';

import { AsignarMateriaProps } from '../../types';


const AsignarMateria: React.FC<AsignarMateriaProps> = ({ isOpen, onClose, nivelId }) => {
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null;

  return (
    /* Ajuste de opacidad de fondo: bg-black/40 para un efecto más claro */
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      
      {/* Contenedor Principal con bordes reforzados para contraste en fondos claros */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-coal-500 rounded-xl shadow-2xl overflow-hidden border border-gray-400 dark:border-gray-dark-300 flex flex-col max-h-[85vh]">
        
        {/* Header del Modal */}
        <div className="p-5 border-b border-gray-400 dark:border-gray-dark-100 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <div>
            <h3 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest">
              Gestionar Materias - Nivel {nivelId}
            </h3>
            <p className="text-4xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Asignación académica y documentos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-danger transition-colors">
            <i className="ki-outline ki-cross text-xl font-bold"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          
          {/* Sección de Carga de Documentos - Bordes marcados */}
          <div className="space-y-3">
            <label className="text-3xs font-black uppercase text-gray-600 dark:text-gray-400 ml-1">Documento de Referencia</label>
            <div className="border border-dashed border-gray-400 dark:border-gray-dark-300 rounded-xl p-4 flex items-center justify-between bg-white dark:bg-coal-600 hover:border-primary transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <i className="ki-outline ki-cloud-add text-xl text-primary font-bold"></i>
                <div className="flex flex-col">
                  <span className="text-2sm font-bold text-gray-700 dark:text-gray-300">Seleccionar archivo</span>
                  <span className="text-4xs text-gray-400 uppercase font-medium">PDF o DOCX hasta 10MB</span>
                </div>
              </div>
              <span className="text-4xs font-bold text-gray-400 italic">Sin archivos...</span>
            </div>
          </div>

          {/* Listado de Materias */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-3xs font-black uppercase text-gray-600 dark:text-gray-400 ml-1">Materias del Nivel</label>
              <button 
                onClick={() => setShowForm(!showForm)}
                className={`text-4xs font-black px-3 py-1.5 rounded-lg border-2 transition-all ${showForm ? 'bg-danger/10 border-danger/40 text-danger' : 'bg-primary/10 border-primary/40 text-primary'}`}
              >
                {showForm ? 'CANCELAR REGISTRO' : '+ CREAR MATERIA'}
              </button>
            </div>

            {/* Formulario de Creación con bordes de alto contraste */}
            {showForm && (
              <div className="p-5 bg-primary/[0.02] border border-gray-400 rounded-xl animate-fade-in-down space-y-4 shadow-inner">
                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">Nombre materia</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm font-bold outline-none dark:text-white focus:ring-1 focus:ring-primary shadow-sm" 
                    placeholder="Ingrese Nombre materia" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">Area de conocimiento</label>
                  <select className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm outline-none dark:text-white font-bold shadow-sm">
                    <option>Seleccionar Area de conocimiento</option>
                    <option>CIENCIAS NATURALES</option>
                    <option>MATEMÁTICAS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">Descripción</label>
                  <textarea 
                    rows={2} 
                    className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm font-medium outline-none dark:text-white no-scrollbar resize-none shadow-sm" 
                    placeholder="Ingrese una breve descripción..." 
                  />
                </div>

                <button className="w-full bg-primary text-white py-2.5 rounded-lg font-black text-3xs uppercase tracking-[0.2em] hover:bg-primary-active transition-all shadow-lg active:scale-[0.98]">
                  Guardar Materia
                </button>
              </div>
            )}

            {/* Lista de Items con bordes reforzados */}
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-coal-300 border border-gray-400 dark:border-gray-dark-100 rounded-lg shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-coal-400 flex items-center justify-center text-primary border border-gray-300 shadow-inner">
                      <i className="ki-outline ki-book text-lg font-bold"></i>
                    </div>
                    <div>
                      <p className="text-2sm font-black text-gray-800 dark:text-white leading-none">Materia Ejemplo {i}</p>
                      <p className="text-4xs text-gray-500 font-black uppercase mt-1">Área de conocimiento • Activa</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-danger hover:bg-danger/10 rounded-full transition-all">
                    <i className="ki-outline ki-trash text-sm font-bold"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 dark:bg-coal-400 border-t border-gray-400 dark:border-gray-dark-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-3xs font-black uppercase text-gray-500 hover:text-red-600 transition-colors tracking-widest">
            Cerrar
          </button>
          <button className="px-10 py-2.5 bg-primary |dark:bg-primary text-white rounded-lg text-3xs font-black uppercase tracking-widest hover:bg-primary-active active:scale-95 transition-all shadow-lg">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarMateria;

