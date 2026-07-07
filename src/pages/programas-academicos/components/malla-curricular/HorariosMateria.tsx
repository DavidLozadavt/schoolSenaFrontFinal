import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { Clock, Save } from 'lucide-react';
import { getColombianHolidayDateSet, isColombianHoliday } from '@/utils/colombianHolidays';

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
  idGradoMateria: number;
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
  idGradoMateria,
  idFicha,
  totalHoras,
  jornada,
  horasActuales,
  horasFaltantes,
  onGuardado,
  porcentajeEjecucion
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

  // Para aplicar misma hora a varios días
  const [horaGlobalInicio, setHoraGlobalInicio] = useState('');
  const [horaGlobalFin, setHoraGlobalFin] = useState('');

  // Si es false, la proyección excluye festivos de Colombia
  const [incluirFestivos, setIncluirFestivos] = useState(true);

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

  const festivosSet = useMemo(() => {
    const baseYear = values.fechaInicio
      ? new Date(values.fechaInicio + 'T00:00:00').getFullYear()
      : new Date().getFullYear();
    return getColombianHolidayDateSet(baseYear, baseYear + 2);
  }, [values.fechaInicio]);

  // Cargar días disponibles al abrir el modal
  useEffect(() => {
    if (open) {
      cargarDias();
      cargarHorarioExistente();
    } else {
      // Limpiar formulario al cerrar
      formik.resetForm();
      setHoraGlobalInicio('');
      setHoraGlobalFin('');
      setIncluirFestivos(false);
    }
  }, [open]);

  // Seleccionar automáticamente el día cuando cambia la fecha de inicio
  useEffect(() => {
    if (values.fechaInicio && values.horarios.length > 0) {
      const fecha = new Date(values.fechaInicio + 'T00:00:00');
      const diaSemana = fecha.getDay();
      const diaBD = diaSemana === 0 ? 7 : diaSemana;

      const diaExiste = values.horarios.some((h: HorarioDia) => h.idDia === diaBD);
    
      if (!diaExiste) {
        enqueueSnackbar('La fecha inicial no coincide con ningún día configurado en el sistema', { variant: 'warning' });
        return;
      }

      const horariosActualizados = values.horarios.map((h: HorarioDia) => ({
        ...h,
        activo: h.idDia === diaBD,
        horaInicio: h.idDia === diaBD ? h.horaInicio : '',
        horaFin: h.idDia === diaBD ? h.horaFin : ''
      }));

      setFieldValue('horarios', horariosActualizados);
    }
  }, [values.fechaInicio, values.horarios.length, loadingDias]);

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

  // Cargar horario existente si lo hay
  const cargarHorarioExistente = async () => {
    if (!idGradoMateria) return;

    setCargandoHorario(true);
    try {
      const response = await axios.get(`horarios/materia/${idGradoMateria}`);
      const data = response.data.data;

      if (data) {
        setFieldValue('fechaInicio', data.fechaInicio || '');
        setFieldValue('observacion', data.observacion || '');

        // Si hay horarios guardados, actualizar los días activos
        if (data.horarios && Array.isArray(data.horarios)) {
          const horariosGuardados = data.horarios;
          const horariosActualizados = values.horarios.map((h: HorarioDia) => {
            const guardado = horariosGuardados.find((hg: any) => hg.idDia === h.idDia);
            if (guardado) {
              return {
                ...h,
                horaInicio: guardado.horaInicio,
                horaFin: guardado.horaFin,
                activo: true
              };
            }
            return h;
          });
          setFieldValue('horarios', horariosActualizados);
        }
      }
    } catch (error) {
      // Si no hay horario, no pasa nada
    } finally {
      setCargandoHorario(false);
    }
  };

