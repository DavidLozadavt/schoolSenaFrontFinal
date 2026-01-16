import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { useSnackbar } from 'notistack';
import { ModalTipoConcepto } from './ModalTipoConcepto';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

type Deduccion = {
  valorFinal: number;
};

const ModalOtrasDeducciones = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [tipoConceptos, setTipoConceptos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<any>(null);
  const [selectedContrato, setSelectedContrato] = useState(null);

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

  const fetchContratos = async () => {
    try {
      const response = await axios.get('contracts_actives_nominas');
      setContratos(response.data);
    } catch (error) {
      setError('Error al cargar contratos');
    }
  };

  useEffect(() => {
    fetchTipoConceptos();
    fetchContratos();
    fetchData();
  }, []);

  const fetchTipoConceptos = async () => {
    try {
      const response = await axios.get('get_tipo_conceptos');
      setTipoConceptos(response.data);
    } catch (error) {
      setError('Error al cargar configuraciones');
    }
  };

  const handleAfterSave = () => {
    fetchTipoConceptos();
  };

  const formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const formik = useFormik({
    initialValues: {
      idTipoConcepto: data?.idTipoConcepto || '',
      cuotas: data?.cuotas || 'no',
      numero_cuotas: data?.numero_cuotas || '',
      valor: data?.valor || '',

      valor_final: data?.valor_final || 0,
      archivo: null as File | null,
      fechaInicial: data?.fechaInicial || ''
    },
    validationSchema: Yup.object().shape({
      idTipoConcepto: Yup.string().required('El tipo concepto es obligatorio'),

      cuotas: Yup.string().required('Debe seleccionar si tiene cuotas'),
      numero_cuotas: Yup.number().when('cuotas', {
        is: 'si',
        then: (schema) =>
          schema.required('Debe ingresar número de cuotas').min(1, 'Debe ser mayor a 0'),
        otherwise: (schema) => schema.notRequired()
      }),
      valor: Yup.number()
        .typeError('Debe ser un número')
        .min(1, 'Debe ser mayor a 0')
        .required('El valor es obligatorio'),

      fechaInicial: Yup.date()
        .transform((value, originalValue) => (originalValue ? new Date(originalValue) : null))
        .required('La fecha inicial es obligatoria'),

      archivo: Yup.mixed().nullable()
    }),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const contratoSeleccionado = contratos.find((c) => c.id === selectedContrato);
        const salarioMensual = contratoSeleccionado?.salario?.valor || 0;
        const porcentajeEndeudamiento = parseFloat(config?.porcentajeNivelEndeudamineto || '0');
        const limite = (salarioMensual * porcentajeEndeudamiento) / 100;

        const totalActualDeducciones = (contratoSeleccionado?.otrasDeducciones || []).reduce(
          (acc: number, ded: Deduccion) => acc + (ded.valorFinal || 0),
          0
        );

        const valorFinalNueva =
          values.cuotas === 'si' ? values.numero_cuotas * values.valor : values.valor;

        const totalConNueva = totalActualDeducciones + valorFinalNueva;

        if (totalConNueva > limite) {
          enqueueSnackbar(
            `El total de deducciones (${formatoMoneda.format(
              totalConNueva
            )}) supera el límite permitido (${formatoMoneda.format(limite)})`,
            { variant: 'error' }
          );
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('idTipoConcepto', values.idTipoConcepto);
        formData.append('cuotas', values.cuotas);
        if (values.cuotas === 'si') {
          formData.append('numero_cuotas', values.numero_cuotas);
        }
        formData.append('valor', values.valor);
        formData.append('fechaInicial', values.fechaInicial);
        formData.append('valor_final', valorFinalNueva.toString());

        if (values.archivo) {
          formData.append('archivo', values.archivo);
        }
        if (selectedContrato) {
          formData.append('idContrato', selectedContrato);
        }

        let response;
        if (data) {
          response = await axios.put(`update_deducciones/${data.id}`, formData);
          enqueueSnackbar('Deducción actualizada exitosamente', { variant: 'success' });
        } else {
          response = await axios.post('store_deducciones', formData);
          enqueueSnackbar('Deducción creada exitosamente', { variant: 'success' });
        }

        if (onSave) onSave();
        fetchContratos();
        if ([200, 201].includes(response.status)) {
          resetForm();
          onClose();
        } else {
          enqueueSnackbar('Error al guardar', { variant: 'error' });
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
          idTipoConcepto: data?.idTipoConcepto || '',
          cuotas: data?.cuotas || 'no',
          numero_cuotas: data?.numero_cuotas || '',
          valor: data?.valor || '',

          valor_final: data?.valor_final || 0,
          archivo: null,
          fechaInicial: data?.fechaInicial || ''
        }
      });
      setSelectedContrato(data?.idContrato || null);
    }
  }, [open, data, resetForm]);

  const fetchData = async () => {
    try {
      const response = await axios.get('configurations_nomina');
      setConfig(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const fontSize = isDarkMode ? '0.875rem' : '1rem';
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`,
    identificacion: contrato.persona?.identificacion,
    foto: contrato.persona?.rutaFotoUrl
  }));

  const valorFinal =
    formik.values.cuotas === 'si'
      ? (formik.values.numero_cuotas || 0) * (formik.values.valor || 0)
      : formik.values.valor || 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Deducción' : 'Nueva Deducción'}</ModalTitle>
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
                styles={customStyles}
                isClearable
                placeholder="Seleccione un contrato"
                value={options.find((option) => option.value === selectedContrato) || null}
                onChange={(selectedOption) =>
                  setSelectedContrato(selectedOption ? selectedOption.value : '')
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
              <label className="block text-sm font-medium mb-1">Tipo Concepto</label>
              <div className="flex items-center gap-2">
                <select
                  className="input p-2 border border-gray-300 rounded-md w-full"
                  {...formik.getFieldProps('idTipoConcepto')}
                >
                  <option value="">Seleccione una opción</option>
                  {tipoConceptos.map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.nombre}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-10 h-10 btn btn-sm btn-light"
                >
                  <KeenIcon icon="plus" />
                </button>
              </div>
              {formik.touched.idTipoConcepto &&
                typeof formik.errors.idTipoConcepto === 'string' && (
                  <p className="text-red-500 text-sm mt-1">{formik.errors.idTipoConcepto}</p>
                )}
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">¿Cuotas?</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('cuotas')}
              >
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>

            {formik.values.cuotas === 'si' && (
              <div className="relative w-[calc(100%-2rem)] mx-auto">
                <label className="block text-sm font-medium mb-1">Número de cuotas</label>
                <input
                  type="number"
                  className="input p-2 border border-gray-300 rounded-md w-full"
                  {...formik.getFieldProps('numero_cuotas')}
                />
                {formik.touched.numero_cuotas &&
                  typeof formik.errors.numero_cuotas === 'string' && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.numero_cuotas}</p>
                  )}
              </div>
            )}

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Fecha Inicial</label>
              <input
                type="date"
                className="input p-2 border border-gray-300 rounded-md w-full"
                {...formik.getFieldProps('fechaInicial')}
                min={new Date().toISOString().split('T')[0]}
              />
              {formik.touched.fechaInicial && typeof formik.errors.fechaInicial === 'string' && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.fechaInicial}</p>
              )}
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

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Archivo (opcional)</label>
              <input
                type="file"
                className="file-input p-2 border border-gray-300 rounded-md w-full"
                onChange={(e) => {
                  formik.setFieldValue('archivo', e.currentTarget.files?.[0] || null);
                }}
              />
            </div>

            <div className="relative w-[calc(100%-2rem)] mx-auto">
              <label className="block text-sm font-medium mb-1">Valor Final</label>
              <input
                type="text"
                value={
                  valorFinal
                    ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(valorFinal)
                    : '$0'
                }
                readOnly
                className="input p-2 border border-gray-300 rounded-md w-full bg-gray-100"
              />
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

        <ModalTipoConcepto
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
          onSave={handleAfterSave}
        />
      </ModalContent>
    </Modal>
  );
};

export { ModalOtrasDeducciones };
