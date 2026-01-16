import React, { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import axios from 'axios';
import { useLayout } from '@/providers';
import { useLocation, useNavigate } from 'react-router';
import { KeenIcon } from '@/components';

import { NumericFormat } from 'react-number-format';

import { useSnackbar } from 'notistack';
import { ModalClaseProducto } from '../registrar-compra/ModalClaseProducto';
import { ModalTipoProducto } from '../registrar-compra/ModalTipoProducto';

const AporteSociosPage = () => {
  const { currentLayout } = useLayout();
  const location = useLocation();
  const tercero = location.state;
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [claseProductos, setClaseProductos] = useState<any[]>([]);
  const [tipoProductos, setTipoProductos] = useState<any[]>([]);
  const [tipoProductosCopia, setTipoProductosCopia] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [modalOpenClaseProducto, setModalOpenClaseProducto] = useState(false);
  const [modalOpenTipoProducto, setModalOpenTipoProducto] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState(1);

  interface FormDataFactura {
    fecha: string;
    valor: number;
    tipoAporte: string;
    claseAporte: string;
    tipoPago: string;
    numCuotas: string;

  }

  interface FormErrors {
    fecha?: string;
    valor?: string;
    tipoAporte?: string;
    claseAporte?: string;
    tipoPago?: string;
    numCuotas?: string;

  }

  const [formDataFactura, setFormDataFactura] = useState<FormDataFactura>({
    fecha: '',
    valor: 0,
    tipoAporte: '',
    claseAporte: '',
    tipoPago: '',
    numCuotas: '',
    
  });

  interface FormDataMedioPago {
    medioPago: string;
    tipoPago: string;
    entidadFinanciera: string;
    factura: File | null;
    comprobante: File | null;
    opcionAbono: string;
    valorAbono?: string;
  }

  interface ErrorsMedioPago {
    medioPago?: string;
    tipoPago?: string;
    entidadFinanciera?: string;
    valorAbono?: string;
  }

  const [formDataMedioPago, setFormDataMedioPago] = useState<FormDataMedioPago>({
    medioPago: '',
    tipoPago: '',
    entidadFinanciera: '',
    factura: null,
    comprobante: null,
    opcionAbono: 'no',
    valorAbono: ''
  });

  const [errorsMedioPago, setErrorsMedioPago] = useState<ErrorsMedioPago>({});

  const [productos, setProductos] = useState<Producto[]>([]);

  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleAfterSaveClaseProducto = () => {
    fetchClaseProductos();
    setModalOpenClaseProducto(false);
  };

  const handleAfterSaveTipoProducto = () => {
    fetchTipoProductos(String(formData.claseProducto));
    setModalOpenTipoProducto(false);
  };

  const steps = [
    { id: 1, title: 'Paso 1', subtitle: 'Registra el valor del aporte' },
    { id: 2, title: 'Paso 2', subtitle: 'Registra la información del aporte' }
  ];

  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get('tipo_pagos');
      setPaymentTypes(response.data);
    } catch (err) {
      setError(`Error al cargar`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await axios.get('medio_pagos');
      setPaymentMethods(response.data);
    } catch (error) {
      setError('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const fetchClaseProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('clase_productos');
      setClaseProductos(response.data);
    } catch (error) {
      setError('Error al cargar las clases de producto');
    } finally {
      setLoading(false);
    }
  };

  const fetchTipoProductos = async (idClase: string) => {
    if (!idClase) return;
    setLoading(true);
    try {
      const response = await axios.get(`tipo_productos_by_id/${idClase}`);

      setTipoProductos(response.data);
      setTipoProductosCopia((prevCopia) => [...prevCopia, ...response.data]);
    } catch (error) {
      setError('Error al cargar los tipos de producto');
    } finally {
      setLoading(false);
    }
  };

  //form productos

  interface Producto {
    claseProducto: number | null;
    idTipoProducto: number | null;
    modelo: string;
    caracteristicas: string;
    valor: string;
    serial: string;
  }

  const [formData, setFormData] = useState<Producto>({
    claseProducto: null,
    idTipoProducto: null,
    modelo: '',
    caracteristicas: '',
    valor: '',
    serial: ''
  });

  const [errorsP, setErrorsP] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: string | number | null) => {
    let error = '';

    const camposObligatorios = ['claseProducto', 'idTipoProducto', 'caracteristicas', 'valor'];

    if (camposObligatorios.includes(name) && (value === '' || value === null)) {
      error = 'Este campo es obligatorio';
    }

    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrorsP((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value) ? validateField(name, value) : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof Producto]);
      if (error) newErrors[key] = error;
    });

    setErrorsP(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editIndex !== null) {
      const updatedProductos = [...productos];
      updatedProductos[editIndex] = formData;
      setProductos(updatedProductos);
      setEditIndex(null);
    } else {
      setProductos([...productos, formData]);
    }

    setFormData({
      claseProducto: null,
      idTipoProducto: null,
      modelo: '',
      caracteristicas: '',
      valor: '',
      serial: ''
    });

    setErrorsP({});
  };

  const handleEdit = (index: number) => {
    const producto = productos[index];
    fetchTipoProductos(String(producto.claseProducto));
    setFormData(producto);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedProductos = productos.filter((_, i) => i !== index);
    setProductos(updatedProductos);
  };

  const getNombreClaseProducto = (id: number) => {
    const clase = claseProductos.find((clase) => clase.id === id);
    return clase ? clase.nombreClaseProducto : 'Desconocido';
  };

  const getNombreTipoProducto = (id: number) => {
    const tipo = tipoProductosCopia.find((tipo) => tipo.id === id);
    return tipo ? tipo.nombreTipoProducto : 'Desconocido';
  };

  const entidadesFinancieras = [{ id: 14, nombre: 'BANCOLOMBIA S.A' }];

  const handleClaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idClase = e.target.value;
    fetchTipoProductos(idClase);
  };

  //fin form productos

  const [errors, setErrors] = useState<FormErrors>({});

  const validateFactura = (name: string, value: string | number): string => {
    if (name === 'fecha' && !value) return 'La fecha es obligatoria';

    if (name === 'valor' && (value === '' || isNaN(Number(value)) || Number(value) <= 0))
      return 'El valor es obligatorio y debe ser mayor a 0';

    if (name === 'tipoAporte' && !value) return 'El tipo de aporte es obligatorio';

    return '';
  };

  const handleChangeFactura = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    if (name === 'valor') {
      parsedValue = parseFloat(value) || 0;
    }

    setFormDataFactura((prev) => {
      const newState = {
        ...prev,
        [name]: parsedValue
      };

      return newState;
    });

    setErrors((prev) => {
      const newErrors = { ...prev, [name]: validateFactura(name, parsedValue) };

      return newErrors;
    });
  };

  useEffect(() => {
    setFormDataFactura((prev) => ({
      ...prev
    }));
  }, [formDataFactura.valor, formDataFactura.fecha]);

  const isFormValid = () => {
    const requiredFields = ['fecha', 'valor', 'tipoAporte'];

    return (
      requiredFields.every((field) => !!formDataFactura[field as keyof FormDataFactura]) &&
      Object.values(errors).every((error) => !error)
    );
  };

  const handleNext = () => {
    const newErrors: FormErrors = {
      fecha: validateFactura('fecha', formDataFactura.fecha),
      valor: validateFactura('valor', formDataFactura.valor),
      tipoAporte: validateFactura('tipoAporte', formDataFactura.tipoAporte)
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    if (isFormValid() && currentStep < steps.length) {
      setCurrentStep((prev: number) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const [idFactura, setIdFactura] = useState(null);

  const handleSaveFactura = async () => {
    const payload = {
      fecha: formDataFactura.fecha,
      valor: formDataFactura.valor,
      idTercero: tercero.id
    };

    try {
      const response = await axios.post('store_factura', payload);

      if (response.data.id) {
        setIdFactura(response.data.id);
        handleSaveProductos(response.data.id);
        enqueueSnackbar('Factura guardada con éxito.', { variant: 'success' });
      } else {
        enqueueSnackbar('No se recibió un ID de factura.', { variant: 'warning' });
      }
    } catch (error) {
      enqueueSnackbar('Error al guardar la factura.', { variant: 'error' });
    }
  };

  //forma de pago form validations

  const validateFieldMedioPago = (name: keyof ErrorsMedioPago, value: string) => {
    let error = '';
    if (!value) error = 'Este campo es obligatorio';
    setErrorsMedioPago((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const handleChangeMedioPago = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormDataMedioPago((prev) => ({
        ...prev,
        opcionAbono: value,
        valorAbono: value === 'si' ? prev.valorAbono : ''
      }));
    } else {
      setFormDataMedioPago((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'tipoPago' && value !== '1' ? { opcionAbono: 'no', valorAbono: '' } : {})
      }));
    }

    validateFieldMedioPago(name as keyof ErrorsMedioPago, value);
  };

  const handleFileChangeMedioPago = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormDataMedioPago({ ...formDataMedioPago, [name]: files[0] });
    }
  };

  const validateFormMedioPago = () => {
    let newErrors: ErrorsMedioPago = {};

    if (!formDataMedioPago.medioPago) newErrors.medioPago = 'Este campo es obligatorio';
    if (!formDataMedioPago.tipoPago) newErrors.tipoPago = 'Este campo es obligatorio';
    if (!formDataMedioPago.entidadFinanciera)
      newErrors.entidadFinanciera = 'Este campo es obligatorio';
    if (
      formDataMedioPago.tipoPago === '1' &&
      formDataMedioPago.opcionAbono === 'si' &&
      !formDataMedioPago.valorAbono
    ) {
      newErrors.valorAbono = 'El valor del abono es obligatorio';
    }

    setErrorsMedioPago(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  //end validation medio pagos

  let valoresProductos: { valor: string; idSubcuentaPropia: number }[] = [];

  const handleSaveProductos = async (idFactura: number) => {
    if (!idFactura) {
      enqueueSnackbar('No hay una factura asociada.', { variant: 'warning' });
      return;
    }

    const payload = {
      idFactura: idFactura,
      productos: productos.map((producto) => ({
        ...producto,
        valor: String(producto.valor).replace(/[$,]/g, '')
      }))
    };

    try {
      const response = await axios.post('store_producto', payload);

      enqueueSnackbar('Productos guardados con éxito.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar los productos.', { variant: 'error' });
    }
  };

  const handleSubmitPago = async (idFac: number) => {
    if (!validateFormMedioPago()) return;

    const data = new FormData();
    data.append('idMedioPago', formDataMedioPago.medioPago);
    data.append('idTipoPago', formDataMedioPago.tipoPago);
    data.append('idFactura', idFac + '');
    data.append('idEntidadFinanciera', formDataMedioPago.entidadFinanciera);
    if (formDataMedioPago.factura) data.append('rutaFacturaFile', formDataMedioPago.factura);
    if (formDataMedioPago.comprobante)
      data.append('rutaComprobanteFile', formDataMedioPago.comprobante);
    data.append('valor', formDataFactura.valor + '');
    data.append('fecha', formDataFactura.fecha + '');
    data.append('idTercero', tercero.id + '');

    data.append('valoresProductos', JSON.stringify(valoresProductos));

    try {
      const response = await axios.post('forma_pago_factura', data);
      enqueueSnackbar('Forma de pago guardada con éxito.', { variant: 'success' });
      navigate('/compras/terceros', { replace: true });
    } catch (error) {
      console.error('Error al enviar:', error);
    }
  };

  const handleSave = () => {
    if (!validateFormMedioPago()) {
      enqueueSnackbar('Por favor, complete todos los campos requeridos del medio de pago.', {
        variant: 'warning'
      });
      return;
    }

    if (productos.length === 0) {
      enqueueSnackbar('Debe agregar al menos un producto antes de guardar.', {
        variant: 'warning'
      });
      return;
    }

    handleSaveFactura();
  };




 const [tipoAporte, setTipoAporte] = useState("");

  const handleChangeTipoAporte = (e:any) => {
    setTipoAporte(e.target.value);
  };

  useEffect(() => {
    if (!tercero) {
      navigate('/compras/terceros', { replace: true });
      return;
    }
    fetchClaseProductos();
    fetchPaymentTypes();
    fetchPaymentMethods();
  }, [tercero, navigate]);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Registro de Aporte con: <span className="italic">{tercero.nombre}</span>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div data-stepper="true">
          <div className="card">
            <div className="card-header flex justify-between items-center gap-4 py-6">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex gap-2.5 items-center ${currentStep === step.id ? 'active' : ''}`}
                >
                  <div
                    className={`rounded-full size-10 flex items-center justify-center text-md font-semibold ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-inverse'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <i className="ki-outline ki-check text-xl"></i>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4
                      className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-600'}`}
                    >
                      {step.title}
                    </h4>
                    <span
                      className={`text-2sm ${currentStep >= step.id ? 'text-gray-700' : 'text-gray-400'}`}
                    >
                      {step.subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-body py-8">
              {currentStep === 1 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Fecha *</label>
                      <input
                        type="date"
                        name="fecha"
                        className="input"
                        value={formDataFactura.fecha}
                        onChange={handleChangeFactura}
                      />
                      {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Valor *</label>
                      <NumericFormat
                        className="input"
                        prefix={'$'}
                        value={formDataFactura.valor}
                        decimalScale={3}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor del aporte"
                        onValueChange={(values) =>
                          handleChangeFactura({
                            target: { name: 'valor', value: values.floatValue || 0 }
                          } as any)
                        }
                      />
                      {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de Aporte *</label>
                      <select
                        name="tipoAporte"
                        className="select"
                        value={formDataFactura.tipoAporte || ''}
                        onChange={handleChangeFactura}
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="ESPECIE">ESPECIE</option>
                      </select>
                      {errors.tipoAporte && (
                        <p className="text-red-500 text-sm mt-1">{errors.tipoAporte}</p>
                      )}
                    </div>



                    <div>
                      <label className="block text-sm font-medium mb-2">Clase de Aporte *</label>
                      <select
                        name="claseAporte"
                        className="select"
                        value={formDataFactura.claseAporte || ''}
                        onChange={handleChangeFactura}
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="OBLIGATORIO">OBLIGATORIO</option>
                        <option value="VOLUNTARIO">VOLUNTARIO</option>
                      </select>
                      {errors.tipoAporte && (
                        <p className="text-red-500 text-sm mt-1">{errors.tipoAporte}</p>
                      )}
                    </div>


{formDataFactura.tipoAporte === 'EFECTIVO' && (
  <>
    <div>
      <label className="block text-sm font-medium mb-2">Tipo de Pago *</label>
      <select
        name="tipoPago"
        className="select"
        value={formDataFactura.tipoPago || ''}
        onChange={handleChangeFactura}
      >
        <option value="">Seleccione una opción</option>
        <option value="CONTADO">CONTADO</option>
        <option value="CUOTAS">CUOTAS</option>
      </select>
      {errors.tipoPago && (
        <p className="text-red-500 text-sm mt-1">{errors.tipoPago}</p>
      )}
    </div>

    {formDataFactura.tipoPago === 'CUOTAS' && (
      <div>
        <label className="block text-sm font-medium mb-2">Número de Cuotas *</label>
        <input
          type="text"
          name="numCuotas"
          placeholder="Ingrese el número de cuotas"
          className="input w-full mr-2"
          value={formDataFactura.numCuotas || ''}
          onChange={handleChangeFactura}
        />
        {errors.numCuotas && (
          <p className="text-red-500 text-sm mt-1">{errors.numCuotas}</p>
        )}
      </div>
    )}
  </>
)}

                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  {formDataFactura.tipoAporte === 'EFECTIVO' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Comprobante de Pago
                        </label>
                        <input
                          type="file"
                          name="comprobante"
                          className="file-input"
                          onChange={handleChangeFactura}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Documentos Adicionales
                        </label>
                        <input
                          type="file"
                          name="documento"
                          className="file-input"
                          onChange={handleChangeFactura}
                        />
                      </div>
                    </div>
                  )}

                  {formDataFactura.tipoAporte === 'ESPECIE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                 <div className="col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="border border-dashed border-gray-400 rounded-md p-4 text-center">
        <p className="text-base font-medium mb-4">
          ¿El aporte es un terreno o un activo fijo?
        </p>
        <div className="flex justify-center space-x-6">
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="aporte"
              value="terreno"
              checked={tipoAporte === "terreno"}
              onChange={handleChangeTipoAporte}
              className="form-radio"
            />
            <span className="ml-2">Terreno</span>
          </label>
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="aporte"
              value="activoFijo"
              checked={tipoAporte === "activoFijo"}
              onChange={handleChangeTipoAporte}
              className="form-radio"
            />
            <span className="ml-2">Activo Fijo</span>
          </label>
        </div>
      </div>

  
      {tipoAporte === "terreno" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Comprobante de Pago
            </label>
            <input
              type="file"
              name="comprobanteTerreno"
              className="file-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Documentos Adicionales
            </label>
            <input
              type="file"
              name="documentoTerreno"
              className="file-input"
            />
          </div>
        </div>
      )}
    </div>
                    </div>
                  )}

              

                 {tipoAporte === "activoFijo" && (
        <form className="mb-12" onSubmit={handleSubmit}>
                          <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Clase de Producto *
                              </label>
                              <div className="flex items-center">
                                <select
                                  name="claseProducto"
                                  className="select w-4/4 mr-2"
                                  value={formData.claseProducto || ''}
                                  onChange={(event) => {
                                    handleChange(event);
                                    handleClaseChange(event);
                                  }}
                                >
                                  <option value="">Seleccione una opción</option>
                                  {claseProductos.map((clase) => (
                                    <option key={clase.id} value={clase.id}>
                                      {clase.nombreClaseProducto}
                                    </option>
                                  ))}
                                </select>
      
                                <button
                                  onClick={() => {
                                    setModalOpenClaseProducto(true);
                                  }}
                                  type="button"
                                  className="w-10 h-10 btn btn-sm btn-light"
                                >
                                  <KeenIcon icon="plus" />
                                </button>
                              </div>
                              {errorsP.claseProducto && <p className="text-red-500 text-sm mt-1">{errorsP.claseProducto}</p>}
                            </div>
      
                            <div>
                              <label className="block text-sm font-medium mb-2">Tipo de Producto *</label>
                              <div className="flex items-center">
                                <select
                                  name="idTipoProducto"
                                  className="select w-4/4 mr-2"
                                  value={formData.idTipoProducto || ''}
                                  onChange={handleChange}
                                >
                                  <option value="">Seleccione una opción</option>
                                  {tipoProductos.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                      {tipo.nombreTipoProducto}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    setModalOpenTipoProducto(true);
                                  }}
                                  type="button"
                                  className="w-10 h-10 btn btn-sm btn-light"
                                >
                                  <KeenIcon icon="plus" />
                                </button>
                              </div>
                              {errorsP.idTipoProducto && <p className="text-red-500 text-sm mt-1">{errorsP.idTipoProducto}</p>}
                            </div>
      
                            <div>
                              <label className="block text-sm font-medium mb-2">Modelo *</label>
                              <input
                                type="text"
                                name="modelo"
                                placeholder="Ingrese el modelo"
                                className="input w-4/4 mr-2"
                                value={formData.modelo}
                                onChange={handleChange}
                              />
                              {errorsP.modelo && <p className="text-red-500 text-sm mt-1">{errorsP.modelo}</p>}
                              
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                            <div>
                              <label className="block text-sm font-medium mb-2">Caracteristicas *</label>
                              <textarea
                                rows={3}
                                name="caracteristicas"
                                placeholder="Ingrese las Caracteristicas"
                                className="textarea"
                                value={formData.caracteristicas}
                                onChange={handleChange}
                              />
                              {errorsP.caracteristicas && <p className="text-red-500 text-sm mt-1">{errorsP.caracteristicas}</p>}
                            </div>
      
                            <div>
                              <label className="block text-sm font-medium mb-2">Valor *</label>
                           
                              <NumericFormat
                                className="input"
                                prefix={'$'}
                                name="valor"
                                value={formData.valor}
                                onChange={handleChange}
                                decimalScale={3}
                                thousandsGroupStyle="thousand"
                                thousandSeparator=","
                                placeholder="Ingrese el valor"
                              />
                                 {errorsP.valor && <p className="text-red-500 text-sm mt-1">{errorsP.valor}</p>}
                            </div>
      
                            <div>
                              <label className="block text-sm font-medium mb-2">Serial *</label>
                              <input
                                type="text"
                                name="serial"
                                placeholder="Ingrese el serial"
                                className="input w-full"
                                value={formData.serial}
                                onChange={handleChange}
                              />
                              {errorsP.serial && <p className="text-red-500 text-sm mt-1">{errorsP.serial}</p>}
      
                              <div className="flex justify-end mt-5">
                                <button type="submit" className="btn-primary btn-sm rounded-md">
                                  {editIndex !== null ? 'Actualizar Producto' : 'Añadir Producto'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
      )}

     
      {tipoAporte === "activoFijo" && productos.length > 0 && (
        <div className="card min-w-full mt-10">
          <div className="card-table">
            <table className="table table-border align-middle text-gray-700 font-medium text-sm">
              <thead>
                <tr>
                  <th className="py-2">Clase de Producto</th>
                  <th className="py-2">Tipo de Producto</th>
                  <th className="py-2">Modelo</th>
                  <th className="py-2">Caracteristicas</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Serial</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={index}>
                    <td>{producto.claseProducto}</td>
                    <td>{producto.idTipoProducto}</td>
                    <td>{producto.modelo}</td>
                    <td>{producto.caracteristicas}</td>
                    <td>{producto.valor}</td>
                    <td>{producto.serial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
                </div>
              )}
            </div>

            <div className="card-footer py-4 flex justify-between">
              <button
                className={`btn btn-light ${currentStep === 1 ? 'hidden' : ''}`}
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
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>

        <ModalClaseProducto
          open={modalOpenClaseProducto}
          onClose={() => {
            setModalOpenClaseProducto(false);
          }}
          onSave={handleAfterSaveClaseProducto}
        />

        <ModalTipoProducto
          open={modalOpenTipoProducto}
          onClose={() => {
            setModalOpenTipoProducto(false);
          }}
          onSave={handleAfterSaveTipoProducto}
        />
      </Container>
    </Fragment>
  );
};

export { AporteSociosPage };
