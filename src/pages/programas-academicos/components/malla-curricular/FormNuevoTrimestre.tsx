import React, { useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface FormNuevoTrimestreProps {
  trimestre: any;
  guardando: boolean;
  onActualizarFechaFin: (fecha: string) => void;
  onActualizarFechaInicio: (fecha: string) => void;
  onActualizarNumeroGrado: (numero: number) => void;
  onAbrirMaterias: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
  trimestres: any[];
  nivel?: string;
}

const formatearFecha = (fecha: string) =>
  fecha ? new Date(fecha).toISOString().split('T')[0] : '';

export const FormNuevoTrimestre: React.FC<FormNuevoTrimestreProps> = ({
  trimestre,
  guardando,
  onActualizarFechaFin,
  onActualizarFechaInicio,
  onActualizarNumeroGrado,
  onAbrirMaterias,
  onGuardar,
  onCancelar,
  trimestres,
  nivel
}) => {
  const persistedTrimestres = trimestres
    .filter(t => !t.esNuevo)
    .sort((a, b) => (a.grado?.numeroGrado || a.numeroGrado) - (b.grado?.numeroGrado || b.numeroGrado));
  const isFirst = persistedTrimestres.length === 0;

  // Lógica de valores iniciales sugerida por el usuario
  useEffect(() => {
    if (isFirst) {
      if (!trimestre.fechaInicio) {
        const now = new Date().toISOString().split('T')[0];
        onActualizarFechaInicio(now);
      }
      if (!trimestre.numeroGrado) {
        onActualizarNumeroGrado(1);
      }
    } else {
      const ultimo = persistedTrimestres[persistedTrimestres.length - 1];
      if (!trimestre.fechaInicio) {
        onActualizarFechaInicio(formatearFecha(ultimo.grado?.fechaFin || ultimo.fechaFin));
      }
      if (!trimestre.numeroGrado) {
        onActualizarNumeroGrado((ultimo.grado?.numeroGrado || ultimo.numeroGrado) + 1);
      }
    }
  }, [isFirst]);

  const formik = useFormik({
    initialValues: {
      numeroGrado: trimestre.numeroGrado || '',
      fechaInicio: formatearFecha(trimestre.fechaInicio) || '',
      fechaFin: trimestre.fechaFin || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      numeroGrado: Yup.number()
        .required('El número de trimestre es requerido')
        .min(1, 'Debe ser al menos 1')
        .test('max-trimestre', (value, context) => {
          const { path, createError } = context;
          if (nivel?.toUpperCase() === 'TECNICO' && (value || 0) > 3) {
            return createError({ path, message: 'Para nivel Técnico el máximo son 3 trimestres' });
          }
          if (nivel?.toUpperCase() === 'TECNOLOGO' && (value || 0) > 7) {
            return createError({ path, message: 'Para nivel Tecnólogo el máximo son 7 trimestres' });
          }
          return true;
        }),
      fechaInicio: Yup.date()
        .required('La fecha de inicio es requerida'),
      fechaFin: Yup.date()
        .required('La fecha de fin es requerida')
        .min(Yup.ref('fechaInicio'), 'La fecha de fin debe ser posterior a la de inicio'),
    }),
    onSubmit: () => {
      onGuardar();
    },
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b-2 border-gray-200 dark:border-gray-600">
          <h3 className="text-2xl font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <span className="text-primary">#{formik.values.numeroGrado}</span>
            TRIMESTRE
            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
              NUEVO
            </span>
          </h3>

          <button
            onClick={onCancelar}
            className="absolute z-10 flex items-center justify-center w-9 h-9 transition-all border border-gray-400 rounded-full top-4 right-4 hover:bg-danger hover:text-white hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>
        </div>

        {/* CONTENIDO */}
        <form onSubmit={formik.handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">

            {/* NUMERO Y FECHAS */}
            <div className={`grid grid-cols-1 ${isFirst ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {isFirst && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-600 mb-2">
                    Número Trimestre
                  </label>
                  <input
                    type="number"
                    name="numeroGrado"
                    value={formik.values.numeroGrado}
                    onChange={(e) => {
                      formik.handleChange(e);
                      onActualizarNumeroGrado(Number(e.target.value));
                    }}
                    onBlur={formik.handleBlur}
                    disabled={!isFirst}
                    className={`w-full input px-4 py-2 rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white ${formik.touched.numeroGrado && formik.errors.numeroGrado ? 'border-danger' : 'border-gray-300 dark:border-gray-600'
                      } ${!isFirst ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-coal-500' : ''}`}
                  />
                  {formik.touched.numeroGrado && formik.errors.numeroGrado && (
                    <p className="text-xs text-danger mt-1">{formik.errors.numeroGrado as string}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-600 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formik.values.fechaInicio}
                  onChange={(e) => {
                    formik.handleChange(e);
                    onActualizarFechaInicio(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2 input rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white ${formik.touched.fechaInicio && formik.errors.fechaInicio ? 'border-danger' : 'border-gray-300 dark:border-gray-600'
                    }`}
                />
                {formik.touched.fechaInicio && formik.errors.fechaInicio && (
                  <p className="text-xs text-danger mt-1">{formik.errors.fechaInicio as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-600 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formik.values.fechaFin}
                  onChange={(e) => {
                    formik.handleChange(e);
                    onActualizarFechaFin(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2 input rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white ${formik.touched.fechaFin && formik.errors.fechaFin ? 'border-danger' : 'border-gray-300 dark:border-gray-600'
                    }`}
                />
                {formik.touched.fechaFin && formik.errors.fechaFin && (
                  <p className="text-xs text-danger mt-1">{formik.errors.fechaFin as string}</p>
                )}
              </div>
            </div>

            {/* MATERIAS */}
            <div>
              <h4 className="text-sm font-black uppercase text-gray-700 dark:text-gray-600 border-l-4 border-primary pl-3 mb-6">
                Competencias Asignadas
              </h4>

              {trimestre.materias && trimestre.materias.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {trimestre.materias.map((materia: any) => (
                    <div
                      key={materia.id}
                      className="p-3 border rounded-lg bg-gray-50 dark:bg-coal-400 text-gray-800 dark:text-white font-semibold"
                    >
                      <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-2xs font-black bg-gray-100 dark:bg-coal-500 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded tracking-tighter shrink-0 border border-gray-200 dark:border-gray-600">
                                  {materia.codigo || 'S/C'}
                                </span>
                                <p className="text-xs font-bold text-gray-800 dark:text-white truncate uppercase">
                                  {materia.nombreMateria || 'Sin nombre'}
                                </p>
                              </div>
                              <p className="text-2xs text-gray-500 font-bold uppercase truncate">
                                {materia.descripcion || 'Sin descripción'}
                              </p>
                            </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-coal-400 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No hay competencias asignadas
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onAbrirMaterias}
                className="w-full py-3 mt-4 font-bold text-gray-600 dark:text-gray-300 uppercase transition-all border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-sm hover:shadow-lg active:scale-95"
              >
                + Agregar Competencias
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-600 flex gap-3">
            <button
              type="submit"
              disabled={guardando || !formik.isValid}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold uppercase text-sm hover:bg-primary-active transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : <><Save size={16} /> Guardar</>}
            </button>

            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold uppercase text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};