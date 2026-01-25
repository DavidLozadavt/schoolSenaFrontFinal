import { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface AssignedProgramsProps {
  contrato: ContratoInterface;
  onSave?: () => void;
}

interface Programa {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
  descripcionPrograma?: string;
  nivel?: {
    nombreNivel?: string;
  };
  tipoFormacion?: {
    nombreTipoFormacion?: string;
  };
  duracion?: string;
  fichas?: number;
}

const AssignedPrograms = ({ contrato, onSave }: AssignedProgramsProps) => {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchProgramas();
    if (contrato?.programas && Array.isArray(contrato.programas)) {
      const programIds = contrato.programas.map((program: any) => {
        if (typeof program === 'object' && program !== null && 'id' in program) {
          return program.id;
        }
        return typeof program === 'number' ? program : null;
      }).filter((id): id is number => id !== null);
      setSelectedPrograms(programIds);
    }
  }, [contrato]);

  const fetchProgramas = async () => {
    try {
      const response = await axios.get('programas_contratacion');
      if (response.data) {
        const programasMapeados = response.data.map((p: any) => ({
          id: p.id,
          nombrePrograma: p.nombrePrograma,
          codigoPrograma: p.codigoPrograma,
          descripcionPrograma: p.descripcionPrograma,
          nivel: p.nivel,
          tipoFormacion: p.tipoFormacion,
          duracion: '24 meses', // TODO: Obtener de la API cuando esté disponible
          fichas: Math.floor(Math.random() * 5) + 1 // TODO: Obtener de la API cuando esté disponible
        }));
        setProgramas(programasMapeados);
      }
    } catch (error) {
      console.error('Error al cargar programas:', error);
      enqueueSnackbar('Error al cargar programas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProgram = async (id: number) => {
    const newSelectedPrograms = selectedPrograms.includes(id)
      ? selectedPrograms.filter((programId) => programId !== id)
      : [...selectedPrograms, id];
    
    setSelectedPrograms(newSelectedPrograms);
    
    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          programas: newSelectedPrograms
        });
        enqueueSnackbar('Programas actualizados', { variant: 'success' });
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Error al guardar programas:', error);
        enqueueSnackbar('Error al guardar programas', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedPrograms(selectedPrograms);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedPrograms.length === programas.length) {
      setSelectedPrograms([]);
    } else {
      setSelectedPrograms(programas.map((program) => program.id));
    }
  };

  const selectedCount = selectedPrograms.length;
  const allSelected = selectedPrograms.length === programas.length && programas.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeenIcon icon="book" className="text-base text-primary" />
            <h3 className="card-title text-sm">Programas Asignados</h3>
          </div>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors ml-4"
          >
            {allSelected ? (
              <>
                <KeenIcon icon="check-circle" className="text-sm" />
                Deseleccionar Todos
              </>
            ) : (
              <>
                <KeenIcon icon="check-circle" className="text-sm" />
                Seleccionar Todos
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card-body py-3">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">Cargando programas...</p>
          </div>
        ) : (
          <>
            <div className="max-h-[350px] overflow-y-auto pr-2">
              <div className="space-y-2">
                {programas.map((programa) => {
                  const isSelected = selectedPrograms.includes(programa.id);
                  return (
                    <label
                      key={programa.id}
                      className={`flex items-start gap-3 px-3 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-primary'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProgram(programa.id)}
                        className="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-xs font-semibold mb-1 ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                              {programa.nombrePrograma}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span>
                                <span className="font-medium">Acrónimo:</span> {programa.codigoPrograma}
                              </span>
                              <span>
                                <span className="font-medium">Duración:</span> {programa.duracion || 'N/A'}
                              </span>
                              <span>
                                <span className="font-medium">Tipo:</span>{' '}
                                {programa.tipoFormacion?.nombreTipoFormacion || programa.nivel?.nombreNivel || 'N/A'}
                              </span>
                              <span>
                                <span className="font-medium">Fichas:</span> {programa.fichas || 0} ficha{programa.fichas !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center bg-blue-50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-primary">
                  {selectedCount} programa{selectedCount !== 1 ? 's' : ''} asignado{selectedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { AssignedPrograms };
