import axios from 'axios';
import { useFormik } from 'formik';
import React, { useContext, useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';
import { AuthContext } from '@/auth/providers/JWTProvider';
import FormularioTipoInfraestructura from './FormularioTipoInfraestructura';

interface Props {
  idInfraestructura?: string;
  setIdInfraestructura: (id: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: 'create' | 'edit';
}

interface TipoInfraestructura {
  id: number;
  nombre: string;
}

interface Sedes {
  id: number;
  nombre: string;
}

interface FormValues {
  nombreInfraestructura: string;
  capacidad: number;
  idSede: { value: number; label: string } | null;
  idTipoInfraestructura: { value: number; label: string } | null;
}

const validationSchema = Yup.object({
  nombreInfraestructura: Yup.string().required('El nombre es obligatorio'),

  capacidad: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser un número entero')
    .positive('Debe ser mayor que 0')
    .max(500, 'Debe ser menor que 500')
    .required('La capacidad es obligatoria'),

  idSede: Yup.object().nullable().required('La sede es obligatoria'),

  idTipoInfraestructura: Yup.object().nullable().required('El ambiente es obligatorio')
});

const FormularioInfraestructura: React.FC<Props> = ({
  idInfraestructura,
  setIdInfraestructura,
  isModalOpen,
  setIsModalOpen,
  setEvento,
  mode = 'create'
}) => {
  const authContext = useContext(AuthContext);

  const [tipoInfraestructura, setTipoInfraestructura] = useState<TipoInfraestructura[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);
  
  //Tipos de infraestructuras:
  const [reloadTipos, setReloadTipos] = useState<boolean>(false);
  //abrir el formulario tipo infraestructura:
  const [formTiIn, setFormTiIn] = useState<boolean>(false);

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      nombreInfraestructura: '',
      capacidad: 1,
      idSede: null,
      idTipoInfraestructura: null
    },

    validationSchema,

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          nombreInfraestructura: values.nombreInfraestructura,
          capacidad: values.capacidad,
          idSede: values.idSede?.value,
          idTipoInfraestructura: values.idTipoInfraestructura?.value
        };

        if (mode === 'create') {
          await axios.post('infraestructuras', payload);
        } else {
          await axios.put(`infraestructuras/${idInfraestructura}`, payload);
        }

        setEvento((prev) => !prev);

        setTimeout(() => {
          resetForm();
          setIsModalOpen(false);
          setIdInfraestructura('');
        }, 500);
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // ------------------------
  // Cargar listas
  // ------------------------
  useEffect(() => {
    const loadData = async () => {
      const [infraRes, sedesRes] = await Promise.all([
        axios.get('infraestructuras/tipos'),
        axios.get(`sedes/regional/${authContext?.empresa?.id}`)
      ]);

      setTipoInfraestructura(infraRes.data.data);
      setSedes(sedesRes.data.data);
    };

    if (authContext?.empresa?.id) loadData();
  }, [authContext?.empresa?.id,reloadTipos]);

  // ------------------------
  // Cargar datos edición
  // ------------------------
  useEffect(() => {
    if (mode === 'edit' && idInfraestructura) {
      const loadInfra = async () => {
        const res = await axios.get(`infraestructuras/${idInfraestructura}`);
        const data = res.data.data;

        formik.setValues({
          nombreInfraestructura: data.nombreInfraestructura,
          capacidad: data.capacidad,
          idSede: {
            value: data.idSede,
            label: data.sede?.nombre
          },
          idTipoInfraestructura: {
            value: data.idTipoInfraestructura,
            label: data.tipo_infraestructura?.nombre
          }
        });
      };

      loadInfra();
    } else {
      formik.resetForm();
    }
  }, [idInfraestructura, mode]);

  if (!isModalOpen) return null;

  const optionsInfra = tipoInfraestructura.map((val) => ({
    value: val.id,
    label: val.nombre
  }));

  const optionsSedes = sedes.map((val) => ({
    value: val.id,
    label: val.nombre
  }));

  const handleUppercase = (field: string, value: string) => {
    formik.setFieldValue(field, value.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
        {/* Botón cerrar */}
        <button
          onClick={() => {
            setIsModalOpen(false);
            setIdInfraestructura('');
            formik.resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
          {mode === 'create' ? 'Crear ambiente' : 'Editar ambiente'}
        </h2>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sede */}
            <div>
              <label className="text-sm font-medium text-gray-700">Sede</label>
              <Select
                options={optionsSedes}
                isClearable
                value={formik.values.idSede}
                onChange={(v) => formik.setFieldValue('idSede', v)}
                classNames={{
                  control: () =>
                    `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                  singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                  placeholder: () => 'text-gray-400 dark:text-gray-300',
                  input: () => 'text-gray-900 dark:text-gray-100',
                  menu: () => 'bg-white dark:bg-coal-500',
                  option: ({ isFocused, isSelected }) =>
                    `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                  indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                  dropdownIndicator: () =>
                    'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                  clearIndicator: () =>
                    'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                }}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de ambiente</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    options={optionsInfra}
                    isClearable
                    value={formik.values.idTipoInfraestructura}
                    onChange={(v) => formik.setFieldValue('idTipoInfraestructura', v)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormTiIn(true)}
                  className="
                    h-[38px] w-[38px]
                    flex items-center justify-center
                    border border-gray-300 rounded-md
                    text-lg font-medium
                    text-gray-600
                    hover:border-blue-500 hover:text-blue-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                    transition
                  "
                  title="Agregar ambiente"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                {...formik.getFieldProps('nombreInfraestructura')}
                onChange={(e) => handleUppercase('nombreInfraestructura', e.target.value)}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.nombreInfraestructura && formik.errors.nombreInfraestructura && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.nombreInfraestructura}</p>
              )}
            </div>

            {/* Capacidad */}
            <div>
              <label className="text-sm font-medium text-gray-700">Capacidad</label>
              <input
                type="number"
                {...formik.getFieldProps('capacidad')}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 "
              />
              {formik.touched.capacidad && formik.errors.capacidad && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.capacidad}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm
                hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formik.isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
      <FormularioTipoInfraestructura
      isModalOpen={formTiIn}
      setReloadTipos={setReloadTipos}
      setIsModalOpen={setFormTiIn}
      />
    </div>
  );
};

export default FormularioInfraestructura;
