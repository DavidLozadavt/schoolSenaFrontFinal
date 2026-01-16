import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useSnackbar } from 'notistack';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalHorasExtraAdmin = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const fetchConfiguracionHE = async () => {
    setLoading(true);
    try {
      const response = await axios.get('configuracion_horas_extra');
      setConfiguraciones(response.data);
    } catch (error) {
      setError('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const [contratos, setContratos] = useState<any[]>([]);

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
    fetchConfiguracionHE();
    fetchContratos();
  }, []);

  useEffect(() => {
    if (open && !data) {
      setSelectedContrato(null);
    }
  }, [open, data]);

  const formik = useFormik({
    initialValues: {
      configuracion_id: data?.configuracion_id || '',
      horas: data?.horas || '',
      fecha: data?.fecha || '',
      archivo: null as File | null
    },
    validationSchema: Yup.object().shape({
      configuracion_id: Yup.string().required('La configuración es obligatoria'),
      horas: Yup.number()
        .typeError('Debe ser un número')
        .min(1, 'Debe ser mayor a 0')
        .required('Las horas son obligatorias'),
      fecha: Yup.date().required('La fecha es obligatoria').typeError('Debe ser una fecha válida'),
      archivo: Yup.mixed().nullable()
    }),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append('idConfiguracionHorasExtra', values.configuracion_id);
        formData.append('horas', values.horas.toString());
        formData.append('fecha', values.fecha);

        if (selectedContrato) {
          formData.append('idContrato', selectedContrato);
        }

        if (values.archivo) {
          formData.append('archivo', values.archivo);
        }

        let response;
        if (data) {
          response = await axios.put(
            `solicitud_trabajador_horas_extra_by_supervisor/${data.id}`,
            formData
          );
          enqueueSnackbar('Solicitud actualizada exitosamente', { variant: 'success' });
        } else {
          response = await axios.post('solicitud_trabajador_horas_extra_by_supervisor', formData);
          enqueueSnackbar('Solicitud creada exitosamente', { variant: 'success' });
        }

        if (onSave) onSave();

        if ([200, 201].includes(response.status)) {
          resetForm();
          onClose();
        } else {
          enqueueSnackbar('Error al guardar la solicitud', { variant: 'error' });
        }
      } catch (error: any) {
        const backendMessage =
          error.response?.data?.message || 'Ocurrió un error inesperado al guardar la solicitud';
        enqueueSnackbar(backendMessage, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  const [selectedContrato, setSelectedContrato] = useState(null);

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

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`
  }));

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Solicitud de Horas Extra' : 'Nueva Solicitud de Horas Extra'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div className="relative w-[calc(100%-2rem)] mx-auto">
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
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Configuración</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('configuracion_id')}
              >
                <option value="">Seleccione una configuración</option>
                {configuraciones.map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>
                    {cfg.detalle}
                  </option>
                ))}
              </select>
              {formik.touched.configuracion_id &&
                typeof formik.errors.configuracion_id === 'string' && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.configuracion_id}</p>
                )}
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de horas
              </label>
              <input
                className="input p-2 border border-gray-300 rounded-md w-full"
                type="number"
                min="1"
                {...formik.getFieldProps('horas')}
              />
              {formik.touched.horas && typeof formik.errors.horas === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.horas}</p>
              )}
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                className="input p-2 border border-gray-300 rounded-md w-full"
                type="date"
                {...formik.getFieldProps('fecha')}
              />
              {formik.touched.fecha && typeof formik.errors.fecha === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.fecha}</p>
              )}
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo (opcional)
              </label>
              <input
                type="file"
                className="file-input p-2 border border-gray-300 rounded-md w-full"
                onChange={(e) => {
                  formik.setFieldValue('archivo', e.currentTarget.files?.[0] || null);
                }}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-4 px-4">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </ModalBody>
        </form>
      </ModalContent>
    </Modal>
  );
};

export { ModalHorasExtraAdmin };