// Activar/desactivar un día
const toggleDia = (index: number) => {
  const horarios = [...values.horarios];
  const diaActual = horarios[index];
  
  // Obtener el día de la fecha inicial
  if (values.fechaInicio) {
    const fecha = new Date(values.fechaInicio + 'T00:00:00');
    const diaSemana = fecha.getDay();
    const diaBD = diaSemana === 0 ? 7 : diaSemana;
    
    // Si intenta desmarcar el día que coincide con la fecha inicial
    if (diaActual.activo && diaActual.idDia === diaBD) {
      enqueueSnackbar('No puedes desmarcar el día que corresponde a la fecha inicial', { 
        variant: 'warning' 
      });
      return;
    }
  }
  
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
      idGradoMateria,
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

  // Calcular proyección de fecha fin y estadísticas
  useEffect(() => {
    calcularProyeccion();
  }, [
    values.fechaInicio, 
    // IMPORTANTE: No incluir values.fechaFin aquí para evitar ciclos
    JSON.stringify(values.horarios.map(h => ({
      idDia: h.idDia,
      activo: h.activo,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin
    }))),
    totalHoras, 
    horasActuales, 
    horasFaltantes,
    porcentajeEjecucion,
    incluirFestivos,
    festivosSet
  ]);

 const calcularProyeccion = () => {
  const diasActivos = values.horarios.filter(h => h.activo).length;

  const horasSemana = values.horarios
    .filter(h => h.activo && h.horaInicio && h.horaFin)
    .reduce((total, h) => {
      const [hIni, mIni] = h.horaInicio.toString().split(':').map(Number);
      const [hFin, mFin] = h.horaFin.toString().split(':').map(Number);
      const minutos = (hFin * 60 + mFin) - (hIni * 60 + mIni);
      return total + (minutos / 60);
    }, 0);

  // Proyección de Fecha Fin
  let fechaFinEstimada = '';
  let horasProgramadas = 0;
  let sesionesPasadas = 0;
  let totalSesiones = 0;
  let sesionesRestantes = 0;

  const horasObjetivo = (totalHoras || 0) * ((porcentajeEjecucion || 100) / 100);
  const horasPendientes = Math.max(0, horasObjetivo - (horasActuales || 0));

  // --- Trabajamos en MINUTOS ENTEROS para evitar errores de decimales ---
  const minutosPendientes = Math.round(horasPendientes * 60);

  if (values.fechaInicio && diasActivos > 0 && horasSemana > 0 && minutosPendientes > 0) {

    let minutosAcumulados = 0;
    const fechaIteracion = new Date(values.fechaInicio + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mapaHorarios = values.horarios.reduce((acc: any, h) => {
      if (h.activo && h.horaInicio && h.horaFin) {
        const jsDay = h.idDia === 7 ? 0 : h.idDia;
        const [hIni, mIni] = h.horaInicio.toString().split(':').map(Number);
        const [hFin, mFin] = h.horaFin.toString().split(':').map(Number);
        // Duración en minutos, entero exacto (sin dividir entre 60 todavía)
        const duracionMin = (hFin * 60 + mFin) - (hIni * 60 + mIni);
        acc[jsDay] = duracionMin;
      }
      return acc;
    }, {});

    // Límite de iteraciones para evitar bucles infinitos
    let iteraciones = 0;
    const MAX_ITERACIONES = 365 * 2;

    const fechaFinCalculada = new Date(fechaIteracion);
    const fechasSesiones: Date[] = [];

    while (minutosAcumulados < minutosPendientes && iteraciones < MAX_ITERACIONES) {
      const diaSemana = fechaFinCalculada.getDay();
      const hayHorarioEnDia = mapaHorarios[diaSemana] !== undefined;

      if (hayHorarioEnDia) {
        const cuentaComoSesion =
          incluirFestivos || !isColombianHoliday(fechaFinCalculada, festivosSet);

        if (cuentaComoSesion) {
          const minutosRestantes = minutosPendientes - minutosAcumulados;
          // Regla: si lo que falta es más de 60 min (1h), sí agrega la sesión completa.
          // Si falta 1h o menos, NO agrega otra sesión (evita sumar de más).
          const debeAgregarSesion = minutosAcumulados === 0 || minutosRestantes > 60;

          if (debeAgregarSesion) {
            minutosAcumulados += mapaHorarios[diaSemana];
            fechasSesiones.push(new Date(fechaFinCalculada));
          } else {
            break;
          }
        }
      }

      if (minutosAcumulados < minutosPendientes) {
        fechaFinCalculada.setDate(fechaFinCalculada.getDate() + 1);
      }
      iteraciones++;
    }

    horasProgramadas = minutosAcumulados / 60;
    fechaFinEstimada = fechaFinCalculada.toISOString().split('T')[0];

    // Calcular sesiones basadas en las fechas reales
    totalSesiones = fechasSesiones.length;
    sesionesPasadas = fechasSesiones.filter(fecha => fecha < hoy).length;
    sesionesRestantes = totalSesiones - sesionesPasadas;

    // Actualizar fecha fin en formik solo si es diferente
    if (fechaFinEstimada && values.fechaFin !== fechaFinEstimada) {
      setTimeout(() => {
        setFieldValue('fechaFin', fechaFinEstimada);
      }, 0);
    }
  }

  setEstadisticas({
    diasPorSemana: diasActivos,
    horasSemana: parseFloat(horasSemana.toFixed(2)),
    horasProgramadas: parseFloat(horasProgramadas.toFixed(2)),
    fechaFinEstimada,
    sesionesPasadas,
    totalSesiones,
    sesionesRestantes
  });
};

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
                    Fecha inicio <span className="text-red-500">*</span>
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
                    Fecha Fin (Estimada)
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={values.fechaFin}
                    readOnly
                    className="input w-full p-2 border rounded-md bg-gray-100 dark:bg-coal-500 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className='flex flex-col gap-2'>

              {/* Horario compartido */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
              </div>

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
                      className="btn btn-sm btn-primary w-full"
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
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Horas Reales ({porcentajeEjecucion}%)</span>
                    <span className="font-bold text-lg text-blue-600">
                      {((totalHoras || 0) * ((porcentajeEjecucion || 100) / 100)).toFixed(1)} h / {totalHoras} h
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Horas Actuales</span>
                    <span className="font-bold text-lg text-green-600">{horasActuales || 0} h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Horas Faltantes</span>
                    <span className="font-bold text-lg text-orange-600">
                      {Math.max(0, ((totalHoras || 0) * ((porcentajeEjecucion || 100) / 100)) - (horasActuales || 0)).toFixed(1)} h / {totalHoras} h
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Horas Programadas</span>
                    <span className="font-bold text-lg text-purple-600">{estadisticas.horasProgramadas} h</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Sesiones Pasadas</span>
                    <span className="font-bold text-lg text-gray-600">{estadisticas.sesionesPasadas}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Total Sesiones</span>
                    <span className="font-bold text-lg text-blue-600">{estadisticas.totalSesiones}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Sesiones Restantes</span>
                    <span className="font-bold text-lg text-orange-600">{estadisticas.sesionesRestantes}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-coal-500 rounded border">
                    <span className="text-gray-500 block">Fecha final estimada</span>
                    <span className="font-bold text-lg text-blue-600">{estadisticas.fechaFinEstimada}
                      {(() => {
                        const hObj = (totalHoras || 0) * ((porcentajeEjecucion || 100) / 100);
                        const hPen = Math.max(0, hObj - (horasActuales || 0));
                        return hPen > 0 && estadisticas.horasProgramadas < hPen;
                      })() && (
                          <span className="text-red-500 ml-2 text-xs">
                            (La programación no cubre las horas del objetivo)
                          </span>
                        )}
                    </span>
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