import axios from 'axios';
import React, { useEffect, useState, useContext } from 'react';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { ModalBody } from '@/components/modal';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { enqueueSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  idCentro?: number;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  programaId?: string; // solo para CREAR
  fichaId?: number | null; // mantenemos opcional por compatibilidad, pero no se usa para editar aquí
  onAction: () => void;
  // callbacks opcionales que usaba EditarFicha (se mantienen por compatibilidad)
  setEvento?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToast?: (v: boolean) => void;
  setMessageToast?: (v: string) => void;
}

interface FormValues {
  idAsignacion: number;
  cantidadGrados: number;
}

// ─── Validación ───────────────────────────────────────────────────────────────
const buildValidationSchema = (hasCentro: boolean) =>
  Yup.object({
    idTipoGrado: Yup.number().nullable(),

    idAsignacion: Yup.number()
      .min(1, 'Debe seleccionar una apertura')
      .typeError('Debe seleccionar una apertura')
      .required('Debe seleccionar una apertura'),

    cantidadGrados: Yup.number()
      .min(1, 'La cantidad de grados debe ser al menos 1')
      .max(10, 'La cantidad de grados no puede ser mayor a 10')
      .required('La cantidad de grados es obligatoria'),
  });

// ─── Estilos compartidos para react-select ────────────────────────────────────
const selectClassNames = {
  control: () =>
    'bg-white dark:bg-coal-400 border border-gray-300 dark:border-coal-200 text-gray-900 dark:text-gray-100',
  singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
  placeholder: () => 'text-gray-400 dark:text-gray-300',
  input: () => 'text-gray-900 dark:text-gray-100',
  menu: () => 'bg-white dark:bg-coal-500',
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `text-gray-900 dark:text-gray-100 ${isSelected ? 'bg-primary-500 text-white' : ''} ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}`,
  indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
  dropdownIndicator: () =>
    'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
  clearIndicator: () => 'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
};

// ─── Componente ───────────────────────────────────────────────────────────────
const CrearGrupos: React.FC<Props> = ({
  isModalOpen,
  setIsModalOpen,
  onAction,
}) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const esInstructorSenaRef = React.useRef(false);
  const idContratoUsuarioRef = React.useRef<number | undefined>(undefined);

  // Actualizar refs cuando cambie el contexto
  useEffect(() => {
    esInstructorSenaRef.current = authContext?.roles?.includes('INSTRUCTOR SENA') ?? false;
    idContratoUsuarioRef.current = authContext?.user?.persona?.contrato?.find(
      (c: any) => c.idEstado === 1
    )?.id;
  }, [authContext]);
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [reload, setReload] = useState(false);
  const [aperturaSelected, setAperturaSelected] = useState<any>(null);
  const { programId } = useParams<{ programId: string }>();

  const [tiposGrado, setTiposGrado] = useState<{ value: number; label: string }[]>([]);

  // ── Formik ─────────────────────────────────────────────────────────────────
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      idAsignacion: programId ? Number(programId) : 0,
      cantidadGrados: 1,
    },
    validationSchema: buildValidationSchema(!!user?.idCentroFormacion),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          idAsignacion: values.idAsignacion,
          cantidadGrados: values.cantidadGrados
        };

        const response = await axios.post('fichas/multiples', payload);

        setTimeout(() => {
          resetForm();
          setIsModalOpen(false);
          enqueueSnackbar(response.data.message || 'Grupos creados correctamente', { variant: 'success' });
          onAction();
        }, 700);
      } catch (error: any) {
        enqueueSnackbar(error.response.data.message || 'Error al crear los grupos', { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    }
  });

  // ── Cargar catálogos generales (solo CREAR) ───────────────────────────────
  useEffect(() => {
    if (!isModalOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const aperturaId = Number(programId);
        if (!aperturaId) {
          console.error('ID de apertura inválido:', programId);
          return;
        }

        const [tiposGradoRes, aperturaRes] = await Promise.all([
          axios.get('tipos-grado'),
          axios.get(`aperturaPrograma/${aperturaId}`)
        ]);

        setTiposGrado(tiposGradoRes.data ?? []);
        setAperturaSelected(aperturaRes.data);

        if (aperturaRes.data?.id) {
          formik.setFieldValue('idAsignacion', Number(aperturaRes.data.id));
        }
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isModalOpen, programId, reload]);

  const fechaFormateada = (fecha: any) => {
    const fechaDate = new Date(fecha);
    const dia = String(fechaDate.getDate()).padStart(2, '0');
    const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const anio = fechaDate.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 items-center justify-center px-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400 shadow-xl">
        {/* Cerrar */}
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={() => {
            setIsModalOpen(false);
            formik.resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">
          Crear Grados
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        ) : (
          <ModalBody className="grid gap-5 px-0 py-5">
            <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── Información académica ─────────────────────── */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                    Información académica
                  </h3>
                </div>

                {/* Grado */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Cantidad de Grados</label>
                  <input
                    type="number"
                    name="cantidadGrados"
                    value={formik.values.cantidadGrados}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full input text-sm"
                  />
                  {formik.touched.cantidadGrados && formik.errors.cantidadGrados && (
                    <p className="text-red-500 text-xs">{formik.errors.cantidadGrados}</p>
                  )}
                </div>

            {/* FECHAS DE APERTURA SELECCIONADA */}
            {aperturaSelected != null && (
              <div className="md:col-span-2 mt-2 border border-gray-200 dark:border-coal-200 rounded-xl p-5">
                <div className="mb-4 border-b border-gray-200 dark:border-coal-300 pb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Fechas del periodo de apertura seleccionado
                  </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Matrículas */}
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                      Matrículas
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Inicio</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaInicialMatriculas)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Fin</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaFinalMatriculas)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Etapa lectiva */}
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">
                      Etapa lectiva
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Inicio</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaInicialClases)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Fin</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaFinalClases)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan de mejoramiento */}
                  <div className="flex flex-col">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">
                      Plan mejoramiento
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Inicio</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaInicialPlanMejoramiento)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Fin</label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg px-3 py-2 mt-1">
                          {fechaFormateada(aperturaSelected.fechaFinalPlanMejoramiento)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    formik.resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className={`px-4 py-2 rounded-lg text-sm text-white transition-colors duration-200 ${formik.isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
                >
                  {formik.isSubmitting ? 'Guardando...' : 'Guardar Grupos'}
                </button>
              </div>
            </form>
          </ModalBody>
        )}
      </div>
    </div>
  );
};

export default CrearGrupos;
