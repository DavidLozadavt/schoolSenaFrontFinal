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
import { validateFieldVehiculo } from '../afiliacion-vehiculos/utils/validateFieldVehiculo';
import { TipoVehiculoInterface } from '../afiliacion-vehiculos/models/TipoVehiculoInterface';
import { ModeloInterface } from '../afiliacion-vehiculos/models/ModeloInterface';
import { MarcaInterface } from '../afiliacion-vehiculos/models/MarcaInterface';
import { TipoAfiliacionInterface } from '../afiliacion-vehiculos/models/TipoAfiliacionInterface';
import Spinner from '@/components/loaders/Spinner';
import { ClaseVehiculosInterface } from '../afiliacion-vehiculos/models/ClaseVehiculosInterface';

interface ModalProps {
  open: boolean;
  afiliacion?: any;
  vehiculo?: any;
  onClose: () => void;
  onSave: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const defaultImage = toAbsoluteUrl('/media/app/auto.png');

const ModalCreateVehiculoAfiliacion = ({
  open,
  onClose,
  afiliacion,
  vehiculo,
  onSave
}: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string>('');
  const [marcas, setMarcas] = useState<MarcaInterface[]>([]);
  const [modelos, setModelos] = useState<ModeloInterface[]>([]);
  const [tipoVehiculos, setTipoVehiculos] = useState<TipoVehiculoInterface[]>([]);
  const [claseVehiculos, setClaseVehiculo] = useState<ClaseVehiculosInterface[]>([]);
  const [tipoAfiliaciones, setTipoAfiliaciones] = useState<TipoAfiliacionInterface[]>([]);
  const [documentosVehiculo, setDocumentosVehiculo] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface FormDataVehiculo {
    placa: string;
    chasis: string;
    tipoV: string;
    modelo: string;
    marca: string;
    numPuestos: string;
    idClaseVehiculo: string;
    tipoCombustible: string;
    motor: string;
    color: string;
    radioAccion: string;
  }

  const [formDataVehiculo, setFormDataVehiculo] = useState<FormDataVehiculo>({
    placa: '',
    chasis: '',
    tipoV: '',
    modelo: '',
    marca: '',
    numPuestos: '',
    idClaseVehiculo: '',
    tipoCombustible: '',
    motor: '',
    color: '',
    radioAccion: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPlacaExist = async () => {
    if (!formDataVehiculo.placa.trim()) return;

    try {
      const response = await axios.get(`exist_placa/${formDataVehiculo.placa}`);

      if (Object.keys(response.data).length === 0) return;

      enqueueSnackbar('La placa ya existe', { variant: 'error' });

      setFormDataVehiculo({
        placa: '',
        chasis: '',
        tipoV: '',
        modelo: '',
        marca: '',
        numPuestos: '',
        idClaseVehiculo: '',
        tipoCombustible: '',
        motor: '',
        color: '',
        radioAccion: ''
      });
    } catch (error) {
      setError('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setFile(null);
      setSelectedFilesVehiculo({});
      setFileErrorsVehiculo({});
      setPreviewSrc(defaultImage);

      if (vehiculo) {
        setFormDataVehiculo({
          placa: vehiculo.placa || '',
          chasis: vehiculo.chasis || '',
          tipoV: vehiculo.idTipo?.toString() || '',
          modelo: vehiculo.idModelo?.toString() || '',
          marca: vehiculo.idMarca?.toString() || '',
          numPuestos: vehiculo.numPuestos?.toString() || '',
          idClaseVehiculo: vehiculo.idClaseVehiculo?.toString() || '',
          tipoCombustible: vehiculo.tipoCombustible || '',
          motor: vehiculo.motor || '',
          color: vehiculo.color || '',
          radioAccion: vehiculo.radioAccion || ''
        });

        if (vehiculo.rutaUrl) {
          setPreviewSrc(vehiculo.rutaUrl);
        }
      } else {
        setFormDataVehiculo({
          placa: '',
          chasis: '',
          tipoV: '',
          modelo: '',
          marca: '',
          numPuestos: '',
          idClaseVehiculo: '',
          tipoCombustible: '',
          motor: '',
          color: '',
          radioAccion: ''
        });
        setPreviewSrc(defaultImage);
      }
    }
  }, [open, vehiculo]);

  const handleChangeFormVehiculo = (e: any) => {
    let { name, value } = e.target;

    if (name === 'radioAccion') {
      value = value.toUpperCase();
    } else {
      value = value.replace(/[^A-Za-z0-9]/g, '');

      if (name === 'placa') {
        if (value.length > 3) {
          value = value.slice(0, 3) + '-' + value.slice(3);
        }
      }

      value = value.toUpperCase();
    }

    const error = validateFieldVehiculo(name, value);

    setFormDataVehiculo((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [file]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);

      setErrors((prevErrors) => ({
        ...prevErrors,
        foto: ''
      }));
    }
  };

  const handleFileDelete = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      foto: 'Por favor, seleccione una foto.'
    }));
  };

  const tipoAfiliacionActual = afiliacion?.tipo_afiliacion?.[0]?.tipoAfiliacion;

  const fetchDocumentosVehiculo = useCallback(async () => {
    if (!tipoAfiliacionActual) return;

    try {
      const response = await axios.get(`documents_by_proceso_nombre/${tipoAfiliacionActual}`);
      setDocumentosVehiculo(response.data);
    } catch (error) {
      console.log('Error al obtener documentos:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoAfiliacionActual]);

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
    setSelectedFilesVehiculo((prev) => {
      const updated = { ...prev };
      delete updated[documentoId];
      return updated;
    });

    setDocumentosCombinados((prev) =>
      prev.map((doc) =>
        doc.idTipoDocumento === documentoId ? { ...doc, cargado: undefined } : doc
      )
    );

    setFileErrorsVehiculo((prev) => {
      const updated = { ...prev };
      delete updated[documentoId];
      return updated;
    });
  };

  const validateVehiculo = () => {
    const newErrors: Partial<FormDataVehiculo> = {};

    if (!formDataVehiculo.placa) {
      newErrors.placa = 'La placa es requerida';
    } else if (!/^[A-Za-z]{3}-\d{3}$/.test(formDataVehiculo.placa)) {
      newErrors.placa =
        'La placa debe tener el formato AAA-123 (tres letras, un guion y tres números)';
    }

    if (!formDataVehiculo.chasis) {
      newErrors.chasis = 'El chasis es requerido';
    }

    if (!formDataVehiculo.tipoV) {
      newErrors.tipoV = 'El tipo de vehículo es requerido';
    }

    if (!formDataVehiculo.modelo) {
      newErrors.modelo = 'El modelo es requerido';
    }

    if (!formDataVehiculo.idClaseVehiculo) {
      newErrors.idClaseVehiculo = 'La clase de vehículo es requerida';
    }

    if (!formDataVehiculo.tipoCombustible) {
      newErrors.tipoCombustible = 'El tipo de combustible es requrido';
    }

    if (!formDataVehiculo.marca) {
      newErrors.marca = 'La marca es requerida';
    }

    if (!formDataVehiculo.numPuestos) {
      newErrors.numPuestos = 'Este campo es requerido';
    } else if (!/^\d+$/.test(formDataVehiculo.numPuestos)) {
      newErrors.numPuestos = 'El número de puestos solo debe contener números';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    let validationErrors: Partial<any> = validateVehiculo();
    let documentErrors: Record<number, { file?: string; fechaExpedicion?: string }> = {};

    documentosCombinados.forEach((documento) => {
      const selectedFile = selectedFilesVehiculo[documento.idTipoDocumento];

      if (documento.cargado && !selectedFile) {
        return;
      }

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

    if (!file && !vehiculo?.rutaUrl) {
      validationErrors['foto'] = 'Por favor, seleccione una foto.';
    }

    if (Object.keys(validationErrors).length > 0 || Object.keys(documentErrors).length > 0) {
      setErrors(validationErrors);
      setFileErrorsVehiculo(documentErrors);
      return;
    }

    const data = new FormData();

    Object.entries(formDataVehiculo).forEach(([key, value]) => {
      data.append(key, value);
    });

    if (file) {
      data.append('fileVehiculo', file);
    } else {
      data.append('fileVehiculo', '');
    }

    Object.entries(selectedFilesVehiculo).forEach(([index, { file, fechaExpedicion }]) => {
      if (file) {
        data.append(`vehiculoFiles[${index}]`, file);
        data.append(`vehiculoFilesFechaExpedicion[${index}]`, fechaExpedicion);
      }
    });

    const url =
      vehiculo && vehiculo.id
        ? `update_vehiculo_afiliacion/${vehiculo.id}`
        : `store_vehiculo_afiliacion/${afiliacion.id}`;

    setLoading(true);

    try {
      const response = await axios.post(url, data);
      enqueueSnackbar(
        vehiculo && vehiculo.id
          ? 'Vehículo actualizado exitosamente.'
          : 'Vehículo guardado exitosamente.',
        { variant: 'success' }
      );

      reset();
      onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar el vehículo.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tipoAfiliacionActual) {
      fetchDocumentosVehiculo();
    }
  }, [tipoAfiliacionActual, fetchDocumentosVehiculo]);

  const [documentosCombinados, setDocumentosCombinados] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    if (documentosVehiculo.length === 0) return;

    if (vehiculo) {
      const docsConCargados = documentosVehiculo.map((doc) => {
        const cargado = vehiculo.documentos_vehiculo?.find(
          (d: any) => d.idTipoDocumento === doc.idTipoDocumento
        );

        return {
          ...doc,
          cargado: cargado ?? undefined
        };
      });

      setDocumentosCombinados(docsConCargados);
      return;
    }

    setDocumentosCombinados(documentosVehiculo);
  }, [open, vehiculo, documentosVehiculo]);

  const reset = () => {
    setDocumentosVehiculo([]);
    setFile(null);
    // setPreviewSrc(defaultImage);
    setSelectedFilesVehiculo({});
    setFileErrorsVehiculo({});
    setFormDataVehiculo({
      placa: '',
      chasis: '',
      tipoV: '',
      modelo: '',
      marca: '',
      numPuestos: '',
      idClaseVehiculo: '',
      tipoCombustible: '',
      motor: '',
      color: '',
      radioAccion: ''
    });
  };

  const fetchModelos = async () => {
    try {
      const response = await axios.get('modelos');
      setModelos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTipoVehiculos = async () => {
    try {
      const response = await axios.get('tipo_vehiculos');
      setTipoVehiculos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaseVehiculos = async () => {
    try {
      const response = await axios.get('clase_vehiculos');
      setClaseVehiculo(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTipoAfiliacion = async () => {
    try {
      const response = await axios.get('tipo_afiliaciones');
      setTipoAfiliaciones(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await axios.get('marcas');
      setMarcas(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelos();
    fetchMarcas();
    fetchClaseVehiculos();
    fetchTipoAfiliacion();
    fetchTipoVehiculos();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{afiliacion ? 'Nuevo Vehículo' : 'Nuevo Vehículo'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          {loading && <Spinner />}
          <div className="flex justify-end gap-3 mt-4 px-4">
            <div>
              <div>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1 basis-[68%]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">Placa *</label>
                        <input
                          type="text"
                          name="placa"
                          placeholder="Ingrese la placa"
                          className={`input w-full ${errors.placa ? 'border-red-500' : ''}`}
                          onChange={handleChangeFormVehiculo}
                          onBlur={fetchPlacaExist}
                          value={formDataVehiculo.placa}
                        />
                        {errors.placa && <p className="text-red-500 text-sm">{errors.placa}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Marca *</label>
                        <div className="flex items-center gap-2">
                          <select
                            name="marca"
                            className={`select w-full ${errors.marca ? 'border-red-500' : ''}`}
                            onChange={handleChangeFormVehiculo}
                            value={formDataVehiculo.marca}
                          >
                            <option value="">Seleccione una opción</option>
                            {marcas.map((marca) => (
                              <option key={marca.id} value={marca.id}>
                                {marca.marca}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.marca && <p className="text-red-500 text-sm">{errors.marca}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Clase de Vehículo *
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            name="idClaseVehiculo"
                            className={`select ${errors.idClaseVehiculo ? 'border-red-500' : ''}`}
                            onChange={handleChangeFormVehiculo}
                            value={formDataVehiculo.idClaseVehiculo}
                          >
                            <option value="">Seleccione una opción</option>
                            {claseVehiculos.map((res) => (
                              <option key={res.id} value={res.id}>
                                {res.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.idClaseVehiculo && (
                          <p className="text-red-500 text-sm">{errors.idClaseVehiculo}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Radio Acción *</label>
                        <select
                          name="radioAccion"
                          className={`select ${errors.radioAccion ? 'border-red-500' : ''}`}
                          onChange={handleChangeFormVehiculo}
                          value={formDataVehiculo.radioAccion}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="OPERACION NACIONAL">OPERACION NACIONAL</option>
                          <option value="OPERACION MUNICIPAL">OPERACION MUNICIPAL</option>
                        </select>

                        {errors.radioAccion && (
                          <p className="text-red-500 text-sm">{errors.radioAccion}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Número de Motor *</label>
                        <input
                          type="text"
                          name="motor"
                          placeholder="Ingrese el número de motor"
                          className={`input w-full ${errors.motor ? 'border-red-500' : ''}`}
                          onChange={handleChangeFormVehiculo}
                          value={formDataVehiculo.motor}
                        />
                        {errors.motor && <p className="text-red-500 text-sm">{errors.motor}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Chasis *</label>
                        <input
                          type="text"
                          name="chasis"
                          placeholder="Ingrese el chasis"
                          className={`input w-full ${errors.chasis ? 'border-red-500' : ''}`}
                          onChange={handleChangeFormVehiculo}
                          value={formDataVehiculo.chasis}
                        />
                        {errors.chasis && <p className="text-red-500 text-sm">{errors.chasis}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Vehículo *</label>
                        <div className="flex items-center gap-2">
                          <select
                            name="tipoV"
                            className={`select ${errors.tipoV ? 'border-red-500' : ''}`}
                            onChange={handleChangeFormVehiculo}
                            value={formDataVehiculo.tipoV}
                          >
                            <option value="">Seleccione una opción</option>
                            {tipoVehiculos.map((tipoV) => (
                              <option key={tipoV.id} value={tipoV.id}>
                                {tipoV.tipo}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.tipoV && <p className="text-red-500 text-sm">{errors.tipoV}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo Combustible *</label>
                        <select
                          name="tipoCombustible"
                          className={`select ${errors.tipoCombustible ? 'border-red-500' : ''}`}
                          onChange={handleChangeFormVehiculo}
                          value={formDataVehiculo.tipoCombustible}
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="GASOLINA">GASOLINA</option>
                          <option value="ACPM">ACPM</option>
                          <option value="GAS">GAS</option>
                          <option value="ELECTRICO">ELECTRICO</option>
                        </select>
                        {errors.tipoCombustible && (
                          <p className="text-red-500 text-sm">{errors.tipoCombustible}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="basis-[35%] flex items-center justify-center">
                    <div className="w-48 h-48 border rounded-lg overflow-hidden shadow">
                      <img
                        src={previewSrc}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Modelo *</label>
                    <div className="flex items-center gap-2">
                      <select
                        name="modelo"
                        className={`select w-full ${errors.modelo ? 'border-red-500' : ''}`}
                        onChange={handleChangeFormVehiculo}
                        value={formDataVehiculo.modelo}
                      >
                        <option value="">Seleccione una opción</option>
                        {modelos.map((modelo) => (
                          <option key={modelo.id} value={modelo.id}>
                            {modelo.modelo}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.modelo && <p className="text-red-500 text-sm">{errors.modelo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      placeholder="Ingrese el color"
                      className={`input w-full ${errors.color ? 'border-red-500' : ''}`}
                      onChange={handleChangeFormVehiculo}
                      value={formDataVehiculo.color}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Foto *</label>
                    {!file && (
                      <input
                        type="file"
                        name="foto"
                        ref={fileInputRef}
                        className="file-input"
                        accept="image/*"
                        required
                        onChange={handleImageChange}
                      />
                    )}

                    {file && (
                      <div className="flex items-center mt-2">
                        <p className="text-sm input flex justify-between w-full items-center">
                          {file.name}
                          <span onClick={handleFileDelete} className="ml-auto cursor-pointer">
                            <KeenIcon icon="trash" />
                          </span>
                        </p>
                      </div>
                    )}
                    {errors.foto && <p className="text-red-500 text-sm">{errors.foto}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Numero de Pasajeros/ Capacidad *{' '}
                    </label>
                    <input
                      type="text"
                      name="numPuestos"
                      placeholder="Ingrese el numero de pasajeros"
                      className={`input w-full ${errors.numPuestos ? 'border-red-500' : ''}`}
                      onChange={handleChangeFormVehiculo}
                      value={formDataVehiculo.numPuestos}
                    />
                    {errors.numPuestos && (
                      <p className="text-red-500 text-sm">{errors.numPuestos}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-2">
                {documentosCombinados.map((documento) => {
                  const cargado = documento.cargado;
                  const selected = selectedFilesVehiculo[documento.idTipoDocumento];

                  return (
                    <div key={documento.idTipoDocumento} className="mb-1">
                      <label className="block text-sm font-medium mb-1">
                        {documento.tipoDocumento.tituloDocumento} *
                      </label>

                      {cargado && !selected ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center border rounded p-2">
                            <a href={cargado.rutaUrl} target="_blank" className="text-sm underline">
                              Ver documento
                            </a>

                            <span
                              onClick={() => handleFileDeleteVehiculo(documento.idTipoDocumento)}
                              className="ml-auto cursor-pointer"
                            >
                              <KeenIcon icon="trash" />
                            </span>
                          </div>

                          <label className="block text-sm font-medium mt-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[290px]">
                            Fecha Vigencia – {documento.tipoDocumento.tituloDocumento} *
                          </label>

                          <input
                            type="date"
                            value={cargado.fecha_vigencia}
                            onChange={(e) => handleDateChange(e, documento.idTipoDocumento)}
                            className="input border rounded px-2 py-1 w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {!selected ? (
                            <input
                              type="file"
                              name={`file-${documento.idTipoDocumento}`}
                              onChange={(e) =>
                                handleFileChangeVehiculo(e, documento.idTipoDocumento)
                              }
                              className="file-input"
                            />
                          ) : (
                            <>
                              <div className="flex items-center input px-2 py-1 justify-between w-full">
                                <p className="text-sm">{selected.file?.name}</p>

                                <span
                                  onClick={() =>
                                    handleFileDeleteVehiculo(documento.idTipoDocumento)
                                  }
                                  className="ml-auto cursor-pointer"
                                >
                                  <KeenIcon icon="trash" />
                                </span>
                              </div>

                              <label className="block text-sm font-medium">
                                Fecha Vigencia – {documento.tipoDocumento.tituloDocumento} *
                              </label>

                              <input
                                type="date"
                                value={selected.fechaExpedicion || ''}
                                onChange={(e) => handleDateChange(e, documento.idTipoDocumento)}
                                className="input border rounded px-2 py-1 w-full"
                              />
                            </>
                          )}

                          {fileErrorsVehiculo[documento.idTipoDocumento]?.file && (
                            <p className="text-red-500 text-sm mt-1">
                              {fileErrorsVehiculo[documento.idTipoDocumento].file}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCreateVehiculoAfiliacion };
