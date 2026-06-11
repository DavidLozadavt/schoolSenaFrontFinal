import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { User, X } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';

interface ProfesorOption {
  value: number;
  label: string;
  foto?: string;
  data?: any;
}

interface ProfesorSelectProps {
  idMateria: number;
  onSelect: (profesor: any) => Promise<void>;
  excludeIds?: number[];
  placeholder?: string;
  isMulti?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export const ProfesorSelect: React.FC<ProfesorSelectProps> = ({
  idMateria,
  onSelect,
  excludeIds = [],
  placeholder = 'Selecciona un profesor',
  isMulti = false,
  loading = false,
  onClose
}) => {
  const [instructores, setInstructores] = useState<ProfesorOption[]>([]);
  const [loadingInstructores, setLoadingInstructores] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar instructores al montar o cuando cambia idMateria
  useEffect(() => {
    cargarInstructores();
  }, [idMateria]);

  const cargarInstructores = async () => {
    setLoadingInstructores(true);
    try {
      const response = await axios.get('materias/instructores', {
        params: { idMateria }
      });

      const data = (response.data.data || []).filter((inst: any) => {
        // Filtrar instructores excluidos
        if (excludeIds.includes(inst.id)) return false;
        if (excludeIds.includes(inst.persona?.id)) return false;
        return true;
      });

      const opciones: ProfesorOption[] = data.map((inst: any) => ({
        value: inst.id,
        label: `${inst.persona?.nombre1 || ''} ${inst.persona?.apellido1 || ''}`.trim(),
        foto: inst.persona?.rutaFotoUrl || inst.persona?.rutaFoto,
        data: inst
      }));

      setInstructores(opciones);
    } catch (error: any) {
      enqueueSnackbar('Error al cargar los profesores disponibles', { variant: 'error' });
    } finally {
      setLoadingInstructores(false);
    }
  };

  const handleChange = async (selected: any) => {
    if (!selected) return;

    setIsSubmitting(true);
    try {
      const profesor = isMulti ? selected[selected.length - 1] : selected;
      await onSelect(profesor);
    } catch (error: any) {
      enqueueSnackbar('Error al asignar profesor', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customStyles = {
    option: (provided: any, state: any) => ({
      ...provided,
      padding: '8px 12px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      backgroundColor: state.isSelected
        ? 'var(--color-primary, #3b82f6)'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      ':active': {
        backgroundColor: 'var(--color-primary, #3b82f6)',
        color: 'white'
      }
    }),
    control: (provided: any, state: any) => ({
      ...provided,
      fontSize: '13px',
      fontWeight: '600',
      borderColor: state.isFocused ? 'var(--color-primary, #3b82f6)' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      ':hover': {
        borderColor: 'var(--color-primary, #3b82f6)'
      },
      backgroundColor: 'white',
      minHeight: '38px'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#1f2937',
      fontWeight: '600'
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '4px 0',
      maxHeight: '200px'
    })
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-95% overflow-visible border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-2xl dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <h3 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest">
            Asignar Profesor
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className={`p-6`}>
          <Select
            options={instructores}
            onChange={handleChange}
            isLoading={loadingInstructores || isSubmitting || loading}
            isDisabled={loadingInstructores || isSubmitting || loading || instructores.length === 0}
            isClearable={false}
            placeholder={placeholder}
            styles={customStyles}
            formatOptionLabel={(option) => (
              <div className="flex items-center gap-3 py-1">
                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {option.foto ? (
                    <img
                      src={option.foto}
                      alt={option.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-800 uppercase truncate">
                  {option.label}
                </span>
              </div>
            )}
            classNamePrefix="profesor-select"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfesorSelect;
