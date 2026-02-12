import { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Toast from '../../programas-academicos/components/Toast';

interface KnowledgeAreasProps {
  contrato: ContratoInterface;
  onSave?: () => void;
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

const KnowledgeAreas = ({ contrato, onSave }: KnowledgeAreasProps) => {
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [creating, setCreating] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchAreas();
    if (contrato?.areasConocimiento && Array.isArray(contrato.areasConocimiento)) {
      const areaIds = contrato.areasConocimiento.map((area: any) => {
        if (typeof area === 'object' && area !== null && 'id' in area) {
          return area.id;
        }
        return typeof area === 'number' ? area : null;
      }).filter((id): id is number => id !== null);
      setSelectedAreas(areaIds);
    }
  }, [contrato]);

  const fetchAreas = async () => {
    try {
      const response = await axios.get('areas_conocimiento');
      if (response.data) {
        setAreas(response.data);
      }
    } catch (error) {
      console.error('Error al cargar áreas de conocimiento:', error);
      enqueueSnackbar('Error al cargar áreas de conocimiento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArea = async (id: number) => {
    const newSelectedAreas = selectedAreas.includes(id)
      ? selectedAreas.filter((areaId) => areaId !== id)
      : [...selectedAreas, id];
    
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
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Error al guardar áreas de conocimiento:', error);
        enqueueSnackbar('Error al guardar áreas de conocimiento', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedAreas(selectedAreas);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedAreas.length === areas.length) {
      setSelectedAreas([]);
    } else {
      setSelectedAreas(areas.map((area) => area.id));
    }
  };

  const handleCreateArea = async () => {
    if (!newAreaName.trim()) {
      enqueueSnackbar('Por favor ingrese un nombre para el área de conocimiento', { variant: 'warning' });
      return;
    }

    try {
      setCreating(true);
      const response = await axios.post('store_area_conocimiento', {
        nombreAreaConocimiento: newAreaName.trim()
      });

      if (response.data && response.data.data) {
        const newArea = response.data.data;
        // Agregar la nueva área a la lista
        setAreas([...areas, newArea].sort((a, b) => 
          a.nombreAreaConocimiento.localeCompare(b.nombreAreaConocimiento)
        ));
        
        // Seleccionar automáticamente la nueva área
        const newSelectedAreas = [...selectedAreas, newArea.id];
        setSelectedAreas(newSelectedAreas);
        
        // Guardar la selección en el contrato
        if (contrato?.id) {
          await axios.post(`update_contrato/${contrato.id}`, {
            areasConocimiento: newSelectedAreas
          });
        }

        // Limpiar el formulario
        setNewAreaName('');
        setShowCreateForm(false);
        
        setToastMessage('Área de conocimiento creada y seleccionada correctamente');
        setShowToast(true);
        
        if (onSave) {
          onSave();
        }
      }
    } catch (error: any) {
      console.error('Error al crear área de conocimiento:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.nombreAreaConocimiento?.[0] ||
                          'Error al crear área de conocimiento';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = selectedAreas.length;
  const allSelected = selectedAreas.length === areas.length && areas.length > 0;

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
          </div>
        </div>
      </div>

      <div className="card-body py-3">
        {loading ? (
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
                    onChange={(e) => setNewAreaName(e.target.value)}
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
            <div 
              className="knowledge-areas-scroll max-h-[160px] overflow-y-auto pr-2 scroll-smooth"
            >
              <div className="grid grid-cols-2 gap-2 pb-1">
                {areas.map((area) => {
                  const isSelected = selectedAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-transparent dark:bg-transparent border-primary'
                          : 'bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleArea(area.id)}
                        className="w-4 h-4 rounded focus:ring-primary flex-shrink-0 appearance-none"
                        style={{
                          backgroundColor: 'transparent',
                          border: isSelected ? '2px solid var(--tw-primary)' : '2px solid rgb(209, 213, 219)',
                          borderColor: isSelected ? 'var(--tw-primary)' : 'rgb(209, 213, 219)',
                          backgroundImage: isSelected ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'9\' viewBox=\'0 0 12 9\' fill=\'none\'%3E%3Cpath d=\'M10.3667 0.541643L4.80007 6.10831L1.56674 2.87498C1.41061 2.71977 1.1994 2.63265 0.979241 2.63265C0.759086 2.63265 0.547876 2.71977 0.391741 2.87498C0.236532 3.03111 0.149414 3.24232 0.149414 3.46248C0.149414 3.68263 0.236532 3.89384 0.391741 4.04998L4.21674 7.87498C4.37288 8.03019 4.58409 8.1173 4.80424 8.1173C5.0244 8.1173 5.23561 8.03019 5.39174 7.87498L11.5417 1.72498C11.6198 1.64751 11.6818 1.55534 11.7241 1.45379C11.7665 1.35224 11.7882 1.24332 11.7882 1.13331C11.7882 1.0233 11.7665 0.914379 11.7241 0.81283C11.6818 0.711281 11.6198 0.619113 11.5417 0.541643C11.3856 0.386434 11.1744 0.299316 10.9542 0.299316C10.7341 0.299316 10.5229 0.386434 10.3667 0.541643Z\' fill=\'%23006AE6\'/%3E%3C/svg%3E")' : 'none',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundSize: 'contain'
                        }}
                      />
                      <span className={`text-xs font-medium break-words ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                        {area.nombreAreaConocimiento}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

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
    </>
  );
};

export { KnowledgeAreas };
