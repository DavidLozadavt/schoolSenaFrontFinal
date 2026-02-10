import { useState, useEffect, useMemo, useRef } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Toast from '../../programas-academicos/components/Toast';

interface AssignedProgramsProps {
  contrato: ContratoInterface;
  onSave?: () => void;
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

const AssignedPrograms = ({ contrato, onSave }: AssignedProgramsProps) => {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();
  const hasShownWarning = useRef<boolean>(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Cargar programas al montar el componente
  useEffect(() => {
    fetchProgramas();
    if (contrato?.programas && Array.isArray(contrato.programas)) {
      const programIds = contrato.programas
        .map((program: any) => {
          if (typeof program === 'object' && program !== null && 'id' in program) {
            return program.id as number;
          }
          return typeof program === 'number' ? program : null;
        })
        .filter((id): id is number => id !== null);
      setSelectedPrograms(programIds);
    }
  }, [contrato]);

  const fetchProgramas = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<ProgramaAPI[]>('programas_contratacion');
      console.log('Programas recibidos:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0 && !hasShownWarning.current) {
          console.warn(
            'No hay programas disponibles para esta empresa. Verifique que existan programas con idCompany correspondiente.'
          );
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
          .filter((programa: Programa) => programa.fichas? programa.fichas > 0 : null); // Solo mostrar programas con fichas
        
        setProgramas(programasMapeados);
      } else {
        console.warn('La respuesta de programas no es un array:', response.data);
        setProgramas([]);
      }
    } catch (error: any) {
      console.error('Error al cargar programas:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      enqueueSnackbar('Error al cargar programas', { variant: 'error' });
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProgram = async (id: number): Promise<void> => {
    const newSelectedPrograms = selectedPrograms.includes(id)
      ? selectedPrograms.filter((programId) => programId !== id)
      : [...selectedPrograms, id];

    setSelectedPrograms(newSelectedPrograms);

    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          programas: newSelectedPrograms,
        });
        setToastMessage('Programas actualizados');
        setShowToast(true);
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

  const handleSelectAll = (): void => {
    if (selectedPrograms.length === programas.length) {
      setSelectedPrograms([]);
    } else {
      setSelectedPrograms(programas.map((program) => program.id));
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
                      <label
                        key={programa.id}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-transparent dark:bg-transparent border-primary'
                            : 'bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProgram(programa.id)}
                          className="w-4 h-4 mt-0.5 rounded focus:ring-primary appearance-none"
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
                      </label>
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