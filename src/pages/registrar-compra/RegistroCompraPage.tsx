import React, { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import axios from 'axios';
import { useLayout } from '@/providers';
import { useLocation, useNavigate } from 'react-router';
import { KeenIcon } from '@/components';
import { TipoPagoInterface } from './models/TipoPagoInterface';
import { NumericFormat } from 'react-number-format';
import { MedioPagoInterface } from './models/MedioPagoInterface';
import { ClaseProductosInterface } from './models/ClaseProductosInterface';
import { TipoProductosInterface } from './models/TipoProductosInterface';
import { ModalClaseProducto } from './ModalClaseProducto';
import { ModalTipoProducto } from './ModalTipoProducto';
import { useSnackbar } from 'notistack';

const RegistroCompraPage = () => {
  const { currentLayout } = useLayout();
  const location = useLocation();
  const tercero = location.state;
  const [paymentTypes, setPaymentTypes] = useState<TipoPagoInterface[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<MedioPagoInterface[]>([]);
  const [claseProductos, setClaseProductos] = useState<ClaseProductosInterface[]>([]);
  const [tipoProductos, setTipoProductos] = useState<TipoProductosInterface[]>([]);
  const [tipoProductosCopia, setTipoProductosCopia] = useState<TipoProductosInterface[]>([]);
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
    numeroFactura: string;
    incluyeIva: string;
    valorIva: number;
    totalSinIva: number;
    totalAPagar: number;
  }

  interface FormErrors {
    fecha?: string;
    numeroFactura?: string;
    valorIva?: string;
    totalSinIva?: string;
  }

  const [formDataFactura, setFormDataFactura] = useState<FormDataFactura>({
    fecha: '',
    numeroFactura: '',
    incluyeIva: 'si',
    valorIva: 0,
    totalSinIva: 0,
    totalAPagar: 0
  });

  interface ProductoCreado {
    detalleFactura: {
      valor: string | number;
    };
    producto: {
      tipoProducto: {
        idSubcuentaPropia: number;
      };
    };
  }


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
    { id: 1, title: 'Paso 1', subtitle: 'Registra la Información de la Factura' },
    { id: 2, title: 'Paso 2', subtitle: 'Registra la Información de la Compra' }
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
    if (value === '' || value === null) {
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
    if (name === 'numeroFactura' && typeof value === 'string' && value.trim().length < 5)
      return 'Debe tener al menos 5 caracteres';
    if (name === 'totalSinIva' && (value === '' || isNaN(Number(value)) || Number(value) <= 0))
      return 'El total sin IVA es obligatorio y debe ser mayor a 0';
    if (formDataFactura.incluyeIva === 'si' && name === 'valorIva') {
      if (value === '' || isNaN(Number(value)) || Number(value) <= 0)
        return 'El valor del IVA es obligatorio y debe ser mayor a 0';
    }
    return '';
  };

  const handleChangeFactura = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    if (name === 'valorIva' || name === 'totalSinIva') {
      parsedValue = parseFloat(value) || 0;
    }

    setFormDataFactura((prev) => {
      const newState = {
        ...prev,
        [name]: parsedValue
      };

      if (name === 'incluyeIva') {
        newState.incluyeIva = value;
        newState.valorIva = value === 'no' ? 0 : prev.valorIva;
      }

      return newState;
    });

    setErrors((prev) => {
      const newErrors = { ...prev, [name]: validateFactura(name, parsedValue) };
      if (name === 'incluyeIva' && value === 'no') {
        delete newErrors.valorIva;
      }
      return newErrors;
    });
  };

  useEffect(() => {
    setFormDataFactura((prev) => ({
      ...prev,
      totalAPagar: prev.incluyeIva === 'si' ? prev.totalSinIva + prev.valorIva : prev.totalSinIva
    }));
  }, [formDataFactura.totalSinIva, formDataFactura.valorIva, formDataFactura.incluyeIva]);

  const isFormValid = () => {
    const requiredFields = ['fecha', 'numeroFactura', 'totalSinIva'];
    if (formDataFactura.incluyeIva === 'si') requiredFields.push('valorIva');

    return (
      requiredFields.every((field) => !!formDataFactura[field as keyof FormDataFactura]) &&
      Object.values(errors).every((error) => !error)
    );
  };

  const handleNext = () => {
    const newErrors: FormErrors = {
      fecha: validateFactura('fecha', formDataFactura.fecha),
      numeroFactura: validateFactura('numeroFactura', formDataFactura.numeroFactura),
      totalSinIva: validateFactura('totalSinIva', formDataFactura.totalSinIva)
    };

    if (formDataFactura.incluyeIva === 'si') {
      newErrors.valorIva = validateFactura('valorIva', formDataFactura.valorIva);
    } else {
      setFormDataFactura((prev) => ({
        ...prev,
        valorIva: 0
      }));
    }

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
      numeroFactura: formDataFactura.numeroFactura,
      valorIva: formDataFactura.valorIva,
      valor: formDataFactura.totalSinIva,
      valorMasIva: formDataFactura.totalAPagar,
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
  
      valoresProductos = response.data.productosCreados.map((productoCreado: ProductoCreado) => ({
        valor: String(productoCreado.detalleFactura.valor).replace(/[$,]/g, ''), 
        idSubcuentaPropia: productoCreado.producto.tipoProducto.idSubcuentaPropia
      }));
  
      handleSubmitPago(idFactura);
  
      enqueueSnackbar('Productos guardados con éxito.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar los productos.', { variant: 'error' });
    }
  };

  const handleSubmitPago = async (idFac:number) => {
    if (!validateFormMedioPago()) return;

    const data = new FormData();
    data.append('idMedioPago', formDataMedioPago.medioPago);
    data.append('idTipoPago', formDataMedioPago.tipoPago);
    data.append('idFactura', idFac + '');
    data.append('idEntidadFinanciera', formDataMedioPago.entidadFinanciera);
    if (formDataMedioPago.factura) data.append('rutaFacturaFile', formDataMedioPago.factura);
    if (formDataMedioPago.comprobante)
      data.append('rutaComprobanteFile', formDataMedioPago.comprobante);
    data.append('valor', formDataFactura.totalAPagar + '');
    data.append('fecha', formDataFactura.fecha + '');
    data.append('idTercero', tercero.id + '');
    data.append('ivaSino', formDataFactura.incluyeIva + '');
    data.append('opcionAbono', formDataMedioPago.opcionAbono + '');
    data.append('valorAbono', formDataMedioPago.valorAbono + '');
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
                Registro de Compra con: <span className="italic">{tercero.nombre}</span>
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
                      <label className="block text-sm font-medium mb-2">Número de Factura *</label>
                      <input
                        type="text"
                        name="numeroFactura"
                        className="input"
                        value={formDataFactura.numeroFactura}
                        placeholder="Ingrese el número de factura"
                        onChange={handleChangeFactura}
                      />
                      {errors.numeroFactura && (
                        <p className="text-red-500 text-sm mt-1">{errors.numeroFactura}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">¿Incluye IVA? *</label>
                      <select
                        value={formDataFactura.incluyeIva}
                        name="incluyeIva"
                        className="input"
                        onChange={handleChangeFactura}
                      >
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Valor IVA *</label>
                      <NumericFormat
                        className="input"
                        prefix={'$'}
                        value={formDataFactura.valorIva}
                        decimalScale={3}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor del IVA"
                        disabled={formDataFactura.incluyeIva === 'no'}
                        onValueChange={(values) =>
                          handleChangeFactura({
                            target: { name: 'valorIva', value: values.floatValue || 0 }
                          } as any)
                        }
                      />
                      {errors.valorIva && formDataFactura.incluyeIva === 'si' && (
                        <p className="text-red-500 text-sm mt-1">{errors.valorIva}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Total sin IVA *</label>

                      <NumericFormat
                        className="input"
                        prefix={'$'}
                        value={formDataFactura.totalSinIva}
                        decimalScale={3}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el total sin IVA"
                        onValueChange={(values) =>
                          handleChangeFactura({
                            target: { name: 'totalSinIva', value: values.floatValue || 0 }
                          } as any)
                        }
                      />

                      {errors.totalSinIva && (
                        <p className="text-red-500 text-sm mt-1">{errors.totalSinIva}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Total a Pagar *</label>

                      <NumericFormat
                        className="input"
                        prefix={'$'}
                        value={formDataFactura.totalAPagar}
                        decimalScale={3}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Total a pagar"
                        disabled={true}
                        onChange={handleChangeFactura}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
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

                  {productos.length > 0 && (
                    <div className="card min-w-full mt-10">
                      <div className="card-table">
                        <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                          <thead>
                            <tr>
                              <th className="py-2">Clase de Producto</th>
                              <th className="py-2">Tipo de Producto</th>
                              <th className="py-2">Modelo</th>
                              <th className="py-2">Caracteristicas</th>
                              <th className="py-2 w-[120px]">Valor</th>
                              <th className="py-2">Serial</th>
                              <th className="py-2 w-[70px]"></th>
                              <th className="py-2 w-[70px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {productos.map((producto, index) => (
                              <tr key={index}>
                                <td className="py-2">
                                  {getNombreClaseProducto(Number(producto.claseProducto))}
                                </td>
                                <td className="py-2">
                                  {getNombreTipoProducto(Number(producto.idTipoProducto))}
                                </td>

                                <td className="py-2">{producto.modelo}</td>
                                <td className="py-2">{producto.caracteristicas}</td>
                                <td className="py-2">{producto.valor}</td>
                                <td className="py-2">{producto.serial}</td>
                                <td className="text-center">
                                  <button
                                    onClick={() => handleEdit(index)}
                                    className="btn btn-sm btn-icon btn-clear btn-light"
                                  >
                                    <KeenIcon icon="notepad-edit" />
                                  </button>
                                </td>
                                <td className="text-center">
                                  <button
                                    onClick={() => handleDelete(index)}
                                    className="btn btn-sm btn-icon btn-clear btn-light"
                                  >
                                    <KeenIcon icon="trash" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {productos.length > 0 && (
                    <div className="flex items-center mt-10 my-4">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-4 text-gray-500">Forma de pago</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}

                  {productos.length > 0 && (
                    <form className="mb-8">
                      <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Medios de Pago *</label>
                          <select
                            name="medioPago"
                            className="input"
                            value={formDataMedioPago.medioPago}
                            onChange={handleChangeMedioPago}
                          >
                            <option value="">Seleccione una opción</option>
                            {paymentMethods.map((medio) => (
                              <option key={medio.id} value={medio.id}>
                                {medio.detalleMedioPago}
                              </option>
                            ))}
                          </select>
                          {errorsMedioPago.medioPago && (
                            <p className="text-red-500 text-sm mt-1">{errorsMedioPago.medioPago}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Tipo de Pago *</label>
                          <select
                            name="tipoPago"
                            className="input"
                            value={formDataMedioPago.tipoPago}
                            onChange={handleChangeMedioPago}
                          >
                            <option value="">Seleccione una opción</option>
                            {paymentTypes.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.detalleTipoPago}
                              </option>
                            ))}
                          </select>
                          {errorsMedioPago.tipoPago && (
                            <p className="text-red-500 text-sm mt-1">{errorsMedioPago.tipoPago}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Entidad Financiera *
                          </label>
                          <select
                            name="entidadFinanciera"
                            className="input"
                            value={formDataMedioPago.entidadFinanciera}
                            onChange={handleChangeMedioPago}
                          >
                            <option value="">Seleccione una opción</option>
                            {entidadesFinancieras.map((entidad) => (
                              <option key={entidad.id} value={entidad.id}>
                                {entidad.nombre}
                              </option>
                            ))}
                          </select>
                          {errorsMedioPago.entidadFinanciera && (
                            <p className="text-red-500 text-sm mt-1">
                              {errorsMedioPago.entidadFinanciera}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Factura (Opcional)
                          </label>
                          <input
                            type="file"
                            name="factura"
                            className="file-input"
                            onChange={handleFileChangeMedioPago}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Comprobante de Pago (Opcional)
                          </label>
                          <input
                            type="file"
                            name="comprobante"
                            className="file-input"
                            onChange={handleFileChangeMedioPago}
                          />
                        </div>
                      </div>

                      {formDataMedioPago.tipoPago === '1' && (
                        <>
                          <div className="grid grid-cols-1 mb-4 mt-4 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                ¿Vas a realizar un abono?
                              </label>
                              <div className="flex gap-4">
                                <label>
                                  <input
                                    type="checkbox"
                                    name="opcionAbono"
                                    className="mr-2"
                                    value="si"
                                    checked={formDataMedioPago.opcionAbono === 'si'}
                                    onChange={handleChangeMedioPago}
                                  />
                                  Sí
                                </label>
                                <label>
                                  <input
                                    type="checkbox"
                                    name="opcionAbono"
                                    className="mr-2"
                                    value="no"
                                    checked={formDataMedioPago.opcionAbono === 'no'}
                                    onChange={handleChangeMedioPago}
                                  />
                                  No
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Valor del Abono (Si eligió Sí) */}
                          {formDataMedioPago.opcionAbono === 'si' && (
                            <div className="grid grid-cols-1 mb-4 mt-4 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Valor del Abono *
                                </label>
                                <div>
                                  <NumericFormat
                                    className="input"
                                    prefix={'$'}
                                    name="valorAbono"
                                    decimalScale={3}
                                    thousandsGroupStyle="thousand"
                                    thousandSeparator=","
                                    placeholder="Ingrese el Valor del Abono"
                                    value={formDataMedioPago.valorAbono}
                                    onValueChange={(values) =>
                                      setFormDataMedioPago((prev) => ({
                                        ...prev,
                                        valorAbono: values.value
                                      }))
                                    }
                                  />
                                  {errorsMedioPago.valorAbono && (
                                    <p className="text-red-500 text-sm mt-1">
                                      {errorsMedioPago.valorAbono}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </form>
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

export { RegistroCompraPage };
