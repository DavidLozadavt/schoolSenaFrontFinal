import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import * as Yup from 'yup';

interface Corte {
  numero: number;
  fechaInicial: string;
  fechaFinal: string;
  porcentaje: number | '';
}

interface AperturaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
  periodos: any[];
  sedes: any[];
  jornadas: any[];
  grado: any[];
  onSuccess: () => void;
  aperturaToEdit?: any | null;
}

const toDate = (date?: string) => (date ? new Date(date) : null);

const validationSchema = Yup.object().shape({
  idPeriodo: Yup.number()
    .typeError('Debe seleccionar un periodo')
    .required('Debe seleccionar un periodo'),
  idJornada: Yup.number()
    .typeError('Debe seleccionar una jornada')
    .required('Debe seleccionar una jornada'),
  idSede: Yup.number().typeError('Debe seleccionar una sede').required('Debe seleccionar una sede'),
  nombre: Yup.string().max(255, 'Máximo 255 caracteres').required('El nombre es obligatorio'),
  idTipoGrado: Yup.number()
    .nullable()
    .typeError('Debe seleccionar un tipo de grado')
    .required('Debe seleccionar un tipo de grado'),
  estado: Yup.string().required('Debe seleccionar un estado'),
  tipoCalificacion: Yup.string()
    .oneOf(['NUMERICO', 'DESEMPEÑO'], 'El tipo de calificación no es válido')
    .required('Debe seleccionar un tipo de calificación'),

  fechaInicialInscripciones: Yup.string().required(
    'La fecha inicial de inscripciones es obligatoria'
  ),
  fechaFinalInscripciones: Yup.string()
    .required('La fecha final de inscripciones es obligatoria')
    .test(
      'fin-inscripciones-after-inicio',
      'Debe ser mayor o igual a la fecha inicial de inscripciones',
      function (value) {
        const { fechaInicialInscripciones } = this.parent;
        if (!value || !fechaInicialInscripciones) return true;
        return toDate(value)! >= toDate(fechaInicialInscripciones)!;
      }
    ),

  fechaInicialMatriculas: Yup.string()
    .required('La fecha inicial de matrículas es obligatoria')
    .test(
      'matricula-inicio-after-inscripcion-inicio',
      'Debe ser mayor o igual a la fecha inicial de inscripciones',
      function (value) {
        const { fechaInicialInscripciones } = this.parent;
        if (!value || !fechaInicialInscripciones) return true;
        return toDate(value)! >= toDate(fechaInicialInscripciones)!;
      }
    ),
  fechaFinalMatriculas: Yup.string()
    .required('La fecha final de matrículas es obligatoria')
    .test(
      'fin-matriculas-after-inicio',
      'Debe ser mayor o igual a la fecha inicial de matrículas',
      function (value) {
        const { fechaInicialMatriculas } = this.parent;
        if (!value || !fechaInicialMatriculas) return true;
        return toDate(value)! >= toDate(fechaInicialMatriculas)!;
      }
    ),

  fechaInicialClases: Yup.string()
    .required('La fecha inicial de clases es obligatoria')
    .test(
      'clases-inicio-after-matriculas-fin',
      'Debe ser posterior a la fecha final de matrículas',
      function (value) {
        const { fechaFinalMatriculas } = this.parent;
        if (!value || !fechaFinalMatriculas) return true;
        return toDate(value)! > toDate(fechaFinalMatriculas)!;
      }
    ),
  fechaFinalClases: Yup.string()
    .required('La fecha final de clases es obligatoria')
    .test(
      'fin-clases-after-inicio',
      'Debe ser mayor o igual a la fecha inicial de clases',
      function (value) {
        const { fechaInicialClases } = this.parent;
        if (!value || !fechaInicialClases) return true;
        return toDate(value)! >= toDate(fechaInicialClases)!;
      }
    ),

  fechaInicialPlanMejoramiento: Yup.string()
    .required('La fecha inicial del plan de mejoramiento es obligatoria')
    .test(
      'plan-inicio-after-clases-fin',
      'Debe ser posterior o igual al fin de clases',
      function (value) {
        const { fechaFinalClases } = this.parent;
        if (!value || !fechaFinalClases) return true;
        return toDate(value)! >= toDate(fechaFinalClases)!;
      }
    ),
  fechaFinalPlanMejoramiento: Yup.string()
    .required('La fecha final del plan de mejoramiento es obligatoria')
    .test(
      'plan-fin-after-inicio',
      'Debe ser mayor o igual a la fecha inicial del plan',
      function (value) {
        const { fechaInicialPlanMejoramiento } = this.parent;
        if (!value || !fechaInicialPlanMejoramiento) return true;
        return toDate(value)! >= toDate(fechaInicialPlanMejoramiento)!;
      }
    ),

  observacion: Yup.string().max(1000, 'Máximo 1000 caracteres'),
  pension: Yup.boolean().required(),
  valorPension: Yup.number()
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v))
    .typeError('Debe ser un número')
    .when('pension', {
      is: true,
      then: (schema) => schema.required('El valor de pensión es obligatorio'),
      otherwise: (schema) => schema.nullable().optional()
    }),
  diasMoraMatricula: Yup.number()
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v))
    .typeError('Debe ser un número entero')
    .when('pension', {
      is: true,
      then: (schema) => schema.required('Los días de mora son obligatorios'),
      otherwise: (schema) => schema.nullable().optional()
    }),
  porcentajeMoraPension: Yup.number()
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v))
    .typeError('Debe ser un número')
    .when('pension', {
      is: true,
      then: (schema) => schema.required('El porcentaje de mora es obligatorio'),
      otherwise: (schema) => schema.nullable().optional()
    }),
  diaCobro: Yup.number()
    .nullable()
    .transform((v, orig) => (orig === '' ? null : v))
    .typeError('Debe ser un número entero')
    .when('pension', {
      is: true,
      then: (schema) => schema.required('El día de cobro es obligatorio'),
      otherwise: (schema) => schema.nullable().optional()
    })
});

