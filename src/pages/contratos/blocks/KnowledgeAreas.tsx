import { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface KnowledgeAreasProps {
  contrato: ContratoInterface;
  onSave?: () => void;
}

interface AreaConocimiento {
  id: number;
  nombreAreaConocimiento: string;
}

const KnowledgeAreas = ({ contrato, onSave }: KnowledgeAreasProps) => {
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

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
        enqueueSnackbar('Áreas de conocimiento actualizadas', { variant: 'success' });
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

  const selectedCount = selectedAreas.length;
  const allSelected = selectedAreas.length === areas.length && areas.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeenIcon icon="abstract-26" className="text-base text-primary" />
            <h3 className="card-title text-sm">Áreas de Conocimiento</h3>
          </div>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors ml-4"
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

      <div className="card-body py-3">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">Cargando áreas...</p>
          </div>
        ) : (
          <>
            <div className="max-h-[350px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-2">
                {areas.map((area) => {
                  const isSelected = selectedAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-primary'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleArea(area.id)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                      />
                      <span className={`text-xs font-medium break-words ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                        {area.nombreAreaConocimiento}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center bg-blue-50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-primary">
                  {selectedCount} área{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { KnowledgeAreas };
