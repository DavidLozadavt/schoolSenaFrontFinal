import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { Clock, Save } from 'lucide-react';

interface HorarioDia {
  idDia: number;
  nombreDia: string;
  horaInicio: any;
  horaFin: any;
  activo: boolean;
}

interface HorariosMateriaProps {
  open: boolean;
  onClose: () => void;
  idMateria: number;
  idFicha: number;
  totalHoras?: number;
  jornada?: string;
  horasActuales?: number;
  horasFaltantes?: number;
  porcentajeEjecucion?: number;
  onGuardado?: () => void;
}

// Schema de validación con Yup
const HorarioSchema = Yup.object().shape({
  fechaInicio: Yup.date()
    .required('La fecha de inicio es requerida')
    .typeError('Fecha inválida'),
  fechaFin: Yup.date()
    .required('La fecha de fin es requerida')
    .typeError('Fecha inválida'),
  observacion: Yup.string().nullable(),
  horarios: Yup.array()
    .of(
      Yup.object().shape({
        idDia: Yup.number().required(),
        nombreDia: Yup.string(),
        horaInicio: Yup.string()
          .when('activo', {
            is: true,
            then: (schema) => schema.required('Hora inicio requerida')
              .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
            otherwise: (schema) => schema.notRequired()
          }),
        horaFin: Yup.string()
          .when('activo', {
            is: true,
            then: (schema) => schema.required('Hora fin requerida')
              .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM')
              .test('is-greater', 'Hora fin debe ser mayor a hora inicio', function (value) {
                const { horaInicio } = this.parent;
                if (!horaInicio || !value) return true;
                return value > horaInicio;
              }),
            otherwise: (schema) => schema.notRequired()
          }),
        activo: Yup.boolean()
      })
    )
    .min(1, 'Debes seleccionar al menos un día')
});

export const HorariosMateria: React.FC<HorariosMateriaProps> = ({
  open,
  onClose,
  idMateria,
  idFicha,
  jornada,
  onGuardado,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Estados para estadísticas y proyección
  const [estadisticas, setEstadisticas] = useState({
    diasPorSemana: 0,
    horasSemana: 0,
    horasProgramadas: 0,
    fechaFinEstimada: '',
    sesionesPasadas: 0,
    totalSesiones: 0,
    sesionesRestantes: 0
  });

  // Estados adicionales
  const [loadingDias, setLoadingDias] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoHorario, setCargandoHorario] = useState(false);

  // Fechas de apertura obtenidas de la ficha
  const [fechaAperturaInicio, setFechaAperturaInicio] = useState('');
  const [fechaAperturaFin, setFechaAperturaFin] = useState('');

  // Para aplicar misma hora a varios días
  const [horaGlobalInicio, setHoraGlobalInicio] = useState('');
  const [horaGlobalFin, setHoraGlobalFin] = useState('');

  // Si es false, la proyección excluye festivos de Colombia
  const [incluirFestivos, setIncluirFestivos] = useState(false);

  // Inicializar Formik
  const formik = useFormik({
    initialValues: {
      fechaInicio: '',
      fechaFin: '',
      observacion: '',
      horarios: [] as HorarioDia[],
      esCompartido: false
    },
    validationSchema: HorarioSchema,
    onSubmit: async (values) => {
      await guardarHorarios(values);
    }
  });

  const { values, setFieldValue, handleChange, handleSubmit, errors, touched } = formik;

  // Cargar días disponibles y datos de apertura al abrir el modal
  useEffect(() => {
    if (open) {
      cargarDias();
      cargarFicha();
    } else {
      // Limpiar formulario al cerrar
      formik.resetForm();
      setHoraGlobalInicio('');
      setHoraGlobalFin('');
      setIncluirFestivos(false);
      setFechaAperturaInicio('');
      setFechaAperturaFin('');
    }
  }, [open]);

  // Cuando se obtienen las fechas de apertura, aplicarlas al formulario
  useEffect(() => {
    if (fechaAperturaInicio) {
      setFieldValue('fechaInicio', fechaAperturaInicio);
    }
    if (fechaAperturaFin) {
      setFieldValue('fechaFin', fechaAperturaFin);
    }
  }, [fechaAperturaInicio, fechaAperturaFin]);

  // Cargar fechas de apertura de la ficha
  const cargarFicha = async () => {
    try {
      const response = await axios.get(`fichas/${idFicha}`);
      // Estructura: { data: { ficha: {...}, apertura: {...} } }
      const apertura = response.data.data?.apertura;

      if (!apertura) {
        enqueueSnackbar('La ficha no tiene datos de apertura configurados', { variant: 'warning' });
        return;
      }

      // Los campos en el modelo AperturarPrograma se llaman fechaInicialClases y fechaFinalClases
      const inicio = apertura.fechaInicialClases
        ? new Date(apertura.fechaInicialClases).toISOString().split('T')[0]
        : null;
      const fin = apertura.fechaFinalClases
        ? new Date(apertura.fechaFinalClases).toISOString().split('T')[0]
        : null;

      if (!inicio || !fin) {
        enqueueSnackbar('La apertura no tiene fechas de clases configuradas', { variant: 'warning' });
        return;
      }

      setFechaAperturaInicio(inicio);
      setFechaAperturaFin(fin);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al cargar datos de la ficha', { variant: 'error' });
    }
  };

  // Cargar días desde la API
  const cargarDias = async () => {
    setLoadingDias(true);
    try {
      const response = await axios.get('dias');
      const dias = response.data || [];
      // Inicializar horarios con los días disponibles (todos inactivos)
      const horariosIniciales = dias.map((dia: any) => ({
        idDia: dia.id,
        nombreDia: dia.dia,
        horaInicio: '',
        horaFin: '',
        activo: false
      }));
      setFieldValue('horarios', horariosIniciales);
    } catch (error) {
      enqueueSnackbar('Error al cargar los días', { variant: 'error' });
    } finally {
      setLoadingDias(false);
    }
  };

// Activar/desactivar un día
const toggleDia = (index: number) => {
  const horarios = [...values.horarios];
  horarios[index].activo = !horarios[index].activo;
  if (!horarios[index].activo) {
    horarios[index].horaInicio = '';
    horarios[index].horaFin = '';
  }
  setFieldValue('horarios', horarios);
};

  // Aplicar misma hora a múltiples días
  const aplicarHoraGlobal = () => {
    if (!horaGlobalInicio || !horaGlobalFin) {
      enqueueSnackbar('Completa las horas para aplicar', { variant: 'warning' });
      return;
    }

    const horariosActualizados = values.horarios.map((h: HorarioDia) => {
      if (h.activo) {
        return {
          ...h,
          horaInicio: horaGlobalInicio,
          horaFin: horaGlobalFin
        };
      }
      return h;
    });

    setFieldValue('horarios', horariosActualizados);
  };

  // Guardar horarios
  const guardarHorarios = async (values: any) => {
    // Filtrar solo los días activos
    const horariosActivos = values.horarios.filter((h: HorarioDia) => h.activo);

    if (horariosActivos.length === 0) {
      enqueueSnackbar('Debes seleccionar al menos un día', { variant: 'warning' });
      return;
    }

    const payload = {
      idMateria,
      idFicha,
      fechaInicio: values.fechaInicio,
      fechaFin: values.fechaFin,
      observacion: values.observacion.toUpperCase(),
      horarios: horariosActivos.map((h: HorarioDia) => ({
        idDia: h.idDia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      })),
      esCompartido: values.esCompartido,
      festivos: incluirFestivos || true,
    };

    setGuardando(true);
    try {
      await axios.post('horarios/materia', payload);
      enqueueSnackbar('Horario guardado correctamente', { variant: 'success' });
      if (onGuardado) onGuardado();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar horario', {
        variant: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  // Contar días activos
  const diasActivos = values.horarios.filter((h: HorarioDia) => h.activo).length;

  return (
    <div className='fixed inset-0 !z-[600] flex items-center justify-center p-2 sm:p-4 animate-fade-in'>
      <ModalContent className="w-full max-w-7xl p-4 max-h-[95vh]">
        <ModalHeader>
          <ModalTitle>Configurar Horarios de la Materia - Jornada: {jornada}</ModalTitle>
          <button
            onClick={onClose}
            className="absolute z-10 flex items-center justify-center w-9 h-9 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger backdrop-blur-md border-gray-400 hover:text-white hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>
        </ModalHeader>

        <ModalBody className="px-0 py-2 overflow-y-auto">
          <FormikProvider value={formik}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fechas del período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    disabled={loadingDias}
                    value={values.fechaInicio}
                    onChange={handleChange}
                    className={`input w-full p-2 border rounded-md ${errors.fechaInicio && touched.fechaInicio ? 'border-red-500' : ''
                      }`}
                  />
                  {errors.fechaInicio && touched.fechaInicio && (
                    <p className="text-red-500 text-xs mt-1">{errors.fechaInicio}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-500">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    disabled={loadingDias}
                    value={values.fechaFin}
                    onChange={handleChange}
                    className="input w-full p-2 border rounded-md"
                  />
                  {errors.fechaFin && touched.fechaFin && (
                    <p className="text-red-500 text-xs mt-1">{errors.fechaFin}</p>
                  )}
                </div>

              </div>

              <div className='flex flex-col gap-2'>

              {/* Horario compartido */}
              {/* <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <label className="switch">
                  <input
                    type="checkbox"
                    name="esCompartido"
                    checked={values.esCompartido}
                    onChange={handleChange}
                  />
                </label>
                <div>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Es Horario Compartido</span>
                  <p className="text-[10px] text-blue-600 dark:text-blue-500">Al marcar esta opción, se habilitará la asignación de múltiples instructores para este horario.</p>
                </div>
              </div> */}

              {/* Incluir festivos en el cálculo */}
              {/* <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={incluirFestivos}
                    onChange={(e) => setIncluirFestivos(e.target.checked)}
                  />
                </label>
                <div>
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                    Incluir días festivos
                  </span>
                  <p className="text-[10px] text-amber-700 dark:text-amber-500">
                    {incluirFestivos
                      ? 'La fecha fin estimada y las sesiones cuentan los festivos de Colombia como días de formación.'
                      : 'La proyección omite los festivos oficiales de Colombia al estimar fecha fin y sesiones.'}
                  </p>
                </div>
              </div> */}

            </div> 

              {/* Observación */}
              <div>
                <label className="block mb-1 text-sm font-medium">Observación</label>
                <textarea
                  name="observacion"
                  value={values.observacion}
                  onChange={handleChange}
                  rows={3}
                  className="input w-full p-2 border rounded-md resize-none uppercase"
                  placeholder="Ej: SE RECOMIENDA LA PUNTUALIDAD"
                />
              </div>

              {/* Aplicador global de horas */}
              <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block mb-1 text-xs">Hora inicio</label>
                    <input
                      type="time"
                      value={horaGlobalInicio}
                      onChange={(e) => setHoraGlobalInicio(e.target.value)}
                      className="input w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs">Hora fin</label>
                    <input
                      type="time"
                      value={horaGlobalFin}
                      onChange={(e) => setHoraGlobalFin(e.target.value)}
                      className="input w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={aplicarHoraGlobal}
                      className="btn btn-sm btn-primary w-full my-1"
                    >
                      Aplicar a días seleccionados
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de días */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">
                    Días de la semana <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {diasActivos} día(s) seleccionado(s)
                  </span>
                </div>

                {loadingDias ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-coal-400">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold">Activo</th>
                          <th className="p-3 text-left text-xs font-semibold">Día</th>
                          <th className="p-3 text-left text-xs font-semibold">Hora inicio</th>
                          <th className="p-3 text-left text-xs font-semibold">Hora fin</th>
                        </tr>
                      </thead>
                      <tbody>
                        <FieldArray name="horarios">
                          {() => (
                            <>
                              {values.horarios.map((horario, index: number) => (
                                <tr key={horario.idDia} className="border-t dark:border-gray-700">
                                  <td className="p-3">
                                    <label className="switch">
                                      <input
                                        type="checkbox"
                                        checked={horario.activo}
                                        onChange={() => toggleDia(index)}
                                      />
                                    </label>
                                  </td>
                                  <td>{horario.nombreDia}</td>
                                  <td className="p-3">
                                    <input
                                      type="time"
                                      name={`horarios[${index}].horaInicio`}
                                      value={horario.horaInicio}
                                      onChange={handleChange}
                                      disabled={!horario.activo}
                                      className={`input w-full p-2 border rounded-md text-sm ${!horario.activo ? 'bg-gray-100 dark:bg-coal-500' : ''
                                        } ${
                                        // CORRECCIÓN: Verificar si existe el error y si es un objeto
                                        formik.errors.horarios &&
                                          Array.isArray(formik.errors.horarios) &&
                                          formik.errors.horarios[index] &&
                                          typeof formik.errors.horarios[index] === 'object' &&
                                          (formik.errors.horarios[index] as any)?.horaInicio &&
                                          formik.touched.horarios?.[index]?.horaInicio
                                          ? 'border-red-500' : ''
                                        }`}
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="time"
                                      name={`horarios[${index}].horaFin`}
                                      value={horario.horaFin}
                                      onChange={handleChange}
                                      disabled={!horario.activo}
                                      className={`input w-full p-2 border rounded-md text-sm ${!horario.activo ? 'bg-gray-100 dark:bg-coal-500' : ''
                                        } ${formik.errors.horarios &&
                                          Array.isArray(formik.errors.horarios) &&
                                          formik.errors.horarios[index] &&
                                          typeof formik.errors.horarios[index] === 'object' &&
                                          (formik.errors.horarios[index] as any)?.horaFin &&
                                          formik.touched.horarios?.[index]?.horaFin
                                          ? 'border-red-500' : ''
                                        }`}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                        </FieldArray>
                      </tbody>
                    </table>
                  </div>
                )}

                {errors.horarios && !Array.isArray(errors.horarios) && (
                  <p className="text-red-500 text-xs mt-1">{errors.horarios as string}</p>
                )}
              </div>

              {/* Resumen de horas */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  Resumen y Proyección
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Días/Semana</span>
                    <span className="font-bold text-lg">{estadisticas.diasPorSemana}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Horas/Semana</span>
                    <span className="font-bold text-lg">{estadisticas.horasSemana} h</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || cargandoHorario}
                  className="btn btn-sm btn-primary flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar horario
                    </>
                  )}
                </button>
              </div>
            </form>
          </FormikProvider>
        </ModalBody>
      </ModalContent>
    </div>
  );
};