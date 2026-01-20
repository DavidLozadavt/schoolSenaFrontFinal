import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FormValues {
  razonSocial: string;
  nit: string;
  representanteLegal: string;
  direccion: string;
  email: string;
  digitoVerificacion: number;
}

const validationSchema = Yup.object({
  razonSocial: Yup.string().required('La razón social es obligatoria'),
  nit: Yup.string().required('El NIT es obligatorio'),
  representanteLegal: Yup.string().required('El representante legal es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  digitoVerificacion: Yup.number()
    .typeError('Debe ser un número')
    .required('El dígito de verificación es obligatorio')
});

const FormularioRegional: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento }) => {
  const formik = useFormik<FormValues>({
    initialValues: {
      razonSocial: '',
      nit: '',
      representanteLegal: '',
      direccion: '',
      email: '',
      digitoVerificacion: 0
    },
    validationSchema,
    onSubmit: async (values,{setSubmitting}) => {
      try {
        await axios.post('regional', values);

        alert('Regional creada correctamente');
        setIsModalOpen(false);
        setEvento((prev) => !prev);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al guardar la empresa');
      } finally{
        setSubmitting(false);
      }
    }
  });

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear regional</h2>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Razón Social */}
          <div>
            <label className="text-sm font-medium text-gray-700">Razón Social</label>
            <input
              type="text"
              {...formik.getFieldProps('razonSocial')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
      focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.razonSocial && formik.errors.razonSocial && (
              <p className="text-xs text-red-500">{formik.errors.razonSocial}</p>
            )}
          </div>

          {/* NIT */}
          <div>
            <label className="text-sm font-medium text-gray-700">NIT</label>
            <input
              type="text"
              {...formik.getFieldProps('nit')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {formik.touched.nit && formik.errors.nit && (
              <p className="text-xs text-red-500">{formik.errors.nit}</p>
            )}
          </div>

          {/* Representante Legal */}
          <div>
            <label className="text-sm font-medium text-gray-700">Representante Legal</label>
            <input
              type="text"
              {...formik.getFieldProps('representanteLegal')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {formik.touched.representanteLegal && formik.errors.representanteLegal && (
              <p className="text-xs text-red-500">{formik.errors.representanteLegal}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              {...formik.getFieldProps('direccion')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {formik.touched.direccion && formik.errors.direccion && (
              <p className="text-xs text-red-500">{formik.errors.direccion}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...formik.getFieldProps('email')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-500">{formik.errors.email}</p>
            )}
          </div>

          {/* Dígito de Verificación */}
          <div>
            <label className="text-sm font-medium text-gray-700">Dígito Verificación</label>
            <input
              type="number"
              {...formik.getFieldProps('digitoVerificacion')}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            {formik.touched.digitoVerificacion && formik.errors.digitoVerificacion && (
              <p className="text-xs text-red-500">{formik.errors.digitoVerificacion}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-4">
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
              className={`px-4 py-2 rounded-lg text-sm text-white transition
              ${formik.isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {formik.isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioRegional;
