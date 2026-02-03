import axios from 'axios';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface FormValues {
  razonSocial: string;
  nit: string;
  representanteLegal: string;
  direccion: string;
  email: string;
  digitoVerificacion: number;
  idCiudad: number;
}

const validationSchema = Yup.object({
  razonSocial: Yup.string().required('La razón social es obligatoria'),
  nit: Yup.string().required('El NIT es obligatorio'),
  representanteLegal: Yup.string().required('El director general es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  digitoVerificacion: Yup.number()
    .typeError('Debe ser un número')
    .min(1, 'Debe ser entre 1 y 9')
    .max(9, 'Debe ser entre 1 y 9')
    .required('El dígito de verificación es obligatorio'),
  idCiudad: Yup.number()
    .typeError('Debe seleccionar una ciudad')
    .required('La ciudad es obligatoria')
});

const FormularioRegional: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento }) => {
  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      razonSocial: '',
      nit: '',
      representanteLegal: '',
      direccion: '',
      email: '',
      digitoVerificacion: 0,
      idCiudad: null as any
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await axios.post('regional', values);

        // Mostrar animación de éxito
        setShowSuccess(true);
        
        // Esperar a que se vea la animación antes de cerrar
        setTimeout(() => {
          setIsModalOpen(false);
          setEvento((prev) => !prev);
          setShowSuccess(false);
        }, 1500);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al guardar la regional');
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('ciudades');
      setCiudades(res.data);
    };
    loadData();
  }, []);

  const options = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      borderWidth: '2px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      minHeight: '42px'
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
          ? '#dbeafe' 
          : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#3b82f6'
      }
    })
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !formik.isSubmitting && setIsModalOpen(false)}
      />

      {/* Modal mejorado */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-scale-in">
        {/* Header del modal */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <i className="ki-outline ki-home-2 text-2xl text-white"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Nueva Regional</h2>
                <p className="text-sm text-blue-100">Complete la información requerida</p>
              </div>
            </div>
            <button
              onClick={() => !formik.isSubmitting && setIsModalOpen(false)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white 
                       flex items-center justify-center transition-all duration-200
                       hover:rotate-90 active:scale-90"
            >
              <i className="ki-outline ki-cross text-xl"></i>
            </button>
          </div>
        </div>

        {/* Animación de éxito */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <i className="ki-outline ki-check text-4xl text-green-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Regional creada!</h3>
              <p className="text-gray-600">La información se guardó correctamente</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={formik.handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ciudad - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-geolocation text-blue-600"></i>
                Ciudad
                <span className="text-red-500">*</span>
              </label>
              <Select
                options={options}
                isClearable
                placeholder="Seleccione una ciudad"
                styles={customSelectStyles}
                value={options.find((option) => option.value === formik.values.idCiudad) || null}
                onChange={(option) => {
                  formik.setFieldValue('idCiudad', option ? option.value : null);
                }}
                noOptionsMessage={() => 'No se encontraron ciudades'}
              />
              {formik.touched.idCiudad && formik.errors.idCiudad && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.idCiudad}</span>
                </div>
              )}
            </div>

            {/* Razón Social */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-home-2 text-blue-600"></i>
                Razón Social
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...formik.getFieldProps('razonSocial')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.razonSocial && formik.errors.razonSocial
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="Ej: Regional SENA Valle"
              />
              {formik.touched.razonSocial && formik.errors.razonSocial && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.razonSocial}</span>
                </div>
              )}
            </div>

            {/* NIT */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-abstract-14 text-purple-600"></i>
                NIT
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...formik.getFieldProps('nit')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.nit && formik.errors.nit
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="890123456"
              />
              {formik.touched.nit && formik.errors.nit && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.nit}</span>
                </div>
              )}
            </div>

            {/* Dígito de Verificación */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-verify text-purple-600"></i>
                Dígito Verificación
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="9"
                {...formik.getFieldProps('digitoVerificacion')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.digitoVerificacion && formik.errors.digitoVerificacion
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="1-9"
              />
              {formik.touched.digitoVerificacion && formik.errors.digitoVerificacion && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.digitoVerificacion}</span>
                </div>
              )}
            </div>

            {/* Director General */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-profile-user text-green-600"></i>
                Director General
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...formik.getFieldProps('representanteLegal')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.representanteLegal && formik.errors.representanteLegal
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="Ej: Juan Pérez García"
              />
              {formik.touched.representanteLegal && formik.errors.representanteLegal && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.representanteLegal}</span>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-map text-orange-600"></i>
                Dirección
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...formik.getFieldProps('direccion')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.direccion && formik.errors.direccion
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="Ej: Calle 10 # 5-20"
              />
              {formik.touched.direccion && formik.errors.direccion && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.direccion}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <i className="ki-outline ki-sms text-blue-600"></i>
                Email
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...formik.getFieldProps('email')}
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium
                  transition-all duration-200 outline-none
                  ${formik.touched.email && formik.errors.email
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                placeholder="regional@sena.edu.co"
              />
              {formik.touched.email && formik.errors.email && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <i className="ki-outline ki-information-5"></i>
                  <span>{formik.errors.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t-2 border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={formik.isSubmitting}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 
                         bg-gray-100 hover:bg-gray-200 
                         transition-all duration-200 active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className={`group relative px-8 py-3 rounded-xl text-sm font-bold text-white 
                  transition-all duration-200 active:scale-95 overflow-hidden
                  ${formik.isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30'
                  }`}
              >
                {/* Efecto de brillo */}
                {!formik.isSubmitting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                               translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                )}
                
                <span className="relative flex items-center gap-2">
                  {formik.isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="ki-outline ki-check text-base"></i>
                      Crear Regional
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioRegional;