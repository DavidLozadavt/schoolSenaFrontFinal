import axios from 'axios';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';
import ModalError from './ModalError';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message: string) => void;
}

interface Persona {
  nombre1: string;
  apellido1: string;
  identificacion: string;
}

interface Responsable {
  id: number;
  persona: Persona;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
}

interface CentroFormacion {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: {
    descripcion: string;
  };
}

interface FormValues {
  nombre: string;
  jefeInmediato: string;
  descripcion: string;
  ciudad: { value: number; label: string } | null;
  empresa: { value: number; label: string } | null;
  centroFormacion: { value: number; label: string } | null; // ← NUEVO CAMPO
  direccion: string;
  email: string;
  telefono: string;
  celular: string;
  responsable: { value: number; label: string } | null;
  imagen: File | null;
}

const validationSchema = Yup.object({
  nombre: Yup.string()
    .trim()
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El nombre es obligatorio'),

  ciudad: Yup.object().nullable().required('La ciudad es obligatoria'),

  responsable: Yup.object().nullable().required('El responsable es obligatorio'),

  empresa: Yup.object().nullable().required('La regional es obligatoria'),

  centroFormacion: Yup.object().nullable().required('El centro de formación es obligatorio'), // ← VALIDACIÓN

  jefeInmediato: Yup.string()
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Solo letras')
    .nullable()
    .required('El jefe inmediato es obligatorio'),

  direccion: Yup.string()
    .trim()
    .min(5, 'Dirección muy corta')
    .required('La dirección es obligatoria'),

  descripcion: Yup.string()
    .max(250, 'Máximo 250 caracteres')
    .nullable()
    .required('La descripción es obligatoria'),

  email: Yup.string().email('Correo inválido').required('El correo es obligatorio'),

  telefono: Yup.string()
    .matches(/^[0-9]+$/, 'Solo números')
    .min(7, 'Debe tener al menos 7 dígitos')
    .max(10, 'Máximo 10 dígitos')
    .required('El teléfono es obligatorio'),

  celular: Yup.string()
    .matches(/^[0-9]+$/, 'Solo números')
    .length(10, 'Debe tener 10 dígitos')
    .required('El celular es obligatorio')
});

