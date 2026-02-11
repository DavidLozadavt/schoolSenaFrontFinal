import axios from 'axios';
import React, { useEffect, useState } from 'react';
import ModalPeriodo from '@/pages/periodos/ModalPeriodo';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import FormularioInfraestructura from '@/pages/gestion-infraestructura/FormularioInfraestructura';
import { ModalBody } from '@/components/modal';
import ModalError from '@/pages/gestion-sedes-sena/ModalError';
import Toast from './Toast';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  fichaId: number | null;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToast: (showToast: boolean) => void;
  setMessageToast: (messageToast: string) => void;
  onAction: () => void;
}

interface Jornada {
  grupoJornada: number;
  nombreJornada: string;
}

interface Periodo {
  id: number;
  nombrePeriodo: string;
  fechaInicial: string;
  fechaFinal: string;
}

interface Sedes {
  id: number;
  nombre: string;
}

interface Programas {
  id: number;
  nombrePrograma: string;
}

interface Regionales {
  id: number;
  razonSocial: string;
}

interface Ambientes {
  id: number;
  nombreInfraestructura: string;
  capacidad: number;
}

interface FormValues {
  observacion: string;
  idPeriodo: number;
  idPrograma: number;
  idRegional: number;
  estado: string;
  idSede: number;
  idJornada: number;
  idInfraestructura: number;
  codigo: string;
  fechaInicialClases: string;
  fechaFinalClases: string;
  fechaInicialPlanMejoramiento: string;
  fechaFinalPlanMejoramiento: string;
  fechaInicialInscripciones: string;
  fechaFinalInscripciones: string;
  fechaInicialMatriculas: string;
  fechaFinalMatriculas: string;
  tipoCalificacion?: string;
  porcentajeEjecucion: null;
  documento: File | null;
}

const toDate = (date?: string) => (date ? new Date(date) : null);

const validationSchema = Yup.object({
  observacion: Yup.string().nullable().max(1000, 'Máximo 1000 caracteres'),

  idPeriodo: Yup.number()
    .typeError('Debe seleccionar un periodo')
    .required('Debe seleccionar un periodo'),

  idPrograma: Yup.number()
    .typeError('Debe seleccionar un programa')
    .required('Debe seleccionar un programa'),

  idRegional: Yup.number()
    .typeError('Debe seleccionar una regional')
    .required('Debe seleccionar una regional'),

  estado: Yup.string().required('Debe seleccionar un estado'),

  idSede: Yup.number().typeError('Debe seleccionar una sede').required('Debe seleccionar una sede'),

  idInfraestructura: Yup.number().nullable(),
  idJornada: Yup.number()
    .typeError('Debe seleccionar una jornada')
    .required('Debe seleccionar una jornada'),

  codigo: Yup.string().required('El código es obligatorio').max(100, 'Máximo 100 caracteres'),

  fechaInicialClases: Yup.string().required('La fecha inicial de clases es obligatoria'),

  fechaFinalClases: Yup.string()
    .required('La fecha final de clases es obligatoria')
    .test(
      'fin-clases-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial de clases',
      function (value) {
        const { fechaInicialClases } = this.parent;
        if (!value || !fechaInicialClases) return true;
        return toDate(value)! >= toDate(fechaInicialClases)!;
      }
    ),

  fechaInicialInscripciones: Yup.string().required(
    'La fecha inicial de inscripciones es obligatoria'
  ),

  fechaFinalInscripciones: Yup.string()
    .required('La fecha final de inscripciones es obligatoria')
    .test('after-or-equal', 'Debe ser mayor o igual a la fecha inicial', function (value) {
      const { fechaInicialInscripciones } = this.parent;
      return !value || !fechaInicialInscripciones || value >= fechaInicialInscripciones;
    }),

  fechaInicialMatriculas: Yup.string()
    .required('La fecha inicial de matrículas es obligatoria')
    .test(
      'matricula-after-or-equal-inscripcion',
      'La fecha inicial de matrículas debe ser mayor o igual a la fecha inicial de inscripciones',
      function (value) {
        const { fechaInicialInscripciones } = this.parent;
        return !value || !fechaInicialInscripciones || value >= fechaInicialInscripciones;
      }
    ),
  fechaFinalMatriculas: Yup.string()
    .required('La fecha final de matrículas es obligatoria')
    .test(
      'after-or-equal',
      'Debe ser mayor o igual a la fecha inicial de matrículas',
      function (value) {
        const { fechaInicialMatriculas } = this.parent;
        return !value || !fechaInicialMatriculas || value >= fechaInicialMatriculas;
      }
    )
    .test(
      'fin-matriculas-before-clases',
      'La fecha final de matrículas debe ser menor a la fecha inicial de la etapa electiva',
      function (value) {
        const { fechaInicialClases } = this.parent;
        if (!value || !fechaInicialClases) return true;
        return toDate(value)! < toDate(fechaInicialClases)!;
      }
    ),

  fechaInicialPlanMejoramiento: Yup.string()
    .required('La fecha inicial del plan de mejoramiento es obligatoria')
    .test(
      'plan-after-clases',
      'La fecha inicial del plan de mejoramiento debe ser posterior al fin de clases',
      function (value) {
        const { fechaFinalClases } = this.parent;
        if (!value || !fechaFinalClases) return true;
        return toDate(value)! > toDate(fechaFinalClases)!;
      }
    ),

  fechaFinalPlanMejoramiento: Yup.string()
    .required('La fecha final del plan de mejoramiento es obligatoria')
    .test(
      'plan-fin-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial del plan de mejoramiento',
      function (value) {
        const { fechaInicialPlanMejoramiento } = this.parent;
        if (!value || !fechaInicialPlanMejoramiento) return true;
        return toDate(value)! >= toDate(fechaInicialPlanMejoramiento)!;
      }
    ),

  porcentajeEjecucion: Yup.number()
    .typeError('Debe ser un número')
    .min(1, 'No puede ser menor que 1')
    .max(100, 'No puede ser mayor que 100')
    .nullable(),

  documento: Yup.mixed()
    .nullable()
    .test('fileType', 'Solo se permiten archivos PDF', (value) => {
      if (!value) return true;
      return value instanceof File && value.type === 'application/pdf';
    })
    .test('fileSize', 'El archivo no puede superar los 5MB', (value) => {
      if (!value) return true;
      return value instanceof File && value.size <= 5 * 1024 * 1024;
    })
});

const ESTADOS_APERTURA = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
  { value: 'EN CURSO', label: 'EN CURSO' },
  { value: 'CERRADO', label: 'CERRADO' },
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'APROBADO', label: 'APROBADO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

