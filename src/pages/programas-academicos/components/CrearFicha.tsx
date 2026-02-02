import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import FormularioInfraestructura from '@/pages/gestion-infraestructura/FormularioInfraestructura';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  programaId: string | undefined;
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
  idRegional: number;
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
  porcentajeEjecucion: number;
  documento: File | null;
}

const toDate = (date?: string) => (date ? new Date(date) : null);

const validationSchema = Yup.object({
  observacion: Yup.string().nullable().max(1000, 'Máximo 1000 caracteres'),

  idPeriodo: Yup.number()
    .typeError('Debe seleccionar un periodo')
    .required('Debe seleccionar un periodo'),

  idRegional: Yup.number()
    .typeError('Debe seleccionar una regional')
    .required('Debe seleccionar una regional'),

  idSede: Yup.number().typeError('Debe seleccionar una sede').required('Debe seleccionar una sede'),

  idInfraestructura: Yup.number().nullable(),

  idJornada: Yup.number()
    .typeError('Debe seleccionar una jornada')
    .required('Debe seleccionar una jornada'),

  codigo: Yup.string().required('El código es obligatorio').max(100, 'Máximo 100 caracteres'),

  fechaInicialInscripciones: Yup.string().required(
    'La fecha inicial de inscripciones es obligatoria'
  ),

  fechaFinalInscripciones: Yup.string()
    .required('La fecha final de inscripciones es obligatoria')
    .test(
      'fin-inscripciones-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial de inscripciones',
      function (value) {
        const { fechaInicialInscripciones } = this.parent;
        if (!value || !fechaInicialInscripciones) return true;
        return toDate(value)! >= toDate(fechaInicialInscripciones)!;
      }
    )
    .test(
      'fin-inscripciones-before-matriculas',
      'La fecha final de inscripciones debe ser menor a la fecha inicial de matrículas',
      function (value) {
        const { fechaInicialMatriculas } = this.parent;
        if (!value || !fechaInicialMatriculas) return true;
        return toDate(value)! < toDate(fechaInicialMatriculas)!;
      }
    ),

  fechaInicialMatriculas: Yup.string().required('La fecha inicial de matrículas es obligatoria'),

  fechaFinalMatriculas: Yup.string()
    .required('La fecha final de matrículas es obligatoria')
    .test(
      'fin-matriculas-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial de matrículas',
      function (value) {
        const { fechaInicialMatriculas } = this.parent;
        if (!value || !fechaInicialMatriculas) return true;
        return toDate(value)! >= toDate(fechaInicialMatriculas)!;
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

  fechaInicialClases: Yup.string().required('La fecha inicial de etapa electiva es obligatoria'),

  fechaFinalClases: Yup.string()
    .required('La fecha final de etapa electiva es obligatoria')
    .test(
      'fin-clases-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial de etapa electiva',
      function (value) {
        const { fechaInicialClases } = this.parent;
        if (!value || !fechaInicialClases) return true;
        return toDate(value)! >= toDate(fechaInicialClases)!;
      }
    ),

  fechaInicialPlanMejoramiento: Yup.string()
    .required('La fecha inicial de la etapa productiva es obligatoria')
    .test(
      'plan-after-clases',
      'La fecha inicial de la etapa productiva debe ser posterior al fin de etapa electiva',
      function (value) {
        const { fechaFinalClases } = this.parent;
        if (!value || !fechaFinalClases) return true;
        return toDate(value)! > toDate(fechaFinalClases)!;
      }
    ),

  fechaFinalPlanMejoramiento: Yup.string()
    .required('La fecha final de la etapa productiva es obligatoria')
    .test(
      'plan-fin-after-inicio',
      'La fecha final debe ser mayor o igual a la fecha inicial de la etapa productiva',
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

const CrearFicha: React.FC<Props> = ({ isModalOpen, setIsModalOpen, programaId }) => {
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      observacion: '',
      idPeriodo: 0,
      idRegional: 0,
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
      porcentajeEjecucion: 100,
      documento: null
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
          if (value !== null && value !== '' && value !== 0) {
            formData.append(key, value as any);
          }
        });

        formData.append('idPrograma', String(programaId));

        await axios.post('fichas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al crear la ficha');
      } finally {
        setSubmitting(false);
        setIsModalOpen(false);
      }
    }
  });
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);
  const [regionales, setRegionales] = useState<Regionales[]>([]);
  useEffect(() => {
    const loadData = async () => {
      const [jornadaRes, periodosRes, regionalesRes] = await Promise.all([
        axios.get('jornadas/agrupadas'),
        axios.get('periodos'),
        axios.get('regional')
      ]);
      setJornadas(jornadaRes.data.data);
      setPeriodos(periodosRes.data);
      setRegionales(regionalesRes.data);
    };
    loadData();
  }, []);

  const optionsJornadas = jornadas.map((val) => ({
    value: val.grupoJornada,
    label: val.nombreJornada
  }));
  const optionsPeriodos = periodos.map((val) => ({
    value: val.id,
    label: `${val.nombrePeriodo} fecha inicio: ${val.fechaInicial} fecha fin: ${val.fechaFinal}`
  }));

  useEffect(() => {
    const loadSedes = async () => {
      if (!formik.values.idRegional) {
        setSedes([]);
        formik.setFieldValue('idSede', 0);
        return;
      }

      try {
        const res = await axios.get(`sedes/regional/${formik.values.idRegional}`);

        setSedes(res.data.data);
        formik.setFieldValue('idSede', 0); // reset sede
      } catch (error) {
        console.error('Error cargando sedes', error);
        setSedes([]);
      }
    };

    loadSedes();
  }, [formik.values.idRegional]);

  const optionsSedes = sedes.map((val) => ({
    value: val.id,
    label: val.nombre
  }));
  const optionsRegionales = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));
  const [evento, setEvento] = useState<boolean>(false);
  const [ambientes, setAmbientes] = useState<Ambientes[]>([]);
  useEffect(() => {
    const loadAmbientes = async () => {
      if (!formik.values.idSede) {
        setAmbientes([]);
        formik.setFieldValue('idInfraestructura', 0);
        return;
      }

      try {
        const res = await axios.get(`sedes/${formik.values.idSede}/infraestructuras`);

        setAmbientes(res.data.data);
        formik.setFieldValue('idInfraestructura', 0); // reset ambiente
      } catch (error) {
        console.error('Error cargando los ambientes', error);
        setSedes([]);
      }
    };

    loadAmbientes();
  }, [formik.values.idSede, formik.values.idRegional, evento]);

  const optionsAmbientes = ambientes.map((val) => ({
    value: val.id,
    label: val.nombreInfraestructura
  }));

  const [codigo, setCodigo] = useState<string>(''); // valor del input
  const [codigoExist, setCodigoExist] = useState<boolean>(false);

  const [showAmbienteForm, setShowAmbienteForm] = useState<boolean>(false);

  useEffect(() => {
    if (!codigo) return;

    const verify = async () => {
      try {
        const res = await axios.get(`ficha/validar-codigo/${codigo}`);
        setCodigoExist(res.data.existe);
      } catch (error) {
        console.error('Error verificando código:', error);
        setCodigoExist(false);
      }
    };

    verify();
  }, [codigo]);

  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity duration-300">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Botón cerrar */}
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={() => {
            setIsModalOpen(false);
            formik.resetForm();
          }}
          className="absolute top-3 right-3 p-2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full transition-colors"
        >
          ✕
        </button>

        {/* Header fijo */}
        <h2 className="sticky top-0 z-10 bg-white px-6 py-4 border-b shadow-sm">Crear Ficha</h2>

        <form
          onSubmit={formik.handleSubmit}
          className="p-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
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
                onChange={(e) => {
                  formik.handleChange(e);
                  setCodigo(e.target.value);
                }}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {codigoExist && (
                <div className="text-red-500 text-xs">Este código ya esta en uso</div>
              )}
              {formik.touched.codigo && formik.errors.codigo && (
                <p className="text-red-500 text-xs">{formik.errors.codigo}</p>
              )}
            </div>
            {/** Observación */}
            <div>
              <label className="text-sm font-medium text-gray-700">Observación</label>
              <textarea
                name="observacion"
                value={formik.values.observacion}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-y"
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
              />
              {formik.touched.idJornada && formik.errors.idJornada && (
                <p className="text-red-500 text-xs">{formik.errors.idJornada}</p>
              )}
            </div>

            {/* Periodo */}
            <div>
              <label className="text-sm font-medium text-gray-700">Periodo</label>

              <Select
                options={optionsPeriodos}
                placeholder="Seleccione el periodo"
                isClearable
                value={optionsPeriodos.find((o) => o.value === formik.values.idPeriodo)}
                onChange={(option) => formik.setFieldValue('idPeriodo', option?.value || 0)}
                onBlur={() => formik.setFieldTouched('idPeriodo', true)}
              />
              {formik.touched.idPeriodo && formik.errors.idPeriodo && (
                <p className="text-red-500 text-xs">{formik.errors.idPeriodo}</p>
              )}
            </div>
            {/* Ubicación */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">Ubicación</h3>
            </div>
            {/* Regional */}
            <div>
              <label className="text-sm font-medium text-gray-700">Regional</label>

              <Select
                options={optionsRegionales}
                placeholder="Seleccione la regional"
                isClearable
                value={optionsRegionales.find((o) => o.value === formik.values.idRegional)}
                onChange={(option) => formik.setFieldValue('idRegional', option?.value || 0)}
                onBlur={() => formik.setFieldTouched('idRegional', true)}
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
                onChange={(option) => formik.setFieldValue('idSede', option?.value || 0)}
                onBlur={() => formik.setFieldTouched('idSede', true)}
              />
              {formik.touched.idSede && formik.errors.idSede && (
                <p className="text-red-500 text-xs">{formik.errors.idSede}</p>
              )}
            </div>

            {/* Ambiente */}
            <div>
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
                    bg-white
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

            {/* Fecha inicial clases */}
            {/* Fechas del proceso */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                Fechas del proceso
              </h3>
            </div>

            {/* Inscripciones */}
            <div className="md:col-span-2 mt-3">
              <p className="text-xs font-bold mb-1">Inscripciones</p>
            </div>
            {/* Fecha inicial inscripciones */}
            <div>
              <label className="text-sm text-gray-700">Inicio</label>
              <input
                type="date"
                name="fechaInicialInscripciones"
                value={formik.values.fechaInicialInscripciones}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaInicialInscripciones &&
                formik.errors.fechaInicialInscripciones && (
                  <p className="text-red-500 text-xs">{formik.errors.fechaInicialInscripciones}</p>
                )}
            </div>

            {/* Fecha final inscripciones */}
            <div>
              <label className="text-sm text-gray-700">Fin</label>
              <input
                type="date"
                name="fechaFinalInscripciones"
                value={formik.values.fechaFinalInscripciones}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaFinalInscripciones && formik.errors.fechaFinalInscripciones && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalInscripciones}</p>
              )}
            </div>
            {/* Matrículas */}
            <div className="md:col-span-2 mt-3">
              <p className="text-xs font-bold mb-1">Matrículas</p>
            </div>
            {/* Fecha inicial matrículas */}
            <div>
              <label className="text-sm text-gray-700">Inicio</label>
              <input
                type="date"
                name="fechaInicialMatriculas"
                value={formik.values.fechaInicialMatriculas}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaInicialMatriculas && formik.errors.fechaInicialMatriculas && (
                <p className="text-red-500 text-xs">{formik.errors.fechaInicialMatriculas}</p>
              )}
            </div>

            {/* Fecha final matrículas */}
            <div>
              <label className="text-sm text-gray-700">Fin</label>
              <input
                type="date"
                name="fechaFinalMatriculas"
                value={formik.values.fechaFinalMatriculas}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaFinalMatriculas && formik.errors.fechaFinalMatriculas && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalMatriculas}</p>
              )}
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
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaInicialClases && formik.errors.fechaInicialClases && (
                <p className="text-red-500 text-xs">{formik.errors.fechaInicialClases}</p>
              )}
            </div>
            {/* Fecha final clases */}
            <div>
              <label className="text-sm text-gray-700">Fin</label>
              <input
                type="date"
                name="fechaFinalClases"
                value={formik.values.fechaFinalClases}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaFinalClases && formik.errors.fechaFinalClases && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalClases}</p>
              )}
            </div>
            {/* Etapa productiva */}
            <div className="md:col-span-2 mt-3">
              <p className="text-xs font-bold mb-1">Etapa productiva</p>
            </div>
            {/* Fecha inicial etapa productiva */}
            <div>
              <label className="text-sm text-gray-700">Inicio</label>
              <input
                type="date"
                name="fechaInicialPlanMejoramiento"
                value={formik.values.fechaInicialPlanMejoramiento}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaInicialPlanMejoramiento &&
                formik.errors.fechaInicialPlanMejoramiento && (
                  <p className="text-red-500 text-xs">
                    {formik.errors.fechaInicialPlanMejoramiento}
                  </p>
                )}
            </div>

            {/* Fecha final plan de mejoramiento */}
            <div>
              <label className="text-sm text-gray-700">Fin</label>
              <input
                type="date"
                name="fechaFinalPlanMejoramiento"
                value={formik.values.fechaFinalPlanMejoramiento}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {formik.touched.fechaFinalPlanMejoramiento &&
                formik.errors.fechaFinalPlanMejoramiento && (
                  <p className="text-red-500 text-xs">{formik.errors.fechaFinalPlanMejoramiento}</p>
                )}
            </div>
            {/* Porcentaje de ejecución */}
            <div>
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
                  formik.setFieldValue('porcentajeEjecucion', value === '' ? null : Number(value));
                }}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ej: 75"
              />

              {formik.touched.porcentajeEjecucion && formik.errors.porcentajeEjecucion && (
                <p className="text-red-500 text-xs">{formik.errors.porcentajeEjecucion}</p>
              )}
            </div>
          </div>
          {/** Documento PDF */}
          <div className="md:col-span-2 mt-4">
            <p className="text-xs font-bold mb-2 text-gray-800">
              Documento de la ficha <span className="text-gray-500">(PDF)</span>
            </p>

            <label
              htmlFor="documento"
              className="
      flex items-center justify-between gap-4
      w-full px-4 py-3
      border-2 border-dashed rounded-xl
      cursor-pointer
      transition
      hover:border-blue-500 hover:bg-blue-50
      focus-within:border-blue-500
    "
            >
              <div className="flex items-center gap-3">
                📄
                <span className="text-sm text-gray-700">
                  {formik.values.documento
                    ? formik.values.documento.name
                    : 'Seleccionar archivo PDF'}
                </span>
              </div>

              <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white">Examinar</span>

              <input
                id="documento"
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] || null;
                  formik.setFieldValue('documento', file);
                }}
                className="hidden"
              />
            </label>

            {/* Hint */}
            <p className="text-xs text-gray-500 mt-1">Solo archivos PDF · Máx 5MB</p>

            {/* Error */}
            {formik.touched.documento && formik.errors.documento && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.documento}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              {formik.isSubmitting ? 'Guardando...' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      </div>
      {showAmbienteForm && (
        <FormularioInfraestructura
          isModalOpen={showAmbienteForm}
          setIsModalOpen={setShowAmbienteForm}
          setEvento={setEvento}
        />
      )}
    </div>
  );
};

export default CrearFicha;
