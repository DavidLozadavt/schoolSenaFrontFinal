import axios from 'axios';
import { useEffect, useState } from 'react';
import Select from "react-select";
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useAuthContext } from '@/auth';

type PropsCompetencia = {
  programId: number;
  competenciaId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  setToast:any
};

type AreaConocimiento = {
  id: number;
  nombreAreaConocimiento: string;
};

export const FormCompetencia: React.FC<PropsCompetencia> = ({
  programId,
  competenciaId,
  onSuccess,
  onCancel,
  setToast
}) => {
  const [areasConocimientos, setAreasConocimientos] = useState<AreaConocimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { empresa } = useAuthContext();

  // Schema de validación con Yup
  const validationSchema = Yup.object({
    nombreMateria: Yup.string()
      .required('El nombre de la competencia es requerido')
      .min(3, 'El nombre debe tener al menos 3 caracteres'),
    idAreaConocimiento: Yup.number()
      .nullable()
      .required('Debe seleccionar un área de conocimiento'),
    descripcion: Yup.string()
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      nombreMateria: '',
      idAreaConocimiento: null as number | null,
      descripcion: '',
      idCompany: empresa?.id
    },
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    getAreas();
    if (competenciaId) {
      getCompetencia();
    }
  }, [competenciaId]);

  const getAreas = async () => {
    try {
      const res = await axios.get(
        `areas-conocimiento/programa/${programId}`
      );
      setAreasConocimientos(res.data.data ?? []);
    } catch (error) {
      setAreasConocimientos([]);
    }
  };

  const getCompetencia = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get(`materias/${competenciaId}`);
      const data = res.data.data;
    
      formik.setValues({
        nombreMateria: data.nombreMateria || '',
        idAreaConocimiento: data.idAreaConocimiento || null,
        descripcion: data.descripcion || '',
        idCompany: empresa.id
      });
      setLoadingData(false);
    } catch (error){
      setLoadingData(false);
    }
  };

  // Enviar datos al backend
  const handleSubmit = async (values: typeof formik.initialValues) => {
    setLoading(true);

    try {
      const payload = {
        nombreMateria: values.nombreMateria,
        idAreaConocimiento: values.idAreaConocimiento,
        descripcion: values.descripcion,
        idCompany: empresa.id,
        ...(!competenciaId && { idPrograma: programId })
      };

      if (competenciaId) {
        await axios.put(`materias/${competenciaId}`, payload);
      } else {
        await axios.post(`materias`, payload);
      }
      if (onSuccess) {
        setToast(true);
        onSuccess();
      }
      if (!competenciaId) {
        formik.resetForm();
      }

    } catch (error: any) {

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach(key => {
          formik.setFieldError(key, backendErrors[key][0]);
        });
      } else {
        formik.setFieldError('nombreMateria', 'Error al guardar la competencia');
      }
    } finally {
      setLoading(false);
    }
  };

  // Opciones para el Select de áreas
  const areaOptions = areasConocimientos.map(a => ({
    value: a.id,
    label: a.nombreAreaConocimiento
  }));

  const selectedArea = areaOptions.find(
    o => o.value === formik.values.idAreaConocimiento
  ) ?? null;

  if (loadingData) {
    return (
      <div className="p-5 bg-primary/[0.02] border border-gray-400 rounded-xl animate-fade-in-down">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-primary/[0.02] border border-gray-400 rounded-xl animate-fade-in-down space-y-4 shadow-inner">

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        
        {/* Nombre de la competencia */}
        <div className="space-y-1">
          <label className="text-4xs font-black uppercase ml-1">
            Nombre competencia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nombreMateria"
            value={formik.values.nombreMateria}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full bg-white dark:bg-coal-400 border rounded-lg p-2.5 font-bold outline-none focus:ring-1 ${
              formik.touched.nombreMateria && formik.errors.nombreMateria
                ? 'border-red-500 focus:ring-red-500'
                : 'focus:ring-primary'
            }`}
            placeholder="Nombre de la competencia"
          />
          {formik.touched.nombreMateria && formik.errors.nombreMateria && (
            <p className="text-xs text-red-500 ml-1 mt-1">
              {formik.errors.nombreMateria}
            </p>
          )}
        </div>

        {/* Área de conocimiento */}
        <div className="space-y-1">
          <label className="text-4xs font-black uppercase ml-1">
            Área de conocimiento <span className="text-red-500">*</span>
          </label>

          <Select
            options={areaOptions}
            value={selectedArea}
            placeholder="Selecciona un área..."
            onChange={(opcion: any) => {
              formik.setFieldValue(
                'idAreaConocimiento',
                opcion ? opcion.value : null
              );
            }}
            onBlur={() => formik.setFieldTouched('idAreaConocimiento', true)}
            isClearable
            classNames={{
              control: () =>
                `bg-white dark:bg-coal-400 border ${
                  formik.touched.idAreaConocimiento && formik.errors.idAreaConocimiento
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`,
              menu: () =>
                "bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-600",
            }}
          />
          {formik.touched.idAreaConocimiento && formik.errors.idAreaConocimiento && (
            <p className="text-xs text-red-500 ml-1 mt-1">
              {formik.errors.idAreaConocimiento}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="text-4xs font-black uppercase ml-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            rows={3}
            value={formik.values.descripcion}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full bg-white dark:bg-coal-400 border rounded-lg p-2.5 resize-none outline-none focus:ring-1 ${
              formik.touched.descripcion && formik.errors.descripcion
                ? 'border-red-500 focus:ring-red-500'
                : 'focus:ring-primary'
            }`}
            placeholder="Descripción de la competencia"
          />
          {formik.touched.descripcion && formik.errors.descripcion && (
            <p className="text-xs text-red-500 ml-1 mt-1">
              {formik.errors.descripcion}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 dark:bg-coal-300 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-black text-3xs uppercase tracking-[0.2em] hover:bg-gray-300 transition-all disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || !formik.isValid}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg font-black text-3xs uppercase tracking-[0.2em] hover:bg-primary-active transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </span>
            ) : (
              competenciaId ? 'Actualizar Competencia' : 'Guardar Competencia'
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
