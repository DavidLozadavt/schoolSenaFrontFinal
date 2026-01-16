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
import { ModalMarca } from '@/pages/gestion-productos/modales/ModalMarca';
import { ModalCategoria } from '@/pages/gestion-productos/modales/ModalCategoria';
import { ModalMedida } from '@/pages/gestion-productos/modales/ModalMedida';
const RegistrarFactura = () => {
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
  const [modalOpenMedida, setModalOpenMedida] = useState(false);
  const [modalOpenCategoria, setModalOpenCategoria] = useState(false);
  const [modalOpenMarca, setModalOpenMarca] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

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

  // Autocomplete / products
  const [productsSelect, setProductsSelect] = useState<any[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSelectedExists, setProductSelectedExists] = useState(false);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  const fetchProductsForSelect = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get('products_select');
      setProductsSelect(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setProductsSelect([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const onProductSelected = async (product: any | null) => {
    if (product) {
      try {
        await fetchClaseProductos();
        await fetchCategories();
        await fetchBrands();
        await fetchMedidas();
        await fetchTipoProductos(product.tipoProducto?.idClaseProducto); // ← AQUÍ EL FIX QUE TE FALTABA

        setFormData((prev) => ({
          ...prev,
          idProducto: product.id,
          claseProducto: product.tipoProducto?.claseProducto?.id || null,
          idTipoProducto: product.tipoProducto?.id || product.idTipoProducto || null,
          idMarca: product.marca?.id || product.idMarca || null,
          idCategoria: product.categoria?.id || product.idCategoria || null,
          idMedida: product.medida?.id || product.idMedida || null,
          modelo: product.modelo || '',
          caracteristicas: product.caracteristicas || '',
          serial: product.serial || ''
        }));

        setFormImagePreview(product.rutaProductoUrl || null);
        setFormFile(null);
        setProductSelectedExists(true);
      } catch (err) {
        console.log(err);
      }
    } else {
      setFormData({
        claseProducto: null,
        idTipoProducto: null,
        idMarca: null,
        idCategoria: null,
        idMedida: null,
        modelo: '',
        caracteristicas: '',
        valor: '',
        serial: ''
      });
      setFormFile(null);
      setFormImagePreview(null);
      setProductSelectedExists(false);
    }

    setShowProducts(false);
    setProductQuery('');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFormFile(f);
    if (f) setFormImagePreview(URL.createObjectURL(f));
  };

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
    { id: 2, title: 'Paso 2', subtitle: 'Agrega productos y detalles (marca, categoría, imagen, cantidad)' }
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

  const fetchMedidas = async () => {
    try {
      const res = await axios.get('medidas');
      setMedidas(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Error al cargar medidas');
      setMedidas([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('categorias');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Error al cargar categorias');
      setCategories([]);
    }
  };

  const fetchBrands = async (idClase?: number) => {
    try {
      const url = idClase ? `marcas/${idClase}` : 'marcas';
      const res = await axios.get(url);
      setBrands(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Error al cargar marcas');
      setBrands([]);
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
    id?: number; // temporal local id
    idProducto?: number | null; // existing product id
    claseProducto: number | null;
    idTipoProducto: number | null;
    idMedida?: number | null;
    idCategoria?: number | null;
    idMarca?: number | null;
    modelo: string;
    caracteristicas: string;
    valor: string;
    serial: string;
    cantidad?: number;
    file?: File | null;
    imagen?: string | null;
  }

  const [formData, setFormData] = useState<Producto>({
    claseProducto: null,
    idTipoProducto: null,
    modelo: '',
    caracteristicas: '',
    valor: '',
    serial: '',
    cantidad: 0,
    file: null,
    imagen: null
  });

  const [medidas, setMedidas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [errorsP, setErrorsP] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: string | number | null | undefined) => {
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
      if (key === 'file' || key === 'imagen') return; // skip file fields
      const error = validateField(key, formData[key as keyof Producto] as any);
      if (error) newErrors[key] = error;
    });

    setErrorsP(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (editIndex !== null) {
      const updatedProductos = [...productos];
      updatedProductos[editIndex] = { ...formData, imagen: formImagePreview };
      setProductos(updatedProductos);
      setEditIndex(null);
    } else {
      setProductos([...productos, { ...formData, imagen: formImagePreview }]);
    }

    // reset form fields
    setFormData({
      claseProducto: null,
      idTipoProducto: null,
      modelo: '',
      caracteristicas: '',
      valor: '',
      serial: '',
      cantidad: 0,
      file: null,
      imagen: null
    });
    setFormFile(null);
    setFormImagePreview(null);
    setCantidad(1);
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
      const facturaCreada = response.data;
      setIdFactura(facturaCreada.id);
      enqueueSnackbar('Factura guardada con éxito.', { variant: 'success' });
      handleSaveProductos(facturaCreada.id);
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
    // entidadFinanciera es opcional ahora (no marcar como obligatorio)
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

  const [valoresProductos, setValoresProductos] = useState<
    { valor: string; idSubcuentaPropia: number }[]
  >([]);

  const handleSaveProductos = async (idFactura: number) => {
    if (!idFactura) {
      enqueueSnackbar('No hay una factura asociada.', { variant: 'warning' });
      return;
    }

    try {
      const fd = new FormData();
      fd.append('idFactura', String(idFactura));

      productos.forEach((producto, i) => {
        fd.append(`productos[${i}][idProducto]`, String(producto.idProducto ?? ''));
        fd.append(`productos[${i}][claseProducto]`, String(producto.claseProducto ?? ''));
        fd.append(`productos[${i}][idTipoProducto]`, String(producto.idTipoProducto ?? ''));
        fd.append(`productos[${i}][idMedida]`, String(producto.idMedida ?? ''));
        fd.append(`productos[${i}][idCategoria]`, String(producto.idCategoria ?? ''));
        fd.append(`productos[${i}][idMarca]`, String(producto.idMarca ?? ''));
        fd.append(`productos[${i}][modelo]`, String(producto.modelo ?? ''));
        fd.append(`productos[${i}][caracteristicas]`, String(producto.caracteristicas ?? ''));
        fd.append(`productos[${i}][valor]`, String(producto.valor).replace(/[$,]/g, '') ?? '');
        fd.append(`productos[${i}][serial]`, String(producto.serial ?? ''));
        fd.append(`productos[${i}][cantidad]`, String(producto.cantidad ?? 0));
        if (producto.file) {
          fd.append(`productos[${i}][imagen]`, producto.file as File);
        }
      });

      const response = await axios.post('store_producto_inventario', fd);

      const productosCreados = response?.data?.productosCreados;
      if (!Array.isArray(productosCreados) || productosCreados.length === 0) {
        console.error('Respuesta inesperada al crear productos:', response?.data);
        enqueueSnackbar('Productos guardados pero respuesta inesperada del servidor.', {
          variant: 'warning'
        });
      } else {
        const nuevosValores = productosCreados.map((productoCreado: ProductoCreado) => {
          const detalleValor = String(productoCreado.detalleFactura?.valor ?? '').replace(
            /[$,]/g,
            ''
          );
          let idSubcuenta = 0;
          try {
            const tp: any = productoCreado.producto?.tipoProducto as any;
            idSubcuenta =
              tp?.idSubcuentaPropia ?? (tp?.claseProducto as any)?.idSubcuentaPropia ?? 0;
          } catch (e) {
            idSubcuenta = 0;
          }
          return { valor: detalleValor, idSubcuentaPropia: idSubcuenta };
        });
        setValoresProductos(nuevosValores);

        handleSubmitPago(idFactura);
        enqueueSnackbar('Productos guardados con éxito.', { variant: 'success' });
      }
    } catch (error: any) {
      console.error('Error guardando productos:', error);
      if (error?.response?.data) {
        console.error('Respuesta del servidor (productos):', error.response.data);
        // intentar mostrar mensaje específico si existe
        const serverMsg =
          typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
        enqueueSnackbar(`Error al guardar los productos: ${serverMsg}`, { variant: 'error' });
      } else {
        enqueueSnackbar('Error al guardar los productos.', { variant: 'error' });
      }
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
      // reset all forms and return to step 1 empty
      resetAll();
    } catch (error) {
      console.error('Error al enviar:', error);
    }
  };

  const resetAll = () => {
    // reset factura
    setFormDataFactura({
      fecha: '',
      numeroFactura: '',
      incluyeIva: 'si',
      valorIva: 0,
      totalSinIva: 0,
      totalAPagar: 0
    });
    // reset productos
    setProductos([]);
    setFormData({
      claseProducto: null,
      idTipoProducto: null,
      modelo: '',
      caracteristicas: '',
      valor: '',
      serial: '',
      cantidad: 0,
      file: null,
      imagen: null
    });
    setFormFile(null);
    setFormImagePreview(null);
    // reset medio de pago
    setFormDataMedioPago({
      medioPago: '',
      tipoPago: '',
      entidadFinanciera: '',
      factura: null,
      comprobante: null,
      opcionAbono: 'no',
      valorAbono: ''
    });
    setErrorsMedioPago({});
    setErrors({});
    setIdFactura(null);
    setValoresProductos([] as any);
    setCurrentStep(1);
  };

  /**
   * Envia un abono (pago parcial) para una factura.
   * @param idFactura id de la factura
   * @param valorAbono valor del abono
   */
  const crearPagoAbono = async (idFactura: number, valorAbono: number): Promise<void> => {
    // Validación básica antes de enviar
    if (!idFactura || isNaN(Number(idFactura))) {
      console.error('Id factura inválido:', idFactura);
      enqueueSnackbar('Id de factura inválido.', { variant: 'error' });
      return;
    }

    if (valorAbono == null || isNaN(Number(valorAbono))) {
      console.error('Valor de abono inválido:', valorAbono);
      enqueueSnackbar('Valor de abono inválido.', { variant: 'error' });
      return;
    }

    // Construir FormData porque el controlador actual espera multipart/form-data
    const form = new FormData();
    form.append('idFactura', String(Number(idFactura)));
    // permitir enviar null/'' si el usuario no provee valorAbono, pero aquí convertimos a cadena
    form.append('valorAbono', String(Number(valorAbono)));

    // Log entries para ayudar a debug si el servidor sigue rechazando
    try {
      for (const e of Array.from((form as any).entries()) as [string, any][]) {
        console.log('FormData entry:', e[0], e[1]);
      }
    } catch (logErr) {
      // ignore logging errors
    }

    try {
      // No establecer Content-Type; axios/browsers lo manejan
      const resp = await axios.post('store_pago_factura', form);
      console.log('Abono registrado con éxito (FormData):', resp.data);
      enqueueSnackbar('Abono registrado con éxito.', { variant: 'success' });
      return;
    } catch (err: any) {
      console.error('Error enviando FormData:', err);
      if (err?.response?.data) console.error('Respuesta del servidor:', err.response.data);
      enqueueSnackbar('Error al registrar abono.', { variant: 'error' });
      return;
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
      navigate('/factura/proveedor', { replace: true });
      return;
    }
    fetchClaseProductos();
    fetchPaymentTypes();
    fetchPaymentMethods();
    // fetch related selects
    fetchMedidas();
    fetchCategories();
    fetchBrands();
    fetchProductsForSelect();
  }, [tercero, navigate]);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Registro de Compra con:
                <span className="italic">{tercero?.nombre ?? 'Cargando...'}</span>
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
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Producto Existente (Opcional)
                        </label>
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => {
                            // limpiar selección de producto
                            setProductQuery('');
                            setProductsSelect([]);
                            setShowProducts(false);
                            setProductSelectedExists(false);
                            setFormFile(null);
                            setFormImagePreview(null);
                            setFormData({
                              claseProducto: null,
                              idTipoProducto: null,
                              modelo: '',
                              caracteristicas: '',
                              valor: '',
                              serial: '',
                              cantidad: 0,
                              file: null,
                              imagen: null
                            });
                          }}
                        >
                          Limpiar
                        </button>
                      </div>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Buscar..."
                        value={productQuery}
                        onFocus={() => {
                          // cargar sugerencias cuando el usuario enfoque el input
                          fetchProductsForSelect();
                          setShowProducts(true);
                        }}
                        onChange={(e) => {
                          setProductQuery(e.target.value);
                          setShowProducts(true);
                        }}
                      />
                    </div>

                    {showProducts && (
                      <div className="mb-4">
                        <div className="bg-white dark:bg-neutral-900 border rounded shadow max-h-48 overflow-auto">
                          {productsLoading ? (
                            <div className="p-3 text-center">Cargando...</div>
                          ) : productsSelect.filter((p) =>
                              (p.caracteristicas || p.modelo || '')
                                .toLowerCase()
                                .includes((productQuery || '').toLowerCase())
                            ).length === 0 ? (
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                              No hay resultados
                            </div>
                          ) : (
                            productsSelect
                              .filter((p) =>
                                (p.caracteristicas || p.modelo || '')
                                  .toLowerCase()
                                  .includes((productQuery || '').toLowerCase())
                              )

                              .map((p) => (
                                <div
                                  key={p.id}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                  onClick={() => onProductSelected(p)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900 dark:text-neutral-50">
                                        {p.caracteristicas}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-neutral-50">
                                        Modelo: {p.modelo}
                                      </div>
                                    </div>
                                    {p.rutaProductoUrl && (
                                      <img
                                        src={p.rutaProductoUrl}
                                        className="h-8 w-8 object-cover rounded"
                                      />
                                    )}
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Clase de Producto *
                        </label>
                        <div className="flex items-center">
                          <select
                            name="claseProducto"
                            className="select w-full mr-2"
                            value={formData.claseProducto ?? ''}
                            disabled={productSelectedExists}
                            onChange={(event) => {
                              // sólo permitir cambio si NO es un producto ya existente
                              if (!productSelectedExists) {
                                handleChange(event);
                                handleClaseChange(event);
                              }
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
                            type="button"
                            className="w-10 h-10 btn btn-sm btn-light"
                            onClick={() => setModalOpenClaseProducto(true)}
                            disabled={productSelectedExists} // desactiva abrir modal para crear nueva clase si el producto existe
                          >
                            <KeenIcon icon="plus" />
                          </button>
                        </div>
                        {errorsP.claseProducto && (
                          <p className="text-red-500 text-sm mt-1">{errorsP.claseProducto}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Producto *</label>
                        <div className="flex items-center">
                          <select
                            name="idTipoProducto"
                            className="select w-full mr-2"
                            value={formData.idTipoProducto ?? ''}
                            disabled={productSelectedExists}
                            onChange={(event) => {
                              if (!productSelectedExists) {
                                handleChange(event);
                              }
                            }}
                          >
                            <option value="">Seleccione una opción</option>
                            {tipoProductos.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.nombreTipoProducto}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="w-10 h-10 btn btn-sm btn-light"
                            onClick={() => setModalOpenTipoProducto(true)}
                            disabled={productSelectedExists}
                          >
                            <KeenIcon icon="plus" />
                          </button>
                        </div>
                        {errorsP.idTipoProducto && (
                          <p className="text-red-500 text-sm mt-1">{errorsP.idTipoProducto}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Modelo</label>
                        <input
                          type="text"
                          name="modelo"
                          placeholder="Ingrese el modelo"
                          className="input w-full mr-2"
                          value={formData.modelo}
                          disabled={productSelectedExists}
                          onChange={(e) => {
                            if (!productSelectedExists) {
                              handleChange(e);
                            }
                          }}
                        />

                        {errorsP.modelo && (
                          <p className="text-red-500 text-sm mt-1">{errorsP.modelo}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Caracteristicas</label>
                        <textarea
                          rows={3}
                          name="caracteristicas"
                          placeholder="Ingrese las Características"
                          className="textarea"
                          value={formData.caracteristicas}
                          disabled={productSelectedExists}
                          onChange={(e) => {
                            if (!productSelectedExists) {
                              handleChange(e);
                            }
                          }}
                        />

                        {errorsP.caracteristicas && (
                          <p className="text-red-500 text-sm mt-1">{errorsP.caracteristicas}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Medida</label>
                        <div className="flex items-center">
                          <select
                            name="idMedida"
                            className="select w-full mr-2"
                            value={formData.idMedida ?? ''}
                            disabled={productSelectedExists}
                            onChange={(event) => {
                              if (!productSelectedExists) {
                                handleChange(event);
                              }
                            }}
                          >
                            <option value="">Seleccione</option>
                            {medidas?.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.unidadMedida ||
                                  m.unidad_medida ||
                                  m.nombreMedida ||
                                  m.nombre ||
                                  String(m.valor || '')}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="w-10 h-10 btn btn-sm btn-light"
                            onClick={() => setModalOpenMedida(true)}
                            disabled={productSelectedExists}
                          >
                            <KeenIcon icon="plus" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Categoría</label>
                        <div className="flex items-center">
                          <select
                            name="idCategoria"
                            className="select w-full mr-2"
                            value={formData.idCategoria ?? ''}
                            disabled={productSelectedExists}
                            onChange={(event) => {
                              if (!productSelectedExists) {
                                handleChange(event);
                              }
                            }}
                          >
                            <option value="">Seleccione</option>
                            {categories?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombreCategoria || c.nombre}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="w-10 h-10 btn btn-sm btn-light"
                            onClick={() => setModalOpenCategoria(true)}
                            disabled={productSelectedExists}
                          >
                            <KeenIcon icon="plus" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Marca</label>
                        <div className="flex items-center">
                          <select
                            name="idMarca"
                            className="select w-full mr-2"
                            value={formData.idMarca ?? ''}
                            disabled={productSelectedExists}
                            onChange={(event) => {
                              if (!productSelectedExists) {
                                handleChange(event);
                              }
                            }}
                          >
                            <option value="">Seleccione</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.marca || b.nombre}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="w-10 h-10 btn btn-sm btn-light"
                            onClick={() => setModalOpenMarca(true)}
                            disabled={productSelectedExists}
                          >
                            <KeenIcon icon="plus" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Serial</label>
                        <input
                          type="text"
                          name="serial"
                          placeholder="Ingrese el serial"
                          className="input w-full"
                          value={String(formData.serial ?? '')}
                          disabled={productSelectedExists}
                          onChange={(e) => {
                            if (!productSelectedExists) {
                              const { name, value } = e.target;
                              setFormData((prev) => ({ ...prev, [name]: value }));
                              setErrorsP((prevErrors) => ({
                                ...prevErrors,
                                [name]: validateField(name, value as any) ?? ''
                              }));
                            }
                          }}
                        />

                        {errorsP.serial && (
                          <p className="text-red-500 text-sm mt-1">{errorsP.serial}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Valor</label>
                          <NumericFormat
                            className="input"
                            prefix="$"
                            name="valor"
                            value={formData.valor}
                            onChange={handleChange}
                            decimalScale={3}
                            thousandsGroupStyle="thousand"
                            thousandSeparator=","
                            placeholder="Ingrese el valor"
                          />
                          {errorsP.valor && (
                            <p className="text-red-500 text-sm mt-1">{errorsP.valor}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Cantidad</label>
                          <input
                            type="number"
                            name="cantidad"
                            className="input"
                            required
                            min={1}
                            value={formData.cantidad ?? ''}
                            onChange={(e) => {
                              let val = Number(e.target.value);
                              if (isNaN(val)) val = 0;
                              setFormData((prev) => ({ ...prev, cantidad: val }));
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="file"
                          className='file-input'
                          accept="image/*"
                          disabled={productSelectedExists}
                          onChange={(e) => {
                            if (!productSelectedExists) {
                              handleFileSelected(e);
                              setFormData((prev) => ({
                                ...prev,
                                file: e.target.files?.[0] ?? null
                              }));
                            }
                          }}
                        />

                        {formImagePreview && (
                          <div className="mt-2">
                            <img
                              src={formImagePreview}
                              className="h-20 w-20 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-end">
                        <button type="submit" className="btn-primary btn rounded-md">
                          {editIndex !== null ? 'Actualizar Producto' : 'Añadir Producto'}
                        </button>
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
                              <th className="py-2">Imagen</th>
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
                                <td className="py-2">
                                  {producto.imagen || (producto as any).rutaProductoUrl ? (
                                    <img
                                      src={producto.imagen || (producto as any).rutaProductoUrl}
                                      alt="img"
                                      className="h-10 w-10 object-cover rounded"
                                    />
                                  ) : (
                                    <span className="text-xs text-gray-500">Sin imagen</span>
                                  )}
                                </td>
                                <td className="py-2">{producto.valor}</td>
                                <td className="py-2">{producto.serial}</td>
                                <td className="text-center">
                                  <button
                                    onClick={() => {
                                      setIsEditingProduct(true);
                                      handleEdit(index);
                                    }}
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
                            className="select"
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
                            className="select"
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
                            Entidad Financiera (Opcional)
                          </label>
                          <select
                            name="entidadFinanciera"
                            className="select"
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
                          {/* ¿Vas a realizar un abono? */}
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

        <ModalMedida
          open={modalOpenMedida}
          onClose={() => setModalOpenMedida(false)}
          onSave={() => {
            fetchMedidas();
            setModalOpenMedida(false);
          }}
        />

        <ModalCategoria
          open={modalOpenCategoria}
          onClose={() => setModalOpenCategoria(false)}
          onSave={() => {
            fetchCategories();
            setModalOpenCategoria(false);
          }}
        />

        <ModalMarca
          open={modalOpenMarca}
          onClose={() => setModalOpenMarca(false)}
          onSave={() => {
            fetchBrands();
            setModalOpenMarca(false);
          }}
        />
      </Container>
    </Fragment>
  );
};

export { RegistrarFactura };
