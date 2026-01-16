import React, { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import axios from 'axios';
import { useLayout } from '@/providers';

import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';

const RegistroAutorizacionMenoresPage = () => {
  const { currentLayout } = useLayout();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Definir los pasos del formulario
  const steps = [
    { id: 1, title: 'Datos del Menor', subtitle: 'Información del niño, niña o adolescente' },
    { id: 2, title: 'Datos del Autorizante', subtitle: 'Quien otorga el permiso' },
    { id: 3, title: 'Persona Autorizada', subtitle: 'Acompañante del menor (si aplica)' },
    { id: 4, title: 'Datos del Viaje', subtitle: 'Información del transporte' },
    { id: 5, title: 'Persona que Recibe', subtitle: 'Quien recibe al menor en destino' }
  ];

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Datos del menor,
    idViaje: '',
    nombreMenor: '',
    tipoDocumentoMenor: '',
    otroDocumentoMenor: '',
    numeroIdentificacionMenor: '',
    discapacidad: '',
    tipoDiscapacidad: '',
    comunidadEtnica: '',
    tipoPoblacionEtnica: '',

    // Paso 2: Datos del autorizante
    nombreAutorizante: '',
    tipoDocumentoAutorizante: '',
    numeroIdentificacionAutorizante: '',
    parentesco: '',
    telefonoAutorizante: '',
    emailAutorizante: '',
    direccionAutorizante: '',
    sexoAutorizante: '',
    generoAutorizante: '',

    // Paso 3: Persona autorizada para viajar
    nombreAcompanante: '',
    tipoDocumentoAcompanante: '',
    numeroIdentificacionAcompanante: '',

    // Paso 4: Datos del viaje
    fechaViaje: '',
    origen: '',
    destino: '',
    placaVehiculo: '',
    numeroInterno: '',
    numeroTiquete: '',

    // Paso 5: Persona que recibe
    nombreReceptor: '',
    tipoDocumentoReceptor: '',
    numeroIdentificacionReceptor: '',
    telefonoReceptor: '',
    emailReceptor: '',
    direccionReceptor: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(phone);
    };

    switch (step) {
      case 1:
        if (!formData.nombreMenor) newErrors.nombreMenor = 'El nombre del menor es requerido';
        if (!formData.numeroIdentificacionMenor)
          newErrors.numeroIdentificacionMenor = 'El número de identificación es requerido';
        if (formData.discapacidad === 'SI' && !formData.tipoDiscapacidad)
          newErrors.tipoDiscapacidad = 'El tipo de discapacidad es requerido';
        if (formData.comunidadEtnica === 'SI' && !formData.tipoPoblacionEtnica)
          newErrors.tipoPoblacionEtnica = 'El tipo de población étnica es requerido';
        break;

      case 2:
        if (!formData.nombreAutorizante)
          newErrors.nombreAutorizante = 'El nombre del autorizante es requerido';
        if (!formData.numeroIdentificacionAutorizante)
          newErrors.numeroIdentificacionAutorizante = 'El número de identificación es requerido';

        if (!formData.telefonoAutorizante) {
          newErrors.telefonoAutorizante = 'El teléfono es requerido';
        } else if (!validatePhone(formData.telefonoAutorizante)) {
          newErrors.telefonoAutorizante = 'El teléfono debe tener 10 dígitos numéricos';
        }

        if (!formData.emailAutorizante) {
          newErrors.emailAutorizante = 'El correo electrónico es requerido';
        } else if (!validateEmail(formData.emailAutorizante)) {
          newErrors.emailAutorizante =
            'El correo electrónico debe tener un formato válido (ejemplo@dominio.com)';
        }
        break;

      case 4:
        if (!formData.fechaViaje) newErrors.fechaViaje = 'La fecha del viaje es requerida';
        if (!formData.origen) newErrors.origen = 'El origen es requerido';
        if (!formData.destino) newErrors.destino = 'El destino es requerido';
        break;

      case 5:
        if (!formData.nombreReceptor)
          newErrors.nombreReceptor = 'El nombre del receptor es requerido';

        // Validación de teléfono del receptor
        if (!formData.telefonoReceptor) {
          newErrors.telefonoReceptor = 'El teléfono del receptor es requerido';
        } else if (!validatePhone(formData.telefonoReceptor)) {
          newErrors.telefonoReceptor = 'El teléfono debe tener 10 dígitos numéricos';
        }

        // Validación de email del receptor (si se proporciona)
        if (formData.emailReceptor && !validateEmail(formData.emailReceptor)) {
          newErrors.emailReceptor =
            'El correo electrónico debe tener un formato válido (ejemplo@dominio.com)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev: number) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const handleSave = async () => {
    if (validateStep(currentStep)) {
      try {
        setLoading(true);

        const datosEnvio = {
          nombreMenor: formData.nombreMenor,
          tipoDocumentoMenor: formData.tipoDocumentoMenor,
          otroDocumentoMenor: formData.otroDocumentoMenor,
          numeroIdentificacionMenor: formData.numeroIdentificacionMenor,
          discapacidad: formData.discapacidad,
          tipoDiscapacidad: formData.tipoDiscapacidad,
          comunidadEtnica: formData.comunidadEtnica,
          tipoPoblacionEtnica: formData.tipoPoblacionEtnica,
          nombreAutorizante: formData.nombreAutorizante,
          tipoDocumentoAutorizante: formData.tipoDocumentoAutorizante,
          numeroIdentificacionAutorizante: formData.numeroIdentificacionAutorizante,
          parentesco: formData.parentesco,
          telefonoAutorizante: formData.telefonoAutorizante,
          emailAutorizante: formData.emailAutorizante,
          direccionAutorizante: formData.direccionAutorizante,
          sexoAutorizante: formData.sexoAutorizante,
          generoAutorizante: formData.generoAutorizante,
          nombreAcompanante: formData.nombreAcompanante,
          tipoDocumentoAcompanante: formData.tipoDocumentoAcompanante,
          numeroIdentificacionAcompanante: formData.numeroIdentificacionAcompanante,
          fechaViaje: formData.fechaViaje,
          origen: formData.origen,
          destino: formData.destino,
          placaVehiculo: formData.placaVehiculo,
          numeroInterno: formData.numeroInterno,
          numeroTiquete: formData.numeroTiquete,
          nombreReceptor: formData.nombreReceptor,
          tipoDocumentoReceptor: formData.tipoDocumentoReceptor,
          numeroIdentificacionReceptor: formData.numeroIdentificacionReceptor,
          telefonoReceptor: formData.telefonoReceptor,
          emailReceptor: formData.emailReceptor,
          direccionReceptor: formData.direccionReceptor,
          idViaje: selectedViaje
        };

        const response = await axios.post('store_registro_permiso_menor', datosEnvio, {
          responseType: 'blob'
        });

        if (response.status === 200) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'autorizacion_menor.pdf');
          document.body.appendChild(link);
          link.click();
          link.remove();

          enqueueSnackbar('Autorización guardada y PDF descargado', { variant: 'success' });
          // resetForm();
        } else {
          throw new Error('Error al generar la autorización');
        }
      } catch (error) {
        console.error('Error al guardar:', error);
        enqueueSnackbar('Error al guardar la autorización', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      // Paso 1: Datos del menor
      idViaje: '',
      nombreMenor: '',
      tipoDocumentoMenor: '', // valor por defecto
      otroDocumentoMenor: '',
      numeroIdentificacionMenor: '',
      discapacidad: 'NO',
      tipoDiscapacidad: '',
      comunidadEtnica: 'NO',
      tipoPoblacionEtnica: '',

      // Paso 2: Datos del autorizante
      nombreAutorizante: '',
      tipoDocumentoAutorizante: '',
      numeroIdentificacionAutorizante: '',
      parentesco: 'PADRE',
      telefonoAutorizante: '',
      emailAutorizante: '',
      direccionAutorizante: '',
      sexoAutorizante: '',
      generoAutorizante: '',

      // Paso 3: Persona autorizada para viajar
      nombreAcompanante: '',
      tipoDocumentoAcompanante: '',
      numeroIdentificacionAcompanante: '',

      // Paso 4: Datos del viaje
      fechaViaje: '',
      origen: '',
      destino: '',
      placaVehiculo: '',
      numeroInterno: '',
      numeroTiquete: '',

      // Paso 5: Persona que recibe
      nombreReceptor: '',
      tipoDocumentoReceptor: '',
      numeroIdentificacionReceptor: '',
      telefonoReceptor: '',
      emailReceptor: '',
      direccionReceptor: ''
    });
    setSelectedViaje('');

    // Reiniciar el stepper al paso 1
    setCurrentStep(1);
 

    // Limpiar errores
    setErrors({});
  };

  const [viajes, setViajes] = useState<any[]>([]);

  const [selectedViaje, setSelectedViaje] = useState<string>('');

  const fetchViajes = async () => {
    try {
      const response = await axios.get('/get_viajes_for_autorizacion');
      setViajes(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViajes();
  }, []);

  const handleViajeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const viajeId = e.target.value;
    setSelectedViaje(viajeId);

    const viaje = viajes.find((v) => v.id === parseInt(viajeId));
    if (viaje) {
      // Buscar número de afiliación (numeroInterno)
      const numeroAfiliacion =
        viaje.vehiculo?.asignacionPropietarios?.[0]?.afiliacion?.numero || '';

      setFormData((prev) => ({
        ...prev,
        fechaViaje: viaje.agendar_viajes?.fecha || '',
        origen: viaje.ruta?.ciudad_origen?.descripcion || '',
        destino: viaje.ruta?.ciudad_destino?.descripcion || '',
        placaVehiculo: viaje.vehiculo?.placa || '',
        numeroInterno: numeroAfiliacion, // ✅ afiliación como número interno
        numeroTiquete: viaje.tickets?.[0]?.numeroTicket || ''
      }));
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Registro de Autorización para Menores</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div data-stepper="true">
          <div className="card">
            {loading && <Spinner />}
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/3 p-6 border-r border-gray-200">
                <div className="space-y-8">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex gap-4 items-start relative ${
                        currentStep === step.id ? 'active' : ''
                      }`}
                    >
                      {step.id > 1 && (
                        <div className="absolute left-5 -top-8 w-0.5 h-8 bg-gray-200"></div>
                      )}

                      <div className="relative flex flex-col items-center">
                        <div
                          className={`rounded-full size-10 flex items-center justify-center text-md font-semibold z-10 ${
                            currentStep === step.id
                              ? 'bg-primary text-primary-inverse'
                              : currentStep > step.id
                                ? 'bg-success text-white'
                                : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {currentStep > step.id ? (
                            <i className="ki-outline ki-check text-xl"></i>
                          ) : (
                            step.id
                          )}
                        </div>
                        {step.id < steps.length && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 pb-8">
                        <h4
                          className={`text-sm font-medium ${
                            currentStep >= step.id ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <span
                          className={`text-2sm ${
                            currentStep >= step.id ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {step.subtitle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-2/3">
                <div className="card-body py-8">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos del Niño, Niña o Adolescente
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">
                            Nombre completo *
                          </label>
                          <input
                            type="text"
                            name="nombreMenor"
                            className="input"
                            value={formData.nombreMenor}
                            onChange={handleChange}
                          />
                          {errors.nombreMenor && (
                            <p className="text-red-500 text-sm mt-1">{errors.nombreMenor}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tipo de documento *
                          </label>
                          <select
                            name="tipoDocumentoMenor"
                            className="select"
                            value={formData.tipoDocumentoMenor}
                            onChange={handleChange}
                          >
                            <option value="6">Registro civil de nacimiento</option>
                            <option value="2">Tarjeta de identidad</option>
                          </select>
                        </div>

                        {formData.tipoDocumentoMenor === 'otro' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Especifique</label>
                            <input
                              type="text"
                              name="otroDocumentoMenor"
                              className="input"
                              value={formData.otroDocumentoMenor}
                              onChange={handleChange}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número de identificación *
                          </label>
                          <input
                            type="text"
                            name="numeroIdentificacionMenor"
                            className="input"
                            value={formData.numeroIdentificacionMenor}
                            onChange={handleChange}
                          />
                          {errors.numeroIdentificacionMenor && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.numeroIdentificacionMenor}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            ¿Se encuentra en situación de discapacidad? *
                          </label>
                          <select
                            name="discapacidad"
                            className="select"
                            value={formData.discapacidad}
                            onChange={handleChange}
                          >
                            <option value="NO">No</option>
                            <option value="SI">Sí</option>
                          </select>
                        </div>

                        {formData.discapacidad === 'SI' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Tipo de discapacidad *
                            </label>
                            <select
                              name="tipoDiscapacidad"
                              className="select"
                              value={formData.tipoDiscapacidad}
                              onChange={handleChange}
                            >
                              <option value="">Seleccione...</option>
                              <option value="FISICA">Física</option>
                              <option value="VISUAL">Visual</option>
                              <option value="COGNITIVA">Cognitiva - Intelectual</option>
                              <option value="MENTAL">Mental - Psicosocial</option>
                              <option value="AUDITIVA">Auditiva</option>
                              <option value="MULTIPLE">Múltiple</option>
                            </select>
                            {errors.tipoDiscapacidad && (
                              <p className="text-red-500 text-sm mt-1">{errors.tipoDiscapacidad}</p>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            ¿Pertenece a alguna comunidad étnica? *
                          </label>
                          <select
                            name="comunidadEtnica"
                            className="select"
                            value={formData.comunidadEtnica}
                            onChange={handleChange}
                          >
                            <option value="NO">No</option>
                            <option value="SI">Sí</option>
                          </select>
                        </div>

                        {formData.comunidadEtnica === 'SI' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Tipo de población étnica *
                            </label>
                            <select
                              name="tipoPoblacionEtnica"
                              className="select"
                              value={formData.tipoPoblacionEtnica}
                              onChange={handleChange}
                            >
                              <option value="">Seleccione...</option>
                              <option value="INDIGENA">Indígena</option>
                              <option value="GITANO">Gitano</option>
                              <option value="PALENQUERO">Palenquero</option>
                              <option value="RAIZAL">Raizal</option>
                              <option value="OTRA">Otra</option>
                            </select>
                            {errors.tipoPoblacionEtnica && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.tipoPoblacionEtnica}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos de Quien Otorga el Permiso
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">
                            Nombre completo *
                          </label>
                          <input
                            type="text"
                            name="nombreAutorizante"
                            className="input"
                            value={formData.nombreAutorizante}
                            onChange={handleChange}
                          />
                          {errors.nombreAutorizante && (
                            <p className="text-red-500 text-sm mt-1">{errors.nombreAutorizante}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tipo de documento *
                          </label>
                          <select
                            name="tipoDocumentoAutorizante"
                            className="select"
                            value={formData.tipoDocumentoAutorizante}
                            onChange={handleChange}
                          >
                            <option value="1">Cédula de ciudadanía</option>
                            <option value="4">Cédula de extranjería</option>
                            <option value="3">Pasaporte</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número de identificación *
                          </label>
                          <input
                            type="text"
                            name="numeroIdentificacionAutorizante"
                            className="input"
                            value={formData.numeroIdentificacionAutorizante}
                            onChange={handleChange}
                          />
                          {errors.numeroIdentificacionAutorizante && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.numeroIdentificacionAutorizante}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Calidad en que actúa *
                          </label>
                          <select
                            name="parentesco"
                            className="select"
                            value={formData.parentesco}
                            onChange={handleChange}
                          >
                            <option value="PADRE">Padre</option>
                            <option value="MADRE">Madre</option>
                            <option value="TUTOR">Tutor legal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número telefónico *
                          </label>
                          <input
                            type="tel"
                            name="telefonoAutorizante"
                            className="input"
                            value={formData.telefonoAutorizante}
                            onChange={handleChange}
                          />
                          {errors.telefonoAutorizante && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.telefonoAutorizante}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Correo electrónico *
                          </label>
                          <input
                            type="email"
                            name="emailAutorizante"
                            className="input"
                            value={formData.emailAutorizante}
                            onChange={handleChange}
                          />
                          {errors.emailAutorizante && (
                            <p className="text-red-500 text-sm mt-1">{errors.emailAutorizante}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">Dirección física</label>
                          <input
                            type="text"
                            name="direccionAutorizante"
                            className="input"
                            value={formData.direccionAutorizante}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos de la Persona Autorizada para Viajar con el Menor de Edad
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Campo exclusivo para autorizaciones de viaje de niños, niñas o adolescentes
                        acompañados por un adulto diferente al padre, madre o tutor legal.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">Nombre completo</label>
                          <input
                            type="text"
                            name="nombreAcompanante"
                            className="input"
                            value={formData.nombreAcompanante}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tipo de documento
                          </label>
                          <select
                            name="tipoDocumentoAcompanante"
                            className="select"
                            value={formData.tipoDocumentoAcompanante}
                            onChange={handleChange}
                          >
                            <option value="1">Cédula de ciudadanía</option>
                            <option value="4">Cédula de extranjería</option>
                            <option value="3">Pasaporte</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número de identificación
                          </label>
                          <input
                            type="text"
                            name="numeroIdentificacionAcompanante"
                            className="input"
                            value={formData.numeroIdentificacionAcompanante}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Viaje</h3>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Seleccionar Viaje *
                        </label>
                        <select
                          name="viaje"
                          className="input"
                          value={selectedViaje}
                          onChange={handleViajeSelect}
                          disabled={loading}
                        >
                          <option value="">Seleccione un viaje...</option>
                          {viajes.map((viaje) => (
                            <option key={viaje.id} value={viaje.id}>
                              {`${viaje.ruta?.ciudad_origen?.descripcion || 'Origen desconocido'} → ${viaje.ruta?.ciudad_destino?.descripcion || 'Destino desconocido'} | ${viaje.vehiculo?.placa || 'Sin placa'}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Fecha del viaje *
                          </label>
                          <input
                            type="date"
                            name="fechaViaje"
                            className="input"
                            value={formData.fechaViaje}
                            readOnly
                          />
                          {errors.fechaViaje && (
                            <p className="text-red-500 text-sm mt-1">{errors.fechaViaje}</p>
                          )}
                        </div>

                        {/* Origen */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Origen *</label>
                          <input
                            type="text"
                            name="origen"
                            className="input"
                            value={formData.origen}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>

                        {/* Destino */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Destino *</label>
                          <input
                            type="text"
                            name="destino"
                            className="input"
                            value={formData.destino}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>

                        {/* Placa */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Placa vehículo</label>
                          <input
                            type="text"
                            name="placaVehiculo"
                            className="input"
                            value={formData.placaVehiculo}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>

                        {/* N° Interno */}
                        <div>
                          <label className="block text-sm font-medium mb-2">N° Interno</label>
                          <input
                            type="text"
                            name="numeroInterno"
                            className="input"
                            value={formData.numeroInterno}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>

                        {/* N° Tiquete */}
                        <div>
                          <label className="block text-sm font-medium mb-2">N° Tiquete</label>
                          <input
                            type="text"
                            name="numeroTiquete"
                            className="input"
                            value={formData.numeroTiquete}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Datos de la Persona Autorizada para Recoger al Menor de Edad
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">
                            Nombre completo *
                          </label>
                          <input
                            type="text"
                            name="nombreReceptor"
                            className="input"
                            value={formData.nombreReceptor}
                            onChange={handleChange}
                          />
                          {errors.nombreReceptor && (
                            <p className="text-red-500 text-sm mt-1">{errors.nombreReceptor}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tipo de documento *
                          </label>
                          <select
                            name="tipoDocumentoReceptor"
                            className="select"
                            value={formData.tipoDocumentoReceptor}
                            onChange={handleChange}
                          >
                            <option value="1">Cédula de ciudadanía</option>
                            <option value="4">Cédula de extranjería</option>
                            <option value="3">Pasaporte</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número de identificación *
                          </label>
                          <input
                            type="text"
                            name="numeroIdentificacionReceptor"
                            className="input"
                            value={formData.numeroIdentificacionReceptor}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Número telefónico *
                          </label>
                          <input
                            type="tel"
                            name="telefonoReceptor"
                            className="input"
                            value={formData.telefonoReceptor}
                            onChange={handleChange}
                          />
                          {errors.telefonoReceptor && (
                            <p className="text-red-500 text-sm mt-1">{errors.telefonoReceptor}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Correo electrónico
                          </label>
                          <input
                            type="email"
                            name="emailReceptor"
                            className="input"
                            value={formData.emailReceptor}
                            onChange={handleChange}
                          />
                          {errors.emailReceptor && (
                            <p className="text-red-500 text-sm mt-1">{errors.emailReceptor}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">Dirección física</label>
                          <input
                            type="text"
                            name="direccionReceptor"
                            className="input"
                            value={formData.direccionReceptor}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de Navegación */}
                <div className="card-footer py-4 flex justify-between border-t border-gray-200">
                  <button
                    className={`btn btn-light ${currentStep === 1 ? 'invisible' : ''}`}
                    onClick={handleBack}
                  >
                    Anterior
                  </button>
                  {currentStep < steps.length ? (
                    <button className="btn btn-light" onClick={handleNext}>
                      Siguiente
                    </button>
                  ) : (
                    <button onClick={handleSave} className="btn btn-primary">
                      Guardar Autorización
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { RegistroAutorizacionMenoresPage };
