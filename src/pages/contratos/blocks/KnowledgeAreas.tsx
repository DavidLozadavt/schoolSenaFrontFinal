import { useState, useEffect, useRef, useMemo } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Toast from '../../programas-academicos/components/Toast';
import ModalAreaConocimiento from './ModalAreaConocimiento';

interface KnowledgeAreasProps {
  contrato: ContratoInterface;
  onSave?: () => void;
  selectedProgramIds?: number[];
}

interface Programa {
  id: number;
  nombrePrograma?: string;
}

interface AreaConocimiento {
  id: number;
  nombreAreaConocimiento: string;
}

// Estilos para ocultar scrollbar
const scrollStyles = `
  .knowledge-areas-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .knowledge-areas-scroll::-webkit-scrollbar {
    display: none;
  }
`;

const KnowledgeAreas = ({ contrato, onSave, selectedProgramIds: externalProgramIds }: KnowledgeAreasProps) => {
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false); // Iniciar en false para evitar mostrar "Cargando..." innecesariamente
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [creating, setCreating] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const isFetchingRef = useRef(false);
  const contratoRef = useRef(contrato);
  // Estado para el modal de información de área
  const [showModalArea, setShowModalArea] = useState(false);
  const [modalData, setModalData] = useState<{
    programasConArea: string[];
    programasSinArea: string[];
    nombreArea?: string;
    titulo?: string;
  } | null>(null);
  
  // Mantener una referencia actualizada del contrato
  useEffect(() => {
    contratoRef.current = contrato;
  }, [contrato]);

  // Obtener programas seleccionados del contrato
  const getSelectedProgramIds = (): number[] => {
    if (!contrato?.programas || !Array.isArray(contrato.programas)) {
      return [];
    }
    return contrato.programas
      .map((program: any) => {
        if (typeof program === 'object' && program !== null && 'id' in program) {
          return program.id as number;
        }
        return typeof program === 'number' ? program : null;
      })
      .filter((id): id is number => id !== null);
  };

  /**
   * Obtiene los nombres de los programas seleccionados
   */
  const getSelectedProgramNames = (): string[] => {
    if (!contrato?.programas || !Array.isArray(contrato.programas)) {
      return [];
    }
    return contrato.programas
      .map((program: any) => {
        if (typeof program === 'object' && program !== null && 'nombrePrograma' in program) {
          return program.nombrePrograma as string;
        }
        return null;
      })
      .filter((name): name is string => name !== null && name.trim() !== '');
  };

  /**
   * Convierte todo el texto a MAYÚSCULAS preservando espacios
   * Ejemplo: "fisica" -> "FISICA"
   * "Fisica" -> "FISICA"
   * "base de datos" -> "BASE DE DATOS"
   * "base  de  datos" -> "BASE  DE  DATOS" (preserva espacios múltiples)
   */
  const toUpperCase = (text: string): string => {
    if (!text) return '';
    // Convertir todo a mayúsculas sin eliminar espacios internos
    // Solo eliminar espacios al inicio y final, pero preservar los del medio
    return text.trim().toUpperCase();
  };

  // Usar programas externos si están disponibles (actualización inmediata), sino usar los del contrato
  const programIdsFromContrato = useMemo(() => getSelectedProgramIds(), [contrato?.programas]);
  const programIds = useMemo(() => {
    // Priorizar programas externos (actualización inmediata desde AssignedPrograms)
    // Solo usar los del contrato si no hay programas externos disponibles
    // externalProgramIds puede ser un array vacío (ningún programa seleccionado), y eso es válido
    if (externalProgramIds !== undefined) {
      return externalProgramIds;
    }
    return programIdsFromContrato;
  }, [externalProgramIds, programIdsFromContrato]);
  
  const programIdsString = useMemo(() => programIds.sort().join(','), [programIds]);
  const previousProgramIdsRef = useRef<string>('');

  // Cargar áreas cuando cambien los programas seleccionados
  useEffect(() => {
    // Solo hacer petición si los IDs de programas realmente cambiaron
    if (programIdsString === previousProgramIdsRef.current) {
      return;
    }
    
    previousProgramIdsRef.current = programIdsString;
    
    if (programIds.length > 0) {
      // Cargar inmediatamente sin delay - el contrato ya está actualizado
      fetchAreasByPrograms(programIds);
    } else {
      // Si no hay programas, limpiar áreas inmediatamente
      setAreas([]);
      setLoading(false);
      setSelectedAreas([]);
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdsString]);

  // Actualizar áreas seleccionadas cuando cambien las áreas del contrato (sin recargar desde el servidor)
  // Esto se ejecuta cuando se actualizan áreas desde otros componentes, sin necesidad de recargar desde el servidor
  useEffect(() => {
    // Solo actualizar las áreas seleccionadas si ya tenemos las áreas cargadas
    if (areas.length === 0) {
      return;
    }

    const areaIdsFromPrograms = areas.map(area => area.id);
    
    if (!contrato?.areasConocimiento || !Array.isArray(contrato.areasConocimiento)) {
      // Si no hay áreas en el contrato, limpiar selección
      if (selectedAreas.length > 0) {
        setSelectedAreas([]);
      }
      return;
    }

    const selectedAreaIds = contrato.areasConocimiento
      .map((area: any) => {
        if (typeof area === 'object' && area !== null && 'id' in area) {
          return area.id;
        }
        return typeof area === 'number' ? area : null;
      })
      .filter((id): id is number => id !== null);
    
    // Filtrar solo las áreas que están en la lista de áreas de los programas seleccionados
    const filteredSelectedAreas = selectedAreaIds.filter(id => areaIdsFromPrograms.includes(id));
    
    // Actualizar siempre para asegurar que todas las áreas del contrato se muestren como seleccionadas
    // Comparar arrays ordenados para evitar actualizaciones innecesarias
    const currentSorted = [...selectedAreas].sort().join(',');
    const newSorted = [...filteredSelectedAreas].sort().join(',');
    
    // Forzar actualización si hay diferencia o si no hay áreas seleccionadas pero debería haberlas
    if (currentSorted !== newSorted || (filteredSelectedAreas.length > 0 && selectedAreas.length === 0)) {
      setSelectedAreas(filteredSelectedAreas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrato?.areasConocimiento, areas]);

  /**
   * Obtiene las áreas de conocimiento de los programas seleccionados
   * Filtra las áreas seleccionadas del contrato para mostrar solo las que pertenecen a los programas actuales
   */
  const fetchAreasByPrograms = async (programIds: number[]) => {
    // Evitar llamadas múltiples simultáneas
    if (isFetchingRef.current) {
      return;
    }
    
    // Si no hay programas, limpiar y salir
    if (programIds.length === 0) {
      setAreas([]);
      setSelectedAreas([]);
      setLoading(false);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Obtener áreas de los programas seleccionados
      const response = await axios.post('areas-conocimiento/programas', {
        idProgramas: programIds
      });
      
      let areasFromPrograms: AreaConocimiento[] = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        areasFromPrograms = response.data.data;
      }

      // Solo mostrar las áreas que pertenecen a los programas seleccionados
      const allAreas = areasFromPrograms.sort((a, b) => 
        a.nombreAreaConocimiento.localeCompare(b.nombreAreaConocimiento)
      );

      setAreas(allAreas);

      // Filtrar las áreas seleccionadas del contrato para que solo incluyan las que pertenecen a los programas actuales
      // Esto asegura que cuando se selecciona un programa, las áreas de ese programa que ya están en el contrato se muestren como seleccionadas
      const areaIdsFromPrograms = allAreas.map(area => area.id);
      
      // Obtener las áreas del contrato más reciente usando la referencia
      // Usar contratoRef.current para obtener el contrato más actualizado
      const currentContrato = contratoRef.current;
      let selectedAreaIds: number[] = [];
      
      if (currentContrato?.areasConocimiento && Array.isArray(currentContrato.areasConocimiento)) {
        selectedAreaIds = currentContrato.areasConocimiento
          .map((area: any) => {
            if (typeof area === 'object' && area !== null && 'id' in area) {
              return area.id;
            }
            return typeof area === 'number' ? area : null;
          })
          .filter((id): id is number => id !== null);
      }
      
      // Filtrar solo las áreas que están en la lista de áreas de los programas seleccionados
      // Esto hace que cuando selecciones un programa, las áreas de ese programa que ya están en el contrato se muestren como seleccionadas
      const filteredSelectedAreas = selectedAreaIds.filter(id => areaIdsFromPrograms.includes(id));
      
      // Establecer las áreas seleccionadas (solo las que pertenecen a los programas actuales)
      // Esto es crítico: cuando seleccionas un programa, las áreas de ese programa que ya están en el contrato deben mostrarse como seleccionadas
      setSelectedAreas(filteredSelectedAreas);
    } catch (error) {
      console.error('Error al cargar áreas de conocimiento:', error);
      enqueueSnackbar('Error al cargar áreas de conocimiento', { variant: 'error' });
      setAreas([]);
      setSelectedAreas([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleToggleArea = async (id: number) => {
    const previousSelectedAreas = [...selectedAreas];
    const newSelectedAreas = selectedAreas.includes(id)
      ? selectedAreas.filter((areaId) => areaId !== id)
      : [...selectedAreas, id];
    
    // Actualizar estado local inmediatamente para mejor UX
    setSelectedAreas(newSelectedAreas);
    
    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          areasConocimiento: newSelectedAreas
        });
        setToastMessage('Áreas de conocimiento actualizadas');
        setShowToast(true);
        
        // Actualizar el contrato en el padre para mantener sincronización
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Error al guardar áreas de conocimiento:', error);
        enqueueSnackbar('Error al guardar áreas de conocimiento', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedAreas(previousSelectedAreas);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSelectAll = async () => {
    const previousSelectedAreas = [...selectedAreas];
    const newSelectedAreas = selectedAreas.length === areas.length
      ? []
      : areas.map((area) => area.id);
    
    // Actualizar estado local inmediatamente para mejor UX
    setSelectedAreas(newSelectedAreas);
    
    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          areasConocimiento: newSelectedAreas
        });
        setToastMessage('Áreas de conocimiento actualizadas');
        setShowToast(true);
        
        // Actualizar el contrato en el padre para mantener sincronización
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Error al guardar áreas de conocimiento:', error);
        enqueueSnackbar('Error al guardar áreas de conocimiento', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedAreas(previousSelectedAreas);
      } finally {
        setSaving(false);
      }
    }
  };

  /**
   * Crea una nueva área de conocimiento y la asocia a los programas seleccionados
   * Maneja validaciones y mensajes según si hay 1 o más programas seleccionados
   */
  const handleCreateArea = async () => {
    const trimmedName = newAreaName.trim();
    
    if (!trimmedName) {
      enqueueSnackbar('Por favor ingrese un nombre para el área de conocimiento', { variant: 'warning' });
      return;
    }

    // Usar los programIds memoizados (que incluyen externalProgramIds si están disponibles)
    // Esto asegura que use los programas actualizados inmediatamente
    // Si programIds está vacío, intentar obtenerlos del contrato como fallback
    const currentProgramIds = programIds.length > 0 ? programIds : (externalProgramIds !== undefined ? externalProgramIds : getSelectedProgramIds());
    const programNames = getSelectedProgramNames();
    
    if (currentProgramIds.length === 0) {
      enqueueSnackbar('Debe seleccionar al menos un programa antes de crear un área de conocimiento', { variant: 'warning' });
      return;
    }

    // Convertir a mayúsculas antes de enviarlo
    const uppercasedName = toUpperCase(trimmedName);

    try {
      setCreating(true);
      const response = await axios.post('store_area_conocimiento', {
        nombreAreaConocimiento: uppercasedName,
        idProgramas: currentProgramIds
      });

      if (response.data && response.data.data) {
        const newArea = response.data.data;
        
        // Recargar las áreas de conocimiento para incluir la nueva
        await fetchAreasByPrograms(currentProgramIds);
        
        // Seleccionar automáticamente la nueva área
        const newSelectedAreas = [...selectedAreas, newArea.id];
        setSelectedAreas(newSelectedAreas);
        
        // Guardar la selección en el contrato
        if (contrato?.id) {
          await axios.post(`update_contrato/${contrato.id}`, {
            areasConocimiento: newSelectedAreas
          });
          
          // Actualizar el contrato en el padre para mantener sincronización
          if (onSave) {
            onSave();
          }
        }

        // Limpiar el formulario
        setNewAreaName('');
        setShowCreateForm(false);
        
        // Construir mensaje según la respuesta del backend
        let message = 'Área de conocimiento creada y asociada correctamente';
        const warnings = response.data.warnings || [];
        
        if (currentProgramIds.length === 1) {
          // Un solo programa: mensaje simple
          message = 'Área de conocimiento creada correctamente';
        } else if (warnings.length > 0) {
          // Múltiples programas: mensaje detallado
          const programasConArea: string[] = [];
          const programasSinArea: string[] = [];
          
          warnings.forEach((warning: string) => {
            if (warning.includes('ya existía en:')) {
              const programas = warning.replace('El área ya existía en: ', '').split(', ');
              programasConArea.push(...programas);
            } else if (warning.includes('Se asoció a:')) {
              const programas = warning.replace('Se asoció a: ', '').split(', ');
              programasSinArea.push(...programas);
            }
          });
          
          // Construir mensaje detallado
          if (programasConArea.length > 0 && programasSinArea.length > 0) {
            message = `Área creada en: ${programasSinArea.join(', ')}. Ya existía en: ${programasConArea.join(', ')}`;
          } else if (programasSinArea.length > 0) {
            message = `Área creada en: ${programasSinArea.join(', ')}`;
          } else if (programasConArea.length > 0) {
            message = `El área ya existía en: ${programasConArea.join(', ')}`;
          }
        }
        
        setToastMessage(message);
        setShowToast(true);
        
        // Si hay advertencias (área ya existía en algunos programas), mostrar modal
        if (warnings.length > 0 && currentProgramIds.length > 1) {
          // Construir datos para el modal
          const programasConArea: string[] = [];
          const programasSinArea: string[] = [];
          
          warnings.forEach((warning: string) => {
            if (warning.includes('ya existía en:')) {
              const programas = warning.replace('El área ya existía en: ', '').split(', ');
              programasConArea.push(...programas);
            } else if (warning.includes('Se asoció a:')) {
              const programas = warning.replace('Se asoció a: ', '').split(', ');
              programasSinArea.push(...programas);
            }
          });
          
          // Mostrar modal con información detallada
          if (programasConArea.length > 0 || programasSinArea.length > 0) {
            setModalData({
              programasConArea,
              programasSinArea,
              nombreArea: uppercasedName,
              titulo: programasConArea.length > 0 && programasSinArea.length === 0 
                ? 'Área ya existe' 
                : 'Información del Área de Conocimiento'
            });
            setShowModalArea(true);
          }
        }
      }
    } catch (error: any) {
      console.error('Error al crear área de conocimiento:', error);
      
      // Manejar error de duplicado (409 Conflict)
      if (error.response?.status === 409) {
        const errorData = error.response?.data;
        const programas = errorData?.data?.programas || [];
        
        if (currentProgramIds.length === 1) {
          // Un solo programa: mensaje simple en snackbar
          const errorMessage = errorData?.message || 'Esa área ya existe';
          enqueueSnackbar(errorMessage, { 
            variant: 'error',
            autoHideDuration: 5000,
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'right',
            }
          });
        } else {
          // Múltiples programas: mostrar modal
          const programasConArea = programas.length > 0 
            ? programas 
            : programNames;
          setModalData({
            programasConArea: Array.isArray(programasConArea) ? programasConArea : [programasConArea],
            programasSinArea: [],
            nombreArea: uppercasedName,
            titulo: 'Área ya existe en todos los programas'
          });
          setShowModalArea(true);
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors?.nombreAreaConocimiento?.[0] ||
                            'Error al crear área de conocimiento';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = selectedAreas.length;
  const allSelected = selectedAreas.length === areas.length && areas.length > 0;
  // programIds ya está memoizado arriba, no redeclarar
  const hasProgramsSelected = programIds.length > 0;

  return (
    <>
      <style>{scrollStyles}</style>
      <div className="card">
        <div className="card-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <KeenIcon icon="abstract-26" className="text-base text-primary" />
            <h3 className="card-title text-sm">Áreas de Conocimiento</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasProgramsSelected && (
              <>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center gap-1 text-xs font-medium text-success hover:text-success-dark transition-colors"
                  title="Crear nueva área de conocimiento"
                >
                  <KeenIcon icon="plus" className="text-sm" />
                  Nueva Área
                </button>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  {allSelected ? (
                    <>
                      <KeenIcon icon="check-circle" className="text-sm" />
                      Deseleccionar Todas
                    </>
                  ) : (
                    <>
                      <KeenIcon icon="check-circle" className="text-sm" />
                      Seleccionar Todas
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card-body py-3">
        {!hasProgramsSelected ? (
          <div className="text-center py-8">
            <KeenIcon icon="abstract-26" className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seleccione programas para ver áreas de conocimiento
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Las áreas de conocimiento se mostrarán según los programas seleccionados
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cargando áreas...</p>
          </div>
        ) : (
          <>
            {showCreateForm && (
              <div className="mb-4 p-3 bg-transparent dark:bg-transparent rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <KeenIcon icon="plus" className="text-sm text-primary" />
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Crear Nueva Área de Conocimiento</h4>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => {
                      // Convertir a mayúsculas mientras se escribe, preservando espacios
                      const inputValue = e.target.value;
                      // Preservar espacios internos, solo convertir a mayúsculas
                      const uppercased = inputValue.toUpperCase();
                      setNewAreaName(uppercased);
                    }}
                    onBlur={(e) => {
                      // Asegurar conversión a mayúsculas y limpiar espacios al inicio/final al perder el foco
                      const trimmed = e.target.value.trim();
                      const uppercased = trimmed.toUpperCase();
                      if (uppercased !== e.target.value) {
                        setNewAreaName(uppercased);
                      }
                    }}
                    placeholder="Ingrese el nombre del área de conocimiento"
                    className="input flex-1 text-xs"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !creating) {
                        handleCreateArea();
                      }
                    }}
                    disabled={creating}
                  />
                  <button
                    onClick={handleCreateArea}
                    disabled={creating || !newAreaName.trim()}
                    className="px-3 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {creating ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <KeenIcon icon="check" className="text-sm" />
                        Crear
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewAreaName('');
                    }}
                    disabled={creating}
                    className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-transparent dark:bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <KeenIcon icon="cross" className="text-sm" />
                  </button>
                </div>
              </div>
            )}
            {areas.length === 0 ? (
              <div className="text-center py-6">
                <KeenIcon icon="abstract-26" className="text-3xl text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No hay áreas de conocimiento asociadas a los programas seleccionados
                </p>
              </div>
            ) : (
              <div 
                className="knowledge-areas-scroll max-h-[160px] overflow-y-auto pr-2 scroll-smooth"
              >
                <div className="grid grid-cols-2 gap-2 pb-1">
                  {areas.map((area) => {
                    const isSelected = selectedAreas.includes(area.id);
                    return (
                      <div
                        key={area.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-transparent dark:bg-transparent border-primary'
                            : 'bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className={`text-xs font-medium break-words flex-1 ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                          {area.nombreAreaConocimiento}
                        </span>
                        <label className="switch switch-sm flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleArea(area.id)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center bg-transparent dark:bg-transparent rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-primary">
                  {selectedCount} área{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    <Toast
      message={toastMessage}
      isOpen={showToast}
      onClose={() => setShowToast(false)}
    />

    <ModalAreaConocimiento
      isOpen={showModalArea}
      onClose={() => {
        setShowModalArea(false);
        setModalData(null);
      }}
      titulo={modalData?.titulo}
      nombreArea={modalData?.nombreArea}
      programasConArea={modalData?.programasConArea || []}
      programasSinArea={modalData?.programasSinArea || []}
    />
    </>
  );
};

export { KnowledgeAreas };
