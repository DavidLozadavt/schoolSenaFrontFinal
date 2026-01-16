import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { TipoDocumentoInterface } from '../contratacion/model/TipoDocumentoInterface';
import { PersonaInterface } from '../contratacion/model/PersonaInterface';

import { toAbsoluteUrl } from '@/utils';
import { AsignacionProcesoDocumentoInterface } from '../afiliacion-vehiculos/models/DocumentosAfiliacionInterface';
import { validationFieldPropietario } from '../afiliacion-vehiculos/utils/validationFieldPropietario';
import { VehiculoInterface } from './models/AfiliacionInterface';
import { useNavigate } from 'react-router';

interface Documento {
  file: File | null;
  fechaExpedicion: string;
}

interface Conductor {
  foto?: File | null;
  documentos: Record<number, Documento>;
  [key: string]: any;
}

interface ModalProps {
  open: boolean;
  afiliacion?: any;
  vehiculo?: VehiculoInterface;
  onClose: () => void;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const defaultImage = toAbsoluteUrl('/media/avatars/300-35.png');

const ModalCreateConductorAfiliacion = ({
  open,
  onClose,
  afiliacion,
  vehiculo,
  onSave
}: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tipoIdentificaciones, setTipoIdentificacion] = useState<TipoDocumentoInterface[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedFilePersona, setSelectedFilePersona] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [documentosConductor, setDocumentosConductor] = useState<
    AsignacionProcesoDocumentoInterface[]
  >([]);

  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formDataPersona, setFormDataPersona] = useState<PersonaInterface>({
    nombre1: '',
    apellido1: '',
    nombre2: '',
    idtipoIdentificacion: '',
    identificacion: '',
    rh: '',
    sexo: '',
    fechaNac: '',
    idciudadNac: '',
    departamento: '',
    apellido2: '',
    email: '',
    direccion: '',
    celular: '',
    telefonoFijo: '',
    celularExtra: '',
    emailExtra: ''
  });

  useEffect(() => {
    if (open) {
      if (afiliacion) {
        setFormDataPersona({
          id: afiliacion.id || undefined,
          nombre1: afiliacion.nombre1 || '',
          idPersona: afiliacion.idPersona || undefined,
          apellido1: afiliacion.apellido1 || '',
          nombre2: afiliacion.nombre2 || '',
          idtipoIdentificacion: afiliacion.idtipoIdentificacion || '',
          identificacion: afiliacion.identificacion || '',
          rh: afiliacion.rh || '',
          sexo: afiliacion.sexo || '',
          fechaNac: afiliacion.fechaNac || '',
          idciudadNac: afiliacion.idciudadNac || '',
          departamento: afiliacion.departamento || '',
          apellido2: afiliacion.apellido2 || '',
          email: afiliacion.email || '',
          direccion: afiliacion.direccion || '',
          celular: afiliacion.celular || '',
          telefonoFijo: afiliacion.telefonoFijo || '',
          emailExtra: afiliacion.emailExtra || '',
          celularExtra: afiliacion.celularExtra || ''
        });
        setSelectedFilePersona(afiliacion.foto || null);
      } else {
        setFormDataPersona({
          id: undefined,
          idPersona: '',
          nombre1: '',
          apellido1: '',
          nombre2: '',
          idtipoIdentificacion: '',
          identificacion: '',
          rh: '',
          sexo: '',
          fechaNac: '',
          idciudadNac: '',
          departamento: '',
          apellido2: '',
          email: '',
          direccion: '',
          celular: '',
          telefonoFijo: '',
          emailExtra: '',
          celularExtra: ''
        });
        setSelectedFilePersona(null);
        setPreviewSrc(defaultImage);
      }
      setFileErrorsVehiculo({});
      setErrors({});
      setObservaciones(['']);
      setSelectedFilesVehiculo({});
    }
  }, [open, afiliacion]);

  const handleChangeFormPerson = (e: any) => {
    let { name, value } = e.target;

    if (name !== 'email' && name !== 'emailExtra') {
      value = value.toUpperCase();
    }

    const error = validationFieldPropietario(name, value);

    setFormDataPersona((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));

    if (name === 'departamento') {
      fetchCiudades(value);
    }
  };

  useEffect(() => {
    if (afiliacion?.departamento) {
      fetchCiudades(afiliacion.departamento);
    }
  }, [afiliacion?.departamento]);

  const fetchDepartamentos = async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCiudades = async (idDepartamento: number) => {
    try {
      const response = await axios.get(`ciudades/departamento/${idDepartamento}`);
      setCiudades(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTipoIdentificacion = async () => {
    try {
      const response = await axios.get('contrato-tipos-identificacion');
      setTipoIdentificacion(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentosVehiculo = async () => {
    try {
      const response = await axios.get(`documents_by_proceso_nombre/VINCULACIÓN CONDUCTOR`);
      setDocumentosConductor(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilePersonaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFilePersona(file);

    if (file) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors['rutaFoto'];
        return newErrors;
      });
    }
  };

  const handleFilePersonaDelete = () => {
    setSelectedFilePersona(null);
  };

  //documentos vehiculo
  const [selectedFilesVehiculo, setSelectedFilesVehiculo] = useState<
    Record<number, { file: File | null; fechaExpedicion: string }>
  >({});

  const [fileErrorsVehiculo, setFileErrorsVehiculo] = useState<
    Record<number, { file?: string; fechaExpedicion?: string }>
  >({});

  const handleFileChangeVehiculo = (
    event: React.ChangeEvent<HTMLInputElement>,
    documentoId: number
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFilesVehiculo((prevFiles) => ({
        ...prevFiles,
        [documentoId]: { file, fechaExpedicion: prevFiles[documentoId]?.fechaExpedicion || '' }
      }));

      setFileErrorsVehiculo((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[documentoId];
        return newErrors;
      });
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>, documentoId: number) => {
    const nuevaFecha = event.target.value;

    setSelectedFilesVehiculo((prevFiles) => ({
      ...prevFiles,
      [documentoId]: {
        file: prevFiles[documentoId]?.file || null,
        fechaExpedicion: nuevaFecha
      }
    }));

    setFileErrorsVehiculo((prevErrors) => {
      if (prevErrors[documentoId]?.fechaExpedicion) {
        const newErrors = { ...prevErrors };
        delete newErrors[documentoId].fechaExpedicion;

        if (Object.keys(newErrors[documentoId]).length === 0) {
          delete newErrors[documentoId];
        }

        return newErrors;
      }
      return prevErrors;
    });
  };

  const handleFileDeleteVehiculo = (documentoId: number) => {
    setSelectedFilesVehiculo((prevFiles) => {
      const updatedFiles = { ...prevFiles };
      delete updatedFiles[documentoId];
      return updatedFiles;
    });
  };

  //fin documentos vehiculo

  const handleSave = () => {
    let validationErrors: Partial<any> = {};
    let documentErrors: Record<number, { file?: string; fechaExpedicion?: string }> = {};

    Object.entries(formDataPersona).forEach(([name, value]) => {
      const error = validationFieldPropietario(name, value);
      if (error) {
        validationErrors[name] = error;
      }
    });

    if (!selectedFilePersona && !previewSrc) {
      validationErrors['rutaFotoUrl'] = 'Por favor, seleccione una foto.';
    }

    documentosConductor.forEach((documento) => {
      const selectedFile = selectedFilesVehiculo[documento.idTipoDocumento];

      if (!selectedFile?.file) {
        documentErrors[documento.idTipoDocumento] = {
          ...documentErrors[documento.idTipoDocumento],
          file: 'Este documento es requerido.'
        };
      }

      if (!selectedFile?.fechaExpedicion) {
        documentErrors[documento.idTipoDocumento] = {
          ...documentErrors[documento.idTipoDocumento],
          fechaExpedicion: 'La fecha es requerida.'
        };
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
    }

    if (Object.keys(documentErrors).length > 0) {
      setFileErrorsVehiculo(documentErrors);
    } else {
      setFileErrorsVehiculo({});
    }

    if (Object.keys(validationErrors).length === 0 && Object.keys(documentErrors).length === 0) {
      const conductor = {
        ...formDataPersona,
        foto: selectedFilePersona,
        documentos: selectedFilesVehiculo
      };

      handleSubmitConductores([conductor]);
    }
  };

  const fetchContratos = async (identificacion: any) => {
    if (!identificacion) return;

    setLoading(true);
    try {
      const response = await axios.get(`contrato_active/${identificacion}`);
      const contrato = response.data;

      if (contrato && contrato.persona) {
        const idDepartamento = contrato.persona.ciudad_nac?.iddepartamento || '';

        setFormDataPersona({
          idPersona: contrato.persona.id,
          nombre1: contrato.persona.nombre1 || '',
          apellido1: contrato.persona.apellido1 || '',
          nombre2: contrato.persona.nombre2 || '',
          idtipoIdentificacion: contrato.persona.idTipoIdentificacion || '',
          identificacion: contrato.persona.identificacion || '',
          rh: contrato.persona.rh || '',
          sexo: contrato.persona.sexo || '',
          fechaNac: contrato.persona.fechaNac || '',
          idciudadNac: contrato.persona.idCiudadNac || '',
          departamento: idDepartamento,
          apellido2: contrato.persona.apellido2 || '',
          email: contrato.persona.email || '',
          direccion: contrato.persona.direccion || '',
          celular: contrato.persona.celular || '',
          telefonoFijo: contrato.persona.telefonoFijo || '',
          emailExtra: contrato.persona.emailExtra || '',
          celularExtra: contrato.persona.celularExtra || '',
          rutaFotoUrl: contrato.persona.rutaFotoUrl
        });
        setPreviewSrc(contrato.persona.rutaFotoUrl);
        if (idDepartamento) {
          await fetchCiudades(idDepartamento);
        }
      }
    } catch (error) {
      setError('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConductores = async (conductores: Conductor[]) => {
    const data = new FormData();

    conductores.forEach((conductor, index) => {
      conductor.observaciones = observaciones;

      Object.entries(conductor).forEach(([key, value]) => {
        if (key !== 'documentos' && key !== 'foto' && key !== 'observaciones') {
          data.append(`conductores[${index}][${key}]`, value as string);
        }
      });

      if (conductor.foto) {
        data.append(`conductores[${index}][foto]`, conductor.foto);
      }

      Object.entries(conductor.documentos).forEach(([idTipoDocumento, documento]) => {
        if (documento.file) {
          data.append(
            `conductores[${index}][documentos][${idTipoDocumento}][file]`,
            documento.file
          );
          data.append(
            `conductores[${index}][documentos][${idTipoDocumento}][fechaExpedicion]`,
            documento.fechaExpedicion
          );
        }
      });

      if (conductor.observaciones && conductor.observaciones.length > 0) {
        conductor.observaciones.forEach((obs: any, obsIndex: any) => {
          data.append(`conductores[${index}][observaciones][${obsIndex}]`, obs);
        });
      }
    });

    try {
      const response = await axios.post(
        `store_afiliacion_conductores/${vehiculo?.id}/${afiliacion?.id}`,
        data
      );
      enqueueSnackbar('Vinculación creada correctamente.', { variant: 'success' });
      onSave();
      onClose();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar('Error al guardar el conductor.', { variant: 'error' });
    }
  };

  const [observaciones, setObservaciones] = useState<string[]>(['']);

  const handleObservacionChange = (index: number, value: string) => {
    const nuevas = [...observaciones];
    nuevas[index] = value;
    setObservaciones(nuevas);
  };

  const handleAddObservacion = () => {
    setObservaciones([...observaciones, '']);
  };

  const handleRemoveObservacion = (index: number) => {
    setObservaciones(observaciones.filter((_, i) => i !== index));
  };

  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFilePersona) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFilePersona);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [selectedFilePersona]);

  const handleNavigate = () => {
    navigate('/gestion-contratos/contratacion');
  };

  useEffect(() => {
    fetchTipoIdentificacion();
    fetchDepartamentos();
    fetchDocumentosVehiculo();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{afiliacion ? 'Nuevo Conductor' : 'Nuevo Conductor'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          {/* <span className="badge text-sm mb-3 badge-outline badge-info justify-start">
            <KeenIcon icon="information-2" className="mr-2" />
            El conductor debe tener un contrato. Si no tiene,
            <button
              onClick={handleNavigate}
              className="text-blue-500 underline bg-transparent border-none cursor-pointer ml-2"
            >
              haz clic aquí
            </button>
            . Si ya tiene uno, solo ingresa la identificación.
          </span> */}

          <form>
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1 basis-[68%]">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Identificación *</label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder="Ingrese su identificación"
                      value={formDataPersona.identificacion}
                      onChange={handleChangeFormPerson}
                      onBlur={() => fetchContratos(formDataPersona.identificacion)}
                      className={`input ${errors.identificacion ? 'border-red-500' : ''}`}
                    />
                    {errors.identificacion && (
                      <p className="text-red-500 text-sm mt-1">{errors.identificacion}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo Identificación *</label>
                    <select
                      name="idtipoIdentificacion"
                      value={formDataPersona.idtipoIdentificacion}
                      onChange={handleChangeFormPerson}
                      className="input"
                    >
                      <option value="">Seleccione una Opción</option>
                      {tipoIdentificaciones.map((tipoIdentificacion) => (
                        <option key={tipoIdentificacion.id} value={tipoIdentificacion.id}>
                          {tipoIdentificacion.codigo}
                        </option>
                      ))}
                    </select>
                    {errors.idtipoIdentificacion && (
                      <p className="text-red-500 text-sm mt-1">{errors.idtipoIdentificacion}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primer Nombre *</label>
                    <input
                      type="text"
                      name="nombre1"
                      placeholder="Ingrese su primer nombre"
                      value={formDataPersona.nombre1}
                      onChange={handleChangeFormPerson}
                      className={`input ${errors.nombre1 ? 'border-red-500' : ''}`}
                    />
                    {errors.nombre1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.nombre1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Segundo Nombre</label>
                    <input
                      type="text"
                      placeholder="Ingrese su segundo nombre"
                      name="nombre2"
                      value={formDataPersona.nombre2}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />
                    {errors.nombre2 && (
                      <p className="text-red-500 text-sm mt-1">{errors.nombre2}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primer Apellido *</label>
                    <input
                      type="text"
                      name="apellido1"
                      placeholder="Ingrese su primer apellido"
                      value={formDataPersona.apellido1}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />{' '}
                    {errors.apellido1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.apellido1}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Segundo Apellido</label>
                    <input
                      type="text"
                      name="apellido2"
                      placeholder="Ingrese su segundo apellido"
                      value={formDataPersona.apellido2}
                      onChange={handleChangeFormPerson}
                      className="input"
                    />
                    {errors.apellido2 && (
                      <p className="text-red-500 text-sm mt-1">{errors.apellido2}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="basis-[35%] flex items-center justify-center">
                <div className="w-48 h-48 border rounded-lg overflow-hidden shadow">
                  <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Sexo *</label>
                <select
                  name="sexo"
                  value={formDataPersona.sexo}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una Opción</option>

                  <option value="F">FEMENINO</option>
                  <option value="M">MASCULINO</option>
                  <option value="O">OTRO</option>
                </select>
                {errors.sexo && <p className="text-red-500 text-sm mt-1">{errors.sexo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rh *</label>
                <select
                  name="rh"
                  value={formDataPersona.rh}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una Opción</option>

                  <option value="A+">A POSITIVO</option>
                  <option value="A-">A NEGATIVO</option>
                  <option value="AB+">AB POSTITIVO</option>
                  <option value="AB-">AB NEGATIVO</option>
                  <option value="B+">B POSITIVO</option>
                  <option value="B-">B NEGATIVO</option>
                  <option value="O+">O POSITIVO</option>
                  <option value="O-">O NEGATIVO</option>
                </select>
                {errors.rh && <p className="text-red-500 text-sm mt-1">{errors.rh}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Foto *</label>
                {!selectedFilePersona ? (
                  <input
                    type="file"
                    name="rutaFotoUrl"
                    onChange={handleFilePersonaChange}
                    className="file-input"
                  />
                ) : (
                  <div className="flex items-center">
                    <p className="text-sm input flex justify-between w-full items-center">
                      {selectedFilePersona.name}
                      <span onClick={handleFilePersonaDelete} className="ml-2 cursor-pointer">
                        <KeenIcon icon="trash" />
                      </span>
                    </p>
                  </div>
                )}

                {errors['rutaFoto'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['rutaFoto']}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Departamento de Nacimiento *
                </label>
                <select
                  name="departamento"
                  value={formDataPersona.departamento}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.descripcion} - {departamento.codigo}
                    </option>
                  ))}
                </select>
                {errors.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ciudad de Nacimiento *</label>
                <select
                  name="idciudadNac"
                  value={formDataPersona.idciudadNac}
                  onChange={handleChangeFormPerson}
                  className="input"
                >
                  <option value="">Seleccione una ciudad</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.id}>
                      {ciudad.descripcion} - {ciudad.codigo}
                    </option>
                  ))}
                </select>
                {errors.idciudadNac && (
                  <p className="text-red-500 text-sm mt-1">{errors.idciudadNac}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="fechaNac"
                  value={formDataPersona.fechaNac}
                  onChange={handleChangeFormPerson}
                  className="input"
                  max={new Date().toISOString().split('T')[0]}
                />

                {errors.fechaNac && <p className="text-red-500 text-sm mt-1">{errors.fechaNac}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  placeholder="Ingrese la dirección"
                  value={formDataPersona.direccion}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.direccion ? 'border-red-500' : ''}`}
                />
                {errors.direccion && (
                  <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Correo Electronico *</label>
                <input
                  type="text"
                  name="email"
                  placeholder="Ingrese el Correo Electronico"
                  value={formDataPersona.email}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Celular *</label>
                <input
                  type="text"
                  name="celular"
                  placeholder="Ingrese el celular"
                  value={formDataPersona.celular}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.celular ? 'border-red-500' : ''}`}
                />
                {errors.celular && <p className="text-red-500 text-sm mt-1">{errors.celular}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono Fijo</label>
                <input
                  type="text"
                  name="telefonoFijo"
                  placeholder="Ingrese el teléfono "
                  value={formDataPersona.telefonoFijo}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.telefonoFijo ? 'border-red-500' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Celular Adicional (Opcional)
                </label>
                <input
                  type="text"
                  name="celularExtra"
                  placeholder="Ingrese el celular"
                  value={formDataPersona.celularExtra}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.celularExtra ? 'border-red-500' : ''}`}
                />
                {errors.celularExtra && (
                  <p className="text-red-500 text-sm mt-1">{errors.celularExtra}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Correo Adicional (Opcional)
                </label>
                <input
                  type="text"
                  name="emailExtra"
                  placeholder="Ingrese el correo electronico adicional"
                  value={formDataPersona.emailExtra}
                  onChange={handleChangeFormPerson}
                  className={`input ${errors.emailExtra ? 'border-red-500' : ''}`}
                />
                {errors.emailExtra && (
                  <p className="text-red-500 text-sm mt-1">{errors.emailExtra}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium ">Restricciones</label>
                {observaciones.map((obs, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <textarea
                      placeholder={`Restricción ${index + 1}`}
                      value={obs}
                      onChange={(e) => handleObservacionChange(index, e.target.value.toUpperCase())}
                      className="textarea flex-1 mt-3"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObservacion(index)}
                        className="w-10 h-10 mt-3 btn btn-sm btn-danger "
                      >
                        <KeenIcon icon="cross" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddObservacion}
                  className="mt-2 px-3 py-1 text-sm btn-light btn "
                >
                  Agregar Restricción
                  <KeenIcon icon="plus" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-3">
              {documentosConductor.map((documento) => (
                <div key={documento.idTipoDocumento} className="mb-1">
                  <label className="block text-sm font-medium mb-1">
                    {documento.tipoDocumento.tituloDocumento} *
                  </label>
                  {!selectedFilesVehiculo[documento.idTipoDocumento]?.file ? (
                    <>
                      <input
                        type="file"
                        name={`file-${documento.idTipoDocumento}`}
                        onChange={(e) => handleFileChangeVehiculo(e, documento.idTipoDocumento)}
                        className="file-input"
                      />
                      {fileErrorsVehiculo[documento.idTipoDocumento]?.file && (
                        <p className="text-red-500 text-sm mt-1">
                          {fileErrorsVehiculo[documento.idTipoDocumento].file}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <p className="text-sm input flex justify-between w-full items-center">
                          {selectedFilesVehiculo[documento.idTipoDocumento]?.file?.name}
                          <span
                            onClick={() => handleFileDeleteVehiculo(documento.idTipoDocumento)}
                            className="ml-auto cursor-pointer"
                          >
                            <KeenIcon icon="trash" />
                          </span>
                        </p>
                      </div>

                      <label className="block text-sm font-medium">
                        {documento.tipoDocumento?.tipoFecha} -{' '}
                        {documento.tipoDocumento.tituloDocumento} *
                      </label>
                      <input
                        type="date"
                        value={
                          selectedFilesVehiculo[documento.idTipoDocumento]?.fechaExpedicion || ''
                        }
                        onChange={(e) => handleDateChange(e, documento.idTipoDocumento)}
                        className="input border rounded px-2 py-1 w-full"
                      />
                      {fileErrorsVehiculo[documento.idTipoDocumento]?.fechaExpedicion && (
                        <p className="text-red-500 text-sm mt-1">
                          {fileErrorsVehiculo[documento.idTipoDocumento].fechaExpedicion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button
              // disabled={!formDataPersona.idPersona}
              className="btn btn-primary btn-sm"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
export { ModalCreateConductorAfiliacion };
