import { useState, useEffect, useMemo, useRef } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Toast from '../../programas-academicos/components/Toast';

interface AssignedProgramsProps {
  contrato: ContratoInterface;
  onSave?: () => void;
  onProgramsChange?: (programIds: number[]) => void;
}

interface Nivel {
  nombreNivel?: string;
}

interface TipoFormacion {
  nombreTipoFormacion?: string;
}

interface Programa {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
  descripcionPrograma?: string;
  nivel?: Nivel;
  tipoFormacion?: TipoFormacion;
  duracion?: string | null;
  fichas?: number;
}

interface ProgramaAPI {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
  descripcionPrograma?: string;
  nivel?: Nivel;
  tipoFormacion?: TipoFormacion;
}

// Estilos para ocultar scrollbar
const programsScrollStyles = `
  .programs-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .programs-scroll::-webkit-scrollbar {
    display: none;
  }
`;

const AssignedPrograms = ({ contrato, onSave, onProgramsChange }: AssignedProgramsProps) => {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();
  const hasShownWarning = useRef<boolean>(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const hasInitializedRef = useRef(false);
  const previousProgramIdsRef = useRef<string>('');

  // Cargar programas solo una vez al montar
  useEffect(() => {
    if (!hasInitializedRef.current) {
      fetchProgramas();
      hasInitializedRef.current = true;
    }
  }, []);

  // Sincronizar programas seleccionados cuando cambie el contrato (solo si realmente cambió)
  useEffect(() => {
    if (contrato?.programas && Array.isArray(contrato.programas)) {
      const programIds = contrato.programas
        .map((program: any) => {
          if (typeof program === 'object' && program !== null && 'id' in program) {
            return program.id as number;
          }
          return typeof program === 'number' ? program : null;
        })
        .filter((id): id is number => id !== null);
      
      const programIdsString = programIds.sort().join(',');
      // Solo actualizar si realmente cambió para evitar recargas innecesarias
      if (programIdsString !== previousProgramIdsRef.current) {
        previousProgramIdsRef.current = programIdsString;
        setSelectedPrograms(programIds);
      }
    } else if (selectedPrograms.length > 0) {
      // Si el contrato no tiene programas pero tenemos seleccionados, limpiar
      previousProgramIdsRef.current = '';
      setSelectedPrograms([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrato?.programas]);

  const fetchProgramas = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<ProgramaAPI[]>('programas_contratacion');
      
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0 && !hasShownWarning.current) {
          enqueueSnackbar('No hay programas disponibles para esta empresa', { variant: 'warning' });
          hasShownWarning.current = true;
        }
        
        const programasMapeados: Programa[] = response.data
          .map((p: any) => ({
            id: p.id,
            nombrePrograma: p.nombrePrograma,
            codigoPrograma: p.codigoPrograma,
            descripcionPrograma: p.descripcionPrograma,
            nivel: p.nivel,
            tipoFormacion: p.tipoFormacion,
            duracion: null,
            fichas: p.fichas || 0,
          }))
          .filter((programa: Programa) => programa.fichas && programa.fichas > 0); // Solo mostrar programas con fichas
        
        setProgramas(programasMapeados);
      } else {
        setProgramas([]);
      }
    } catch {
      enqueueSnackbar('Error al cargar programas', { variant: 'error' });
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProgram = async (id: number): Promise<void> => {
    const previousSelectedPrograms = [...selectedPrograms];
    const newSelectedPrograms = selectedPrograms.includes(id)
      ? selectedPrograms.filter((programId) => programId !== id)
      : [...selectedPrograms, id];

    // Actualizar estado local inmediatamente para mejor UX
    setSelectedPrograms(newSelectedPrograms);
    
    // Notificar cambio inmediatamente para que KnowledgeAreas pueda reaccionar al instante
    if (onProgramsChange) {
      onProgramsChange(newSelectedPrograms);
    }

    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          programas: newSelectedPrograms,
        });

        // Mantiene sincronizado el contrato en el padre para que otros bloques no queden stale.
        if (onSave) onSave();
        
        setToastMessage('Programas actualizados');
        setShowToast(true);
        
        // No recargar el contrato - ya notificamos el cambio con onProgramsChange
        // El contrato se sincronizará automáticamente cuando sea necesario
        // Evitar recarga innecesaria que causa loops
      } catch (error) {
        enqueueSnackbar('Error al guardar programas', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedPrograms(previousSelectedPrograms);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSelectAll = async (): Promise<void> => {
    const previousSelectedPrograms = [...selectedPrograms];
    const newSelectedPrograms = selectedPrograms.length === programas.length
      ? []
      : programas.map((program) => program.id);

    // Actualizar estado local inmediatamente para mejor UX
    setSelectedPrograms(newSelectedPrograms);
    
    // Notificar cambio inmediatamente para que KnowledgeAreas pueda reaccionar al instante
    if (onProgramsChange) {
      onProgramsChange(newSelectedPrograms);
    }

    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          programas: newSelectedPrograms,
        });

        if (onSave) onSave();

        setToastMessage('Programas actualizados');
        setShowToast(true);
        
        // No recargar el contrato - ya notificamos el cambio con onProgramsChange
        // El contrato se sincronizará automáticamente cuando sea necesario
        // Evitar recarga innecesaria que causa loops
      } catch (error) {
        enqueueSnackbar('Error al guardar programas', { variant: 'error' });
        // Revertir cambio en caso de error
        setSelectedPrograms(previousSelectedPrograms);
      } finally {
        setSaving(false);
      }
    }
  };

  const selectedCount: number = selectedPrograms.length;
  const allSelected: boolean = selectedPrograms.length === programas.length && programas.length > 0;

  // Filtrar programas por término de búsqueda
  const filteredProgramas = useMemo<Programa[]>(() => {
    if (!searchTerm) return programas;
    const term = searchTerm.toLowerCase();
    return programas.filter(
      (programa) =>
        programa.nombrePrograma.toLowerCase().includes(term) ||
        programa.codigoPrograma.toLowerCase().includes(term) ||
        programa.descripcionPrograma?.toLowerCase().includes(term)
    );
  }, [programas, searchTerm]);

  return (
    <>
      <style>{programsScrollStyles}</style>
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <KeenIcon icon="book" className="text-base text-primary" />
              <h3 className="card-title text-sm">Programas Asignados</h3>
            </div>
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
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
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Buscar Programa</label>
            <div className="relative">
              <KeenIcon
                icon="magnifier"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o descripción..."
                className="w-full pl-10 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Cargando programas...</p>
            </div>
          ) : filteredProgramas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'No se encontraron programas con ese criterio'
                  : 'No hay programas disponibles'}
              </p>
            </div>
          ) : (
            <>
              <div
                className="programs-scroll max-h-[350px] overflow-y-auto pr-2 scroll-smooth"
              >
                <div className="space-y-2 pb-1">
                  {filteredProgramas.map((programa) => {
                    const isSelected = selectedPrograms.includes(programa.id);
                    return (
                      <div
                        key={programa.id}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-transparent dark:bg-transparent border-primary'
                            : 'bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p
                                className={`text-xs font-semibold mb-1 ${
                                  isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {programa.nombrePrograma}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                  <span className="font-medium">Acrónimo:</span> {programa.codigoPrograma}
                                </span>
                                {programa.duracion && (
                                  <span>
                                    <span className="font-medium">Duración:</span> {programa.duracion}
                                  </span>
                                )}
                                <span>
                                  <span className="font-medium">Tipo:</span>{' '}
                                  {programa.tipoFormacion?.nombreTipoFormacion ||
                                    programa.nivel?.nombreNivel ||
                                    'N/A'}
                                </span>
                                <span>
                                  <span className="font-medium">Fichas:</span> {programa.fichas || 0} ficha
                                  {programa.fichas !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <label className="switch switch-sm flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProgram(programa.id)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center bg-transparent dark:bg-transparent rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-primary">
                    {selectedCount} programa{selectedCount !== 1 ? 's' : ''} asignado
                    {selectedCount !== 1 ? 's' : ''}
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

export { AssignedPrograms };