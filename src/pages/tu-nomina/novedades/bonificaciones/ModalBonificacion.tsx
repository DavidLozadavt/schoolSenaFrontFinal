import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}
const ModalBonificacion = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [contratos, setContratos] = useState<any[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<number | null>(null);

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

  const fetchContratos = useCallback(async () => {
    try {
      const response = await axios.get('contracts_actives_nominas');
      setContratos(response.data);
    } catch (error) {
      enqueueSnackbar('Error al cargar contratos', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`,
    identificacion: contrato.persona?.identificacion,
    foto: contrato.persona?.rutaFotoUrl
  }));

  const formik = useFormik({
    initialValues: {
      valor: data?.valor || '',
      observacion: data?.observacion || '',
      fechaInicial: data?.fechaInicial || '',
      fechaFinal: data?.fechaFinal || '',
      tipo: data?.tipo || '',
      descripcion: data?.descripcion || ''
    },
    validationSchema: Yup.object().shape({
      valor: Yup.number().required('El valor es obligatorio'),
      observacion: Yup.string().required('La observación es obligatoria'),
      fechaInicial: Yup.date().required('La fecha inicial es obligatoria'),
      fechaFinal: Yup.date().min(
        Yup.ref('fechaInicial'),
        'La fecha final debe ser mayor o igual a la inicial'
      ),
      tipo: Yup.string().oneOf(['HABITUAL', 'TEMPORAL']).required('La frecuencia es obligatoria'),
      descripcion: Yup.string().required('La descripción es obligatoria')
    }),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('valor', values.valor);
        formData.append('observacion', values.observacion);
        formData.append('fechaInicial', values.fechaInicial);
        formData.append('fechaFinal', values.fechaFinal);
        formData.append('tipo', values.tipo);
        formData.append('descripcion', values.descripcion);
        if (selectedContrato) {
          formData.append('idContrato', selectedContrato.toString());
        }

        let response;
        if (data) {
          response = await axios.put(`update_bonificacion/${data.id}`, formData);
          enqueueSnackbar('Bonificación actualizada exitosamente', { variant: 'success' });
        } else {
          response = await axios.post('store_bonificacion', formData);
          enqueueSnackbar('Bonificación creada exitosamente', { variant: 'success' });
        }

        if (onSave) onSave();
        if ([200, 201].includes(response.status)) {
          resetForm();
          onClose();
        }
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.message || 'Error al guardar', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({
        values: {
          valor: data?.valor || '',
          observacion: data?.observacion || '',
          fechaInicial: data?.fechaInicial || '',
          fechaFinal: data?.fechaFinal || '',
          tipo: data?.tipo || '',
          descripcion: data?.descripcion || ''
        }
      });
      setSelectedContrato(data?.idContrato || null);
    }
  }, [open, data, resetForm]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Bonificación' : 'Nueva Bonificación'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block mb-1 text-sm font-medium">Seleccione un Contrato</label>
              <Select
                options={options}
                isLoading={loading}
                styles={customStyles}
                isClearable
                placeholder="Seleccione un contrato"
                value={options.find((option) => option.value === selectedContrato) || null}
                onChange={(selectedOption) =>
                  setSelectedContrato(selectedOption ? selectedOption.value : null)
                }
                formatOptionLabel={(option: any) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={option.foto || '/default/user.svg'}
                      alt="foto persona"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.identificacion}</span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Valor</label>
              <input
                type="text"
                className="input p-2 border border-gray-300 rounded-md w-full"
                value={
                  formik.values.valor
                    ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(Number(formik.values.valor))
                    : ''
                }
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                  formik.setFieldValue('valor', rawValue ? parseInt(rawValue, 10) : '');
                }}
              />
              {formik.touched.valor && typeof formik.errors.valor === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.valor}</p>
              )}
            </div>

            {/* Fecha Inicial */}
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Fecha Inicial</label>
              <input
                type="date"
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('fechaInicial')}
              />
              {formik.touched.fechaInicial && typeof formik.errors.fechaInicial === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.fechaInicial}</p>
              )}
            </div>

            {/* Fecha Final */}
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Fecha Final</label>
              <input
                type="date"
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('fechaFinal')}
              />
              {formik.touched.fechaFinal && typeof formik.errors.fechaFinal === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.fechaFinal}</p>
              )}
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Frecuencia</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('tipo')}
              >
                <option value="">Seleccione una opción</option>
                <option value="HABITUAL">HABITUAL</option>
                <option value="TEMPORAL">TEMPORAL</option>
              </select>
              {formik.touched.tipo && typeof formik.errors.tipo === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.tipo}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                className="textarea p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('descripcion')}
              />
              {formik.touched.descripcion && typeof formik.errors.descripcion === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.descripcion}</p>
              )}
            </div>

            {/* Observación */}
            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Observación</label>
              <textarea
                className="textarea p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('observacion')}
              />
              {formik.touched.observacion && typeof formik.errors.observacion === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.observacion}</p>
              )}
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

export { ModalBonificacion };
