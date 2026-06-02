import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import * as Yup from 'yup';

interface AperturaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
  periodos: any[];
  sedes: any[];
  onSuccess: () => void;
  aperturaToEdit?: any | null;
}

const toDate = (date?: string) => (date ? new Date(date) : null);

const validationSchema = Yup.object().shape({
  idPeriodo: Yup.number().typeError('Debe seleccionar un periodo').required('Debe seleccionar un periodo'),
  idSede: Yup.number().typeError('Debe seleccionar una sede').required('Debe seleccionar una sede'),
  estado: Yup.string().required('Debe seleccionar un estado'),
  tipoCalificacion: Yup.string().oneOf(['NUMERICO', 'DESEMPEÑO'], 'El tipo de calificación no es válido').required('Debe seleccionar un tipo de calificación'),

  fechaInicialClases: Yup.string().required('La fecha inicial de clases es obligatoria'),
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

  fechaInicialInscripciones: Yup.string().required('La fecha inicial de inscripciones es obligatoria'),
  fechaFinalInscripciones: Yup.string()
    .required('La fecha final de inscripciones es obligatoria')
    .test('after-or-equal', 'Debe ser mayor o igual a la fecha inicial', function (value) {
      const { fechaInicialInscripciones } = this.parent;
      return !value || !fechaInicialInscripciones || value >= fechaInicialInscripciones;
    }),

  fechaInicialMatriculas: Yup.string()
    .required('La fecha inicial de matrículas es obligatoria')
    .test(
      'matricula-after-inscripcion',
      'Debe ser mayor o igual a la fecha inicial de inscripciones',
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
      'Debe ser menor a la fecha inicial de clases',
      function (value) {
        const { fechaInicialClases } = this.parent;
        if (!value || !fechaInicialClases) return true;
        return toDate(value)! < toDate(fechaInicialClases)!;
      }
    ),

  fechaInicialPlanMejoramiento: Yup.string()
    .required('La fecha inicial del plan de mejoramiento es obligatoria')
    .test('plan-after-clases', 'Debe ser posterior al fin de clases', function (value) {
      const { fechaFinalClases } = this.parent;
      if (!value || !fechaFinalClases) return true;
      return toDate(value)! >= toDate(fechaFinalClases)!;
    }),
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
  observacion: Yup.string().required('La observación es obligatoria').max(1000, 'Máximo 1000 caracteres'),
  pension: Yup.boolean().required('Debe indicar si tiene pensión'),
  valorPension: Yup.number().nullable().typeError('Debe ser un número'),
  diasMoraMatricula: Yup.number().nullable().typeError('Debe ser un número entero'),
  porcentajeMoraPension: Yup.number().nullable().typeError('Debe ser un número'),
  diaCobroPension: Yup.number().nullable().typeError('Debe ser un número entero')
});