const EditarFicha: React.FC<Props> = ({
  isModalOpen,
  setIsModalOpen,
  fichaId,
  setEvento,
  setShowToast,
  setMessageToast,
  onAction
}) => {
  const [reload, setReload] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);
  const [programas, setProgramas] = useState<Programas[]>([]);
  const [regionales, setRegionales] = useState<Regionales[]>([]);
  const [ambientes, setAmbientes] = useState<Ambientes[]>([]);
  const [eventoAmbiente, setEventoAmbiente] = useState<boolean>(false);
  const [showAmbienteForm, setShowAmbienteForm] = useState<boolean>(false);
  const [idInfraestructura, setIdInfraestructura] = useState<string>('');

  const [handleError, setHandleError] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>('');

  const [handleSuccess, setHandleSuccess] = useState<boolean>(false);
  const [messageSuccess, setMessageSuccess] = useState<string>('');
  const normalizeDate = (date?: string | null) => {
    if (!date) return '';
    return date.split('T')[0]; // corta horas
  };

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      observacion: '',
      idPeriodo: 0,
      idPrograma: 0,
      idRegional: 0,
      estado: '',
      idSede: 0,
      idInfraestructura: 0,
      fechaInicialClases: '',
      fechaFinalClases: '',
      idJornada: 0,
      codigo: '',
      fechaInicialPlanMejoramiento: '',
      fechaFinalPlanMejoramiento: '',
      fechaInicialInscripciones: '',
      fechaFinalInscripciones: '',
      fechaInicialMatriculas: '',
      fechaFinalMatriculas: '',
      tipoCalificacion: 'NUMERICO',
      porcentajeEjecucion: null,
      documento: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (value !== null && value !== '' && value !== 0) {
            formData.append(key, value as any);
          }
        });

        await axios.post(`fichas/${fichaId}?_method=PUT`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setHandleSuccess(true);
        setMessageSuccess('Ficha actualizada correctamente');

        setTimeout(() => {
          resetForm();
          setIsModalOpen(false);
          setHandleSuccess(false);
          onAction();
        }, 700);
      } catch (error: any) {
        setHandleError(true);
        setMessageError('No se pudo actualizar');
      } finally {
        setSubmitting(false);
      }
    }
  });

  //Agregar el formulario del periodo:
  const [openModal, setOpenModal] = useState(false);

  // Cargar catálogos generales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [jornadaRes, periodosRes, regionalesRes, programasRes] = await Promise.all([
          axios.get('jornadas/agrupadas'),
          axios.get('periodos'),
          axios.get('regional'),
          axios.get('programas')
        ]);
        setJornadas(jornadaRes.data.data);
        setPeriodos(periodosRes.data);
        setRegionales(regionalesRes.data);
        setProgramas(programasRes.data.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    loadData();
  }, [reload]);

  // Cargar datos de la ficha
  useEffect(() => {
    const loadFichaData = async () => {
      if (fichaId && isModalOpen) {
        setIsLoading(true);
        try {
          const response = await axios.get(`fichas/${fichaId}`);
          const { ficha, apertura } = response.data.data;

          formik.setValues({
            observacion: apertura.observacion || '',
            idPeriodo: apertura.idPeriodo || 0,
            idPrograma: apertura.idPrograma || 0,
            idRegional: ficha.idRegional || 0,
            estado: apertura.estado || '',
            idSede: apertura.idSede || 0,
            idJornada: ficha.idJornada || 0,
            codigo: ficha.codigo || '',
            fechaInicialClases: normalizeDate(apertura.fechaInicialClases),
            fechaFinalClases: normalizeDate(apertura.fechaFinalClases),
            fechaInicialInscripciones: normalizeDate(apertura.fechaInicialInscripciones),
            fechaFinalInscripciones: normalizeDate(apertura.fechaFinalInscripciones),
            fechaInicialMatriculas: normalizeDate(apertura.fechaInicialMatriculas),
            fechaFinalMatriculas: normalizeDate(apertura.fechaFinalMatriculas),
            fechaInicialPlanMejoramiento: normalizeDate(apertura.fechaInicialPlanMejoramiento),
            fechaFinalPlanMejoramiento: normalizeDate(apertura.fechaFinalPlanMejoramiento),

            idInfraestructura: ficha.idInfraestructura || 0,
            tipoCalificacion: apertura.tipoCalificacion || 'NUMERICO',
            porcentajeEjecucion: ficha.porcentajeEjecucion,
            documento: null
          });
        } catch (error: any) {
          setMessageToast(error.response?.data?.message || 'Error al cargar la ficha');
          setShowToast(true);
          setIsModalOpen(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadFichaData();
  }, [fichaId, isModalOpen]);

  // Cargar sedes cuando cambia regional
  useEffect(() => {
    const loadSedes = async () => {
      if (!formik.values.idRegional) {
        setSedes([]);
        return;
      }

      try {
        const res = await axios.get(`sedes/regional/${formik.values.idRegional}`);
        setSedes(res.data.data);
      } catch (error) {
        console.error('Error cargando sedes', error);
        setSedes([]);
      }
    };

    loadSedes();
  }, [formik.values.idRegional]);

  // Cargar ambientes cuando cambia sede
  useEffect(() => {
    const loadAmbientes = async () => {
      if (!formik.values.idSede) {
        setAmbientes([]);
        return;
      }

      try {
        const res = await axios.get(`sedes/${formik.values.idSede}/infraestructuras`);
        setAmbientes(res.data.data);
      } catch (error) {
        console.error('Error cargando los ambientes', error);
        setAmbientes([]);
      }
    };

    loadAmbientes();
  }, [formik.values.idSede, eventoAmbiente]);

  const optionsJornadas = jornadas.map((val) => ({
    value: val.grupoJornada,
    label: val.nombreJornada
  }));

  const optionsPeriodos = periodos.map((val) => ({
    value: val.id,
    label: `${val.nombrePeriodo} fecha inicio: ${val.fechaInicial} fecha fin: ${val.fechaFinal}`
  }));

  const optionsSedes = sedes.map((val) => ({
    value: val.id,
    label: val.nombre
  }));

  const optionsProgramas = programas.map((val) => ({
    value: val.id,
    label: val.nombrePrograma
  }));

  const optionsRegionales = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));

  const optionsAmbientes = ambientes.map((val) => ({
    value: val.id,
    label: val.nombreInfraestructura
  }));

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl dark:border-coal-100 bg-white dark:bg-coal-400  shadow-xl">
        {/* Botón cerrar */}
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

        {/* Header fijo */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Editar Ficha</h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-gray-500">Cargando datos...</div>
          </div>
        ) : (
          <ModalBody className="grid gap-5 px-0 py-5">
            <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                    Información académica
                  </h3>
                </div>

                {/* Código */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Código de la ficha</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formik.values.codigo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.codigo && formik.errors.codigo && (
                    <p className="text-red-500 text-xs">{formik.errors.codigo}</p>
                  )}
                </div>
                {/* Observación */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Observación</label>
                  <textarea
                    name="observacion"
                    value={formik.values.observacion}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 resize-y"
                    placeholder="Escriba la observación (máx. 1000 caracteres)"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {formik.touched.observacion && formik.errors.observacion && (
                        <span className="text-red-500">{formik.errors.observacion}</span>
                      )}
                    </span>
                    <span
                      className={`text-xs ${formik.values.observacion.length > 1000 ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {formik.values.observacion.length}/1000
                    </span>
                  </div>
                </div>

                {/* Jornada */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Jornada</label>
                  <Select
                    options={optionsJornadas}
                    placeholder="Seleccione la jornada"
                    isClearable
                    value={optionsJornadas.find((o) => o.value === formik.values.idJornada)}
                    onChange={(option) => formik.setFieldValue('idJornada', option?.value || 0)}
                    onBlur={() => formik.setFieldTouched('idJornada', true)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                  {formik.touched.idJornada && formik.errors.idJornada && (
                    <p className="text-red-500 text-xs">{formik.errors.idJornada}</p>
                  )}
                </div>

                {/* Periodo */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Periodo</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        options={optionsPeriodos}
                        placeholder="Seleccione el periodo"
                        isClearable
                        value={optionsPeriodos.find((o) => o.value === formik.values.idPeriodo)}
                        onChange={(option) => formik.setFieldValue('idPeriodo', option?.value || 0)}
                        onBlur={() => formik.setFieldTouched('idPeriodo', true)}
                        classNames={{
                          control: () =>
                            `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                          singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                          placeholder: () => 'text-gray-400 dark:text-gray-300',
                          input: () => 'text-gray-900 dark:text-gray-100',
                          menu: () => 'bg-white dark:bg-coal-500',
                          option: ({ isFocused, isSelected }) =>
                            `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                          indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                          dropdownIndicator: () =>
                            'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                          clearIndicator: () =>
                            'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                        }}
                      />
                    </div>
                    {/* Botón + */}
                    <button
                      type="button"
                      onClick={() => setOpenModal(true)}
                      className="
                    h-[38px] w-[38px]
                    flex items-center justify-center
                    border border-gray-300 rounded-md
                    text-lg font-medium
                    text-gray-600
                    hover:border-blue-500 hover:text-blue-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                    transition
                  "
                      title="Agregar ambiente"
                    >
                      +
                    </button>
                  </div>
                  {formik.touched.idPeriodo && formik.errors.idPeriodo && (
                    <p className="text-red-500 text-xs">{formik.errors.idPeriodo}</p>
                  )}
                </div>

                {/* Programa */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Programa</label>
                  <Select
                    options={optionsProgramas}
                    placeholder="Seleccione el programa"
                    isClearable
                    value={optionsProgramas.find((o) => o.value === formik.values.idPrograma)}
                    onChange={(option) => formik.setFieldValue('idPrograma', option?.value || 0)}
                    onBlur={() => formik.setFieldTouched('idPrograma', true)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                  {formik.touched.idPrograma && formik.errors.idPrograma && (
                    <p className="text-red-500 text-xs">{formik.errors.idPrograma}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <Select
                    options={ESTADOS_APERTURA}
                    placeholder="Seleccione el estado"
                    isClearable
                    value={ESTADOS_APERTURA.find((o) => o.value === formik.values.estado)}
                    onChange={(option) => formik.setFieldValue('estado', option?.value || '')}
                    onBlur={() => formik.setFieldTouched('estado', true)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                  {formik.touched.estado && formik.errors.estado && (
                    <p className="text-red-500 text-xs">{formik.errors.estado}</p>
                  )}
                </div>

                {/* Ubicación */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                    Ubicación
                  </h3>
                </div>

                {/* Regional */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Regional</label>
                  <Select
                    options={optionsRegionales}
                    placeholder="Seleccione la regional"
                    isClearable
                    value={optionsRegionales.find((o) => o.value === formik.values.idRegional)}
                    onChange={(option) => {
                      formik.setFieldValue('idRegional', option?.value || 0);
                      formik.setFieldValue('idSede', 0);
                      formik.setFieldValue('idInfraestructura', 0);
                    }}
                    onBlur={() => formik.setFieldTouched('idRegional', true)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                  {formik.touched.idRegional && formik.errors.idRegional && (
                    <p className="text-red-500 text-xs">{formik.errors.idRegional}</p>
                  )}
                </div>

                {/* Sede */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Sede</label>
                  <Select
                    options={optionsSedes}
                    placeholder={
                      !formik.values.idRegional
                        ? 'Seleccione primero una regional'
                        : sedes.length === 0
                          ? 'No hay sedes para esta regional'
                          : 'Seleccione la sede'
                    }
                    isDisabled={!formik.values.idRegional || sedes.length === 0}
                    isClearable
                    value={optionsSedes.find((o) => o.value === formik.values.idSede)}
                    onChange={(option) => {
                      formik.setFieldValue('idSede', option?.value || 0);
                      formik.setFieldValue('idInfraestructura', 0);
                    }}
                    onBlur={() => formik.setFieldTouched('idSede', true)}
                    classNames={{
                      control: () =>
                        `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                      singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                      placeholder: () => 'text-gray-400 dark:text-gray-300',
                      input: () => 'text-gray-900 dark:text-gray-100',
                      menu: () => 'bg-white dark:bg-coal-500',
                      option: ({ isFocused, isSelected }) =>
                        `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                      indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                      dropdownIndicator: () =>
                        'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                      clearIndicator: () =>
                        'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                    }}
                  />
                  {formik.touched.idSede && formik.errors.idSede && (
                    <p className="text-red-500 text-xs">{formik.errors.idSede}</p>
                  )}
                </div>

                {/* Ambiente */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Ambiente</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        options={optionsAmbientes}
                        placeholder={
                          !formik.values.idSede
                            ? 'Seleccione primero una sede'
                            : ambientes.length === 0
                              ? 'No hay ambientes para esta sede'
                              : 'Seleccione el ambiente'
                        }
                        isDisabled={!formik.values.idSede || ambientes.length === 0}
                        isClearable
                        value={optionsAmbientes.find(
                          (o) => o.value === formik.values.idInfraestructura
                        )}
                        onChange={(option) =>
                          formik.setFieldValue('idInfraestructura', option?.value || 0)
                        }
                        onBlur={() => formik.setFieldTouched('idInfraestructura', true)}
                        classNames={{
                          control: () =>
                            `
                      bg-white dark:bg-coal-400
                      border border-gray-300 dark:border-coal-200
                      text-gray-900 dark:text-gray-100
                      `,
                          singleValue: () => 'text-gray-900 dark:text-gray-100 font-medium',
                          placeholder: () => 'text-gray-400 dark:text-gray-300',
                          input: () => 'text-gray-900 dark:text-gray-100',
                          menu: () => 'bg-white dark:bg-coal-500',
                          option: ({ isFocused, isSelected }) =>
                            `
                      text-gray-900 dark:text-gray-100
                      ${isSelected ? 'bg-primary-500 text-white' : ''}
                      ${isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''}
                      `,
                          indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
                          dropdownIndicator: () =>
                            'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
                          clearIndicator: () =>
                            'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
                        }}
                      />
                    </div>

                    {/* Botón + */}
                    <button
                      type="button"
                      disabled={!formik.values.idSede}
                      onClick={() => setShowAmbienteForm(true)}
                      className="
                      h-[38px] w-[38px]
                      flex items-center justify-center
                      border border-gray-300 rounded-md
                      text-lg font-medium
                      text-gray-600
                      hover:border-blue-500 hover:text-blue-600
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                      transition
                    "
                      title="Agregar ambiente"
                    >
                      +
                    </button>
                  </div>
                  {formik.touched.idInfraestructura && formik.errors.idInfraestructura && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.idInfraestructura}</p>
                  )}
                </div>

                {/* Fechas del proceso */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                    Fechas del proceso
                  </h3>
                </div>

                {/* Clases */}
                <div className="md:col-span-2">
                  <p className="text-xs font-bold mb-1">Etapa electiva</p>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Inicio</label>
                  <input
                    type="date"
                    name="fechaInicialClases"
                    value={formik.values.fechaInicialClases}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaInicialClases && formik.errors.fechaInicialClases && (
                    <p className="text-red-500 text-xs">{formik.errors.fechaInicialClases}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-700">Fin</label>
                  <input
                    type="date"
                    name="fechaFinalClases"
                    value={formik.values.fechaFinalClases}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaFinalClases && formik.errors.fechaFinalClases && (
                    <p className="text-red-500 text-xs">{formik.errors.fechaFinalClases}</p>
                  )}
                </div>

                {/* Inscripciones */}
                <div className="md:col-span-2 mt-3">
                  <p className="text-xs font-bold mb-1">Inscripciones</p>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Inicio</label>
                  <input
                    type="date"
                    name="fechaInicialInscripciones"
                    value={formik.values.fechaInicialInscripciones}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaInicialInscripciones &&
                    formik.errors.fechaInicialInscripciones && (
                      <p className="text-red-500 text-xs">
                        {formik.errors.fechaInicialInscripciones}
                      </p>
                    )}
                </div>
                <div>
                  <label className="text-sm text-gray-700">Fin</label>
                  <input
                    type="date"
                    name="fechaFinalInscripciones"
                    value={formik.values.fechaFinalInscripciones}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaFinalInscripciones &&
                    formik.errors.fechaFinalInscripciones && (
                      <p className="text-red-500 text-xs">
                        {formik.errors.fechaFinalInscripciones}
                      </p>
                    )}
                </div>

                {/* Matrículas */}
                <div className="md:col-span-2 mt-3">
                  <p className="text-xs font-bold mb-1">Matrículas</p>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Inicio</label>
                  <input
                    type="date"
                    name="fechaInicialMatriculas"
                    value={formik.values.fechaInicialMatriculas}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaInicialMatriculas &&
                    formik.errors.fechaInicialMatriculas && (
                      <p className="text-red-500 text-xs">{formik.errors.fechaInicialMatriculas}</p>
                    )}
                </div>
                <div>
                  <label className="text-sm text-gray-700">Fin</label>
                  <input
                    type="date"
                    name="fechaFinalMatriculas"
                    value={formik.values.fechaFinalMatriculas}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaFinalMatriculas && formik.errors.fechaFinalMatriculas && (
                    <p className="text-red-500 text-xs">{formik.errors.fechaFinalMatriculas}</p>
                  )}
                </div>

                {/* Etapa productiva */}
                <div className="md:col-span-2 mt-3">
                  <p className="text-xs font-bold mb-1">Etapa productiva</p>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Inicio</label>
                  <input
                    type="date"
                    name="fechaInicialPlanMejoramiento"
                    value={formik.values.fechaInicialPlanMejoramiento}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaInicialPlanMejoramiento &&
                    formik.errors.fechaInicialPlanMejoramiento && (
                      <p className="text-red-500 text-xs">
                        {formik.errors.fechaInicialPlanMejoramiento}
                      </p>
                    )}
                </div>
                <div>
                  <label className="text-sm text-gray-700">Fin</label>
                  <input
                    type="date"
                    name="fechaFinalPlanMejoramiento"
                    value={formik.values.fechaFinalPlanMejoramiento}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  />
                  {formik.touched.fechaFinalPlanMejoramiento &&
                    formik.errors.fechaFinalPlanMejoramiento && (
                      <p className="text-red-500 text-xs">
                        {formik.errors.fechaFinalPlanMejoramiento}
                      </p>
                    )}
                </div>
              </div>
              {/* Porcentaje de ejecución */}
              <div>
                {/* Porcentaje de ejecución*/}
                <div className="md:col-span-2 mt-3">
                  <p className="text-xs font-bold mb-1">Porcentaje de ejecución</p>
                </div>

                <input
                  type="number"
                  name="porcentajeEjecucion"
                  min={1}
                  max={100}
                  value={formik.values.porcentajeEjecucion ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    formik.setFieldValue(
                      'porcentajeEjecucion',
                      value === '' ? null : Number(value)
                    );
                  }}
                  onBlur={formik.handleBlur}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-coal-100 bg-white dark:bg-coal-400"
                  placeholder="Ej: 75"
                />

                {formik.touched.porcentajeEjecucion && formik.errors.porcentajeEjecucion && (
                  <p className="text-red-500 text-xs">{formik.errors.porcentajeEjecucion}</p>
                )}
              </div>

              <div className="md:col-span-2 mt-4">
                <label className="text-xs font-bold mb-2 text-gray-800">
                  Documento de la ficha (PDF)
                </label>

                <label
                  className="flex items-center justify-between gap-4
                w-full px-4 py-3
                border-2 border-dashed rounded-xl
                cursor-pointer
                transition
                hover:border-blue-500
                focus-within:border-blue-500"
                >
                  <span className="text-sm text-gray-600 truncate">
                    {formik.values.documento?.name || 'Seleccionar archivo PDF'}
                  </span>

                  <span className="text-xs px-3 py-1 rounded-md text-blue-600">Examinar</span>

                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] || null;
                      formik.setFieldValue('documento', file);
                    }}
                  />
                </label>

                {formik.touched.documento && formik.errors.documento && (
                  <p className="text-red-500 text-xs">{formik.errors.documento}</p>
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
                  className={`px-4 py-2 rounded-lg text-sm text-white transition-colors duration-200
                  ${formik.isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
                >
                  {formik.isSubmitting ? 'Actualizando...' : 'Actualizar ficha'}
                </button>
              </div>
            </form>
          </ModalBody>
        )}
      </div>

      {showAmbienteForm && (
        <FormularioInfraestructura
          setIdInfraestructura={setIdInfraestructura}
          idInfraestructura={idInfraestructura}
          isModalOpen={showAmbienteForm}
          setIsModalOpen={setShowAmbienteForm}
          setEvento={setEventoAmbiente}
        />
      )}
      <ModalPeriodo
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={() => {
          setReload((prev) => !prev);
          setOpenModal(false);
        }}
      />
      <Toast
        isOpen={handleSuccess}
        message={messageSuccess}
        onClose={() => setHandleSuccess(false)}
      />
      <ModalError
        isOpen={handleError}
        message={messageError}
        onClose={() => {
          setHandleError(false);
          setMessageError('');
        }}
      />
    </div>
  );
};

export default EditarFicha;
