import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { ESTADOS_APERTURA } from './estados';
import * as Yup from 'yup';
import { useFormik } from 'formik';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToast:(showToast:boolean) => void;
  setMessageToast:(messageToast:string) => void;
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

interface FormValues {
  observacion: string;
  idPeriodo: number;
  idPrograma: number;
  idRegional: number;
  estado: string;
  idSede: number;
  idJornada: number;
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
}

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

  estado: Yup.string()
    .required('Debe seleccionar un estado')
    .oneOf(
      [
        'ACTIVO',
        'INACTIVO',
        'OCULTO',
        'PENDIENTE',
        'RECHAZADO',
        'APROBADO',
        'CANCELADO',
        'REPROBADO',
        'CERRADO',
        'ACEPTADO',
        'LEIDO',
        'EN ESPERA',
        'INSCRIPCION',
        'MATRICULADO',
        'ABIERTO',
        'EN CURSO',
        'POR ACTUALIZAR',
        'CURSANDO',
        'ENTREVISTA',
        'SIN ENTREVISTA',
        'JUSTIFICADO'
      ],
      'Estado inválido'
    ),

  idSede: Yup.number().typeError('Debe seleccionar una sede').required('Debe seleccionar una sede'),

  fechaInicialClases: Yup.string().required('La fecha inicial de clases es obligatoria'),

  fechaFinalClases: Yup.string()
    .required('La fecha final de clases es obligatoria')
    .test(
      'after-or-equal',
      'La fecha final debe ser mayor o igual a la fecha inicial',
      function (value) {
        const { fechaInicialClases } = this.parent;
        return !value || !fechaInicialClases || value >= fechaInicialClases;
      }
    ),

  idJornada: Yup.number()
    .typeError('Debe seleccionar una jornada')
    .required('Debe seleccionar una jornada'),

  codigo: Yup.string().required('El código es obligatorio').max(100, 'Máximo 100 caracteres'),

  fechaInicialPlanMejoramiento: Yup.string().required(
    'La fecha inicial del plan de mejoramiento es obligatoria'
  ),

  fechaFinalPlanMejoramiento: Yup.string()
    .required('La fecha final del plan de mejoramiento es obligatoria')
    .test('after-or-equal', 'Debe ser mayor o igual a la fecha inicial', function (value) {
      const { fechaInicialPlanMejoramiento } = this.parent;
      return !value || !fechaInicialPlanMejoramiento || value >= fechaInicialPlanMejoramiento;
    }),

  fechaInicialInscripciones: Yup.string().required(
    'La fecha inicial de inscripciones es obligatoria'
  ),

  fechaFinalInscripciones: Yup.string()
    .required('La fecha final de inscripciones es obligatoria')
    .test('after-or-equal', 'Debe ser mayor o igual a la fecha inicial', function (value) {
      const { fechaInicialInscripciones } = this.parent;
      return !value || !fechaInicialInscripciones || value >= fechaInicialInscripciones;
    }),

  fechaInicialMatriculas: Yup.string().required('La fecha inicial de matrículas es obligatoria'),

  fechaFinalMatriculas: Yup.string()
    .required('La fecha final de matrículas es obligatoria')
    .test('after-or-equal', 'Debe ser mayor o igual a la fecha inicial', function (value) {
      const { fechaInicialMatriculas } = this.parent;
      return !value || !fechaInicialMatriculas || value >= fechaInicialMatriculas;
    }),
  porcentajeEjecucion: Yup.number()
  .typeError('Debe ser un número')
  .min(1, 'No puede ser menor que 1')
  .max(100, 'No puede ser mayor que 100')
  .nullable(),

});

const FormularioFichasSena: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento, setShowToast, setMessageToast }) => {
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      observacion: '',
      idPeriodo: 0,
      idPrograma: 0,
      idRegional: 0,
      estado: '',
      idSede: 0,
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
      porcentajeEjecucion:100
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '' && value !== 0)
        );

        await axios.post('fichas', payload);
        setMessageToast('Ficha creada')
        setShowToast(true);
        setEvento((prev) => !prev);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al actualizar la ficha');
      } finally {
        setSubmitting(false);
        setIsModalOpen(false);
      }
    }
  });
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);
  const [programas, setProgramas] = useState<Programas[]>([]);
  const [regionales, setRegionales] = useState<Regionales[]>([]);
  useEffect(() => {
    const loadData = async () => {
      const [jornadaRes, periodosRes, sedesRes, programasRes, regionalesRes] = await Promise.all([
        axios.get('jornadas/agrupadas'),
        axios.get('periodos'),
        axios.get('sedesSena'),
        axios.get('programas'),
        axios.get('regional')
      ]);
      setJornadas(jornadaRes.data.data);
      setPeriodos(periodosRes.data);
      setSedes(sedesRes.data);
      setProgramas(programasRes.data.data);
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
  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(false);
            formik.resetForm();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
        {/* Header fijo */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Crear Ficha</h2>

        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Seleccione estado"
                isClearable
                value={ESTADOS_APERTURA.find((o) => o.value === formik.values.estado)}
                onChange={(option) => formik.setFieldValue('estado', option?.value || '')}
                onBlur={() => formik.setFieldTouched('estado', true)}
              />
              {formik.touched.estado && formik.errors.estado && (
                <p className="text-red-500 text-xs">{formik.errors.estado}</p>
              )}
            </div>

            {/* Sede */}
            <div>
              <label className="text-sm font-medium text-gray-700">Sede</label>

              <Select
                options={optionsSedes}
                placeholder="Seleccione la sede"
                isClearable
                value={optionsSedes.find((o) => o.value === formik.values.idSede)}
                onChange={(option) => formik.setFieldValue('idSede', option?.value || 0)}
                onBlur={() => formik.setFieldTouched('idSede', true)}
              />
              {formik.touched.idSede && formik.errors.idSede && (
                <p className="text-red-500 text-xs">{formik.errors.idSede}</p>
              )}
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
                className="w-full rounded-lg border px-3 py-2 text-sm"
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
                className="w-full rounded-lg border px-3 py-2 text-sm resize-y"
                placeholder="Escriba la observación (máx. 1000 caracteres)"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {formik.touched.observacion && formik.errors.observacion && (
                    <span className="text-red-500">{formik.errors.observacion}</span>
                  )}
                </span>
                <span>{formik.values.observacion.length}/1000</span>
              </div>
            </div>
            {/* Fecha inicial clases */}
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha inicio de clases</label>
              <input
                type="date"
                name="fechaInicialClases"
                value={formik.values.fechaInicialClases}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaInicialClases && formik.errors.fechaInicialClases && (
                <p className="text-red-500 text-xs">{formik.errors.fechaInicialClases}</p>
              )}
            </div>
            {/* Fecha final clases */}
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha final de clases</label>
              <input
                type="date"
                name="fechaFinalClases"
                value={formik.values.fechaFinalClases}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaFinalClases && formik.errors.fechaFinalClases && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalClases}</p>
              )}
            </div>
            {/* Fecha inicial inscripciones */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Fecha inicio de inscripciones
              </label>
              <input
                type="date"
                name="fechaInicialInscripciones"
                value={formik.values.fechaInicialInscripciones}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaInicialInscripciones &&
                formik.errors.fechaInicialInscripciones && (
                  <p className="text-red-500 text-xs">{formik.errors.fechaInicialInscripciones}</p>
                )}
            </div>

            {/* Fecha final inscripciones */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Fecha final de inscripciones
              </label>
              <input
                type="date"
                name="fechaFinalInscripciones"
                value={formik.values.fechaFinalInscripciones}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaFinalInscripciones && formik.errors.fechaFinalInscripciones && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalInscripciones}</p>
              )}
            </div>
            {/* Fecha inicial matrículas */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Fecha inicio de matrículas
              </label>
              <input
                type="date"
                name="fechaInicialMatriculas"
                value={formik.values.fechaInicialMatriculas}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaInicialMatriculas && formik.errors.fechaInicialMatriculas && (
                <p className="text-red-500 text-xs">{formik.errors.fechaInicialMatriculas}</p>
              )}
            </div>

            {/* Fecha final matrículas */}
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha final de matrículas</label>
              <input
                type="date"
                name="fechaFinalMatriculas"
                value={formik.values.fechaFinalMatriculas}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaFinalMatriculas && formik.errors.fechaFinalMatriculas && (
                <p className="text-red-500 text-xs">{formik.errors.fechaFinalMatriculas}</p>
              )}
            </div>
            {/* Fecha inicial plan de mejoramiento */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Fecha inicio plan de mejoramiento
              </label>
              <input
                type="date"
                name="fechaInicialPlanMejoramiento"
                value={formik.values.fechaInicialPlanMejoramiento}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
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
              <label className="text-sm font-medium text-gray-700">
                Fecha final plan de mejoramiento
              </label>
              <input
                type="date"
                name="fechaFinalPlanMejoramiento"
                value={formik.values.fechaFinalPlanMejoramiento}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {formik.touched.fechaFinalPlanMejoramiento &&
                formik.errors.fechaFinalPlanMejoramiento && (
                  <p className="text-red-500 text-xs">{formik.errors.fechaFinalPlanMejoramiento}</p>
                )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
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
              {formik.isSubmitting ? 'Guardando...' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioFichasSena;