const AperturaCreateModal: React.FC<AperturaCreateModalProps> = ({
  isOpen,
  onClose,
  programId,
  periodos,
  sedes,
  onSuccess,
  aperturaToEdit = null
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const steps = [
    { title: 'Datos Básicos', icon: 'ki-information-2' },
    { title: 'Fechas Clases', icon: 'ki-calendar' },
    { title: 'Inscripciones', icon: 'ki-document' },
    { title: 'Matrículas', icon: 'ki-check' },
    { title: 'Plan Mejoramiento', icon: 'ki-target' },
    { title: 'Financiera', icon: 'ki-bill' }
  ];

  const getInitialFormState = () => ({
    idPeriodo: '',
    idSede: '',
    estado: 'ABIERTO',
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
    diaCobroPension: ''
  });

  const [formData, setFormData] = useState(getInitialFormState());

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFormErrors({});
      if (aperturaToEdit) {
        setFormData({
          idPeriodo: aperturaToEdit.idPeriodo || aperturaToEdit.periodo?.id || '',
          idSede: aperturaToEdit.idSede || aperturaToEdit.sede?.id || '',
          estado: aperturaToEdit.estado || 'ABIERTO',
          tipoCalificacion: aperturaToEdit.tipoCalificacion || 'NUMERICO',
          fechaInicialClases: aperturaToEdit.fechaInicialClases?.split('T')[0] || aperturaToEdit.fechaInicialClases || new Date().toISOString().split('T')[0],
          fechaFinalClases: aperturaToEdit.fechaFinalClases?.split('T')[0] || aperturaToEdit.fechaFinalClases || new Date().toISOString().split('T')[0],
          fechaInicialInscripciones: aperturaToEdit.fechaInicialInscripciones?.split('T')[0] || aperturaToEdit.fechaInicialInscripciones || new Date().toISOString().split('T')[0],
          fechaFinalInscripciones: aperturaToEdit.fechaFinalInscripciones?.split('T')[0] || aperturaToEdit.fechaFinalInscripciones || new Date().toISOString().split('T')[0],
          fechaInicialMatriculas: aperturaToEdit.fechaInicialMatriculas?.split('T')[0] || aperturaToEdit.fechaInicialMatriculas || new Date().toISOString().split('T')[0],
          fechaFinalMatriculas: aperturaToEdit.fechaFinalMatriculas?.split('T')[0] || aperturaToEdit.fechaFinalMatriculas || new Date().toISOString().split('T')[0],
          fechaInicialPlanMejoramiento: aperturaToEdit.fechaInicialPlanMejoramiento?.split('T')[0] || aperturaToEdit.fechaInicialPlanMejoramiento || new Date().toISOString().split('T')[0],
          fechaFinalPlanMejoramiento: aperturaToEdit.fechaFinalPlanMejoramiento?.split('T')[0] || aperturaToEdit.fechaFinalPlanMejoramiento || new Date().toISOString().split('T')[0],
          observacion: aperturaToEdit.observacion || '',
          pension: aperturaToEdit.pension ? true : false,
          valorPension: aperturaToEdit.valorPension || '',
          diasMoraMatricula: aperturaToEdit.diasMoraMatricula || '',
          porcentajeMoraPension: aperturaToEdit.porcentajeMoraPension || '',
          diaCobroPension: aperturaToEdit.diaCobroPension || ''
        });
      } else {
        setFormData(getInitialFormState());
      }
    }
  }, [isOpen, aperturaToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    let finalValue: any;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
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
      case 'estado':
      case 'tipoCalificacion':
        return 0;
      case 'fechaInicialClases':
      case 'fechaFinalClases':
        return 1;
      case 'fechaInicialInscripciones':
      case 'fechaFinalInscripciones':
        return 2;
      case 'fechaInicialMatriculas':
      case 'fechaFinalMatriculas':
        return 3;
      case 'fechaInicialPlanMejoramiento':
      case 'fechaFinalPlanMejoramiento':
      case 'observacion':
        return 4;
      case 'pension':
      case 'valorPension':
      case 'diasMoraMatricula':
      case 'porcentajeMoraPension':
      case 'diaCobroPension':
        return 5;
      default:
        return 0;
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

    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idPrograma: programId,
        ...formData,
        idPeriodo: parseInt(formData.idPeriodo as string) || null,
        idSede: parseInt(formData.idSede as string) || null,
        valorPension: formData.valorPension ? parseFloat(formData.valorPension as string) : null,
        diasMoraMatricula: formData.diasMoraMatricula ? parseInt(formData.diasMoraMatricula as string) : null,
        porcentajeMoraPension: formData.porcentajeMoraPension ? parseFloat(formData.porcentajeMoraPension as string) : null,
        diaCobroPension: formData.diaCobroPension ? parseInt(formData.diaCobroPension as string) : null,
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
      const msg = error.response?.data?.message || 'No se pudo aperturar el programa. Intenta nuevamente.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = !!aperturaToEdit;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full max-w-2xl mx-4 sm:mx-auto overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isEdit ? 'bg-blue-100 dark:bg-blue-500/10' : 'bg-green-100 dark:bg-green-500/10'} flex items-center justify-center`}>
              <i className={`ki-outline ${isEdit ? 'ki-notepad-edit text-blue-600 dark:text-blue-400' : 'ki-plus text-green-600 dark:text-green-400'} text-xl`} />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                {isEdit ? 'Editar Apertura' : 'Nueva Apertura'}
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEdit ? 'Modifique los datos de la apertura seleccionada' : 'Registre una nueva apertura para el programa'}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
                      <i className={`ki-outline ${step.icon} text-lg ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-300'}`} />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                      {step.title}
                    </p>
                  </button>
                );
              })}
            </div>

            <fieldset className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Período</label>
                      <select name="idPeriodo" value={formData.idPeriodo} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idPeriodo ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona período</option>
                        {(periodos || []).map(p => (
                          <option key={p.id} value={p.id}>{p.nombrePeriodo}</option>
                        ))}
                      </select>
                      {formErrors.idPeriodo && <p className="text-xs text-red-500 mt-1">{formErrors.idPeriodo}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Sede</label>
                      <select name="idSede" value={formData.idSede} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.idSede ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="">Selecciona sede</option>
                        {(sedes || []).map(s => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                      {formErrors.idSede && <p className="text-xs text-red-500 mt-1">{formErrors.idSede}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Estado</label>
                      <select name="estado" value={formData.estado} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.estado ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="ABIERTO">ABIERTO</option>
                        <option value="CERRADO">CERRADO</option>
                      </select>
                      {formErrors.estado && <p className="text-xs text-red-500 mt-1">{formErrors.estado}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Tipo calificación</label>
                      <select name="tipoCalificacion" value={formData.tipoCalificacion} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.tipoCalificacion ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`}>
                        <option value="NUMERICO">NUMÉRICO</option>
                        <option value="DESEMPEÑO">DESEMPEÑO</option>
                      </select>
                      {formErrors.tipoCalificacion && <p className="text-xs text-red-500 mt-1">{formErrors.tipoCalificacion}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio clases</label>
                      <input type="date" name="fechaInicialClases" value={formData.fechaInicialClases} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialClases ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialClases && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialClases}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin clases</label>
                      <input type="date" name="fechaFinalClases" value={formData.fechaFinalClases} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalClases ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalClases && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalClases}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio inscripciones</label>
                      <input type="date" name="fechaInicialInscripciones" value={formData.fechaInicialInscripciones} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialInscripciones ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialInscripciones && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialInscripciones}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin inscripciones</label>
                      <input type="date" name="fechaFinalInscripciones" value={formData.fechaFinalInscripciones} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalInscripciones ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalInscripciones && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalInscripciones}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio matrículas</label>
                      <input type="date" name="fechaInicialMatriculas" value={formData.fechaInicialMatriculas} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialMatriculas ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialMatriculas && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialMatriculas}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin matrículas</label>
                      <input type="date" name="fechaFinalMatriculas" value={formData.fechaFinalMatriculas} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalMatriculas ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalMatriculas && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalMatriculas}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha inicio plan mejoramiento</label>
                      <input type="date" name="fechaInicialPlanMejoramiento" value={formData.fechaInicialPlanMejoramiento} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaInicialPlanMejoramiento ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaInicialPlanMejoramiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaInicialPlanMejoramiento}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Fecha fin plan mejoramiento</label>
                      <input type="date" name="fechaFinalPlanMejoramiento" value={formData.fechaFinalPlanMejoramiento} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.fechaFinalPlanMejoramiento ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.fechaFinalPlanMejoramiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaFinalPlanMejoramiento}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Observación</label>
                    <textarea name="observacion" value={formData.observacion} onChange={handleInputChange} rows={3} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.observacion ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                    {formErrors.observacion && <p className="text-xs text-red-500 mt-1">{formErrors.observacion}</p>}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-1.5 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="pension" checked={formData.pension} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">¿Aplica pensión?</span>
                    </label>
                    {formErrors.pension && <p className="text-xs text-red-500 mt-1">{formErrors.pension}</p>}
                  </div>
                  
                  {formData.pension === true && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Valor Pensión</label>
                        <input type="number" name="valorPension" value={formData.valorPension} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.valorPension ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.valorPension && <p className="text-xs text-red-500 mt-1">{formErrors.valorPension}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Porcentaje Mora Pensión</label>
                        <input type="number" step="0.01" name="porcentajeMoraPension" value={formData.porcentajeMoraPension} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.porcentajeMoraPension ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.porcentajeMoraPension && <p className="text-xs text-red-500 mt-1">{formErrors.porcentajeMoraPension}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Día Cobro Pensión</label>
                        <input type="number" name="diaCobroPension" value={formData.diaCobroPension} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.diaCobroPension ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                        {formErrors.diaCobroPension && <p className="text-xs text-red-500 mt-1">{formErrors.diaCobroPension}</p>}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Días Mora Matrícula</label>
                      <input type="number" name="diasMoraMatricula" value={formData.diasMoraMatricula} onChange={handleInputChange} className={`w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border ${formErrors.diasMoraMatricula ? 'border-red-500' : 'border-gray-200 dark:border-coal-300'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none`} />
                      {formErrors.diasMoraMatricula && <p className="text-xs text-red-500 mt-1">{formErrors.diasMoraMatricula}</p>}
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

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
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-colors text-sm font-bold"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all text-sm font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="ki-outline ki-check" />
                    )}
                    {isSubmitting ? 'Procesando...' : (isEdit ? 'Actualizar' : 'Aperturar')}
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
