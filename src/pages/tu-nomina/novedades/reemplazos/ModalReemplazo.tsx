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
const ModalReemplazo = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [contratos, setContratos] = useState<any[]>([]);
  const [selectedContrato1, setSelectedContrato1] = useState<number | null>(null);
  const [selectedContrato2, setSelectedContrato2] = useState<number | null>(null);

  const formik = useFormik({
    initialValues: {
      fechaInicial: data?.fechaInicial || '',
      fechaFinal: data?.fechaFinal || '',
      observacion: data?.observacion || ''
    },
    validationSchema: Yup.object().shape({
      fechaInicial: Yup.date().required('La fecha inicial es obligatoria'),
      fechaFinal: Yup.date().min(Yup.ref('fechaInicial'), 'Debe ser mayor a la inicial'),
      observacion: Yup.string().required('La observación es obligatoria')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = {
          fechaInicial: values.fechaInicial,
          fechaFinal: values.fechaFinal,
          observacion: values.observacion,
          idContratoTrabajador: selectedContrato2,
          idContratoRemplazo: selectedContrato1
        };

        let response;
        if (data) {
          response = await axios.put(`update_reemplazo/${data.id}`, payload);
          enqueueSnackbar('Reemplazo actualizado exitosamente', { variant: 'success' });
        } else {
          response = await axios.post('store_reemplazo', payload);
          enqueueSnackbar('Reemplazo creado exitosamente', { variant: 'success' });
        }

        if (onSave) onSave();
        if ([200, 201].includes(response.status)) {
          onClose();
        }
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.message || 'Error al guardar', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  });

  const { setValues, resetForm } = formik;

  useEffect(() => {
    if (data) {
      setValues({
        fechaInicial: data.fechaInicial || '',
        fechaFinal: data.fechaFinal || '',
        observacion: data.observacion || ''
      });

      setSelectedContrato1(data.idContratoTrabajador || null);
      setSelectedContrato2(data.idContratoRemplazo || null);
    } else {
      resetForm();
      setSelectedContrato1(null);
      setSelectedContrato2(null);
    }
  }, [data, setValues, resetForm]);

  useEffect(() => {
    if (open) {
      if (data) {
        setValues({
          fechaInicial: data.fechaInicial || '',
          fechaFinal: data.fechaFinal || '',
          observacion: data.observacion || ''
        });

        setSelectedContrato1(data.idContratoTrabajador || null);
        setSelectedContrato2(data.idContratoRemplazo || null);
      } else {
        resetForm();
        setSelectedContrato1(null);
        setSelectedContrato2(null);
      }
    }
  }, [open, data, setValues, resetForm]);

  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const fontSize = isDarkMode ? '0.875rem' : '1rem';
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`,
    identificacion: contrato.persona?.identificacion,
    foto: contrato.persona?.rutaFotoUrl,
    salario: contrato.salario?.valor
  }));

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

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Registro' : 'Nuevo Registro'}</ModalTitle>
          <button onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <form onSubmit={formik.handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div>
              <label>Trabajador a Reemplazar</label>
              <Select
                options={options}
                isLoading={loading}
                styles={customStyles}
                isClearable
                placeholder="Seleccione un contrato"
                value={options.find((o) => o.value === selectedContrato1) || null}
                onChange={(opt) => setSelectedContrato1(opt ? opt.value : null)}
                formatOptionLabel={(option: any) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={option.foto || '/default/user.svg'}
                      alt="foto persona"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">CC: {option.identificacion}</span>
                      <span className="text-xs text-green-600">
                        💰{' '}
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP'
                        }).format(option.salario || 0)}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div>
              <label>Trabajador Reemplazante</label>
              <Select
                options={options}
                isLoading={loading}
                styles={customStyles}
                isClearable
                placeholder="Seleccione un contrato"
                value={options.find((o) => o.value === selectedContrato2) || null}
                onChange={(opt) => setSelectedContrato2(opt ? opt.value : null)}
                formatOptionLabel={(option: any) => (
                  <div className="flex items-center gap-2">
                    <img
                      src={option.foto || '/default/user.svg'}
                      alt="foto persona"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">CC: {option.identificacion}</span>
                      <span className="text-xs text-green-600">
                        💰{' '}
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP'
                        }).format(option.salario || 0)}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            <div>
              <label>Fecha Inicial</label>
              <input
                className="input p-2 border border-gray-300 rounded-md w-full"
                type="date"
                {...formik.getFieldProps('fechaInicial')}
              />
              {formik.touched.fechaInicial && formik.errors.fechaInicial && (
                <p className="text-red-500 text-sm">{String(formik.errors.fechaInicial)}</p>
              )}
            </div>

            <div>
              <label>Fecha Final</label>
              <input
                className="input p-2 border border-gray-300 rounded-md w-full"
                type="date"
                {...formik.getFieldProps('fechaFinal')}
              />
              {formik.touched.fechaFinal && formik.errors.fechaFinal && (
                <p className="text-red-500 text-sm">{String(formik.errors.fechaFinal)}</p>
              )}
            </div>

            <div>
              <label>Observación</label>
              <textarea
                className="textarea p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('observacion')}
              />
              {formik.touched.observacion && typeof formik.errors.observacion === 'string' && (
                <p className="text-red-500 text-sm">{formik.errors.observacion}</p>
              )}
            </div>

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

export { ModalReemplazo };
