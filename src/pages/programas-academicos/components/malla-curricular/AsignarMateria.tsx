import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AsignarMateriaProps } from '../../types';

const AsignarMateria: React.FC<AsignarMateriaProps> = ({ 
  idPrograma,
  isOpen, 
  onClose, 
  nivelId,
  onMateriasSeleccionadas
}) => {
  const [showForm, setShowForm] = useState(false);
  const [materiasDisponibles, setMateriasDisponibles] = useState<any[]>([]);
  const [idsSeleccionados, setIdsSeleccionados] = useState<number[]>([]); // ← Solo IDs
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState<string>('');

  // Cargar materias disponibles cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarMaterias();
    }
  }, [isOpen]);

  const cargarMaterias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`materias-programa/${idPrograma}`);
      setMateriasDisponibles(response.data || []);
    } catch (error) {
      setMateriasDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selección de materia - ahora solo maneja IDs
  const toggleMateria = (idMateria: number) => {
    const yaSeleccionada = idsSeleccionados.includes(idMateria);
    
    if (yaSeleccionada) {
      // Quitar el ID
      setIdsSeleccionados(idsSeleccionados.filter(id => id !== idMateria));
    } else {
      // Agregar el ID
      setIdsSeleccionados([...idsSeleccionados, idMateria]);
    }
  };

  // Verificar si una materia está seleccionada
  const estaSeleccionada = (idMateria: number) => {
    return idsSeleccionados.includes(idMateria);
  };

  // Confirmar y enviar IDs al componente padre
  const handleConfirmar = () => {

    if (onMateriasSeleccionadas) {
      onMateriasSeleccionadas(idsSeleccionados);
    }
    
    // Limpiar selección y cerrar
    setIdsSeleccionados([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-coal-500 rounded-xl shadow-2xl overflow-hidden border border-gray-400 dark:border-gray-dark-300 flex flex-col max-h-[85vh]">
        
        {/* Header del Modal */}
        <div className="p-5 border-b border-gray-400 dark:border-gray-dark-100 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <div>
            <h3 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest">
              Asignar Competencias - Trimestre #{nivelId}
            </h3>
            <p className="text-4xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
              {idsSeleccionados.length} competencia(s) seleccionada(s)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-danger transition-colors">
            <i className="ki-outline ki-cross text-xl font-bold"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          
          {/* Listado de Materias */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              {/* BUSCADOR DE COMPETENCIAS */}
              <input 
                type="text" 
                onChange={(e) => setBuscar(e.target.value)} 
                placeholder='Busca por nombre o código de la competencia...'
                className='input'
              />
              <button 
                onClick={() => setShowForm(!showForm)}
                className={`text-4xs font-black px-3 py-1.5 mx-2 rounded-lg border-2 transition-all ${
                  showForm 
                    ? 'bg-danger/10 border-danger/40 text-danger' 
                    : 'bg-primary/10 border-primary/40 text-primary'
                }`}
              >
                {showForm ? 'CANCELAR' : '+ CREAR NUEVA'}
              </button>
            </div>

            {/* Formulario de Creación */}
            {showForm && (
              <div className="p-5 bg-primary/[0.02] border border-gray-400 rounded-xl animate-fade-in-down space-y-4 shadow-inner">
                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">
                    Nombre competencia
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm font-bold outline-none dark:text-white focus:ring-1 focus:ring-primary shadow-sm" 
                    placeholder="Ingrese nombre de la competencia" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">
                    Área de conocimiento
                  </label>
                  <select className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm outline-none dark:text-white font-bold shadow-sm">
                    <option>Seleccionar área de conocimiento</option>
                    <option>CIENCIAS NATURALES</option>
                    <option>MATEMÁTICAS</option>
                    <option>LENGUAJE</option>
                    <option>SOCIALES</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-black text-gray-700 dark:text-primary uppercase ml-1">
                    Descripción
                  </label>
                  <textarea 
                    rows={2} 
                    className="w-full bg-white dark:bg-coal-400 border border-gray-400 dark:border-gray-dark-100 rounded-lg p-2.5 text-2sm font-medium outline-none dark:text-white no-scrollbar resize-none shadow-sm" 
                    placeholder="Ingrese una breve descripción..." 
                  />
                </div>

                <button className="w-full bg-primary text-white py-2.5 rounded-lg font-black text-3xs uppercase tracking-[0.2em] hover:bg-primary-active transition-all shadow-lg active:scale-[0.98]">
                  Guardar Competencia
                </button>
              </div>
            )}

            {/* Lista de Materias con Checkboxes */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : materiasDisponibles.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <i className="ki-outline ki-book text-3xl text-gray-400 mb-2"></i>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                  No hay competencias disponibles
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {materiasDisponibles
                  .filter((m: any) => 
                    m.materia.nombreMateria.toLowerCase().includes(buscar.toLowerCase()) 
                    || m.materia.codigo.toLowerCase().includes(buscar.toLowerCase())
                  )
                  .map((materia) => {
                    const seleccionada = estaSeleccionada(materia.idMateria);
                    
                    return (
                      <div 
                        key={materia.id} 
                        onClick={() => toggleMateria(materia.idMateria)}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                          seleccionada
                            ? 'bg-primary/10 border-primary shadow-md'
                            : 'bg-white dark:bg-coal-300 border-gray-400 dark:border-gray-dark-100 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            seleccionada
                              ? 'bg-primary border-primary'
                              : 'bg-white dark:bg-coal-400 border-gray-400'
                          }`}>
                            {seleccionada && (
                              <i className="ki-outline ki-check text-white text-xs font-bold"></i>
                            )}
                          </div>

                          {/* Icono y datos */}
                          <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-coal-400 flex items-center justify-center text-primary border border-gray-300 shadow-inner">
                            <i className="ki-outline ki-book text-lg font-bold"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-800 dark:text-white leading-none">
                              {materia.materia.nombreMateria || 'Sin nombre'}
                            </p>
                            <p className="text-2xs text-gray-500 font-black uppercase mt-1">
                              {materia.materia.horas ? `${materia.materia.horas} Horas • ` : ''} 
                              {materia.materia.codigo || 'Sin código'}
                            </p>
                          </div>
                        </div>

                        {/* Badge de seleccionado */}
                        {seleccionada && (
                          <span className="px-2 py-1 bg-primary text-white text-4xs font-black rounded-full">
                            SELECCIONADA
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 dark:bg-coal-400 border-t border-gray-400 dark:border-gray-dark-100 flex justify-between items-center gap-3">
          <div className="text-left">
            <p className="text-4xs font-black text-gray-600 dark:text-gray-400 uppercase">
              {idsSeleccionados.length} competencia(s) seleccionada(s)
            </p>
            {/* Debug: muestra los IDs seleccionados */}
            {idsSeleccionados.length > 0 && (
              <p className="text-4xs text-primary font-mono mt-1">
                IDs: [{idsSeleccionados.join(', ')}]
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-2 text-3xs font-black uppercase text-gray-500 hover:text-red-600 transition-colors tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmar}
              disabled={idsSeleccionados.length === 0}
              className="px-10 py-2.5 bg-primary text-white rounded-lg text-3xs font-black uppercase tracking-widest hover:bg-primary-active active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar ({idsSeleccionados.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarMateria;