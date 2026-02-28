import axios from 'axios';
import { useEffect, useState } from 'react';
import Select from "react-select";
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { enqueueSnackbar } from 'notistack';

type PropsCompetencia = {
  isOpen: boolean;
  onClose: () => void;
  programId?: number;
  competenciaId?: number;
  idGradoPrograma?: number;
  onSuccess?: () => void;
  idMateriaPadre?: number;
  idFicha?: number;
};

type AreaConocimiento = {
  id: number;
  nombreAreaConocimiento: string;
};

export const FormCompetencia: React.FC<PropsCompetencia> = ({
  isOpen,
  onClose,
  programId,
  competenciaId,
  onSuccess,
  idGradoPrograma,
  idMateriaPadre,
  idFicha
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
      .nullable(),
    descripcion: Yup.string().nullable(),
    horas: Yup.number().required('Las horas son requeridas').positive('Debe ser un número positivo')
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      nombreMateria: '',
      idAreaConocimiento: null as number | null,
      descripcion: '',
      idCompany: empresa?.id,
      horas: 0,
      idMateriaPadre: null as number | null
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      getAreas();
      if (competenciaId) {
        getCompetencia();
      } else {
        formik.resetForm();
      }
    }
  }, [isOpen, competenciaId]);

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
        idCompany: empresa.id,
        horas: data.horas || 0,
        idMateriaPadre: data.idMateriaPadre || null
      });
    } catch (error) {
      enqueueSnackbar("Error al cargar la competencia", { variant: "error" });
    } finally {
      setLoadingData(false);
    }
  };

  // Enviar datos al backend
  const handleSubmit = async (values: typeof formik.initialValues) => {
    setLoading(true);

    try {
      const payload = {
        nombreMateria: values.nombreMateria.toLocaleUpperCase(),
        idAreaConocimiento: values.idAreaConocimiento,
        descripcion: values.descripcion ? values.descripcion.toLocaleUpperCase() : '',
        idCompany: empresa.id,
        horas: values.horas,
        idFicha: idFicha,
        idGradoPrograma: idGradoPrograma,
        creditos: values.horas ? values.horas / 48 : 0,
        idMateriaPadre: idMateriaPadre || null,
        ...(!competenciaId && { idPrograma: programId })
      };

      if (competenciaId) {
        await axios.put(`materias/${competenciaId}`, payload);
      } else {
        await axios.post(`materias`, payload);
      }

      enqueueSnackbar(`${idMateriaPadre ? 'RAP' : 'Competencia'} ${competenciaId ? 'actualizado' : 'creado'} exitosamente`, { variant: "success" });
      if (onSuccess) {
        onSuccess();
      }
      onClose();

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

  // Cálculo de créditos
  const calcularCreditos = (horas: number) => {
    return (horas / 48).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className='p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400'>
          <h3 className='text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest'>
            {competenciaId ? (formik.values.idMateriaPadre ? 'Editar RAP' : 'Editar Competencia') : (idMateriaPadre ? 'Crear Nuevo RAP' : 'Crear Nueva Competencia')}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 transition-all border border-gray-400 rounded-full hover:bg-danger hover:text-white hover:scale-110"
            aria-label="Cerrar modal"
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 uppercase animate-pulse tracking-widest">Cargando datos...</p>
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Nombre de la competencia */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black uppercase ml-1 text-gray-500 dark:text-gray-400">
                  Nombre {formik.values.idMateriaPadre ? 'del RAP' : 'competencia'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombreMateria"
                  value={formik.values.nombreMateria}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-gray-50 dark:bg-coal-400 input rounded-lg p-3.5 uppercase outline-none transition-all ${formik.touched.nombreMateria && formik.errors.nombreMateria
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder={formik.values.idMateriaPadre ? "Ej: IDENTIFICAR LOS COMPONENTES..." : "Ej: ALGORITMIA Y PROGRAMACIÓN"}
                />
                {formik.touched.nombreMateria && formik.errors.nombreMateria && (
                  <p className="text-xs text-red-500 ml-1 mt-1 font-semibold">
                    {formik.errors.nombreMateria}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-4xs font-black uppercase ml-1 text-gray-500 dark:text-gray-400">
                    Horas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="horas"
                    disabled={!(formik.values.idMateriaPadre || idMateriaPadre)}
                    value={formik.values.horas}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-gray-50 dark:bg-coal-400 input rounded-lg p-3.5 uppercase outline-none transition-all ${formik.touched.horas && formik.errors.horas
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary/20 focus:border-primary'
                      }`}
                    placeholder="0"
                  />
                  {formik.touched.horas && formik.errors.horas && (
                    <p className="text-xs text-red-500 ml-1 mt-1 font-semibold">
                      {formik.errors.horas}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-4xs font-black uppercase ml-1 text-gray-500 dark:text-gray-400">
                    Créditos (Equiv.)
                  </label>
                  <div className="w-full bg-gray-100 dark:bg-coal-300 border border-gray-200 dark:border-gray-600 rounded-lg p-2 font-bold text-primary flex items-center justify-between">
                    <span>{calcularCreditos(formik.values.horas || 0)}</span>
                    <span className="text-[10px] text-gray-400">1 CR = 48H</span>
                  </div>
                </div>
              </div>


              {/* Área de conocimiento */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black uppercase ml-1 text-gray-500 dark:text-gray-400">
                  Área de conocimiento
                </label>
                <Select
                  options={areaOptions}
                  value={selectedArea}
                  isDisabled={formik.values.idMateriaPadre == null ? false : true}
                  placeholder="Busca o selecciona un área..."
                  onChange={(opcion: any) => {
                    formik.setFieldValue(
                      'idAreaConocimiento',
                      opcion ? opcion.value : null
                    );
                  }}
                  onBlur={() => formik.setFieldTouched('idAreaConocimiento', true)}
                  isClearable
                  classNames={{
                    control: (state) =>
                      `bg-gray-50 dark:bg-coal-400 border input rounded-lg transition-all ${formik.touched.idAreaConocimiento && formik.errors.idAreaConocimiento
                        ? 'border-red-500'
                        : state.isFocused ? 'border-primary input' : 'border-gray-300 dark:border-gray-600'
                      }`,
                    menu: () => "bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-600 shadow-xl",
                    option: ({ isFocused, isSelected }) =>
                      `p-3.5 text-sm cursor-pointer transition-colors ${isSelected ? "bg-primary text-white" : isFocused ? "bg-gray-100 dark:bg-coal-300" : "text-gray-700 dark:text-white"
                      }`,
                  }}
                />
                {formik.touched.idAreaConocimiento && formik.errors.idAreaConocimiento && (
                  <p className="text-xs text-red-500 ml-1 mt-1 font-semibold">
                    {formik.errors.idAreaConocimiento}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black uppercase ml-1 text-gray-500 dark:text-gray-400">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  rows={2}
                  value={formik.values.descripcion}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full h-20 bg-gray-50 dark:bg-coal-400 input rounded-lg uppercase p-3.5 resize-none outline-none transition-all ${formik.touched.descripcion && formik.errors.descripcion
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary/20 focus:border-primary'
                    }`}
                  placeholder="Detalles de la unidad..."
                />
                {formik.touched.descripcion && formik.errors.descripcion && (
                  <p className="text-xs text-red-500 ml-1 mt-1 font-semibold">
                    {formik.errors.descripcion}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading || !formik.isValid}
                  className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-active transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </span>
                  ) : (
                    competenciaId ? 'Actualizar' : 'Guardar'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