const FormularioSedesSena: React.FC<Props> = ({
  isModalOpen,
  setIsModalOpen,
  setEvento,
  showToast
}) => {
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [regionales, setRegionales] = useState<Empresa[]>([]);
  const [centrosFormacion, setCentrosFormacion] = useState<CentroFormacion[]>([]); // ← NUEVO ESTADO
  const [responsable, setResponsable] = useState<Responsable[]>([]);

  // Manejar el error:
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ciudadesRes, regionalesRes, usuariosRes] = await Promise.all([
          axios.get('ciudades'),
          axios.get('regional'),
          axios.get('sedesSena/users')
        ]);
        setCiudades(ciudadesRes.data);
        setRegionales(regionalesRes.data);
        setResponsable(usuariosRes.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  const formik = useFormik<FormValues>({
    initialValues: {
      nombre: '',
      jefeInmediato: '',
      descripcion: '',
      ciudad: null,
      empresa: null,
      centroFormacion: null, // ← VALOR INICIAL
      direccion: '',
      email: '',
      telefono: '',
      celular: '',
      responsable: null,
      imagen: null
    },

    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const formData = new FormData();

        formData.append('nombre', values.nombre);
        formData.append('jefeInmediato', values.jefeInmediato);
        formData.append('descripcion', values.descripcion);
        formData.append('direccion', values.direccion);
        formData.append('email', values.email);
        formData.append('telefono', values.telefono);
        formData.append('celular', values.celular);

        if (values.ciudad) {
          formData.append('idCiudad', String(values.ciudad.value));
        }

        if (values.responsable) {
          formData.append('idResponsable', String(values.responsable.value));
        }

        if (values.empresa) {
          formData.append('idEmpresa', String(values.empresa.value));
        }

        if (values.centroFormacion) {
          formData.append('idCentroFormacion', String(values.centroFormacion.value)); // ← ENVIAR AL BACKEND
        }

        if (values.imagen) {
          formData.append('imagen', values.imagen);
        }

        await axios.post('sedesSena', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        showToast('Sede creada correctamente');
        setEvento((prev) => !prev);
        resetForm();
        setIsModalOpen(false);
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          'No se pudo crear la sede. Verifica la información e intenta nuevamente.';

        setErrorMessage(message);
        setErrorOpen(true);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Cargar centros de formación cuando se selecciona una empresa (regional)
  const handleChangeRegional = async (value: { value: number; label: string } | null) => {
    formik.setFieldValue('empresa', value);
    formik.setFieldValue('centroFormacion', null);
    setCentrosFormacion([]);

    if (!value) return;

    try {
      const res = await axios.get(`centrosFormacion/regional/${value.value}`);
      setCentrosFormacion(res.data.data);
    } catch (error) {
      console.error('Error cargando centros de formación:', error);
      setCentrosFormacion([]);
    }
  };

  const optionsCiudades = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));

  const optionsRegionales = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));

  const optionsCentrosFormacion = centrosFormacion.map((val) => ({
    value: val.id,
    label: `${val.nombre} - ${val?.ciudad.descripcion}`
  }));

  const optionsResponsables = responsable
    .filter((val) => val.persona !== null)
    .map((val) => ({
      value: val.id,
      label: `${val.persona!.nombre1} ${val.persona!.apellido1} - ${val.persona!.identificacion}`
    }));

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header fijo */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Crear sede</h2>

        {/* Form con scroll */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div>
              <label className="text-sm font-medium text-gray-700">Ciudad</label>
              <Select
                options={optionsCiudades}
                placeholder="Selecciona la ciudad..."
                isClearable
                value={formik.values.ciudad}
                onChange={(value) => formik.setFieldValue('ciudad', value)}
                onBlur={() => formik.setFieldTouched('ciudad', true)}
                classNamePrefix="react-select"
              />
              {formik.touched.ciudad && formik.errors.ciudad && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.ciudad}</p>
              )}
            </div>

            {/* Regional */}
            <div>
              <label className="text-sm font-medium text-gray-700">Regional</label>
              <Select
                options={optionsRegionales}
                placeholder="Selecciona la regional..."
                isClearable
                value={formik.values.empresa}
                onChange={handleChangeRegional}
                onBlur={() => formik.setFieldTouched('empresa', true)}
              />
              {formik.touched.empresa && formik.errors.empresa && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.empresa}</p>
              )}
            </div>

            {/* Centro de Formación - NUEVO CAMPO */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Centro de Formación</label>
              <Select
                options={optionsCentrosFormacion}
                placeholder={
                  !formik.values.empresa
                    ? 'Primero selecciona una regional...'
                    : centrosFormacion.length === 0
                      ? 'No hay centros de formación disponibles'
                      : 'Selecciona el centro de formación...'
                }
                isClearable
                isDisabled={!formik.values.empresa || centrosFormacion.length === 0}
                value={formik.values.centroFormacion}
                onChange={(value) => formik.setFieldValue('centroFormacion', value)}
                onBlur={() => formik.setFieldTouched('centroFormacion', true)}
                classNamePrefix="react-select"
              />
              {formik.touched.centroFormacion && formik.errors.centroFormacion && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.centroFormacion}</p>
              )}
            </div>

            {/* Responsable de la Sede */}
            <div>
              <label className="text-sm font-medium text-gray-700">Responsable de la sede</label>
              <Select
                options={optionsResponsables}
                placeholder="Selecciona el responsable..."
                isClearable
                value={formik.values.responsable}
                onChange={(value) => formik.setFieldValue('responsable', value)}
                onBlur={() => formik.setFieldTouched('responsable', true)}
              />
              {formik.touched.responsable && formik.errors.responsable && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.responsable}</p>
              )}
            </div>

            {/* Nombre ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre de la sede</label>
              <input
                type="text"
                {...formik.getFieldProps('nombre')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.nombre && formik.errors.nombre
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
              />
              {formik.touched.nombre && formik.errors.nombre && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.nombre}</p>
              )}
            </div>

            {/* Jefe inmediato */}
            <div>
              <label className="text-sm font-medium text-gray-700">Jefe inmediato</label>
              <input
                type="text"
                {...formik.getFieldProps('jefeInmediato')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.jefeInmediato && formik.errors.jefeInmediato && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.jefeInmediato}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                {...formik.getFieldProps('direccion')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.direccion && formik.errors.direccion && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.direccion}</p>
              )}
            </div>

            {/* Descripcion */}
            <div>
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                {...formik.getFieldProps('descripcion')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.descripcion && formik.errors.descripcion && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.descripcion}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                {...formik.getFieldProps('email')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                {...formik.getFieldProps('telefono')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.telefono && formik.errors.telefono && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.telefono}</p>
              )}
            </div>

            {/* Celular */}
            <div>
              <label className="text-sm font-medium text-gray-700">Celular</label>
              <input
                type="text"
                {...formik.getFieldProps('celular')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {formik.touched.celular && formik.errors.celular && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.celular}</p>
              )}
            </div>
          </div>

          {/* Footer fijo */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => {
                formik.resetForm();
                setIsModalOpen(false);
              }}
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
              {formik.isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
      <ModalError isOpen={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />
    </div>
  );
};

export default FormularioSedesSena;
