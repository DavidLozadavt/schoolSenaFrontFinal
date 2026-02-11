import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AsignarMateriaProps } from '../../types';
import { Pencil } from 'lucide-react';
import { FormCompetencia } from './FormCompetencia';
import Toast from '../Toast';

export const AsignarMateria: React.FC<AsignarMateriaProps> = ({ 
  idPrograma,
  isOpen, 
  onClose, 
  nivelId,
  onMateriasSeleccionadas
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompetenciaId, setEditingCompetenciaId] = useState<number | undefined>(undefined);
  const [materiasDisponibles, setMateriasDisponibles] = useState<any[]>([]);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState<string>('');
  const [toast, setToast] = useState<boolean>(false);

  // referencia del formulario para cuando le de editar
  const formRef = useRef<HTMLDivElement>(null);

  // Cargar materias disponibles cuando se abre el modal
  useEffect(() => {
      if (showForm && formRef.current) {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }, 100);
  }
    if (isOpen) {
      cargarMaterias();
      setMateriasSeleccionadas([]); // Limpiar selección al abrir
    }
  }, [isOpen, showForm]);

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

  // Toggle selección de materia
  const toggleMateria = (materia: any) => {
    const yaSeleccionada = materiasSeleccionadas.some(m => m.id === materia.id);
    
    if (yaSeleccionada) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter(mat => mat.id !== materia.id));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materia]);
    }
  };

  // Verificar si una materia está seleccionada
  const estaSeleccionada = (materia: any) => {
    return materiasSeleccionadas.some(m => m.id === materia.id);
  };

  // Manejar edición de competencia
  const handleEdit = (e: React.MouseEvent, competenciaId: number) => {
    e.stopPropagation(); // Evitar que se seleccione la competencia
    setEditingCompetenciaId(competenciaId);
    setShowForm(true);
  };

  // Callback cuando se crea/actualiza exitosamente
  const handleFormSuccess = () => {
    
    // Cerrar formulario y recargar lista
    setShowForm(false);
    setEditingCompetenciaId(undefined);
    cargarMaterias();
  };

  // Callback para cancelar formulario
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCompetenciaId(undefined);
  };

  // Confirmar y enviar al componente padre
  const handleConfirmar = () => {
    if (onMateriasSeleccionadas) {
      onMateriasSeleccionadas({idGradoPrograma:nivelId??0, materias: materiasSeleccionadas});
    }
    
    // Limpiar selección y cerrar
    setMateriasSeleccionadas([]);
    setShowForm(false);
    setEditingCompetenciaId(undefined);
    onClose();
  };

  // Cerrar modal
  const handleClose = () => {
    setMateriasSeleccionadas([]);
    setShowForm(false);
    setEditingCompetenciaId(undefined);
    setBuscar('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-coal-500 rounded-xl shadow-2xl overflow-hidden border border-gray-400 dark:border-gray-dark-300 flex flex-col max-h-[85vh]">
        
        <Toast message='Competencia guardada correctamente' isOpen={toast} onClose={()=> setToast(false)}/>

        {/* Header del Modal */}
        <div className="p-5 border-b border-gray-400 dark:border-gray-dark-100 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <div>
            <h3 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest">
              Asignar Competencias
            </h3>
            <p className="text-4xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
              {materiasSeleccionadas.length} competencia(s) seleccionada(s)
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-danger transition-colors">
            <i className="ki-outline ki-cross text-xl font-bold"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          
          {/* Listado de Materias */}
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-3">
              {/* BUSCADOR DE COMPETENCIAS */}
              <input 
                type="text" 
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)} 
                placeholder='Busca por nombre o código de la competencia...'
                className='input flex-1'
              />
              <button 
                onClick={() => {
                  if (showForm) {
                    handleFormCancel();
                  } else {
                    setShowForm(true);
                    setEditingCompetenciaId(undefined);
                  }
                }}
                className={`text-4xs font-black px-3 py-1.5 rounded-lg border-2 transition-all whitespace-nowrap ${
                  showForm 
                    ? 'bg-danger/10 border-danger/40 text-danger' 
                    : 'bg-primary/10 border-primary/40 text-primary disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                disabled={showForm?false:true}
              >
                {showForm ? 'CANCELAR' : '+ CREAR NUEVA'}
              </button>
            </div>

            {/* Formulario de Creación/Edición */}
            {showForm && (
              <div ref={formRef}>
              <FormCompetencia 
                programId={idPrograma ?? 0}
                competenciaId={editingCompetenciaId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                setToast={setToast}
                />
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
                <p className="text-xs text-gray-400 mt-2">
                  Crea tu primera competencia usando el botón "+ CREAR NUEVA"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {materiasDisponibles
                  .filter((m: any) => 
                    m.nombreMateria.toLowerCase().includes(buscar.toLowerCase()) 
                    || m.codigo.toLowerCase().includes(buscar.toLowerCase())
                  )
                  .map((materia) => {
                    const seleccionada = estaSeleccionada(materia);
                    
                    return (
                      <div 
                        key={materia.id} 
                        onClick={() => toggleMateria(materia)}
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
                              {materia.codigo || 'Sin código'} - {materia.nombreMateria || 'Sin nombre'}
                            </p>
                            <p className="text-2xs text-gray-500 font-black uppercase mt-1">
                              {materia.descripcion || 'Sin descripción'}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => handleEdit(e, materia.id)}
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-coal-400 hover:text-blue-600 transition"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                
                {/* Mensaje si no hay resultados en búsqueda */}
                {materiasDisponibles.filter((m: any) => 
                  m.nombreMateria.toLowerCase().includes(buscar.toLowerCase()) 
                  || m.codigo.toLowerCase().includes(buscar.toLowerCase())
                ).length === 0 && buscar && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                    <i className="ki-outline ki-magnifier text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                      No se encontraron competencias con "{buscar}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 dark:bg-coal-400 border-t border-gray-400 dark:border-gray-dark-100 flex justify-between items-center gap-3">
          <div className="text-left">
            <p className="text-4xs font-black text-gray-600 dark:text-gray-400 uppercase">
              {materiasSeleccionadas.length} competencia(s) seleccionada(s)
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleClose} 
              className="px-6 py-2 text-3xs font-black uppercase text-gray-500 hover:text-red-600 transition-colors tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmar}
              disabled={materiasSeleccionadas.length === 0}
              className="px-10 py-2.5 bg-primary text-white rounded-lg text-3xs font-black uppercase tracking-widest hover:bg-primary-active active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar ({materiasSeleccionadas.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};