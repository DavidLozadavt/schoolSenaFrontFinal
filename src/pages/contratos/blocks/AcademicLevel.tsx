import { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface AcademicLevelProps {
  contrato: ContratoInterface;
  onSave?: () => void;
}

interface NivelEducativo {
  id: number;
  nombre: string;
}

const AcademicLevel = ({ contrato, onSave }: AcademicLevelProps) => {
  const [nivelesEducativos, setNivelesEducativos] = useState<NivelEducativo[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchNivelesEducativos();
    if (contrato?.nivelEducativo?.id) {
      setSelectedLevel(contrato.nivelEducativo.id);
    } else if (contrato?.idNivelEducativo) {
      setSelectedLevel(contrato.idNivelEducativo);
    }
  }, [contrato]);

  const fetchNivelesEducativos = async () => {
    try {
      const response = await axios.get('programas_recursos_crear');
      if (response.data?.data?.niveles_educativos) {
        setNivelesEducativos(response.data.data.niveles_educativos);
      }
    } catch (error) {
      console.error('Error al cargar niveles educativos:', error);
      enqueueSnackbar('Error al cargar niveles educativos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLevel = async (id: number) => {
    setSelectedLevel(id);
    
    // Guardar cambios en el backend
    if (contrato?.id) {
      try {
        setSaving(true);
        await axios.post(`update_contrato/${contrato.id}`, {
          idNivelEducativo: id
        });
        enqueueSnackbar('Nivel educativo actualizado', { variant: 'success' });
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Error al guardar nivel educativo:', error);
        enqueueSnackbar('Error al guardar nivel educativo', { variant: 'error' });
        // Revertir cambio en caso de error
        if (contrato?.nivelEducativo?.id) {
          setSelectedLevel(contrato.nivelEducativo.id);
        } else if (contrato?.idNivelEducativo) {
          setSelectedLevel(contrato.idNivelEducativo);
        } else {
          setSelectedLevel(null);
        }
      } finally {
        setSaving(false);
      }
    }
  };

  const selectedNivel = nivelesEducativos.find((n) => n.id === selectedLevel);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <KeenIcon icon="abstract-25" className="text-base text-primary" />
          <h3 className="card-title text-sm">Nivel Académico</h3>
        </div>
      </div>

      <div className="card-body py-3">
        {loading ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">Cargando niveles...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {nivelesEducativos.map((nivel) => {
                const isSelected = selectedLevel === nivel.id;
                return (
                  <button
                    key={nivel.id}
                    onClick={() => handleSelectLevel(nivel.id)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                      isSelected
                        ? 'bg-blue-50 border-primary text-primary font-semibold'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {nivel.nombre}
                  </button>
                );
              })}
            </div>

            {selectedNivel && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-2 py-1.5">
                  <KeenIcon icon="check-circle" className="text-xs text-primary" />
                  <p className="text-xs font-semibold text-gray-700">
                    Nivel seleccionado:{' '}
                    <span className="text-primary font-semibold">{selectedNivel.nombre}</span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export { AcademicLevel };
