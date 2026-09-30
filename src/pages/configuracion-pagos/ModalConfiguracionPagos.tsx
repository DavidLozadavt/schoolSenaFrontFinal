import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import Select from 'react-select';
import Spinner from '@/components/loaders/Spinner';
import { useSnackbar } from 'notistack';
import {
  ConfiguracionPagosVariant,
  existeProcesoMatricula,
  getLabelsConfiguracionPagos
} from './configuracionPagosShared';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
  variant?: ConfiguracionPagosVariant;
}

interface ConfiguracionPagoVigencia {
  id?: number;
  idConfiguracionPago?: number;
  valor: number;
  fechaInicial: string;
  fechaFinal: string | null;
}

const ModalConfiguracionPagos = ({
  open,
  onClose,
  data,
  onSave,
  variant = 'pagos'
}: ModalProps) => {
  const labels = getLabelsConfiguracionPagos(variant);
  const { enqueueSnackbar } = useSnackbar();
  const [errorTitulo, setErrorTitulo] = useState('');
  const [tituloPago, setTituloPago] = useState('');
  const [description, setDescription] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [porcentaje, setPorcentaje] = useState<number | ''>('');
  const [displayPorcentaje, setDisplayPorcentaje] = useState<string>('');
  const [estado, setEstado] = useState<string>('ACTIVO');
  const [idProceso, setIdProceso] = useState<number>(0);
  const [errorProceso, setErrorProceso] = useState('');
  const [procesos, setProcesos] = useState<any[]>([]);
  const [clasesVehiculo, setClasesVehiculo] = useState<any[]>([]);
  const [idClaseVehiculo, setIdClaseVehiculo] = useState<string>('');
  const [idsClaseVehiculo, setIdsClaseVehiculo] = useState<number[]>([]);
  // const [subCuentasPropias, setSubCuentasPropias] = useState<any[]>([]);
  // const [centrosCostos, setCentrosCostos] = useState<any[]>([]);
  // const [idCentroCosto, setIdCentroCosto] = useState<string>('');
  // const [errorCentroCosto, setErrorCentroCosto] = useState('');
  // const [idContabilizacion, setIdContabilizacion] = useState<string>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<
    'RECIBO DE CAJA' | 'COMPROBANTE DE EGRESO' | 'NOTA CONTABLE' | 'FACTURA DE VENTA' | ''
  >('');
  const [ivaSi, setIvaSi] = useState<'SI' | 'NO'>('NO');
  const [porcentajeIva, setPorcentajeIva] = useState<number | ''>('');
  const [displayPorcentajeIva, setDisplayPorcentajeIva] = useState<string>('');
  const [repetirPago, setRepetirPago] = useState<'SI' | 'NO'>('NO');
  const [frecuenciaPago, setFrecuenciaPago] = useState<'MENSUAL' | 'QUINCENAL' | ''>('');
  const [topeValor, setTopeValor] = useState<number>(0);
  const [displayTopeValor, setDisplayTopeValor] = useState<string>('');
  const [frecuenciaTope, setFrecuenciaTope] = useState<'DIARIO' | 'QUINCENAL' | 'MENSUAL' | ''>('');
  const [obligatorioPlanilla, setObligatorioPlanilla] = useState<'SI' | 'NO'>('NO');
  const [loading, setLoading] = useState<boolean>(false);
  const [vigenciaFechaInicial, setVigenciaFechaInicial] = useState<string>('');
  const [vigenciaFechaFinal, setVigenciaFechaFinal] = useState<string>('');
  const [errorVigencia, setErrorVigencia] = useState('');
  const [vigencias, setVigencias] = useState<ConfiguracionPagoVigencia[]>([]);
  const [savingVigenciaId, setSavingVigenciaId] = useState<number | null>(null);
  const [forzarNuevaVigencia, setForzarNuevaVigencia] = useState<boolean>(false);
  const idVigenciaActualFormulario = Number(
    data?.configuracionPagoVigenciaActual?.id ??
      data?.configuracion_pago_vigencia_actual?.id ??
      0
  );

  const procesoSeleccionadoNombre = useMemo(() => {
    const proceso = procesos.find((p: any) => Number(p.id) === Number(idProceso));
    return String(proceso?.nombreProceso || '')
      .trim()
      .toUpperCase();
  }, [idProceso, procesos]);

  const ocultarValorPorProceso = useMemo(() => {
    return procesoSeleccionadoNombre === 'VENTA TIQUETES';
  }, [procesoSeleccionadoNombre]);

  const ocultarValorPorTitulo = useMemo(() => {
    return (
      String(tituloPago || '')
        .trim()
        .toUpperCase() === 'PLANILLA'
    );
  }, [tituloPago]);

  const ocultarCampoValor = useMemo(() => {
    return ocultarValorPorProceso || ocultarValorPorTitulo;
  }, [ocultarValorPorProceso, ocultarValorPorTitulo]);

  const ocultarRepetirPagoPorProceso = useMemo(() => {
    return (
      procesoSeleccionadoNombre === 'VENTA TIQUETES' || procesoSeleccionadoNombre === 'PLANILLA'
    );
  }, [procesoSeleccionadoNombre]);

  const esProcesoPlanilla = useMemo(() => {
    return procesoSeleccionadoNombre === 'PLANILLA';
  }, [procesoSeleccionadoNombre]);

  const procesoOptions = useMemo(
    () =>
      procesos.map((proceso: any) => ({
        value: Number(proceso.id),
        label: String(proceso.nombreProceso || `Proceso #${proceso.id}`)
      })),
    [procesos]
  );

  const procesoMatriculaDisponible = useMemo(
    () => existeProcesoMatricula(procesos),
    [procesos]
  );

  const claseVehiculoOptions = useMemo(
    () =>
      clasesVehiculo.map((clase: any) => ({
        value: Number(clase.id),
        label: String(clase.nombre || clase.descripcion || `Clase #${clase.id}`)
      })),
    [clasesVehiculo]
  );

  const formatCurrency = (value: number): string => {
    if (value === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleValueChange = (inputValue: string) => {
    const cleaned = inputValue.replace(/\D/g, '');
    const numericValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
    const valorActualVigencia = Number(
      data?.configuracionPagoVigenciaActual?.valor ??
        data?.configuracion_pago_vigencia_actual?.valor ??
        0
    );
    setValor(numericValue);
    setDisplayValue(formatCurrency(numericValue));
    if (numericValue > 0) {
      setPorcentaje('');
      setDisplayPorcentaje('');
    }
    if (numericValue === 0) {
      setVigenciaFechaInicial('');
      setVigenciaFechaFinal('');
      setErrorVigencia('');
    }
    if (
      data?.id &&
      (data?.configuracionPagoVigenciaActual?.id || data?.configuracion_pago_vigencia_actual?.id)
    ) {
      const cambioValorVigencia = numericValue !== valorActualVigencia;
      setForzarNuevaVigencia(cambioValorVigencia);
      if (cambioValorVigencia) {
        setVigenciaFechaInicial('');
        setVigenciaFechaFinal('');
        setErrorVigencia('');
      }
    }
  };

  const handlePorcentajeIvaChange = (inputValue: string) => {
    const cleaned = inputValue.replace(',', '.').replace(/[^0-9.]/g, '');
    if (cleaned === '') {
      setPorcentajeIva('');
      setDisplayPorcentajeIva('');
      return;
    }
    const numericValue = Number(cleaned);
    setPorcentajeIva(Number.isFinite(numericValue) ? numericValue : '');
    setDisplayPorcentajeIva(cleaned);
  };

  const handlePorcentajeChange = (inputValue: string) => {
    const cleaned = inputValue.replace(',', '.').replace(/[^0-9.]/g, '');
    if (cleaned === '') {
      setPorcentaje('');
      setDisplayPorcentaje('');
      return;
    }
    const numericValue = Number(cleaned);
    setPorcentaje(Number.isFinite(numericValue) ? numericValue : '');
    setDisplayPorcentaje(cleaned);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      setValor(0);
      setDisplayValue('');
    }
  };

  const handleTopeValorChange = (inputValue: string) => {
    const cleaned = inputValue.replace(/\D/g, '');
    const numericValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setTopeValor(numericValue);
    setDisplayTopeValor(formatCurrency(numericValue));
    if (numericValue === 0) {
      setFrecuenciaTope('');
    }
  };

  const normalizeVigencias = useCallback((vigenciasDataRaw: any): ConfiguracionPagoVigencia[] => {
    if (!Array.isArray(vigenciasDataRaw)) return [];
    return vigenciasDataRaw
      .map((v: any) => ({
        id: v?.id ? Number(v.id) : undefined,
        idConfiguracionPago: v?.idConfiguracionPago ? Number(v.idConfiguracionPago) : undefined,
        valor: Number(v?.valor || 0),
        fechaInicial: String(v?.fechaInicial || v?.fecha_inicial || ''),
        fechaFinal: v?.fechaFinal || v?.fecha_final || null
      }))
      .filter((v: ConfiguracionPagoVigencia) => v.valor >= 0);
  }, []);

  const fetchVigencias = useCallback(async (idConfiguracionPago: number) => {
    try {
      const response = await axios.get(`configuracion_pago_vigencias/${idConfiguracionPago}`);
      const list = normalizeVigencias(response.data);
      setVigencias(list);
    } catch {
      // fallback silencioso cuando el endpoint aún no existe o no responde.
    }
  }, [normalizeVigencias]);

  const handleUpdateVigencia = async (row: ConfiguracionPagoVigencia) => {
    if (!row.id) return;
    if (!row.fechaInicial && row.fechaFinal) {
      setErrorVigencia('En historial, no puedes definir fecha final sin fecha inicial.');
      return;
    }
    if (row.fechaInicial && !row.fechaFinal) {
      setErrorVigencia('En historial, si hay fecha inicial la fecha final es obligatoria.');
      return;
    }
    if (row.fechaFinal && row.fechaFinal < row.fechaInicial) {
      setErrorVigencia('En historial, la fecha final no puede ser menor a la inicial.');
      return;
    }
    setErrorVigencia('');
    setSavingVigenciaId(row.id);
    try {
      await axios.put(`update_configuracion_pago_vigencia/${row.id}`, {
        valor: row.valor,
        fechaInicial: row.fechaInicial,
        fechaFinal: row.fechaFinal
      });
      if (data?.id) {
        await fetchVigencias(Number(data.id));
      }
    } catch (e) {
      console.error('Error al actualizar vigencia:', e);
    } finally {
      setSavingVigenciaId(null);
    }
  };

  useEffect(() => {
    // const fetchCentros = async () => {
    //   setLoading(true);
    //   try {
    //     const res = await axios.get('cost_centers');
    //     setCentrosCostos(Array.isArray(res.data) ? res.data : []);
    //     setErrorCentroCosto('');
    //   } catch {
    //     setErrorCentroCosto('Error al cargar los centros de costo');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const fetchCatalogos = async () => {
      setLoading(true);
      try {
        const [procesosRes] = await Promise.all([
          axios.get('procesos'),
          // axios.get('get_all_contabilizaciones'),
          // axios.get('clase_vehiculos')
        ]);
        setProcesos(Array.isArray(procesosRes.data) ? procesosRes.data : []);
        // setSubCuentasPropias(
        //   Array.isArray(contabilizacionesRes.data) ? contabilizacionesRes.data : []
        // );
        // setClasesVehiculo(Array.isArray(clasesVehiculoRes.data) ? clasesVehiculoRes.data : []);
      } catch (error) {
        console.error('Error al obtener catálogos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogos();
    // fetchCentros();

    if (data) {
      setTituloPago(data?.titulo || data.tituloPago || '');
      setDescription(data?.detalle || data.descripcion || '');
      const vigenciaActualRaw =
        data?.configuracionPagoVigenciaActual ??
        data?.configuracion_pago_vigencia_actual ??
        null;
      const valorDesdeVigenciaActual =
        vigenciaActualRaw && vigenciaActualRaw.valor !== null && vigenciaActualRaw.valor !== undefined
          ? Number(vigenciaActualRaw.valor)
          : null;
      const valorData = valorDesdeVigenciaActual ?? (data?.valor || 0);
      setValor(valorData);
      setDisplayValue(formatCurrency(valorData));
      const rawPorcentaje =
        data?.porcentaje ??
        data?.configuracion_pago?.porcentaje ??
        data?.porcentaje_pago ??
        data?.configuracion_pago?.porcentaje_pago ??
        null;
      const porcentajeNum =
        rawPorcentaje !== null && rawPorcentaje !== undefined && String(rawPorcentaje).trim() !== ''
          ? Number(rawPorcentaje)
          : '';
      setPorcentaje(Number.isFinite(Number(porcentajeNum)) ? (porcentajeNum as number | '') : '');
      setDisplayPorcentaje(porcentajeNum === '' ? '' : String(porcentajeNum).replace(/\.0+$/, ''));
      setEstado(data?.estado || 'ACTIVO');
      const idProcesoData =
        data?.idProceso ??
        data?.id_proceso ??
        data?.asignacion_proceso_pago?.idProceso ??
        data?.asignacion_proceso_pago?.id_proceso ??
        0;
      setIdProceso(Number(idProcesoData) || 0);
      const idClaseVehiculoData =
        data?.idClaseVehiculo ??
        data?.id_clase_vehiculo ??
        data?.configuracion_pago?.idClaseVehiculo ??
        data?.configuracion_pago?.id_clase_vehiculo ??
        '';
      setIdClaseVehiculo(idClaseVehiculoData ? String(idClaseVehiculoData) : '');
      const idsClaseVehiculoDataRaw =
        data?.idClaseVehiculos ??
        data?.id_clase_vehiculos ??
        data?.configuracion_pago?.idClaseVehiculos ??
        data?.configuracion_pago?.id_clase_vehiculos ??
        data?.asignacion_configuracion_pago_clase_vehiculo?.map(
          (item: any) => item?.idClaseVehiculo ?? item?.id_clase_vehiculo
        ) ??
        data?.asignacionConfiguracionPagoClaseVehiculo?.map(
          (item: any) => item?.idClaseVehiculo ?? item?.id_clase_vehiculo
        ) ??
        null;
      if (Array.isArray(idsClaseVehiculoDataRaw)) {
        setIdsClaseVehiculo(
          idsClaseVehiculoDataRaw
            .map((id: any) => Number(id))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        );
      } else if (idClaseVehiculoData) {
        const parsed = Number(idClaseVehiculoData);
        setIdsClaseVehiculo(Number.isFinite(parsed) && parsed > 0 ? [parsed] : []);
      } else {
        setIdsClaseVehiculo([]);
      }
      const idConta =
        data?.idContabilizacion ??
        data?.configuracion_pago?.idContabilizacion ??
        data?.id_contabilizacion ??
        data?.configuracion_pago?.id_contabilizacion ??
        '';
      // setIdContabilizacion(idConta ? String(idConta) : '');
      // const idCentroCostoData =
      //   data?.idCentroCosto ??
      //   data?.id_centro_costo ??
      //   data?.configuracion_pago?.idCentroCosto ??
      //   data?.configuracion_pago?.id_centro_costo ??
      //   '';
      // setIdCentroCosto(idCentroCostoData ? String(idCentroCostoData) : '');
      const rawTipoMovimiento =
        data?.tipoMovimiento ??
        data?.tipo_movimiento ??
        data?.configuracion_pago?.tipoMovimiento ??
        data?.configuracion_pago?.tipo_movimiento ??
        '';
      const tipoMovimientoNormalizado = String(rawTipoMovimiento || '')
        .trim()
        .toUpperCase();
      if (
        tipoMovimientoNormalizado === 'RECIBO DE CAJA' ||
        tipoMovimientoNormalizado === 'COMPROBANTE DE EGRESO' ||
        tipoMovimientoNormalizado === 'NOTA CONTABLE' ||
        tipoMovimientoNormalizado === 'FACTURA DE VENTA'
      ) {
        setTipoMovimiento(
          tipoMovimientoNormalizado as
            | 'RECIBO DE CAJA'
            | 'COMPROBANTE DE EGRESO'
            | 'NOTA CONTABLE'
            | 'FACTURA DE VENTA'
        );
      } else {
        setTipoMovimiento('');
      }
      const rawPorcentajeIva =
        data?.porcentajeIva ??
        data?.porcentajeIva ??
        data?.porcentaje_iva ??
        data?.porcentaje_iva ??
        null;
      const aplicaIva =
        rawPorcentajeIva !== null &&
        rawPorcentajeIva !== undefined &&
        String(rawPorcentajeIva).trim() !== '';
      setIvaSi(aplicaIva ? 'SI' : 'NO');

      const porcentajeIvaNum = aplicaIva ? Number(rawPorcentajeIva) || 0 : '';
      setPorcentajeIva(porcentajeIvaNum);
      setDisplayPorcentajeIva(
        porcentajeIvaNum === '' ? '' : String(porcentajeIvaNum).replace(/\.0+$/, '')
      );

      const rawRepetirPago =
        data?.repetirPago ?? data?.repetirPago ?? data?.repetir_pago ?? data?.repetir_pago ?? false;
      const aplicaRepeticion =
        rawRepetirPago === true ||
        rawRepetirPago === 1 ||
        String(rawRepetirPago).toLowerCase() === '1' ||
        String(rawRepetirPago).toLowerCase() === 'true' ||
        String(rawRepetirPago).toLowerCase() === 'si' ||
        String(rawRepetirPago).toLowerCase() === 'sí';
      setRepetirPago(aplicaRepeticion ? 'SI' : 'NO');

      const rawFrecuencia =
        data?.frecuenciaPago ??
        data?.frecuenciaPago ??
        data?.frecuencia_pago ??
        data?.frecuencia_pago ??
        '';
      const frecuenciaNormalizada = String(rawFrecuencia || '')
        .trim()
        .toUpperCase();
      if (frecuenciaNormalizada === 'MENSUAL' || frecuenciaNormalizada === 'QUINCENAL') {
        setFrecuenciaPago(frecuenciaNormalizada as 'MENSUAL' | 'QUINCENAL');
        setRepetirPago('SI');
      } else {
        setFrecuenciaPago('');
        setRepetirPago(aplicaRepeticion ? 'SI' : 'NO');
      }

      const rawTopeValor =
        data?.topeValor ??
        data?.tope_valor ??
        data?.configuracion_pago?.topeValor ??
        data?.configuracion_pago?.tope_valor ??
        null;
      const topeValorNum =
        rawTopeValor !== null && rawTopeValor !== undefined && String(rawTopeValor).trim() !== ''
          ? Number(rawTopeValor)
          : 0;
      setTopeValor(Number.isFinite(topeValorNum) ? topeValorNum : 0);
      setDisplayTopeValor(
        Number.isFinite(topeValorNum) && topeValorNum > 0 ? formatCurrency(topeValorNum) : ''
      );

      const rawFrecuenciaTope =
        data?.frecuenciaTope ??
        data?.frecuencia_tope ??
        data?.configuracion_pago?.frecuenciaTope ??
        data?.configuracion_pago?.frecuencia_tope ??
        '';
      const frecuenciaTopeNormalizada = String(rawFrecuenciaTope || '')
        .trim()
        .toUpperCase();
      if (
        frecuenciaTopeNormalizada === 'DIARIO' ||
        frecuenciaTopeNormalizada === 'QUINCENAL' ||
        frecuenciaTopeNormalizada === 'MENSUAL'
      ) {
        setFrecuenciaTope(frecuenciaTopeNormalizada as 'DIARIO' | 'QUINCENAL' | 'MENSUAL');
      } else {
        setFrecuenciaTope('');
      }

      const rawObligatorio =
        data?.obligatorio ??
        data?.configuracion_pago?.obligatorio ??
        data?.obligatorio_planilla ??
        data?.configuracion_pago?.obligatorio_planilla ??
        null;
      const aplicaObligatorio =
        rawObligatorio === true ||
        rawObligatorio === 1 ||
        String(rawObligatorio).toLowerCase() === '1' ||
        String(rawObligatorio).toLowerCase() === 'true' ||
        String(rawObligatorio).toLowerCase() === 'si' ||
        String(rawObligatorio).toLowerCase() === 'sí';
      const noObligatorio =
        rawObligatorio === false ||
        rawObligatorio === 0 ||
        String(rawObligatorio).toLowerCase() === '0' ||
        String(rawObligatorio).toLowerCase() === 'false' ||
        String(rawObligatorio).toLowerCase() === 'no';

      if (aplicaObligatorio) {
        setObligatorioPlanilla('SI');
      } else if (noObligatorio) {
        setObligatorioPlanilla('NO');
      } else {
        setObligatorioPlanilla('NO');
      }

      const vigenciasDataRaw =
        data?.configuracionPagoVigencia ??
        data?.configuracion_pago_vigencia ??
        data?.vigencias ??
        [];
      const vigenciasNormalizadas = normalizeVigencias(vigenciasDataRaw);
      const vigenciaActualNormalizada = vigenciaActualRaw
        ? {
            id: vigenciaActualRaw?.id ? Number(vigenciaActualRaw.id) : undefined,
            idConfiguracionPago: vigenciaActualRaw?.idConfiguracionPago
              ? Number(vigenciaActualRaw.idConfiguracionPago)
              : undefined,
            valor: Number(vigenciaActualRaw?.valor || 0),
            fechaInicial: String(vigenciaActualRaw?.fechaInicial || vigenciaActualRaw?.fecha_inicial || ''),
            fechaFinal: vigenciaActualRaw?.fechaFinal || vigenciaActualRaw?.fecha_final || null
          }
        : null;
      const vigenciasConActual =
        vigenciasNormalizadas.length > 0
          ? vigenciasNormalizadas
          : vigenciaActualNormalizada
            ? [vigenciaActualNormalizada]
            : [];
      setVigencias(vigenciasConActual);
      if (vigenciaActualNormalizada) {
        setVigenciaFechaInicial(vigenciaActualNormalizada.fechaInicial || '');
        setVigenciaFechaFinal(vigenciaActualNormalizada.fechaFinal || '');
      } else if (vigenciasConActual.length > 0) {
        const ultima = vigenciasConActual[vigenciasConActual.length - 1];
        setVigenciaFechaInicial(ultima.fechaInicial || '');
        setVigenciaFechaFinal(ultima.fechaFinal || '');
      } else {
        setVigenciaFechaInicial('');
        setVigenciaFechaFinal('');
      }
      setForzarNuevaVigencia(false);
      if (data?.id) {
        fetchVigencias(Number(data.id));
      }
    } else {
      clearFields();
    }
  }, [data, open, fetchVigencias, normalizeVigencias]);

  const clearFields = () => {
    setTituloPago('');
    setDescription('');
    setValor(0);
    setDisplayValue('');
    setPorcentaje('');
    setDisplayPorcentaje('');
    setEstado('ACTIVO');
    setIdProceso(0);
    setIdClaseVehiculo('');
    setIdsClaseVehiculo([]);
    setErrorProceso('');
    // setIdCentroCosto('');
    // setIdContabilizacion('');
    setTipoMovimiento('');
    setIvaSi('NO');
    setPorcentajeIva('');
    setDisplayPorcentajeIva('');
    setRepetirPago('NO');
    setFrecuenciaPago('');
    setTopeValor(0);
    setDisplayTopeValor('');
    setFrecuenciaTope('');
    setObligatorioPlanilla('NO');
    setVigenciaFechaInicial('');
    setVigenciaFechaFinal('');
    setErrorVigencia('');
    setVigencias([]);
    setSavingVigenciaId(null);
    setForzarNuevaVigencia(false);
  };

  const handleDeleteVigencia = async (row: ConfiguracionPagoVigencia) => {
    if (!row.id) return;
    setSavingVigenciaId(row.id);
    try {
      await axios.delete(`delete_configuracion_pago_vigencia/${row.id}`);
      if (data?.id) {
        await fetchVigencias(Number(data.id));
      } else {
        setVigencias((prev) => prev.filter((v) => v.id !== row.id));
      }
    } catch (e) {
      console.error('Error al eliminar vigencia:', e);
    } finally {
      setSavingVigenciaId(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tituloLimpio = String(tituloPago ?? '').trim();
      if (!tituloLimpio) {
        setErrorTitulo('El nombre del concepto es obligatorio.');
        return;
      }
      setErrorTitulo('');

      if (!idProceso || Number(idProceso) === 0) {
        setErrorProceso('El proceso es requerido.');
        return;
      }
      setErrorProceso('');

      if (
        variant === 'economicos' &&
        !ocultarCampoValor &&
        porcentaje === '' &&
        (valor < 0 || Number.isNaN(valor))
      ) {
        enqueueSnackbar('El valor debe ser numérico y mayor o igual a 0.', { variant: 'warning' });
        return;
      }
      if (
        !ocultarCampoValor &&
        porcentaje === '' &&
        valor > 0 &&
        !vigenciaFechaInicial &&
        vigenciaFechaFinal
      ) {
        setErrorVigencia('No puedes definir fecha final sin fecha inicial.');
        return;
      }
      if (
        !ocultarCampoValor &&
        porcentaje === '' &&
        valor > 0 &&
        vigenciaFechaInicial && !vigenciaFechaFinal
      ) {
        setErrorVigencia('Si defines fecha inicial, la fecha final es obligatoria.');
        return;
      }
      if (vigenciaFechaFinal && vigenciaFechaInicial && vigenciaFechaFinal < vigenciaFechaInicial) {
        setErrorVigencia('La fecha final no puede ser menor que la fecha inicial.');
        return;
      }
      setErrorVigencia('');

      const payload = {
        idProceso,
        idClaseVehiculo: esProcesoPlanilla
          ? idsClaseVehiculo.length === 1
            ? idsClaseVehiculo[0]
            : idClaseVehiculo
              ? Number(idClaseVehiculo)
              : null
          : null,
        idClaseVehiculos: esProcesoPlanilla ? idsClaseVehiculo : [],
        // idContabilizacion: idContabilizacion ? Number(idContabilizacion) : null,
        // idCentroCosto: idCentroCosto ? Number(idCentroCosto) : null,
        tipoMovimiento: tipoMovimiento || null,
        titulo: tituloLimpio,
        detalle: description,
        valor: ocultarCampoValor ? 0 : porcentaje !== '' && Number(porcentaje) > 0 ? null : valor,
        porcentaje:
          ocultarCampoValor || valor > 0 ? null : porcentaje === '' ? null : Number(porcentaje),
        porcentajeIva:
          ivaSi === 'SI' ? (porcentajeIva === '' ? null : Number(porcentajeIva)) : null,
        repetirPago: ocultarRepetirPagoPorProceso ? null : repetirPago === 'SI' ? 1 : null,
        frecuenciaPago:
          ocultarRepetirPagoPorProceso || repetirPago !== 'SI' ? null : frecuenciaPago || null,
        obligatorio: esProcesoPlanilla ? (obligatorioPlanilla === 'SI' ? 1 : 0) : null,
        topeValor: topeValor > 0 ? topeValor : null,
        frecuenciaTope: topeValor > 0 ? frecuenciaTope || null : null,
        estado: estado,
        eliminarConfiguracionPagoVigenciaId:
          data?.id &&
          (valor <= 0 || forzarNuevaVigencia) &&
          (data?.configuracionPagoVigenciaActual?.id ||
            data?.configuracion_pago_vigencia_actual?.id)
            ? Number(
                data?.configuracionPagoVigenciaActual?.id ||
                  data?.configuracion_pago_vigencia_actual?.id
              )
            : null,
        configuracionPagoVigencia:
          !ocultarCampoValor &&
          porcentaje === '' &&
          valor > 0 &&
          vigenciaFechaInicial &&
          vigenciaFechaFinal
            ? [
                {
                  ...(!forzarNuevaVigencia &&
                    (data?.configuracionPagoVigenciaActual?.id ||
                      data?.configuracion_pago_vigencia_actual?.id) && {
                      id: Number(
                        data?.configuracionPagoVigenciaActual?.id ||
                          data?.configuracion_pago_vigencia_actual?.id
                      )
                    }),
                  valor,
                  fechaInicial: vigenciaFechaInicial,
                  fechaFinal: vigenciaFechaFinal || null
                }
              ]
            : []
      };

      if (data) {
        await axios.put(`update_configuracion_pago/${data.id}`, payload);
      } else {
        await axios.post('store_configuracion_pago', payload);
      }

      enqueueSnackbar(
        data ? 'Configuración guardada correctamente' : 'Configuración creada correctamente',
        { variant: 'success' }
      );

      if (onSave) {
        onSave();
      }
      clearFields();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'No fue posible guardar la configuración';
      enqueueSnackbar(msg, { variant: 'error' });
      console.error('Error al guardar configuración de pago:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ocultarCampoValor) return;
    setValor(0);
    setDisplayValue('');
    setPorcentaje('');
    setDisplayPorcentaje('');
  }, [ocultarCampoValor]);

  useEffect(() => {
    if (!ocultarRepetirPagoPorProceso) return;
    setRepetirPago('NO');
    setFrecuenciaPago('');
  }, [ocultarRepetirPagoPorProceso]);

  useEffect(() => {
    if (procesoSeleccionadoNombre === 'TRANSPORTES') {
      setTipoMovimiento('FACTURA DE VENTA');
    }
  }, [procesoSeleccionadoNombre]);

  useEffect(() => {
    if (!data || idProceso) return;
    if (!Array.isArray(procesos) || procesos.length === 0) return;

    const nombreProcesoDesdeAsignacion =
      data?.asignacion_proceso_pago?.proceso?.nombreProceso ??
      data?.asignacionProcesoPago?.proceso?.nombreProceso ??
      data?.proceso?.nombreProceso ??
      '';
    const nombreNormalizado = String(nombreProcesoDesdeAsignacion).trim().toUpperCase();
    if (!nombreNormalizado) return;

    const procesoMatch = procesos.find(
      (p: any) =>
        String(p?.nombreProceso || '')
          .trim()
          .toUpperCase() === nombreNormalizado
    );
    if (procesoMatch?.id) {
      setIdProceso(Number(procesoMatch.id));
    }
  }, [data, idProceso, procesos]);

  useEffect(() => {
    if (esProcesoPlanilla) return;
    setObligatorioPlanilla('NO');
  }, [esProcesoPlanilla]);

  useEffect(() => {
    if (esProcesoPlanilla) return;
    setIdClaseVehiculo('');
    setIdsClaseVehiculo([]);
  }, [esProcesoPlanilla]);

  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const fontSize = isDarkMode ? '0.875rem' : '1rem';
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      width: '100%',
      backgroundColor: background,
      borderColor: state.isFocused
        ? isDarkMode
          ? '#4F46E5'
          : '#3B82F6'
        : isDarkMode
          ? '#374151'
          : '#D1D5DB',
      color,
      fontSize,
      boxShadow: state.isFocused
        ? isDarkMode
          ? '0 0 0 1px #4F46E5'
          : '0 0 0 1px #3B82F6'
        : 'none',
      '&:hover': {
        borderColor: isDarkMode ? '#4F46E5' : '#3B82F6'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color,
      fontSize
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9CA3AF',
      fontSize
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: iconColor,
      '&:hover': { color: iconColor }
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#374151' : '#D1D5DB'
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: background,
      color,
      borderRadius: '0.5rem',
      border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? '#4F46E5'
          : '#3B82F6'
        : state.isFocused
          ? isDarkMode
            ? '#374151'
            : '#F3F4F6'
          : background,
      color: state.isSelected ? 'white' : color,
      fontSize
    })
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        clearFields();
        onClose();
      }}
    >
    
           <ModalContent className="max-w-[700px] top-[5%] max-h-[100vh] overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
        <ModalHeader>
          <ModalTitle>{data ? labels.modalEdit : labels.modalCreate}</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={() => {
              clearFields();
              onClose();
            }}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        {loading && <Spinner />}
        <ModalBody className="grid gap-5 px-0 py-5">
          {variant === 'economicos' && !procesoMatriculaDisponible && (
            <div className="mx-auto w-[calc(100%-2rem)] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              No se encontró el proceso <strong>MATRICULA</strong> en el catálogo. Puede asociar el
              concepto a otro proceso existente. Solicite al administrador crear el proceso MATRICULA
              en base de datos si lo requiere para matrícula académica.
            </div>
          )}

          {variant === 'economicos' && (
            <p className="mx-auto w-[calc(100%-2rem)] text-xs text-gray-500 dark:text-gray-400">
              Los valores configurados preparan recibos o facturas (cobro pendiente). No
              procesan pagos en pasarela.
            </p>
          )}

          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="tituloDoc" className="text-sm font-medium text-gray-700">
              {labels.labelTitulo}
            </label>
            <input
              id="tituloDoc"
              className="input p-2 border border-gray-300 rounded-md"
              placeholder={labels.placeholderTitulo}
              type="text"
              value={tituloPago}
              disabled={
                String(tituloPago || '')
                  .trim()
                  .toUpperCase() === 'PLANILLA'
              }
              onChange={(e) => {
                setTituloPago(e.target.value);
                if (errorTitulo) setErrorTitulo('');
              }}
            />
            {errorTitulo ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errorTitulo}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
              {labels.labelDescripcion}
            </label>
            <textarea
              id="descripcion"
              className="textarea p-2 border border-gray-300 rounded-md"
              placeholder={labels.placeholderDescripcion}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="proceso" className="text-sm font-medium text-gray-700">
              Proceso
            </label>
            <Select
              inputId="proceso"
              options={procesoOptions}
              value={procesoOptions.find((opt) => Number(opt.value) === Number(idProceso)) || null}
              onChange={(selected: any) => {
                const value = selected ? Number(selected.value) : 0;
                setIdProceso(value);
                if (errorProceso) setErrorProceso('');
              }}
              placeholder="Seleccione un proceso..."
              isClearable
              isSearchable
              styles={customStyles}
              classNamePrefix="react-select"
            />
            {errorProceso && <p className="text-xs text-red-600 mt-1">{errorProceso}</p>}
          </div>

          {esProcesoPlanilla && (
            <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
              <label className="text-sm font-medium text-gray-700">
                Clase de vehículo (Opcional)
              </label>
              <Select
                options={claseVehiculoOptions}
                value={claseVehiculoOptions.filter((opt) => idsClaseVehiculo.includes(Number(opt.value)))}
                onChange={(selected: any) => {
                  const values = Array.isArray(selected)
                    ? selected
                        .map((opt: any) => Number(opt.value))
                        .filter((id: number) => Number.isFinite(id) && id > 0)
                    : [];
                  setIdsClaseVehiculo(values);
                  setIdClaseVehiculo(values.length === 1 ? String(values[0]) : '');
                }}
                placeholder="Seleccione una o varias clases de vehículo..."
                isClearable
                isMulti
                isSearchable
                styles={customStyles}
                classNamePrefix="react-select"
              />
            </div>
          )}

          {!ocultarCampoValor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-[calc(100%-2rem)] mx-auto">
              <div className="flex flex-col gap-1">
                <label htmlFor="valor" className="text-sm font-medium text-gray-700">
                  Valor del período actual (COP)
                </label>
                <div className="relative">
                  <input
                    id="valor"
                    className="input border border-gray-300 rounded-md w-full"
                    placeholder="0"
                    type="text"
                    value={displayValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="porcentaje_pago" className="text-sm font-medium text-gray-700">
                  Porcentaje %
                </label>
                <div className="relative">
                  <input
                    id="porcentaje_pago"
                    className="input border border-gray-300 rounded-md w-full"
                    placeholder="0"
                    type="text"
                    value={displayPorcentaje}
                    onChange={(e) => handlePorcentajeChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="md:col-span-2 text-xs text-gray-500">
                Puedes elegir un valor fijo o un porcentaje, si eliges un valor el porcentaje se
                deshabilitará y viceversa.
              </p>
            </div>
          )}
          {!ocultarCampoValor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-[calc(100%-2rem)] mx-auto">
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="vigencia_fecha_inicial" className="text-sm font-medium text-gray-700">
                  Fecha inicial del período actual
                </label>
                <input
                  id="vigencia_fecha_inicial"
                  className="input border border-gray-300 rounded-md w-full"
                  type="date"
                  value={vigenciaFechaInicial}
                  onChange={(e) => setVigenciaFechaInicial(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="vigencia_fecha_final" className="text-sm font-medium text-gray-700">
                  Fecha final del período actual (Opcional)
                </label>
                <input
                  id="vigencia_fecha_final"
                  className="input border border-gray-300 rounded-md w-full"
                  type="date"
                  value={vigenciaFechaFinal}
                  onChange={(e) => setVigenciaFechaFinal(e.target.value)}
                />
              </div>
              <p className="md:col-span-2 text-xs text-gray-500">
                La fecha inicial es opcional. Si la defines, la fecha final es obligatoria.
              </p>
              {errorVigencia && <p className="md:col-span-2 text-xs text-red-600">{errorVigencia}</p>}
            </div>
          )}
          {ocultarValorPorTitulo && (
            <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
              <label className="text-sm font-medium text-gray-700">Valor</label>
              <div className="rounded-md input border border-gray-200  px-3 py-2 text-sm text-gray-600">
                Se define por el valor del recaudo .
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-[calc(100%-2rem)] mx-auto">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="tope_valor" className="text-sm font-medium text-gray-700">
                Tope de cobro (COP)
              </label>
              <input
                id="tope_valor"
                className="input border border-gray-300 rounded-md w-full"
                placeholder="0"
                type="text"
                value={displayTopeValor}
                onChange={(e) => handleTopeValorChange(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="frecuencia_tope" className="text-sm font-medium text-gray-700">
                Periodicidad del tope
              </label>
              <select
                id="frecuencia_tope"
                className="select p-2 border border-gray-300 rounded-md"
                value={frecuenciaTope}
                onChange={(e) =>
                  setFrecuenciaTope(
                    (e.target.value as 'DIARIO' | 'QUINCENAL' | 'MENSUAL' | '') || ''
                  )
                }
              >
                <option value="">Sin tope periódico</option>
                <option value="DIARIO">DIARIO</option>
                <option value="QUINCENAL">QUINCENAL</option>
                <option value="MENSUAL">MENSUAL</option>
              </select>
            </div>

            <p className="md:col-span-2 text-xs text-gray-500">
              Si este pago llega al tope configurado en el periodo seleccionado, no se volverá a
              cobrar hasta el siguiente ciclo.
            </p>
          </div>

          {/* <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label className="text-sm font-medium text-gray-700">Contabilización</label>
            <Select
              options={subCuentasPropias.map((subcuenta: any) => ({
                value: subcuenta.id,
                label: (() => {
                  const debito = subcuenta.impuesto_contabilizacion?.[0]?.debito;
                  const codigo = debito?.codigo || '';
                  const nombre = debito?.nombreSubcuentaPropia || subcuenta.nombre || '';
                  return codigo ? `${codigo} - ${nombre}` : nombre;
                })()
              }))}
              value={
                idContabilizacion
                  ? {
                      value: Number(idContabilizacion),
                      label: (() => {
                        const match = subCuentasPropias.find(
                          (s: any) => Number(s.id) === Number(idContabilizacion)
                        );
                        const debito = match?.impuesto_contabilizacion?.[0]?.debito;
                        const codigo = debito?.codigo || '';
                        const nombre = debito?.nombreSubcuentaPropia || match?.nombre || '';
                        return codigo ? `${codigo} - ${nombre}` : nombre;
                      })()
                    }
                  : null
              }
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                setIdContabilizacion(String(value));
              }}
              placeholder="Seleccione una contabilización..."
              isClearable
              styles={customStyles}
              classNamePrefix="react-select"
            />
          </div> */}

          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="tipo_movimiento" className="text-sm font-medium text-gray-700">
              Tipo de movimiento contable
            </label>
            <select
              id="tipo_movimiento"
              className="select p-2 border border-gray-300 rounded-md"
              value={tipoMovimiento}
              disabled={procesoSeleccionadoNombre === 'TRANSPORTES'}
              onChange={(e) =>
                setTipoMovimiento(
                  (e.target.value as
                    | 'RECIBO DE CAJA'
                    | 'COMPROBANTE DE EGRESO'
                    | 'NOTA CONTABLE'
                    | 'FACTURA DE VENTA'
                    | '') || ''
                )
              }
            >
              <option value="">SIN DEFINIR</option>
              {/* <option value="RECIBO DE CAJA">RECIBO DE CAJA</option>
              <option value="COMPROBANTE DE EGRESO">COMPROBANTE DE EGRESO</option>
              <option value="NOTA CONTABLE">NOTA CONTABLE</option> */}
              <option value="FACTURA DE VENTA">FACTURA DE VENTA</option>
            </select>
            <p className="text-xs text-gray-500">
              Este campo define en qué documento contable se registrará este pago. Úsalo para
              separar ingresos, egresos o ajustes contables según tu proceso.
            </p>
          </div>

          {/* <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label className="text-sm font-medium text-gray-700">Centro de costo (Opcional)</label>

            <Select
              options={centrosCostos.map((centro: any) => ({
                value: centro.id,
                label: `${centro.descripcion || 'Sin descripción'}${centro.codigo ? ` - ${centro.codigo}` : ''}`
              }))}
              value={
                idCentroCosto
                  ? (() => {
                      const c = centrosCostos.find(
                        (c: any) => Number(c.id) === Number(idCentroCosto)
                      );

                      return c
                        ? {
                            value: Number(c.id),
                            label: `${c.descripcion || 'Sin descripción'}${c.codigo ? ` - ${c.codigo}` : ''}`
                          }
                        : {
                            value: Number(idCentroCosto),
                            label: `Centro #${idCentroCosto}`
                          };
                    })()
                  : null
              }
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                setIdCentroCosto(String(value));
              }}
              placeholder="Seleccione un centro de costo..."
              isClearable
              styles={customStyles}
              classNamePrefix="react-select"
            />

            {errorCentroCosto && <p className="text-xs text-red-500">{errorCentroCosto}</p>}
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-[calc(100%-2rem)] mx-auto">
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="iva_si" className="text-sm font-medium text-gray-700">
                IVA
              </label>
              <select
                id="iva_si"
                className="select p-2 border border-gray-300 rounded-md"
                value={ivaSi}
                onChange={(e) => {
                  const value = (e.target.value as 'SI' | 'NO') || 'NO';
                  setIvaSi(value);
                  if (value === 'NO') {
                    setPorcentajeIva('');
                    setDisplayPorcentajeIva('');
                  }
                }}
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>

            {!ocultarRepetirPagoPorProceso && (
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="repetir_pago" className="text-sm font-medium text-gray-700">
                  ¿Repetir pago?
                </label>
                <select
                  id="repetir_pago"
                  className="select p-2 border border-gray-300 rounded-md"
                  value={repetirPago}
                  onChange={(e) => {
                    const value = (e.target.value as 'SI' | 'NO') || 'NO';
                    setRepetirPago(value);
                    if (value === 'NO') {
                      setFrecuenciaPago('');
                    }
                  }}
                >
                  <option value="NO">NO</option>
                  <option value="SI">SI</option>
                </select>
              </div>
            )}

            {esProcesoPlanilla && (
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="obligatorio_planilla" className="text-sm font-medium text-gray-700">
                  Cobro Obligatorio
                </label>
                <select
                  id="obligatorio_planilla"
                  className="select p-2 border border-gray-300 rounded-md"
                  value={obligatorioPlanilla}
                  onChange={(e) => setObligatorioPlanilla((e.target.value as 'SI' | 'NO') || 'NO')}
                  required
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            )}

            {!ocultarRepetirPagoPorProceso && repetirPago === 'SI' && (
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="frecuencia_pago" className="text-sm font-medium text-gray-700">
                  Frecuencia
                </label>
                <select
                  id="frecuencia_pago"
                  className="select p-2 border border-gray-300 rounded-md"
                  value={frecuenciaPago}
                  onChange={(e) =>
                    setFrecuenciaPago((e.target.value as 'MENSUAL' | 'QUINCENAL' | '') || '')
                  }
                >
                  <option value="">Seleccione una opción</option>
                  <option value="MENSUAL">MENSUAL</option>
                  <option value="QUINCENAL">QUINCENAL</option>
                </select>
              </div>
            )}
          </div>

          {ivaSi === 'SI' && (
            <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
              <label htmlFor="porcentaje_iva" className="text-sm font-medium text-gray-700">
                Porcentaje IVA
              </label>
              <input
                id="porcentaje_iva"
                className="input border border-gray-300 rounded-md w-full"
                placeholder="0"
                type="text"
                value={displayPorcentajeIva}
                onChange={(e) => handlePorcentajeIvaChange(e.target.value)}
              />
            </div>
          )}

          {data && (
            <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
              <label htmlFor="estado" className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="estado"
                className="select p-2 border border-gray-300 rounded-md"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2 w-[calc(100%-2rem)] mx-auto border-t pt-4">
            <label className="text-sm font-medium text-gray-700">Historial de vigencias</label>
            <div className="overflow-x-auto border rounded-md">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs uppercase font-semibold">Valor</th>
                    <th className="text-left text-xs uppercase font-semibold">Fecha inicial</th>
                    <th className="text-left text-xs uppercase font-semibold">Fecha final</th>
                    <th className="text-left text-xs uppercase font-semibold">Guardar</th>
                    <th className="text-left text-xs uppercase font-semibold">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {vigencias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-sm text-gray-500 py-3">
                        No hay historial de vigencias.
                      </td>
                    </tr>
                  ) : (
                    vigencias.map((row, index) => (
                      <tr key={row.id || index}>
                        <td>
                          <input
                            className="input border border-gray-300 rounded-md w-full"
                            type="text"
                            value={formatCurrency(Number(row.valor || 0))}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              const numericValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
                              setVigencias((prev) =>
                                prev.map((v, i) => (i === index ? { ...v, valor: numericValue } : v))
                              );
                              if (Number(row.id || 0) > 0 && Number(row.id) === idVigenciaActualFormulario) {
                                setValor(numericValue);
                                setDisplayValue(formatCurrency(numericValue));
                                if (numericValue > 0) {
                                  setPorcentaje('');
                                  setDisplayPorcentaje('');
                                }
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className="input border border-gray-300 rounded-md w-full"
                            type="date"
                            value={row.fechaInicial || ''}
                            onChange={(e) =>
                              {
                                const newFechaInicial = e.target.value;
                                setVigencias((prev) =>
                                  prev.map((v, i) =>
                                    i === index ? { ...v, fechaInicial: newFechaInicial } : v
                                  )
                                );
                                if (
                                  Number(row.id || 0) > 0 &&
                                  Number(row.id) === idVigenciaActualFormulario
                                ) {
                                  setVigenciaFechaInicial(newFechaInicial);
                                }
                              }
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="input border border-gray-300 rounded-md w-full"
                            type="date"
                            value={row.fechaFinal || ''}
                            onChange={(e) =>
                              {
                                const newFechaFinal = e.target.value || null;
                                setVigencias((prev) =>
                                  prev.map((v, i) =>
                                    i === index ? { ...v, fechaFinal: newFechaFinal } : v
                                  )
                                );
                                if (
                                  Number(row.id || 0) > 0 &&
                                  Number(row.id) === idVigenciaActualFormulario
                                ) {
                                  setVigenciaFechaFinal(newFechaFinal || '');
                                }
                              }
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            disabled={!row.id || savingVigenciaId === row.id}
                            onClick={() => handleUpdateVigencia(row)}
                          >
                            {savingVigenciaId === row.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-xs btn-danger"
                            disabled={!row.id || savingVigenciaId === row.id}
                            onClick={() => handleDeleteVigencia(row)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-4 mt-4">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                clearFields();
                onClose();
              }}
            >
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-sm btn-primary">
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalConfiguracionPagos };



