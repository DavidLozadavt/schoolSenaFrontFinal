import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { enqueueSnackbar } from 'notistack';
import { User } from 'lucide-react';

interface AsignacionSesionModalProps {
  isOpen: boolean;
  onClose: () => void;
  idMateria: number;
  horario: any;
  fechaSeleccionada: string; // formato YYYY-MM-DD
}

export const AsignacionSesionModal: React.FC<AsignacionSesionModalProps> = ({
  isOpen,
  onClose,
  idMateria,
  horario,
  fechaSeleccionada
}) => {
  const [instructores, setInstructores] = useState<any[]>([]);
  const [loadingInstructores, setLoadingInstructores] = useState(false);
  const [loading, setLoading] = useState(false);

  // Schema de validación con Yup
  const validationSchema = Yup.object({
    tipoAsignacion: Yup.string()
      .required('El tipo de asignación es requerido')
      .oneOf(['REEMPLAZO', 'HORARIO COMPARTIDO'], 'Tipo de asignación inválido'),
    idInstructor: Yup.number().required('Debe seleccionar un instructor').nullable(),
    fechaInicio: Yup.date()
      .required('La fecha de inicio es requerida')
      .max(Yup.ref('fechaFin'), 'La fecha de inicio no puede ser mayor a la fecha fin'),
    fechaFin: Yup.date()
      .required('La fecha de fin es requerida')
      .min(Yup.ref('fechaInicio'), 'La fecha de fin no puede ser menor a la fecha inicio')
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      tipoAsignacion: '' as '' | 'REEMPLAZO' | 'HORARIO_COMPARTIDO',
      idInstructor: null as number | null,
      fechaInicio: fechaSeleccionada,
      fechaFin: fechaSeleccionada
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    }
  });

  // Cargar instructores disponibles
  useEffect(() => {
    if (isOpen) {
      cargarInstructores();
      // Resetear fechas cuando se abre el modal
      formik.resetForm({
        values: {
          tipoAsignacion: '' as '' | 'REEMPLAZO' | 'HORARIO_COMPARTIDO',
          idInstructor: null,
          fechaInicio: fechaSeleccionada,
          fechaFin: fechaSeleccionada
        }
      });
    }
  }, [isOpen, fechaSeleccionada]);

  const cargarInstructores = async () => {
    setLoadingInstructores(true);
    try {
      const response = await axios.get('materias/instructores', {
        params: {
          idMateria: idMateria ?? 54
        }
      });
      setInstructores(response.data.data || []);
    } catch (error) {
      setInstructores([]);
      enqueueSnackbar('Error al cargar los instructores disponibles', { variant: 'error' });
    } finally {
      setLoadingInstructores(false);
    }
  };

  // Enviar datos al backend
  const handleSubmit = async (values: typeof formik.values) => {
    setLoading(true);

    try {
      const payload = {
        idHorarioMateria: horario.id,
        tipoAsignacion: values.tipoAsignacion,
        idContrato: values.idInstructor,
        fechaInicio: values.fechaInicio,
        fechaFin: values.fechaFin
      };

      const res = await axios.post('asignacion-sesion', payload);
      enqueueSnackbar(res.data.message || 'Asignación creada exitosamente', { variant: 'success' });
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al crear la asignación', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Opciones para el Select de tipo de asignación
  const tipoAsignacionOptions = [
    { value: 'REEMPLAZO', label: 'REEMPLAZO' },
    { value: 'HORARIO COMPARTIDO', label: 'HORARIO COMPARTIDO' }
  ];

  const selectedTipoOption =
    tipoAsignacionOptions.find((o) => o.value === formik.values.tipoAsignacion) ?? null;

  // Opciones para el Select de instructores
  const instructorOptions = instructores.map((inst) => ({
    value: inst.id,
    label: `${inst.persona?.nombre1 || ''} ${inst.persona?.apellido1 || ''}`,
    foto: inst.persona?.rutaFotoUrl || null
  }));

  const selectedInstructorOption =
    instructorOptions.find((o) => o.value === formik.values.idInstructor) ?? null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-95% overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <h3 className="text-sm font-black uppercase text-gray-800 dark:text-white tracking-widest">
            Nueva Asignación
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
        <div className="p-8">
          {loadingInstructores ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 uppercase animate-pulse tracking-widest">
                Cargando instructores...
              </p>
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Tipo de Asignación */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2 tracking-wider">
                  Tipo de Asignación <span className="text-danger">*</span>
                </label>
                <Select
                  name="tipoAsignacion"
                  options={tipoAsignacionOptions}
                  value={selectedTipoOption}
                  onChange={(option) => formik.setFieldValue('tipoAsignacion', option?.value || '')}
                  placeholder="Seleccione el tipo de asignación"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                />
                {formik.touched.tipoAsignacion && formik.errors.tipoAsignacion ? (
                  <div className="text-danger text-xs mt-1 font-semibold">
                    {formik.errors.tipoAsignacion}
                  </div>
                ) : null}
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2 tracking-wider">
                  Instructor <span className="text-danger">*</span>
                </label>
                <Select
                  name="idInstructor"
                  maxMenuHeight={150}
                  options={instructorOptions}
                  value={selectedInstructorOption}
                  onChange={(option) => formik.setFieldValue('idInstructor', option?.value || null)}
                  placeholder="Seleccione un instructor"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  formatOptionLabel={(option) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {option.foto ? (
                          <img
                            src={option.foto}
                            alt={option.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                            <User size={14} className="m-1.5 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-bold text-gray-800 uppercase truncate">
                        {option.label}
                      </p>
                    </div>
                  )}
                />
                {formik.touched.idInstructor && formik.errors.idInstructor ? (
                  <div className="text-danger text-xs mt-1 font-semibold">
                    {formik.errors.idInstructor as string}
                  </div>
                ) : null}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha Inicio */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2 tracking-wider">
                    Fecha Inicio <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formik.values.fechaInicio}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full input px-4 py-2.5 bg-gray-50 dark:bg-coal-600 rounded-lg outline-none transition-all text-xs font-semibold border border-gray-200 dark:border-gray-600 focus:border-primary"
                  />
                  {formik.touched.fechaInicio && formik.errors.fechaInicio ? (
                    <div className="text-danger text-xs mt-1 font-semibold">
                      {formik.errors.fechaInicio as string}
                    </div>
                  ) : null}
                </div>

                {/* Fecha Fin */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2 tracking-wider">
                    Fecha Fin <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formik.values.fechaFin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full input px-4 py-2.5 bg-gray-50 dark:bg-coal-600 rounded-lg outline-none transition-all text-xs font-semibold border border-gray-200 dark:border-gray-600 focus:border-primary"
                  />
                  {formik.touched.fechaFin && formik.errors.fechaFin ? (
                    <div className="text-danger text-xs mt-1 font-semibold">
                      {formik.errors.fechaFin as string}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-wider border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {loading ? 'Guardando...' : 'Guardar Asignación'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsignacionSesionModal;