const emptyCorte = (numero: number, fechaClases: string): Corte => ({
  numero,
  fechaInicial: fechaClases,
  fechaFinal: fechaClases,
  porcentaje: ''
});

const AperturaCreateModal: React.FC<AperturaCreateModalProps> = ({
  isOpen,
  onClose,
  programId,
  periodos,
  sedes,
  jornadas,
  grado,
  onSuccess,
  aperturaToEdit = null
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // ── Cortes state ─────────────────────────────────────────────────────────
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [cortesErrors, setCortesErrors] = useState<{ [key: string]: string }>({});

  const steps = [
    { title: 'Datos Básicos', icon: 'ki-information-2' },
    { title: 'Inscripciones', icon: 'ki-document' },
    { title: 'Matrículas', icon: 'ki-check' },
    { title: 'Fechas Clases', icon: 'ki-calendar' },
    { title: 'Plan Mejoramiento', icon: 'ki-target' },
    { title: 'Cortes', icon: 'ki-setting-3' },
    { title: 'Financiera', icon: 'ki-bill' }
  ];

  const getInitialFormState = () => ({
    idPeriodo: '',
    idJornada: '',
    idSede: '',
    idTipoGrado: '',
    nombre: '',
    estado: 'EN CURSO',
    tipoCalificacion: 'NUMERICO',
    fechaInicialClases: new Date().toISOString().split('T')[0],
    fechaFinalClases: new Date().toISOString().split('T')[0],
    fechaInicialInscripciones: new Date().toISOString().split('T')[0],
    fechaFinalInscripciones: new Date().toISOString().split('T')[0],
    fechaInicialMatriculas: new Date().toISOString().split('T')[0],
    fechaFinalMatriculas: new Date().toISOString().split('T')[0],
    fechaInicialPlanMejoramiento: new Date().toISOString().split('T')[0],
    fechaFinalPlanMejoramiento: new Date().toISOString().split('T')[0],
    observacion: '',
    pension: false,
    valorPension: '',
    diasMoraMatricula: '',
    porcentajeMoraPension: '',
    diaCobro: ''
  });

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFormErrors({});
      setCortesErrors({});
      if (aperturaToEdit) {
        setFormData({
          idPeriodo: aperturaToEdit.idPeriodo || aperturaToEdit.periodo?.id || '',
          idJornada: aperturaToEdit.idJornada || aperturaToEdit.jornada?.id || '',
          idSede: aperturaToEdit.idSede || aperturaToEdit.sede?.id || '',
          idTipoGrado: aperturaToEdit.idTipoGrado || aperturaToEdit.grado?.id || '',
          nombre: aperturaToEdit.nombre || '',
          estado: aperturaToEdit.estado || 'EN CURSO',
          tipoCalificacion: aperturaToEdit.tipoCalificacion || 'NUMERICO',
          fechaInicialClases:
            aperturaToEdit.fechaInicialClases?.split('T')[0] ||
            aperturaToEdit.fechaInicialClases ||
            new Date().toISOString().split('T')[0],
          fechaFinalClases:
            aperturaToEdit.fechaFinalClases?.split('T')[0] ||
            aperturaToEdit.fechaFinalClases ||
            new Date().toISOString().split('T')[0],
          fechaInicialInscripciones:
            aperturaToEdit.fechaInicialInscripciones?.split('T')[0] ||
            aperturaToEdit.fechaInicialInscripciones ||
            new Date().toISOString().split('T')[0],
          fechaFinalInscripciones:
            aperturaToEdit.fechaFinalInscripciones?.split('T')[0] ||
            aperturaToEdit.fechaFinalInscripciones ||
            new Date().toISOString().split('T')[0],
          fechaInicialMatriculas:
            aperturaToEdit.fechaInicialMatriculas?.split('T')[0] ||
            aperturaToEdit.fechaInicialMatriculas ||
            new Date().toISOString().split('T')[0],
          fechaFinalMatriculas:
            aperturaToEdit.fechaFinalMatriculas?.split('T')[0] ||
            aperturaToEdit.fechaFinalMatriculas ||
            new Date().toISOString().split('T')[0],
          fechaInicialPlanMejoramiento:
            aperturaToEdit.fechaInicialPlanMejoramiento?.split('T')[0] ||
            aperturaToEdit.fechaInicialPlanMejoramiento ||
            new Date().toISOString().split('T')[0],
          fechaFinalPlanMejoramiento:
            aperturaToEdit.fechaFinalPlanMejoramiento?.split('T')[0] ||
            aperturaToEdit.fechaFinalPlanMejoramiento ||
            new Date().toISOString().split('T')[0],
          observacion: aperturaToEdit.observacion || '',
          pension: aperturaToEdit.pension ? true : false,
          valorPension: aperturaToEdit.valorPension || '',
          diasMoraMatricula: aperturaToEdit.diasMoraMatricula || '',
          porcentajeMoraPension: aperturaToEdit.porcentajeMoraPension || '',
          diaCobro: aperturaToEdit.diaCobro || ''
        });
        // Cargar cortes existentes si vienen del backend
        if (aperturaToEdit.cortes && Array.isArray(aperturaToEdit.cortes)) {
          setCortes(
            aperturaToEdit.cortes.map((c: any, i: number) => ({
              numero: c.numero ?? i + 1,
              fechaInicial: c.fechaInicial?.split('T')[0] || c.fechaInicial || '',
              fechaFinal: c.fechaFinal?.split('T')[0] || c.fechaFinal || '',
              porcentaje: c.porcentaje ?? ''
            }))
          );
        } else {
          setCortes([]);
        }
      } else {
        setFormData(getInitialFormState());
        setCortes([]);
      }
    }
  }, [isOpen, aperturaToEdit]);

  // ── Helpers cortes ────────────────────────────────────────────────────────
  const totalPorcentaje = cortes.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0);
  const remaining = 100 - totalPorcentaje;

  const addCorte = () => {
    const fechaBase = formData.fechaInicialClases || new Date().toISOString().split('T')[0];
    setCortes((prev) => [...prev, emptyCorte(prev.length + 1, fechaBase)]);
  };

  const removeCorte = (index: number) => {
    setCortes((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((c, i) => ({ ...c, numero: i + 1 }))
    );
    // Limpiar errores del corte eliminado
    setCortesErrors((prev) => {
      const next = { ...prev };
      delete next[`corte_${index}_fechaInicial`];
      delete next[`corte_${index}_fechaFinal`];
      delete next[`corte_${index}_porcentaje`];
      return next;
    });
  };

  const updateCorte = (index: number, field: keyof Corte, value: string | number) => {
    setCortes((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    const key = `corte_${index}_${field}`;
    if (cortesErrors[key]) {
      setCortesErrors((prev) => ({ ...prev, [key]: '' }));
    }
    if (field === 'porcentaje') {
      setCortesErrors((prev) => ({ ...prev, porcentajeTotal: '' }));
    }
  };

  const validateCortes = (): boolean => {
    const errors: { [key: string]: string } = {};

    cortes.forEach((c, i) => {
      if (!c.fechaInicial) {
        errors[`corte_${i}_fechaInicial`] = 'La fecha inicial es obligatoria';
      }
      if (!c.fechaFinal) {
        errors[`corte_${i}_fechaFinal`] = 'La fecha final es obligatoria';
      }
      if (c.fechaInicial && c.fechaFinal && toDate(c.fechaFinal)! < toDate(c.fechaInicial)!) {
        errors[`corte_${i}_fechaFinal`] = 'Debe ser mayor o igual a la fecha inicial';
      }
      if (formData.fechaInicialClases && c.fechaInicial && toDate(c.fechaInicial)! < toDate(formData.fechaInicialClases)!) {
        errors[`corte_${i}_fechaInicial`] = 'Debe estar dentro del rango de clases';
      }
      if (formData.fechaFinalClases && c.fechaFinal && toDate(c.fechaFinal)! > toDate(formData.fechaFinalClases)!) {
        errors[`corte_${i}_fechaFinal`] = 'No puede superar la fecha final de clases';
      }
      if (c.porcentaje === '' || c.porcentaje === null || c.porcentaje === undefined) {
        errors[`corte_${i}_porcentaje`] = 'El porcentaje es obligatorio';
      } else if (Number(c.porcentaje) <= 0) {
        errors[`corte_${i}_porcentaje`] = 'Debe ser mayor a 0';
      } else if (Number(c.porcentaje) > 100) {
        errors[`corte_${i}_porcentaje`] = 'No puede superar 100%';
      }
    });

    if (cortes.length > 0 && totalPorcentaje > 100) {
      errors['porcentajeTotal'] = `La suma de porcentajes es ${totalPorcentaje}%. No puede superar el 100%.`;
    }

    setCortesErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;
    let finalValue: any;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
      if (name === 'pension' && !finalValue) {
        setFormData((prev) => ({
          ...prev,
          pension: false,
          valorPension: '',
          diasMoraMatricula: '',
          porcentajeMoraPension: '',
          diaCobro: ''
        }));
        return;
      }
    } else {
      finalValue = e.target.value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getStepForField = (field: string) => {
    switch (field) {
      case 'idPeriodo':
      case 'idSede':
      case 'idJornada':
      case 'estado':
      case 'idTipoGrado':
      case 'nombre':
      case 'tipoCalificacion':
        return 0;
      case 'fechaInicialInscripciones':
      case 'fechaFinalInscripciones':
        return 1;
      case 'fechaInicialMatriculas':
      case 'fechaFinalMatriculas':
        return 2;
      case 'fechaInicialClases':
      case 'fechaFinalClases':
        return 3;
      case 'fechaInicialPlanMejoramiento':
      case 'fechaFinalPlanMejoramiento':
      case 'observacion':
        return 4;
      // step 5 = Cortes (validado aparte)
      case 'pension':
      case 'valorPension':
      case 'diasMoraMatricula':
      case 'porcentajeMoraPension':
      case 'diaCobro':
        return 6;
      default:
        return 0;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep < steps.length - 1) {
      e.preventDefault();
    }
  };

  const validateForm = async () => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (err: any) {
      if (err.inner) {
        const errors: { [key: string]: string } = {};
        let firstStepWithError = -1;
        err.inner.forEach((e: any) => {
          if (!errors[e.path]) {
            errors[e.path] = e.message;
            const step = getStepForField(e.path);
            if (firstStepWithError === -1 || step < firstStepWithError) {
              firstStepWithError = step;
            }
          }
        });
        setFormErrors(errors);
        if (firstStepWithError !== -1 && firstStepWithError !== currentStep) {
          setCurrentStep(firstStepWithError);
        }
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFormValid = await validateForm();
    const areCortesValid = validateCortes();
    if (!isFormValid) return;
    if (!areCortesValid) {
      setCurrentStep(5);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        idPrograma: programId,
        ...formData,
        idPeriodo: parseInt(formData.idPeriodo as string) || null,
        idJornada: parseInt(formData.idJornada as string) || null,
        idSede: parseInt(formData.idSede as string) || null,
        idTipoGrado: parseInt(formData.idTipoGrado as string) || null,
        valorPension: formData.valorPension ? parseFloat(formData.valorPension as string) : null,
        diasMoraMatricula: formData.diasMoraMatricula
          ? parseInt(formData.diasMoraMatricula as string)
          : null,
        porcentajeMoraPension: formData.porcentajeMoraPension
          ? parseFloat(formData.porcentajeMoraPension as string)
          : null,
        diaCobro: formData.diaCobro ? parseInt(formData.diaCobro as string) : null,
        cortes: cortes.map((c) => ({
          numero: c.numero,
          fechaInicial: c.fechaInicial,
          fechaFinal: c.fechaFinal,
          porcentaje: Number(c.porcentaje)
        }))
      };

      if (aperturaToEdit) {
        await axios.patch(`/aperturaPrograma/${aperturaToEdit.id}`, payload);
      } else {
        await axios.post('/aperturaPrograma', payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar apertura:', error);
      const msg =
        error.response?.data?.message || 'No se pudo aperturar el programa. Intenta nuevamente.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = !!aperturaToEdit;

  // Colores del badge de porcentaje acumulado
  const pctColor =
    totalPorcentaje === 100
      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
      : totalPorcentaje > 100
        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full max-w-2xl mx-4 sm:mx-auto overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${isEdit ? 'bg-blue-100 dark:bg-blue-500/10' : 'bg-green-100 dark:bg-green-500/10'} flex items-center justify-center`}
            >
              <i
                className={`ki-outline ${isEdit ? 'ki-notepad-edit text-blue-600 dark:text-blue-400' : 'ki-plus text-green-600 dark:text-green-400'} text-xl`}
              />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                {isEdit ? 'Editar Apertura' : 'Nueva Apertura'}
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEdit
                  ? 'Modifique los datos de la apertura seleccionada'
                  : 'Registre una nueva apertura para el programa'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors"
          >
            <i className="ki-outline ki-cross text-lg" />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* ── Steps nav ── */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`px-2 py-2 rounded-xl border text-center transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20'
                        : isCompleted
                          ? 'border-green-300 bg-green-50 dark:bg-green-500/10'
                          : 'border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <i
                        className={`ki-outline ${step.icon} text-lg ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-300'}`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                      {step.title}
                    </p>
                  </button>
                );
              })}
            </div>

            <fieldset className="space-y-6">
              {/* ── Step 0: Datos básicos ── */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Nombre</label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.nombre ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}
                        placeholder="Nombre de la apertura" />
                      {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Período</label>
                      <select name="idPeriodo" value={formData.idPeriodo} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idPeriodo ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona período</option>
                        {(periodos || []).map((p) => <option key={p.id} value={p.id}>{p.nombrePeriodo}</option>)}
                      </select>
                      {formErrors.idPeriodo && <p className="text-xs text-red-500 mt-1">{formErrors.idPeriodo}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Tipo grado</label>
                      <select name="idTipoGrado" value={formData.idTipoGrado} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idTipoGrado ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona grado</option>
                        {(grado || []).map((g) => <option key={g.id} value={g.id}>{g.nombreTipoGrado}</option>)}
                      </select>
                      {formErrors.idTipoGrado && <p className="text-xs text-red-500 mt-1">{formErrors.idTipoGrado}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Sede</label>
                      <select name="idSede" value={formData.idSede} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idSede ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona sede</option>
                        {(sedes || []).map((s) => <option key={s.id} value={s.id}>{s.nombre}, {s.centro_formacion.nombre}</option>)}
                      </select>
                      {formErrors.idSede && <p className="text-xs text-red-500 mt-1">{formErrors.idSede}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Jornada</label>
                      <select name="idJornada" value={formData.idJornada} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idJornada ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona jornada</option>
                        {(jornadas || []).map((j: any) => <option key={j.id} value={j.id}>{j.nombreJornada}</option>)}
                      </select>
                      {formErrors.idJornada && <p className="text-xs text-red-500 mt-1">{formErrors.idJornada}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Estado</label>
                      <select name="estado" value={formData.estado} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.estado ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="EN CURSO">EN CURSO</option>
                        <option value="ABIERTO">ABIERTO</option>
                        <option value="CERRADO">CERRADO</option>
                      </select>
                      {formErrors.estado && <p className="text-xs text-red-500 mt-1">{formErrors.estado}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Tipo calificación</label>
                      <select name="tipoCalificacion" value={formData.tipoCalificacion} onChange={handleInputChange}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.tipoCalificacion ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="NUMERICO">NUMÉRICO</option>
                        <option value="DESEMPEÑO">DESEMPEÑO</option>
                      </select>
                      {formErrors.tipoCalificacion && <p className="text-xs text-red-500 mt-1">{formErrors.tipoCalificacion}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Inscripciones ── */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio inscripciones</label>
                      <input type="date" name="fechaInicialInscripciones" value={formData.fechaInicialInscripciones} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialInscripciones ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialInscripciones && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialInscripciones}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin inscripciones</label>
                      <input type="date" name="fechaFinalInscripciones" value={formData.fechaFinalInscripciones} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalInscripciones ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalInscripciones && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalInscripciones}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Matrículas ── */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio matrículas</label>
                      <input type="date" name="fechaInicialMatriculas" value={formData.fechaInicialMatriculas} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialMatriculas ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialMatriculas && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialMatriculas}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin matrículas</label>
                      <input type="date" name="fechaFinalMatriculas" value={formData.fechaFinalMatriculas} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalMatriculas ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalMatriculas && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalMatriculas}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Fechas Clases ── */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio clases</label>
                      <input type="date" name="fechaInicialClases" value={formData.fechaInicialClases} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialClases ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialClases && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialClases}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin clases</label>
                      <input type="date" name="fechaFinalClases" value={formData.fechaFinalClases} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalClases ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalClases && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalClases}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Plan Mejoramiento ── */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio plan mejoramiento</label>
                      <input type="date" name="fechaInicialPlanMejoramiento" value={formData.fechaInicialPlanMejoramiento} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialPlanMejoramiento ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialPlanMejoramiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialPlanMejoramiento}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin plan mejoramiento</label>
                      <input type="date" name="fechaFinalPlanMejoramiento" value={formData.fechaFinalPlanMejoramiento} onChange={handleInputChange} onKeyDown={handleKeyDown}
                        className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalPlanMejoramiento ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalPlanMejoramiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalPlanMejoramiento}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Observación</label>
                    <textarea name="observacion" value={formData.observacion} onChange={handleInputChange} rows={3}
                      className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.observacion ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                    {formErrors.observacion && <p className="text-xs text-red-500 mt-1">{formErrors.observacion}</p>}
                  </div>
                </div>
              )}

              {/* ── Step 5: Cortes ── */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  {/* Header con resumen de porcentaje */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        Cortes académicos
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctColor}`}>
                        {totalPorcentaje}% / 100%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addCorte}
                      disabled={totalPorcentaje >= 100}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <i className="ki-outline ki-plus text-sm" />
                      Agregar corte
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 dark:bg-coal-300 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        totalPorcentaje > 100
                          ? 'bg-red-500'
                          : totalPorcentaje === 100
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(totalPorcentaje, 100)}%` }}
                    />
                  </div>

                  {/* Error global de porcentaje */}
                  {cortesErrors.porcentajeTotal && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                      <i className="ki-outline ki-information-2 text-red-500 text-sm" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {cortesErrors.porcentajeTotal}
                      </p>
                    </div>
                  )}

                  {/* Lista de cortes */}
                  {cortes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-coal-300 rounded-xl">
                      <i className="ki-outline ki-scissors text-3xl mb-2" />
                      <p className="text-sm font-medium">No hay cortes registrados</p>
                      <p className="text-xs mt-1">Haz clic en "Agregar corte" para comenzar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cortes.map((corte, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl space-y-3"
                        >
                          {/* Cabecera del corte */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                                {corte.numero}
                              </span>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                Corte {corte.numero}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCorte(index)}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <i className="ki-outline ki-trash text-sm" />
                            </button>
                          </div>

                          {/* Campos del corte */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                Fecha inicial
                              </label>
                              <input
                                type="date"
                                value={corte.fechaInicial}
                                min={formData.fechaInicialClases}
                                max={formData.fechaFinalClases}
                                onChange={(e) => updateCorte(index, 'fechaInicial', e.target.value)}
                                className={`w-full px-3 py-2 bg-white dark:bg-coal-500 border ${
                                  cortesErrors[`corte_${index}_fechaInicial`]
                                    ? 'border-red-500'
                                    : 'border-gray-200 dark:border-coal-300'
                                } rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}
                              />
                              {cortesErrors[`corte_${index}_fechaInicial`] && (
                                <p className="text-xs text-red-500">
                                  {cortesErrors[`corte_${index}_fechaInicial`]}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                Fecha final
                              </label>
                              <input
                                type="date"
                                value={corte.fechaFinal}
                                min={corte.fechaInicial || formData.fechaInicialClases}
                                max={formData.fechaFinalClases}
                                onChange={(e) => updateCorte(index, 'fechaFinal', e.target.value)}
                                className={`w-full px-3 py-2 bg-white dark:bg-coal-500 border ${
                                  cortesErrors[`corte_${index}_fechaFinal`]
                                    ? 'border-red-500'
                                    : 'border-gray-200 dark:border-coal-300'
                                } rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}
                              />
                              {cortesErrors[`corte_${index}_fechaFinal`] && (
                                <p className="text-xs text-red-500">
                                  {cortesErrors[`corte_${index}_fechaFinal`]}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                Porcentaje (%)
                                {remaining > 0 && (
                                  <span className="ml-1 text-gray-400 font-normal">
                                    — quedan {remaining}%
                                  </span>
                                )}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={corte.porcentaje}
                                  onChange={(e) =>
                                    updateCorte(
                                      index,
                                      'porcentaje',
                                      e.target.value === '' ? '' : Number(e.target.value)
                                    )
                                  }
                                  className={`w-full px-3 py-2 pr-8 bg-white dark:bg-coal-500 border ${
                                    cortesErrors[`corte_${index}_porcentaje`]
                                      ? 'border-red-500'
                                      : 'border-gray-200 dark:border-coal-300'
                                  } rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}
                                  placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                  %
                                </span>
                              </div>
                              {cortesErrors[`corte_${index}_porcentaje`] && (
                                <p className="text-xs text-red-500">
                                  {cortesErrors[`corte_${index}_porcentaje`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tip informativo */}
                  {cortes.length > 0 && totalPorcentaje < 100 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                      Faltan <span className="font-bold text-blue-500">{remaining}%</span> para completar el 100%.
                      Puedes guardar con menos del 100% si lo deseas.
                    </p>
                  )}
                  {totalPorcentaje === 100 && (
                    <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
                      ✓ Los cortes suman exactamente 100%
                    </p>
                  )}
                </div>
              )}

              {/* ── Step 6: Financiera ── */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="space-y-1.5 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="pension"
                        checked={formData.pension}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        ¿Aplica pensión?
                      </span>
                    </label>
                    {formErrors.pension && <p className="text-xs text-red-500 mt-1">{formErrors.pension}</p>}
                  </div>

                  {formData.pension === true && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Días Mora Matrícula</label>
                        <input type="number" name="diasMoraMatricula" value={formData.diasMoraMatricula ?? 0} onChange={handleInputChange} onKeyDown={handleKeyDown}
                          className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.diasMoraMatricula ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.diasMoraMatricula && <p className="text-xs text-red-500 mt-1">{formErrors.diasMoraMatricula}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Valor Pensión</label>
                        <input type="number" name="valorPension" value={formData.valorPension ?? 0} onChange={handleInputChange} onKeyDown={handleKeyDown}
                          className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.valorPension ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.valorPension && <p className="text-xs text-red-500 mt-1">{formErrors.valorPension}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Porcentaje Mora Pensión</label>
                        <input type="number" step="0.01" name="porcentajeMoraPension" value={formData.porcentajeMoraPension ?? 0} onChange={handleInputChange} onKeyDown={handleKeyDown}
                          className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.porcentajeMoraPension ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.porcentajeMoraPension && <p className="text-xs text-red-500 mt-1">{formErrors.porcentajeMoraPension}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Día Cobro Pensión</label>
                        <input type="number" name="diaCobro" value={formData.diaCobro ?? 0} onChange={handleInputChange} onKeyDown={handleKeyDown}
                          className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.diaCobro ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.diaCobro && <p className="text-xs text-red-500 mt-1">{formErrors.diaCobro}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            {/* ── Footer botones ── */}
            <div className="flex gap-3 justify-between pt-6 mt-4 border-t border-gray-100 dark:border-coal-300">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors text-sm font-bold"
              >
                Cancelar
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-coal-400 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-coal-300 disabled:opacity-50 transition-colors text-sm font-bold"
                >
                  Anterior
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    key="btn-next"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentStep(currentStep + 1);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors text-sm font-bold"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    key="btn-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all text-sm font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="ki-outline ki-check" />
                    )}
                    {isSubmitting ? 'Procesando...' : isEdit ? 'Actualizar' : 'Aperturar'}
                  </button>
                )}
              </div>
            </div>
          </ModalBody>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AperturaCreateModal;