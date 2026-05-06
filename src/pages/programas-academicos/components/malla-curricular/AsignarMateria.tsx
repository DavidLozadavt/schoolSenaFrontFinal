import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, BookOpen, Check, Pencil } from 'lucide-react';
import { FormCompetencia } from './FormCompetencia';
import Toast from '../Toast';
import { enqueueSnackbar } from 'notistack';

interface AsignarMateriaProps {
  idPrograma: number;
  isOpen: boolean;
  onClose: () => void;
  nivelId: number | null;
  onMateriasSeleccionadas: (data: { idGradoPrograma: number; materias: any[] }) => void;
  materiasActuales?: any[];
  idFicha?: number;
}

export const AsignarMateria: React.FC<AsignarMateriaProps> = ({
  idPrograma,
  isOpen,
  onClose,
  nivelId,
  onMateriasSeleccionadas,
  materiasActuales = [],
  idFicha
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompetenciaId, setEditingCompetenciaId] = useState<number | undefined>(undefined);
  const [materiasDisponibles, setMateriasDisponibles] = useState<any[]>([]);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState<string>('');
  const [toast, setToast] = useState<boolean>(false);
  const [raps, setRaps] = useState<any[]>([]);
  const [openRapsId, setOpenRapsId] = useState<number | null>(null);
  const [loadingRaps, setLoadingRaps] = useState<boolean>(false);

  // Cargar materias disponibles y sincronizar selección inicial
  useEffect(() => {
    if (isOpen) {
      cargarMaterias();
      if (Array.isArray(materiasActuales)) {
        setMateriasSeleccionadas([...materiasActuales]);
      } else {
        setMateriasSeleccionadas([]);
      }
    }
  }, [isOpen, nivelId, materiasActuales]);

  const cargarMaterias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`materias-programa`, {
        params: {
          idPrograma: idPrograma,
          idFicha: idFicha
        }
      });
      setMateriasDisponibles(response.data || []);
    } catch (error) {
      setMateriasDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyAssigned = (materia: any) => {
    return (materiasActuales || []).some(m => (m.idMateria || m.id) === materia.id);
  };

  const toggleMateria = (materia: any) => {
    // Si ya está asignada, no permitimos cambiar su estado (bloqueada)
    if (isAlreadyAssigned(materia)) return;

    const yaSeleccionada = materiasSeleccionadas.some(m => (m.idMateria || m.id) === materia.id);

    if (yaSeleccionada) {
      setMateriasSeleccionadas(materiasSeleccionadas.filter(mat => (mat.idMateria || mat.id) !== materia.id));
    } else {
      setMateriasSeleccionadas([...materiasSeleccionadas, materia]);
    }
  };

  const estaSeleccionada = (materia: any) => {
    return materiasSeleccionadas.some(m => (m.idMateria || m.id) === materia.id);
  };

  const handleEdit = (e: React.MouseEvent, competenciaId: number) => {
    e.stopPropagation();
    setEditingCompetenciaId(competenciaId);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompetenciaId(undefined);
    cargarMaterias();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCompetenciaId(undefined);
  };

  const handleConfirmar = () => {
    if (onMateriasSeleccionadas) {
      // Filtrar para enviar SOLO las que son nuevas
      const nuevasMaterias = materiasSeleccionadas.filter(m => !isAlreadyAssigned(m));
      onMateriasSeleccionadas({ idGradoPrograma: nivelId ?? 0, materias: nuevasMaterias });
    }
    onClose();
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCompetenciaId(undefined);
    setOpenRapsId(null);
    setBuscar('');
    onClose();
  };

  const truncate = (text: string, length: number) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const cargarRaps = async (idMateriaPadre: number) => {
    if (openRapsId === idMateriaPadre) {
      setOpenRapsId(null);
      return;
    }

    setLoadingRaps(true);
    setOpenRapsId(idMateriaPadre);
    setRaps([]);

    try {
      const response = await axios.get(`materias/hijas`, { params: { idMateriaPadre, idFicha: idFicha } });
      setRaps(response.data.data || []);
    } catch (error) {
      enqueueSnackbar("Error al cargar los RAPs", { variant: "error" });
      setOpenRapsId(null);
    } finally {
      setLoadingRaps(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden">

      <div className="relative w-full max-w-4xl bg-white dark:bg-coal-500 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        <Toast message='Competencia guardada correctamente' isOpen={toast} onClose={() => setToast(false)} />

        {/* Header del Modal - Más compacto */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <div>
            <h3 className="text-md font-black uppercase text-gray-800 dark:text-white tracking-widest flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Asignar Competencias
            </h3>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Antes de asignar una competencia, asegúrate de haber cargado los juicios evaluativos de Sofia Plus.</p>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
          >
            <i className="text-base ki-outline ki-cross"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="text"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder='Nombre o código...'
                  className='w-full input pl-9 pr-4 py-2 bg-gray-50 dark:bg-coal-600 rounded-lg outline-none transition-all uppercase text-xs font-semibold'
                />
              </div>

              {/* <button
                onClick={() => {
                  setEditingCompetenciaId(undefined);
                  setShowForm(true);
                }}
                disabled={true}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-coal-600 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg font-black text-[10px] uppercase tracking-widest cursor-not-allowed opacity-60"
              >
                <Plus size={14} />
                Crear Nueva
              </button> */}
            </div>

            <FormCompetencia
              isOpen={showForm}
              onClose={handleFormCancel}
              programId={idPrograma ?? 0}
              competenciaId={editingCompetenciaId}
              onSuccess={handleFormSuccess}
            />

            {/* Lista de Materias */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Cargando...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {(() => {
                  const itemsFiltered = materiasDisponibles
                    .filter(Boolean)
                    .filter((m: any) =>
                      (m.nombreMateria || '').toLowerCase().includes((buscar || '').toLowerCase()) ||
                      (m.codigo || '').toLowerCase().includes((buscar || '').toLowerCase())
                    );

                  if (itemsFiltered.length < 1) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-coal-600 rounded-full flex items-center justify-center mb-2">
                          <BookOpen className="text-gray-300 dark:text-gray-600" size={32} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-1">
                            {buscar ? 'Sin resultados' : 'No hay competencias disponibles'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                            {buscar 
                              ? `No se encontró nada que coincida con "${buscar}"`
                              : 'Asegúrate de haber cargado los juicios evaluativos de Sofia Plus para esta ficha.'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return itemsFiltered.map((materia) => {
                    const seleccionada = estaSeleccionada(materia);

                    const yaAsignada = isAlreadyAssigned(materia);

                    return (
                      <div
                        key={materia.id}
                        onClick={() => !materia.isCompleta && !yaAsignada && toggleMateria(materia)}
                        className={`group flex flex-col p-3 border rounded-xl transition-all duration-200 
                          ${(seleccionada || yaAsignada)
                            ? 'bg-primary/5 border-primary ring-1 ring-primary/10'
                            : 'border-gray-100 dark:border-gray-700 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-coal-300'
                          } 
                          ${materia.isCompleta ? 'border-green-500 dark:border-green-500' : ''} 
                          ${yaAsignada ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            
                            { !materia.isCompleta && !yaAsignada && (
                              <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${seleccionada ? 'bg-primary' : 'bg-gray-200 dark:bg-coal-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${seleccionada ? 'translate-x-4' : 'translate-x-1'}`} />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-2xs font-black bg-gray-100 dark:bg-coal-500 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded tracking-tighter shrink-0 border border-gray-200 dark:border-gray-600">
                                  {materia.codigo || 'S/C'}
                                </span>
                                <p className="text-xs font-bold text-gray-800 dark:text-white truncate uppercase">
                                  {materia.nombreMateria || 'Sin nombre'} 
                                  {materia.isCompleta && <span className="text-xs text-green-500 opacity-70"> - Finalizado</span>}
                                </p>
                              </div>
                              <p className="text-2xs text-gray-500 font-bold uppercase truncate">
                                {materia.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); cargarRaps(materia.id); }}
                              className={`p-1.5 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm shrink-0 ${openRapsId === materia.id ? 'bg-primary text-white' : 'text-gray-500 hover:bg-white dark:hover:bg-coal-400 hover:text-primary'}`}
                              title="Ver RAPs"
                            >
                              <BookOpen size={14} />
                            </button>
                            <button
                              onClick={(e) => handleEdit(e, materia.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-white dark:hover:bg-coal-400 hover:text-primary transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm shrink-0"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Desplegable de RAPs */}
                        {openRapsId === materia.id && (
                          <div
                            className="mt-3 ml-12 p-3 bg-gray-50 dark:bg-coal-600 rounded-lg border border-gray-100 dark:border-gray-600 animate-in fade-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Check size={12} className="text-primary" />
                                Resultados de Aprendizaje
                              </h4>
                              {loadingRaps && (
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>

                            {loadingRaps ? (
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse py-1">Cargando...</p>
                            ) : raps.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                                {raps.map((rap) => (
                                  <div key={rap.id} className="flex items-center gap-2 group/rap">
                                    <div className="w-1 h-1 rounded-full bg-primary/50 group-hover/rap:bg-primary transition-colors"></div>
                                    <p
                                      className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary/30"
                                      title={rap.nombreMateria}
                                    >
                                      {truncate(rap.nombreMateria || '', 35)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-2 px-1 border-l-2 border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] text-gray-400 font-medium italic">No se encontraron RAPs vinculados</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Más compacto */}
        <div className="p-4 bg-gray-50 dark:bg-coal-400 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
              {materiasSeleccionadas.length}
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
              Seleccionadas
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-danger transition-all tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={materiasSeleccionadas.length === 0}
              className="px-6 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-active active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-w-[120px]"
            >
              Confirmar ({materiasSeleccionadas.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};