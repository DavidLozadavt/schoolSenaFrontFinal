import React, { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import axios from 'axios';
import { useLayout } from '@/providers';

import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';

const RegistroAutorizacionMenoresWebForm = () => {
  const { currentLayout } = useLayout();
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    // Sección 1: Datos del menor
    idViaje: '',
    nombreMenor: '',
    tipoDocumentoMenor: '',
    otroDocumentoMenor: '',
    numeroIdentificacionMenor: '',
    discapacidad: '',
    tipoDiscapacidad: '',
    comunidadEtnica: '',
    tipoPoblacionEtnica: '',

    // Sección 2: Datos del autorizante
    nombreAutorizante: '',
    tipoDocumentoAutorizante: '',
    numeroIdentificacionAutorizante: '',
    parentesco: 'padre',
    telefonoAutorizante: '',
    emailAutorizante: '',
    direccionAutorizante: '',
    sexoAutorizante: '',
    generoAutorizante: '',

    // Sección 3: Persona autorizada para viajar
    nombreAcompanante: '',
    tipoDocumentoAcompanante: '',
    numeroIdentificacionAcompanante: '',

    // Sección 4: Datos del viaje
    fechaViaje: '',
    origen: '',
    destino: '',
    placaVehiculo: '',
    numeroInterno: '',
    numeroTiquete: '',

    // Sección 5: Persona que recibe
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^\d{10}$/;
      return phoneRegex.test(phone);
    };

    // Validación Sección 1: Datos del menor
    if (!formData.nombreMenor) newErrors.nombreMenor = 'El nombre del menor es requerido';
    if (!formData.numeroIdentificacionMenor)
      newErrors.numeroIdentificacionMenor = 'El número de identificación es requerido';
    if (formData.discapacidad === 'SI' && !formData.tipoDiscapacidad)
      newErrors.tipoDiscapacidad = 'El tipo de discapacidad es requerido';
    if (formData.comunidadEtnica === 'SI' && !formData.tipoPoblacionEtnica)
      newErrors.tipoPoblacionEtnica = 'El tipo de población étnica es requerido';

    // Validación Sección 2: Datos del autorizante
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

    // Validación Sección 4: Datos del viaje
    if (!formData.fechaViaje) newErrors.fechaViaje = 'La fecha del viaje es requerida';
    if (!formData.origen) newErrors.origen = 'El origen es requerido';
    if (!formData.destino) newErrors.destino = 'El destino es requerido';

    // Validación Sección 5: Persona que recibe
    if (!formData.nombreReceptor) newErrors.nombreReceptor = 'El nombre del receptor es requerido';

    if (!formData.telefonoReceptor) {
      newErrors.telefonoReceptor = 'El teléfono del receptor es requerido';
    } else if (!validatePhone(formData.telefonoReceptor)) {
      newErrors.telefonoReceptor = 'El teléfono debe tener 10 dígitos numéricos';
    }

    if (formData.emailReceptor && !validateEmail(formData.emailReceptor)) {
      newErrors.emailReceptor =
        'El correo electrónico debe tener un formato válido (ejemplo@dominio.com)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
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

        const response = await axios.post('store_registro_permiso_menor', datosEnvio);

        if (response.status === 200) {
                 const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'autorizacion_menor.pdf');
          document.body.appendChild(link);
          link.click();
          link.remove();
          enqueueSnackbar('Autorización guardada exitosamente', { variant: 'success' });
          resetForm();
        } else {
          throw new Error(response.data.message || 'Error al guardar la autorización');
        }
      } catch (error: any) {
        console.error('Error al guardar:', error);

        let errorMessage = 'Error al guardar la autorización';

        if (error.response) {
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        } else if (error.request) {
          errorMessage = 'Error de conexión con el servidor';
        } else {
          errorMessage = error.message || errorMessage;
        }

        enqueueSnackbar(errorMessage, { variant: 'error' });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      // Sección 1: Datos del menor
      idViaje: '',
      nombreMenor: '',
      tipoDocumentoMenor: '',
      otroDocumentoMenor: '',
      numeroIdentificacionMenor: '',
      discapacidad: 'NO',
      tipoDiscapacidad: '',
      comunidadEtnica: 'NO',
      tipoPoblacionEtnica: '',

      // Sección 2: Datos del autorizante
      nombreAutorizante: '',
      tipoDocumentoAutorizante: '',
      numeroIdentificacionAutorizante: '',
      parentesco: '',
      telefonoAutorizante: '',
      emailAutorizante: '',
      direccionAutorizante: '',
      sexoAutorizante: '',
      generoAutorizante: '',

      // Sección 3: Persona autorizada para viajar
      nombreAcompanante: '',
      tipoDocumentoAcompanante: '',
      numeroIdentificacionAcompanante: '',

      // Sección 4: Datos del viaje
      fechaViaje: '',
      origen: '',
      destino: '',
      placaVehiculo: '',
      numeroInterno: '',
      numeroTiquete: '',

      // Sección 5: Persona que recibe
      nombreReceptor: '',
      tipoDocumentoReceptor: '',
      numeroIdentificacionReceptor: '',
      telefonoReceptor: '',
      emailReceptor: '',
      direccionReceptor: ''
    });

    setErrors({});
    setSelectedViaje('');
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
        <div className="space-y-8">
          {loading && <Spinner />}

          {/* Sección 1: Datos del Menor */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Datos del Niño, Niña o Adolescente
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Nombre completo *</label>
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
                  <label className="block text-sm font-medium mb-2">Tipo de documento *</label>
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
                    <p className="text-red-500 text-sm mt-1">{errors.numeroIdentificacionMenor}</p>
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
                    <label className="block text-sm font-medium mb-2">Tipo de discapacidad *</label>
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
                      <p className="text-red-500 text-sm mt-1">{errors.tipoPoblacionEtnica}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección 2: Datos del Autorizante */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Datos de Quien Otorga el Permiso
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Nombre completo *</label>
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
                  <label className="block text-sm font-medium mb-2">Tipo de documento *</label>
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
                  <label className="block text-sm font-medium mb-2">Calidad en que actúa *</label>
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
                  <label className="block text-sm font-medium mb-2">Número telefónico *</label>
                  <input
                    type="tel"
                    name="telefonoAutorizante"
                    className="input"
                    value={formData.telefonoAutorizante}
                    onChange={handleChange}
                  />
                  {errors.telefonoAutorizante && (
                    <p className="text-red-500 text-sm mt-1">{errors.telefonoAutorizante}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Correo electrónico *</label>
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
          </div>

          {/* Sección 3: Persona Autorizada para Viajar */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Datos de la Persona Autorizada para Viajar con el Menor de Edad
              </h3>
            </div>
            <div className="card-body">
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
                  <label className="block text-sm font-medium mb-2">Tipo de documento</label>
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
                  <label className="block text-sm font-medium mb-2">Número de identificación</label>
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
          </div>

          {/* Sección 4: Datos del Viaje */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Datos del Viaje</h3>
            </div>

            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             
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
                {/* Fecha del viaje (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha del viaje *</label>
                  <input
                    type="date"
                    name="fechaViaje"
                    className="input"
                    value={formData.fechaViaje}
                    readOnly // ✅ no editable
                  />
                  {errors.fechaViaje && (
                    <p className="text-red-500 text-sm mt-1">{errors.fechaViaje}</p>
                  )}
                </div>

                {/* Origen (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Origen *</label>
                  <input
                    type="text"
                    name="origen"
                    className="input"
                    value={formData.origen}
                    readOnly // ✅ no editable
                  />
                  {errors.origen && <p className="text-red-500 text-sm mt-1">{errors.origen}</p>}
                </div>

                {/* Destino (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Destino *</label>
                  <input
                    type="text"
                    name="destino"
                    className="input"
                    value={formData.destino}
                    readOnly // ✅ no editable
                  />
                  {errors.destino && <p className="text-red-500 text-sm mt-1">{errors.destino}</p>}
                </div>

                {/* Placa vehículo (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Placa vehículo</label>
                  <input
                    type="text"
                    name="placaVehiculo"
                    className="input"
                    value={formData.placaVehiculo}
                    readOnly // ✅ no editable
                  />
                </div>

                {/* N° Interno (solo lectura, viene de afiliación) */}
                <div>
                  <label className="block text-sm font-medium mb-2">N° Interno</label>
                  <input
                    type="text"
                    name="numeroInterno"
                    className="input"
                    value={formData.numeroInterno}
                    readOnly // ✅ no editable
                  />
                </div>

                {/* N° Tiquete (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2">N° Tiquete</label>
                  <input
                    type="text"
                    name="numeroTiquete"
                    className="input"
                    value={formData.numeroTiquete}
                    readOnly // ✅ no editable
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 5: Persona que Recibe */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Datos de la Persona Autorizada para Recoger al Menor de Edad
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Nombre completo *</label>
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
                  <label className="block text-sm font-medium mb-2">Tipo de documento *</label>
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
                  <label className="block text-sm font-medium mb-2">Número telefónico *</label>
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
                  <label className="block text-sm font-medium mb-2">Correo electrónico</label>
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
          </div>

          {/* Botón de Guardar */}
          <div className="flex justify-end space-x-4 mt-6">
            <button className="btn btn-light" onClick={resetForm} type="button">
              Limpiar Formulario
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Autorización'}
            </button>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { RegistroAutorizacionMenoresWebForm };
