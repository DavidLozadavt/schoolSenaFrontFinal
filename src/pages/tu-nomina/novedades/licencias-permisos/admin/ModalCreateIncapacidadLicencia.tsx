import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import Select from 'react-select';
import { useSnackbar } from 'notistack';
import { TipoIncapacidadInterface } from '@/pages/tipo-incapacidades/models/TipoIncapacidadInterface';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalCreateIncapacidadLicencia = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fechaInicial, setFechaInicial] = useState(data?.fechaInicial || '');
  const [fechaFinal, setFechaFinal] = useState(data?.fechaFinal || '');
  const [tipo, setTipo] = useState(data?.tipo || '');
  const [numeroDias, setNumeroDias] = useState(data?.numeroDias || '');
  const [comentario, setComentario] = useState(data?.comentario || '');
  const [selectedContrato, setSelectedContrato] = useState(null);

  const [imagen, setImagen] = useState(null);
  const [contratos, setContratos] = useState<any[]>([]);
  const [tipoIncapacidades, setTipoIncapacidades] = useState<TipoIncapacidadInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [errors, setErrors] = useState({
    fechaInicial: '',
    fechaFinal: '',
    tipo: '',
    comentario: '',
    imagen: '',
    idContrato: '',
    tipoParto: ''
  });

  useEffect(() => {
    if (open) {
      setFechaInicial('');
      setFechaFinal('');
      setTipo('');
      setNumeroDias('');
      setComentario('');
      setImagen(null);
      setSelectedContrato(null);
      setTipoMaternidad('');
      setErrors({
        fechaInicial: '',
        fechaFinal: '',
        tipo: '',
        comentario: '',
        imagen: '',
        idContrato: '',
        tipoParto: ''
      });
    }
  }, [open]);

  const [tipoParto, setTipoMaternidad] = useState('');

  const isMaternidad = (() => {
    const selectedTipo = tipoIncapacidades.find((item) => item.id === parseInt(tipo));
    if (!selectedTipo) return false;
    return selectedTipo.tipoIncapacidad.toLowerCase().startsWith('maternidad');
  })();

  useEffect(() => {
    if (!isMaternidad) {
      setTipoMaternidad('');
      setErrors((prev) => ({ ...prev, tipoParto: '' }));
    }
  }, [isMaternidad]);

  useEffect(() => {
    if (fechaInicial && fechaFinal) {
      const inicio = new Date(fechaInicial).getTime();
      const fin = new Date(fechaFinal).getTime();

      if (fin >= inicio) {
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setNumeroDias(diffDays.toString());
        setErrors((prev) => ({ ...prev, fechaFinal: '' }));
      } else {
        setNumeroDias('');
        setErrors((prev) => ({
          ...prev,
          fechaFinal: 'La fecha final no puede ser menor que la inicial.'
        }));
      }
    }
  }, [fechaInicial, fechaFinal]);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
    }
  };

  const validate = () => {
    const newErrors = {
      fechaInicial: fechaInicial ? '' : 'La fecha inicial es requerida.',
      fechaFinal: fechaFinal ? errors.fechaFinal || '' : 'La fecha final es requerida.',
      tipo: tipo.trim() ? '' : 'El tipo es requerido.',
      idContrato: selectedContrato ? '' : 'El Contrato es requerido.',
      comentario: comentario.trim() ? '' : 'El comentario es requerido.',
      imagen: imagen ? '' : 'El documento es requerido.',
      tipoParto: isMaternidad && !tipoParto ? 'Debe seleccionar el tipo de maternidad.' : ''
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('fechaInicial', fechaInicial);
    formData.append('fechaFinal', fechaFinal);
    formData.append('idTipoIncapacidad', tipo);
    formData.append('comentario', comentario);
    formData.append('idContrato', selectedContrato + ' ');
    if (isMaternidad) formData.append('tipoParto', tipoParto);
    if (imagen) formData.append('soporte', imagen);

    try {
      await axios.post('solicitud_inc_by_supervisor', formData);
      enqueueSnackbar('Datos guardados con éxito.', { variant: 'success' });
      onSave();
      onClose();
    } catch (error: any) {
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al guardar los datos.';

      enqueueSnackbar(backendMessage, { variant: 'error' });

      console.error('Error al guardar:', error.response?.data || error);
    }
  };

  const fetchTipoIncapacidades = async () => {
    setLoading(true);
    try {
      const response = await axios.get('tipos_incapacidades');
      setTipoIncapacidades(response.data);
    } catch (error) {
      setError('Error al cargar los tipos de incapacidad');
    } finally {
      setLoading(false);
    }
  };

  const [config, setConfig] = useState<any>(null);
  const [disableFechaFinal, setDisableFechaFinal] = useState(false);
  const fetchConfiguracionNomina = async () => {
    setLoading(true);
    try {
      const response = await axios.get('configurations_incapacidades');
      setConfig(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  const sumarDias = (fecha: string, dias: number): string => {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias + 1);
    const año = f.getFullYear();
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  useEffect(() => {
    if (!config || !fechaInicial || !tipo) return;

    let dias = 0;
    let desactivarFechaFinal = false;

    const selectedTipo = tipoIncapacidades.find((item) => item.id === parseInt(tipo));
    if (!selectedTipo) return;

    const nombreTipo = selectedTipo.tipoIncapacidad?.toUpperCase() || '';
    const esMaternidad = nombreTipo.startsWith('MATERNIDAD');

    if (esMaternidad && tipoParto) {
      switch (tipoParto) {
        case 'NORMAL':
          dias = config.diasMaternidadNormal || 0;
          desactivarFechaFinal = true;
          break;
        case 'MULTIPLE':
          dias = config.diasMaternidadMultiple || 0;
          desactivarFechaFinal = true;
          break;
        case 'PREMATURO':
          dias = config.diasMaternidadPrematura || 0;
          desactivarFechaFinal = true;
          break;
        case 'CASO_ESPECIAL':
          dias = config.diasMaternidadCasoEspecial || 0;
          desactivarFechaFinal = true;
          break;
        default:
          dias = 0;
          desactivarFechaFinal = false;
      }
    } else {
      switch (nombreTipo) {
        case 'LUTO COMPAÑERO':
          dias = config.diasLutoComp || 0;
          desactivarFechaFinal = true;
          break;
        case 'LUTO':
          dias = config.diasLutoFamiliar || 0;
          desactivarFechaFinal = true;
          break;

        case 'PATERNIDAD':
          dias = config.diasPaternidad || 0;
          desactivarFechaFinal = true;
          break;
        default:
          dias = 0;
          desactivarFechaFinal = false;
      }
    }

    if (dias > 0) {
      const nuevaFechaFinal = sumarDias(fechaInicial, dias);
      setFechaFinal(nuevaFechaFinal);
      setNumeroDias(dias.toString());
      setDisableFechaFinal(desactivarFechaFinal);
    } else {
      setNumeroDias('');
      setDisableFechaFinal(false);
    }
  }, [tipo, fechaInicial, config, tipoParto, tipoIncapacidades]);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('contracts_actives_nominas');
      setContratos(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipoIncapacidades();
    fetchContratos();
    fetchConfiguracionNomina();
  }, []);

  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [diasUsados, setDiasUsados] = useState<number | null>(null);

  useEffect(() => {
    const fetchDiasRestantes = async () => {
      if (!selectedContrato || !tipo) {
        setDiasRestantes(null);
        setDiasUsados(null);
        return;
      }

      const tipoSeleccionado = tipoIncapacidades.find((t) => t.id === parseInt(tipo));

      if (!tipoSeleccionado || tipoSeleccionado.tipoIncapacidad !== 'CUIDADO_NINEZ') {
        setDiasRestantes(null);
        setDiasUsados(null);
        return;
      }

      try {
        const response = await axios.post('calculate_days_restantes_cuidado_ninez', {
          idContrato: selectedContrato
        });

        if (response.data.success) {
          setDiasUsados(response.data.dias_usados);
          setDiasRestantes(response.data.dias_restantes);
        }
      } catch (error: any) {
        if (error.response?.data?.error) {
          enqueueSnackbar(error.response.data.error, { variant: 'error' });
          setDiasUsados(error.response.data.dias_usados || 10);
          setDiasRestantes(0);
        } else {
          enqueueSnackbar('Error al consultar los días restantes.', { variant: 'error' });
        }
      }
    };

    fetchDiasRestantes();
  }, [selectedContrato, tipo, tipoIncapacidades, enqueueSnackbar]);

  useEffect(() => {
    if (!fechaInicial || !fechaFinal || diasRestantes === null) return;

    const inicio = new Date(fechaInicial);
    const fin = new Date(fechaFinal);

    if (fin < inicio) {
      enqueueSnackbar('La fecha final no puede ser anterior a la inicial.', { variant: 'warning' });
      setFechaFinal('');
      return;
    }

    const diferenciaMs = fin.getTime() - inicio.getTime();
    const diasSeleccionados = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)) + 1;

    if (diasSeleccionados > diasRestantes) {
      enqueueSnackbar(`No puedes elegir más de ${diasRestantes} días.`, {
        variant: 'error'
      });
      setFechaFinal('');
    }
  }, [fechaInicial, fechaFinal, diasRestantes, enqueueSnackbar]);

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`
  }));

  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;

  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const fontSize = isDarkMode ? '0.875rem' : '1rem';
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: background,
      color: color,
      fontSize: fontSize,
      borderColor: isDarkMode ? '#2D2E36' : '#E4E6EF',
      boxShadow: 'none',
      '&:hover': {
        borderColor: isDarkMode ? '#555' : '#A1A5B7'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: color,
      fontSize: fontSize
    }),
    input: (provided: any) => ({
      ...provided,
      color: isDarkMode ? 'white' : '#4B5675',
      fontSize: fontSize
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#aaa' : '#A1A5B7',
      fontSize: fontSize
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: iconColor,
      '&:hover': { color: iconColor }
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: iconColor
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: background,
      color: color,
      borderRadius: '0.5rem',
      boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.15)'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? '#333'
          : '#E4E6EF'
        : state.isFocused
          ? isDarkMode
            ? '#2D2E36'
            : '#F1F1F1'
          : background,
      color: color,
      fontSize: fontSize
    })
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Solicitud de Incapacidades y Licencias</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="contrato" className="block mb-1 text-sm font-medium">
              Seleccione un Contrato
            </label>
            <Select
              id="contrato"
              options={options}
              isLoading={loading}
              isClearable
              placeholder="Seleccione un contrato"
              value={options.find((option) => option.value === selectedContrato) || null}
              onChange={(selectedOption) =>
                setSelectedContrato(selectedOption ? selectedOption.value : '')
              }
              className="w-full"
              styles={customStyles}
            />

            {errors.idContrato && <p className="text-red-500 text-sm mt-1">{errors.idContrato}</p>}
          </div>

          <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium">
              Tipo Incapacidad
            </label>
            <select
              id="tipo"
              className={`input p-2 border ${
                errors.tipo ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={tipo}
              onChange={(e) => {
                const value = e.target.value;
                setTipo(value);
                if (errors.tipo) setErrors((prev) => ({ ...prev, tipo: '' }));
              }}
            >
              <option value="">Seleccione un tipo</option>
              {tipoIncapacidades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.tipoIncapacidad}
                </option>
              ))}
            </select>
            {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>}
          </div>

          {isMaternidad && (
            <div className="mt-3">
              <label htmlFor="tipoParto" className="block mb-1 text-sm font-medium">
                Tipo de Maternidad
              </label>
              <select
                id="tipoParto"
                className={`input p-2 border ${errors.tipoParto ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
                value={tipoParto}
                onChange={(e) => {
                  setTipoMaternidad(e.target.value);
                  if (errors.tipoParto) setErrors((prev) => ({ ...prev, tipoParto: '' }));
                }}
              >
                <option value="">Seleccione una opción</option>
                <option value="NINGUNO">NINGUNO</option>
                <option value="NORMAL">NORMAL</option>
                <option value="MULTIPLE">MÚLTIPLE</option>
                <option value="PREMATURO">PREMATURO</option>
                <option value="CASO_ESPECIAL">CASO ESPECIAL</option>
              </select>
              {errors.tipoParto && <p className="text-red-500 text-sm mt-1">{errors.tipoParto}</p>}
            </div>
          )}

          <div>
            <label htmlFor="fechaInicial" className="block mb-1 text-sm font-medium">
              Fecha Inicial
            </label>
            <input
              type="date"
              id="fechaInicial"
              className={`input p-2 border ${
                errors.fechaInicial ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={fechaInicial}
              onChange={(e) => {
                setFechaInicial(e.target.value);
                if (errors.fechaInicial) setErrors((prev) => ({ ...prev, fechaInicial: '' }));
              }}
            />
            {errors.fechaInicial && (
              <p className="text-red-500 text-sm mt-1">{errors.fechaInicial}</p>
            )}
          </div>

          <div>
            <label htmlFor="fechaFinal" className="block mb-1 text-sm font-medium">
              Fecha Final
            </label>
            <input
              type="date"
              id="fechaFinal"
              className={`input p-2 border ${
                errors.fechaFinal ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={fechaFinal}
              disabled={disableFechaFinal}
              onChange={(e) => {
                setFechaFinal(e.target.value);
                if (errors.fechaFinal) setErrors((prev) => ({ ...prev, fechaFinal: '' }));
              }}
            />
            {errors.fechaFinal && <p className="text-red-500 text-sm mt-1">{errors.fechaFinal}</p>}
          </div>

          <div>
            <label htmlFor="numeroDias" className="block mb-1 text-sm font-medium">
              Número de Días
            </label>
            <input
              disabled
              type="text"
              id="numeroDias"
              className="input p-2 border border-gray-300 rounded-md w-full"
              value={numeroDias}
            />
          </div>

          <div>
            <label htmlFor="comentario" className="block mb-1 text-sm font-medium">
              Comentario
            </label>
            <textarea
              id="comentario"
              className={`textarea p-2 border ${errors.comentario ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Escribe un comentario"
              rows={3}
              value={comentario}
              onChange={(e) => {
                setComentario(e.target.value);
                if (errors.comentario) setErrors((prev) => ({ ...prev, comentario: '' }));
              }}
            />
            {errors.comentario && <p className="text-red-500 text-sm mt-1">{errors.comentario}</p>}
          </div>

          <div>
            <label htmlFor="imagen" className="block mb-1 text-sm font-medium">
              Archivo
            </label>
            <input
              type="file"
              id="imagen"
              className="file-input p-2 border border-gray-300 rounded-md w-full"
              onChange={(e) => {
                handleFileChange(e);
                if (errors.imagen) setErrors((prev) => ({ ...prev, imagen: '' }));
              }}
            />
            {errors.imagen && <p className="text-red-500 text-sm mt-1">{errors.imagen}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCreateIncapacidadLicencia };
