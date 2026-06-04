import axios from 'axios';
import React, { useEffect, useState, useContext, useMemo } from 'react';
import ModalPeriodo from '@/pages/periodos/ModalPeriodo';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import FormularioInfraestructura from '@/pages/gestion-infraestructura/FormularioInfraestructura';
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
  fichaId?: number | null; // solo para EDITAR — si viene, entra en modo edición
  onAction: () => void;
  // callbacks opcionales que usaba EditarFicha (se mantienen por compatibilidad)
  setEvento?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToast?: (v: boolean) => void;
  setMessageToast?: (v: string) => void;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Jornada {
  id: number;
  nombreJornada: string;
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
  idAsignacion: number;
  idPrograma: number;
  idRegional: number;
  idTipoGrado: number | null;
  estado: string;
  idSede: number;
  idJornada: number;
  idInfraestructura: number;
  codigo: string;
  tipoCalificacion: string;
  porcentajeEjecucion: number | null;
  documento: File | null;
}

const ESTADOS_APERTURA = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
  { value: 'EN CURSO', label: 'EN CURSO' },
  { value: 'CERRADO', label: 'CERRADO' },
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'APROBADO', label: 'APROBADO' },
  { value: 'CANCELADO', label: 'CANCELADO' }
];

// ─── Validación ───────────────────────────────────────────────────────────────
const buildValidationSchema = (isEditing: boolean, hasCentro: boolean) =>
  Yup.object({
    observacion: Yup.string().nullable().max(1000, 'Máximo 1000 caracteres'),
    idTipoGrado: Yup.number(),

    idAsignacion: Yup.number()
      .min(1, 'Debe seleccionar una apertura')
      .typeError('Debe seleccionar una apertura')
      .required('Debe seleccionar una apertura'),

    idSede: Yup.number()
      .min(1, 'Debe seleccionar una sede')
      .typeError('Debe seleccionar una sede')
      .required('Debe seleccionar una sede'),

    idInfraestructura: Yup.number().nullable(),

    codigo: Yup.string().required('El código es obligatorio').max(100, 'Máximo 100 caracteres'),

    porcentajeEjecucion: Yup.number()
      .typeError('El porcentaje de ejecución debe ser un número')
      .min(1, 'El porcentaje debe ser mínimo 1')
      .max(100, 'El porcentaje debe ser máximo 100')
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
const CrearEditarFicha: React.FC<Props> = ({
  idCentro,
  isModalOpen,
  setIsModalOpen,
  programaId,
  fichaId,
  onAction,
  setShowToast,
  setMessageToast
}) => {
  const isEditing = Boolean(fichaId);

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
  const [openModal, setOpenModal] = useState(false);
  const [showAmbienteForm, setShowAmbienteForm] = useState(false);
  const [eventoAmbiente, setEventoAmbiente] = useState(false);
  const [idInfraestructura, setIdInfraestructura] = useState('');
  const [codigoExist, setCodigoExist] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [aperturaSelected, setAperturaSelected] = useState<any>(null);
  const { programId } = useParams<{ programId: string }>();

  // Catálogos
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);
  const [programas, setProgramas] = useState<Programas[]>([]);
  const [regionales, setRegionales] = useState<Regionales[]>([]);
  const [ambientes, setAmbientes] = useState<Ambientes[]>([]);
  const [tiposGrado, setTiposGrado] = useState<{ value: number; label: string }[]>([]);

  // ── Formik ─────────────────────────────────────────────────────────────────
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      idAsignacion: Number(programId) || 0,
      idPrograma: 0,
      idSede: 0,
      idTipoGrado: 0,
      idRegional: 0,
      estado: '',
      idInfraestructura: 0,
      idJornada: 0,
      codigo: '',
      tipoCalificacion: 'NUMERICO',
      porcentajeEjecucion: isEditing ? null : 100,
      documento: null
    },
    validationSchema: buildValidationSchema(isEditing, !!user?.idCentroFormacion),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (value !== null && value !== '' && value !== 0) {
            formData.append(key, value as any);
          }
        });

        if (isEditing) {
          formData.append('_method', 'PUT');
          await axios.post(`fichas/${fichaId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          enqueueSnackbar('Grado actualizado correctamente', { variant: 'success' });
        } else {
          formData.append('idPrograma', String(programaId));
          const fichaRes = await axios.post('fichas', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const nuevaFichaId = fichaRes.data?.data?.ficha?.id;

          if (esInstructorSenaRef.current && idContratoUsuarioRef.current && nuevaFichaId) {
            try {
              await axios.post(`fichas/${nuevaFichaId}/asignar-instructor-lider`, {
                idInstructorLider: idContratoUsuarioRef.current
              });
            } catch (e: any) {
              console.warn('No se pudo asignar automáticamente el instructor líder');
            }
          }
        }
        setTimeout(() => {
          resetForm();
          setIsModalOpen(false);
          enqueueSnackbar( isEditing ?  'Grado actualizado correctamente' : 'Grado creado correctamente', { variant: 'success' });
          onAction();
        }, 700);
      } catch (error: any) {
        enqueueSnackbar( isEditing ? 'Error al actualizar el grado' : 'Error al crear el grado', { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    }
  });

  // ── Cargar catálogos generales (solo CREAR) ───────────────────────────────
  useEffect(() => {
    if (isEditing) return; // en edición todo se carga dentro de loadFichaData
    const loadData = async () => {
      try {
        const [jornadaRes, periodosRes, tiposGradoRes, aperturaRes] = await Promise.all([
          axios.get('jornadas/agrupadas', { params: { idCentroFormacion: idCentro } }),
          axios.get('regional'),
          axios.get('tipos-grado'),
          axios.get(`aperturaPrograma/${Number(programId)}`)
        ]);
        setJornadas(jornadaRes.data.data);
        setPeriodos(periodosRes.data);
        setTiposGrado(tiposGradoRes.data);
        setAperturaSelected(aperturaRes.data);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    loadData();
  }, [reload]);

  useEffect(() => {
    const currentProgramaId = isEditing ? formik.values.idPrograma : programaId;
    if (!isModalOpen || !currentProgramaId || !formik.values.idSede) return;
    if (isEditing && isLoading) return;

    const loadPeriodosDisponibles = async () => {
      try {
        const res = await axios.get('aperturarprograma/disponibles', { 
          params: { idPrograma: currentProgramaId, idSede: formik.values.idSede } 
        });
        setPeriodos(res.data);
      } catch (error) {
        enqueueSnackbar('Error al cargar periodos de apertura disponibles', { variant: 'error' });
      }
    };

    loadPeriodosDisponibles();
  }, [isModalOpen, isEditing, programaId, formik.values.idPrograma, formik.values.idSede, reload, isLoading]);

  // ── Cargar datos de la ficha + todos los catálogos (solo EDITAR) ──────────
  useEffect(() => {
    if (!isEditing || !isModalOpen) return;

    const loadFichaData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`fichas/${fichaId}`);
        const { ficha, apertura } = response.data.data;

        const idRegional = Number(ficha.idRegional) || 0;
        const idSede = Number(ficha.idSede || apertura.idSede) || 0;
        // Usar el idCentroFormacion que viene en la respuesta del API
        const idCentroFromApi = Number(
          ficha.sede?.idCentroFormacion || ficha.jornada?.idCentroFormacion || idCentro
        );

        // Cargar TODO en paralelo: catálogos + sedes + ambientes
        const [jornadaRes, aperturasRes, regionalesRes, aperturaRes, sedesRes, ambientesRes] =
          await Promise.all([
            axios.get('jornadas/agrupadas', { params: { idCentroFormacion: idCentroFromApi } }),
            axios.get('aperturarprograma/disponibles', { params: { idPrograma: Number(apertura.idPrograma) || 0, idSede } }),
            axios.get('regional'),
            axios.get(`aperturaPrograma/${Number(apertura.id || Number(programId))}`),
            idRegional ? axios.get(`sedes/regional/${idRegional}`) : Promise.resolve(null),
            idSede ? axios.get(`sedes/${idSede}/infraestructuras`) : Promise.resolve(null)
          ]);

        setJornadas(jornadaRes.data.data);
        setAperturaSelected(aperturaRes.data);

        // Asegurarnos de que la apertura actual esté en la lista aunque ya no esté "disponible"
        // ficha.asignacion trae las relaciones correctas (como periodo)
        const currentApertura = ficha.asignacion || apertura;
        
        let listaAperturas = aperturasRes.data || [];
        if (currentApertura && !listaAperturas.some((a: any) => a.id === currentApertura.id)) {
          listaAperturas = [...listaAperturas, currentApertura];
        }
        setPeriodos(listaAperturas);
        setRegionales(regionalesRes.data);
        if (sedesRes) setSedes(sedesRes.data.data);
        if (ambientesRes) setAmbientes(ambientesRes.data.data);

        formik.setValues({
          idAsignacion: Number(ficha.idAsignacion) || Number(currentApertura.id) || 0,
          idPrograma: Number(apertura.idPrograma) || 0,
          idRegional: Number(idRegional) || 0,
          estado: apertura.estado || '',
          idTipoGrado: Number(ficha.idTipoGrado) || 0,
          idSede: Number(idSede) || 0,
          idJornada: Number(ficha.idJornada) || 0,
          codigo: ficha.codigo || '',
          idInfraestructura: Number(ficha.idInfraestructura) || 0,
          tipoCalificacion: apertura.tipoCalificacion || 'NUMERICO',
          porcentajeEjecucion: ficha.porcentajeEjecucion != null ? Number(ficha.porcentajeEjecucion) : null,
          documento: null
        });
      } catch (error: any) {
        const msg = error.response?.data?.message || 'Error al cargar la ficha';
        setShowToast?.(true);
        setMessageToast?.(msg);
        setIsModalOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadFichaData();
  }, [fichaId, isModalOpen]);

  // ── Auto-cargar sedes desde el centro de formación del usuario ───────────
  // Si el usuario tiene centro asignado, se cargan solo sus sedes y se
  // detecta automáticamente la regional (idEmpresa del centro).
  useEffect(() => {
    if (!isModalOpen || isEditing || !user?.idCentroFormacion) return;

    axios
      .get(`sedes/centro-formacion/${user.idCentroFormacion}`)
      .then((res) => {
        setSedes(res.data.data ?? []);
        formik.setFieldValue('idRegional', Number(res.data.centroFormacion?.idEmpresa) || 0);
      })
      .catch(() => setSedes([]));
  }, [isModalOpen, user]);

  // ── Cargar sedes al cambiar regional (solo usuarios sin centro asignado) ──
  useEffect(() => {
    // Usuarios con centro: las sedes las carga el efecto anterior.
    if (user?.idCentroFormacion) return;
    // En edición, la carga inicial la hace loadFichaData.
    if (isLoading) return;
    if (!formik.values.idRegional) {
      setSedes([]);
      return;
    }
    axios
      .get(`sedes/regional/${formik.values.idRegional}`)
      .then((res) => setSedes(res.data.data))
      .catch(() => setSedes([]));
  }, [formik.values.idRegional]);

  // ── Cargar ambientes al cambiar sede (solo cuando el usuario cambia manual) ──
  useEffect(() => {
    if (isLoading) return; // evita pisar la carga inicial
    if (!formik.values.idSede) {
      setAmbientes([]);
      return;
    }
    axios
      .get(`sedes/${formik.values.idSede}/infraestructuras`)
      .then((res) => setAmbientes(res.data.data))
      .catch(() => setAmbientes([]));
  }, [formik.values.idSede, eventoAmbiente]);

  const fechaFormateada = (fecha: any) => {
    const fechaDate = new Date(fecha);
    const dia = String(fechaDate.getDate()).padStart(2, '0');
    const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const anio = fechaDate.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  // ── Opciones para react-select ────────────────────────────────────────────
  const optionsJornadas = jornadas.map((v) => ({ value: v.id, label: v.nombreJornada }));
  const optionsPeriodos = periodos.map((v) => ({
    value: v.id,
    label: `${v.periodo?.nombrePeriodo} fecha inicio: ${fechaFormateada(v.fechaInicialClases)} fecha fin: ${fechaFormateada(v.fechaFinalClases)}`
  }));
  const optionsSedes = sedes.map((v) => ({ value: v.id, label: v.nombre }));
  const optionsRegionales = regionales.map((v) => ({ value: v.id, label: v.razonSocial }));
  const optionsAmbientes = ambientes.map((v) => ({ value: v.id, label: v.nombreInfraestructura }));
  const optionsProgramas = programas.map((v) => ({ value: v.id, label: v.nombrePrograma }));

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
          {isEditing ? 'Editar Grado' : 'Crear Grado'}
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
                  <label className="text-sm font-medium text-gray-700">Grado</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formik.values.codigo}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (!isEditing) setCodigo(e.target.value);
                    }}
                    onBlur={formik.handleBlur}
                    className="w-full input text-sm"
                  />
                  {!isEditing && codigoExist && (
                    <p className="text-red-500 text-xs">Este código ya está en uso</p>
                  )}
                  {formik.touched.codigo && formik.errors.codigo && (
                    <p className="text-red-500 text-xs">{formik.errors.codigo}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Grado</label>
                  <Select
                    options={tiposGrado}
                    placeholder="Seleccione el tipo de grado"
                    isClearable
                    value={tiposGrado.find((o) => o.value === formik.values.idTipoGrado)}
                    onChange={(option) => {
                      formik.setFieldValue('idTipoGrado', option?.value || 0);
                    }}
                    onBlur={() => formik.setFieldTouched('idTipoGrado', true)}
                    classNames={selectClassNames}
                  />
                  {formik.touched.idTipoGrado && formik.errors.idTipoGrado && (
                    <p className="text-red-500 text-xs">{formik.errors.idTipoGrado}</p>
                  )}
                </div>

                {/* ── Ubicación ────────────────────────────────────── */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                    Ubicación
                  </h3>
                </div>

                {/* Regional — oculta si el usuario tiene centro de formación asignado */}
                {!user?.idCentroFormacion && (
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
                      classNames={selectClassNames}
                    />
                    {formik.touched.idRegional && formik.errors.idRegional && (
                      <p className="text-red-500 text-xs">{formik.errors.idRegional}</p>
                    )}
                  </div>
                )}

                {/* Sede */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Sede</label>
                  <Select
                    options={optionsSedes}
                    placeholder={
                      sedes.length === 0
                        ? user?.idCentroFormacion
                          ? 'Cargando sedes...'
                          : 'Seleccione primero una regional'
                        : 'Seleccione la sede'
                    }
                    isDisabled={sedes.length === 0}
                    isClearable
                    value={optionsSedes.find((o) => o.value === formik.values.idSede)}
                    onChange={(option) => {
                      formik.setFieldValue('idSede', option?.value || 0);
                      formik.setFieldValue('idInfraestructura', 0);
                    }}
                    onBlur={() => formik.setFieldTouched('idSede', true)}
                    classNames={selectClassNames}
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
                        classNames={selectClassNames}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!formik.values.idSede}
                      onClick={() => setShowAmbienteForm(true)}
                      className="h-[38px] w-[38px] flex items-center justify-center border border-gray-300 rounded-md text-lg font-medium text-gray-600 bg-white hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                      title="Agregar ambiente"
                    >
                      +
                    </button>
                  </div>
                  {formik.touched.idInfraestructura && formik.errors.idInfraestructura && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.idInfraestructura}</p>
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

              {/* Documento PDF */}
              <div className="md:col-span-2 mt-4">
                <p className="text-xs font-bold mb-2 text-gray-800">
                  Documento de la ficha <span className="text-gray-500">(PDF)</span>
                </p>
                <label
                  htmlFor="documento"
                  className="flex items-center justify-between gap-4 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition hover:border-blue-500 focus-within:border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    📄
                    <span className="text-sm text-gray-700">
                      {formik.values.documento
                        ? formik.values.documento.name
                        : 'Seleccionar archivo PDF'}
                    </span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white">
                    Examinar
                  </span>
                  <input
                    id="documento"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      formik.setFieldValue('documento', e.currentTarget.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">Solo archivos PDF · Máx 5MB</p>
                {formik.touched.documento && formik.errors.documento && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.documento}</p>
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
                  {formik.isSubmitting
                    ? isEditing
                      ? 'Actualizando...'
                      : 'Guardando...'
                    : isEditing
                      ? 'Actualizar Grado'
                      : 'Guardar Grado'}
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
      {openModal && (
        <ModalPeriodo
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSave={() => {
            setOpenModal(false);
            setReload(r => !r);
          }}
        />
      )}
    </div>
  );
};

export default CrearEditarFicha;
