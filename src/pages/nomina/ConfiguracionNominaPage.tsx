import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLayout } from '@/providers';

import { Scrollspy } from '@/components/scrollspy/Scrollspy';
import clsx from 'clsx';
import { useResponsive, useScrollPosition } from '@/hooks';

import { SettingsConfiguracionNomina } from './SettingsConfiguracionNomina';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';
const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--tw-header-height)+var(--tw-navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--tw-header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]'
};

interface FormDataInterface {
  id: string;
  numHorasMes: string;
  diaPago: string;
  valorHorasExD: string;
  valorHorasExN: string;
  valorHorasFD: string;
  valorHorasFN: string;
  valorHorasExFD: string;
  valorHorasExFN: string;
  smlv: string;
  valAuxTransporte: string;
  porcentajeSalud: string;
  porcentajePension: string;
  porcentajeFsp: string;
  porcentajeNivelEndeudamineto: string;
  porcentajeAporteSalud: string | null;
  porcentajeAportePension: string | null;
  porcentajeAporteFsp: string | null;
  porcentajeCajaComp: string;
  porcentajeIcbf: string;
  porcentajeSena: string;
  porcentajeCesantias: string;
  porcentajeIntCesantias: string;
  porcentajePrima: string;
  porcentajeVacaciones: string;
  comparacionAuxTrans: string;
  numAuxTrans: string;
  comparacionFsp: string;
  numAuxFsp: string;
  comparacionRetefuente: string;
  valRetefuente: string;
  totalPagar: string;
  valUVT: string;
  numAuxUVTRetefuente: string;
  periodo: string;
  idEmpresa: string;
  created_at: string;
  updated_at: string;
}

const ConfiguracionNominaPage = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { currentLayout } = useLayout();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) {
      parentRef.current = scrollableElement;
    }
  }, []);

  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition, currentLayout?.options]);

  const stickyClass = currentLayout?.name
    ? stickySidebarClasses[currentLayout.name] || 'top-[calc(var(--tw-header-height)+1rem)]'
    : 'top-[calc(var(--tw-header-height)+1rem)]';

  const [formData, setFormData] = useState<FormDataInterface>({
    id: '',
    numHorasMes: '',
    diaPago: '',
    valorHorasExD: '',
    valorHorasExN: '',
    valorHorasFD: '',
    valorHorasFN: '',
    valorHorasExFD: '',
    valorHorasExFN: '',
    smlv: '',
    valAuxTransporte: '',
    porcentajeSalud: '',
    porcentajePension: '',
    porcentajeFsp: '',
    porcentajeNivelEndeudamineto: '',
    porcentajeAporteSalud: null,
    porcentajeAportePension: null,
    porcentajeAporteFsp: null,
    porcentajeCajaComp: '',
    porcentajeIcbf: '',
    porcentajeSena: '',
    porcentajeCesantias: '',
    porcentajeIntCesantias: '',
    porcentajePrima: '',
    porcentajeVacaciones: '',
    comparacionAuxTrans: '',
    numAuxTrans: '',
    comparacionFsp: '',
    numAuxFsp: '',
    comparacionRetefuente: '',
    valRetefuente: '',
    totalPagar: '',
    valUVT: '',
    numAuxUVTRetefuente: '',
    periodo: '',
    idEmpresa: '',
    created_at: '',
    updated_at: ''
  });

  const fetchData = async () => {
    try {
      const response = await axios.get('configurations_nomina');
      setConfig(response.data);

      setFormData((prevState) => ({
        ...prevState,
        ...response.data
      }));
    } catch (error) {
      setError('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const [porcentajeSMLV, setPorcentajeSMLV] = useState('');

  const handleSavePorcentajeSMLV = async () => {
    if (!porcentajeSMLV.trim()) {
      enqueueSnackbar('Por favor, ingrese un porcentaje de incremento.', { variant: 'warning' });
      return;
    }

    const porcentajeNum = parseFloat(porcentajeSMLV);
    if (isNaN(porcentajeNum) || porcentajeNum < 0 || porcentajeNum > 100) {
      enqueueSnackbar('El porcentaje debe ser un número entre 0 y 100.', { variant: 'error' });
      return;
    }

    const payload = {
      incremento_anual_smlv: porcentajeNum
    };

    try {
      if (config?.id) {
        await axios.post(`update_solicitud_by_supervisor/${config?.id}`, payload);
        enqueueSnackbar('Porcentaje actualizado con éxito.', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Errror al actualizar el porcentaje', { variant: 'error' });
    }
  };

  const handleInputChangeSMLV = (e: any) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) {
      enqueueSnackbar('Solo se permiten números.', { variant: 'error' });
      return;
    }

    const porcentajeNum = parseFloat(value);
    if (!isNaN(porcentajeNum)) {
      if (porcentajeNum > 100) {
        setPorcentajeSMLV('100');
        enqueueSnackbar('El porcentaje no puede ser mayor a 100.', { variant: 'warning' });
      } else if (porcentajeNum < 0) {
        setPorcentajeSMLV('0');
        enqueueSnackbar('El porcentaje no puede ser menor a 0.', { variant: 'warning' });
      } else {
        setPorcentajeSMLV(value);
      }
    } else {
      setPorcentajeSMLV(value);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === 'periodo' && (!/^\d{4}$/.test(value) || parseInt(value) <= 0)) {
        newErrors[name] = 'El campo Año debe contener exactamente 4 cifras';
      } else {
        delete newErrors[name];
      }

      if (name === 'smlv' && !value) {
        newErrors[name] = 'El campo SMLV es obligatorio';
      } else {
        delete newErrors[name];
      }

      if (name === 'valAuxTransporte' && !value) {
        newErrors[name] = 'El campo valor es obligatorio';
      } else {
        delete newErrors[name];
      }

      if (name === 'valUVT' && !value) {
        newErrors[name] = 'El campo Valor es obligatorio';
      } else {
        delete newErrors[name];
      }

      const decimalFields = ['numAuxTrans', 'numAuxFsp', 'numAuxUVTRetefuente'];
      if (decimalFields.includes(name)) {
        if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          newErrors[name] = 'El campo debe ser un número válido con hasta dos decimales';
        } else {
          delete newErrors[name];
        }
      }

      const percentageFields = [
        'porcentajeSalud',
        'porcentajePension',
        'porcentajeCajaComp',
        'porcentajeFsp',
        'porcentajeVacaciones',
        'porcentajePrima',
        'porcentajeIntCesantias',
        'porcentajeCesantias',
        'porcentajeSena',
        'porcentajeIcbf',
        'porcentajeCajaComp',
        'porcentajeNivelEndeudamineto'
      ];
      if (percentageFields.includes(name)) {
        const percentageValue = parseFloat(value);
        if (
          isNaN(percentageValue) ||
          percentageValue < 0 ||
          percentageValue > 100 ||
          !/^\d{1,3}(\.\d+)?$/.test(value)
        ) {
          newErrors[name] = 'El porcentaje debe ser un número entre 0 y 100';
        } else {
          delete newErrors[name];
        }
      }

      if (['comparacionAuxTrans', 'comparacionFsp', 'comparacionRetefuente'].includes(name)) {
        if (value === '') {
          newErrors[name] = 'Debe seleccionar una opción';
        } else {
          delete newErrors[name];
        }
      }

      if (
        name === 'diaPago' &&
        (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 31)
      ) {
        newErrors[name] = 'El campo día de pago debe ser un número entre 1 y 31';
      } else {
        delete newErrors[name];
      }

      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.periodo || !/^\d{4}$/.test(formData.periodo) || parseInt(formData.periodo) <= 0) {
      newErrors['periodo'] = 'El campo Año debe contener exactamente 4 cifras';
    }

    if (!formData.smlv) {
      newErrors['smlv'] = 'El campo SMLV es obligatorio';
    }

    if (!formData.valAuxTransporte) {
      newErrors['valAuxTransporte'] = 'El campo valor es obligatorio';
    }

    if (!formData.valUVT) {
      newErrors['valUVT'] = 'El campo valor es obligatorio';
    }

    const decimalFields: (keyof FormDataInterface)[] = [
      'numAuxTrans',
      'numAuxFsp',
      'numAuxUVTRetefuente'
    ];
    decimalFields.forEach((field) => {
      if (!formData[field] || !/^\d+(\.\d{1,2})?$/.test(formData[field] || '')) {
        newErrors[field] = 'El campo debe ser un número válido con hasta dos decimales';
      }
    });

    const percentageFields: (keyof FormDataInterface)[] = [
      'porcentajeSalud',
      'porcentajePension',
      'porcentajeCajaComp',
      'porcentajeFsp',
      'porcentajeVacaciones',
      'porcentajePrima',
      'porcentajeIntCesantias',
      'porcentajeCesantias',
      'porcentajeSena',
      'porcentajeIcbf',
      'porcentajeCajaComp',
      'porcentajeNivelEndeudamineto'
    ];
    percentageFields.forEach((field) => {
      const percentageValue = parseFloat(formData[field] || '');
      if (
        isNaN(percentageValue) ||
        percentageValue < 0 ||
        percentageValue > 100 ||
        !/^\d{1,3}(\.\d+)?$/.test(formData[field] || '')
      ) {
        newErrors[field] = 'El porcentaje debe ser un número entre 0 y 100';
      }
    });

    const comparisonFields: (keyof FormDataInterface)[] = [
      'comparacionAuxTrans',
      'comparacionFsp',
      'comparacionRetefuente'
    ];
    comparisonFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'Debe seleccionar una opción';
      }
    });

    if (
      !formData.diaPago ||
      !/^\d+$/.test(formData.diaPago) ||
      parseInt(formData.diaPago) < 1 ||
      parseInt(formData.diaPago) > 31
    ) {
      newErrors['diaPago'] = 'El campo día de pago debe ser un número entre 1 y 31';
    }

    if (Object.keys(newErrors).length > 0) {
      enqueueSnackbar('Por favor revise de nuevo el formulario.', {
        variant: 'solid',
        state: 'warning'
      });
      setErrors(newErrors);
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    const formPayload = {
      periodo: formData.periodo,
      smlv: String(formData.smlv).replace(/[$,]/g, ''),
      numHorasMes: formData.numHorasMes,
      diaPago: formData.diaPago,
      valorHorasFD: String(formData.valorHorasFD).replace(/[$,]/g, ''),
      valorHorasFN: String(formData.valorHorasFN).replace(/[$,]/g, ''),
      valUVT: String(formData.valUVT).replace(/[$,]/g, ''),
      valAuxTransporte: String(formData.valAuxTransporte).replace(/[$,]/g, ''),
      numAuxTrans: formData.numAuxTrans,
      valorHorasExD: String(formData.valorHorasExD).replace(/[$,]/g, ''),
      valorHorasExN: String(formData.valorHorasExN).replace(/[$,]/g, ''),
      valorHorasExFD: String(formData.valorHorasExFD).replace(/[$,]/g, ''),
      valorHorasExFN: String(formData.valorHorasExFN).replace(/[$,]/g, ''),
      numAuxUVTRetefuente: formData.numAuxUVTRetefuente,
      numAuxFsp: formData.numAuxFsp,
      porcentajeSalud: formData.porcentajeSalud,
      porcentajePension: formData.porcentajePension,
      porcentajeFsp: formData.porcentajeFsp,
      comparacionAuxTrans: formData.comparacionAuxTrans,
      comparacionRetefuente: formData.comparacionRetefuente,
      comparacionFsp: formData.comparacionFsp,
      porcentajePrima: formData.porcentajePrima,
      porcentajeVacaciones: formData.porcentajeVacaciones,
      porcentajeIntCesantias: formData.porcentajeIntCesantias,
      porcentajeCesantias: formData.porcentajeCesantias,
      porcentajeSena: formData.porcentajeSena,
      porcentajeIcbf: formData.porcentajeIcbf,
      porcentajeCajaComp: formData.porcentajeCajaComp,
      porcentajeNivelEndeudamineto: formData.porcentajeNivelEndeudamineto
    };

    try {
      if (config && config.id) {
        await axios.put(`configurations_nomina/${config.id}`, formPayload);
        enqueueSnackbar('Configuración actualizada con éxito.', {
          variant: 'success'
        });
        fetchData();
      } else {
        await axios.post('configurations_nomina', formPayload);
        enqueueSnackbar('Configuración guardada con éxito.', {
          variant: 'success'
        });
        fetchData();
      }
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', {
        variant: 'solid',
        state: 'danger'
      });
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Configuración de Nómina</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="flex grow gap-5 lg:gap-7.5">
          {desktopMode && (
            <div className="w-[230px] shrink-0">
              <div
                className={clsx(
                  'w-[230px]',
                  sidebarSticky && `fixed z-10 left-auto ${stickyClass}`
                )}
              >
                <Scrollspy offset={100} targetRef={parentRef}>
                  <SettingsConfiguracionNomina />
                </Scrollspy>
              </div>
            </div>
          )}

          <form>
            <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
              <div className="card pb-2.5">
                <div className="card-header" id="1">
                  <h3 className="card-title">Configuración de Valores</h3>
                </div>
                <div className="card-body grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Año</label>
                      <input
                        className="input"
                        type="text"
                        id="periodo"
                        name="periodo"
                        value={formData.periodo}
                        onChange={handleInputChange}
                        placeholder="Ingrese el año"
                      />
                    </div>

                    {errors.periodo && (
                      <div className="text-red-500 text-sm mt-1">{errors.periodo}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Salario Minimo Vigente
                      </label>

                      <NumericFormat
                        id="smlv"
                        name="smlv"
                        className="input"
                        prefix={'$'}
                        value={formData.smlv}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor del SMLV"
                      />
                    </div>
                    {errors.smlv && <div className="text-red-500 text-sm mt-1">{errors.smlv}</div>}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Incremento Anual SMLV
                      </label>
                      <input
                        className="input"
                        type="text"
                        placeholder="Ingrese porcentaje de incremento"
                        value={porcentajeSMLV}
                        onChange={handleInputChangeSMLV}
                      />{' '}
                      %
                      <button className="btn btn-sm btn-success" onClick={handleSavePorcentajeSMLV}>
                        <i className="ki-outline ki-check"></i>
                      </button>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Número de Horas Mensuales
                      </label>
                      <input
                        id="numHorasMes"
                        name="numHorasMes"
                        value={formData.numHorasMes}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese el número de horas mensuales"
                      />
                    </div>
                    {errors.numHorasMes && (
                      <div className="text-red-500 text-sm mt-1">{errors.numHorasMes}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Dia pago Nómina
                      </label>
                      <input
                        className="input"
                        type="text"
                        id="diaPago"
                        name="diaPago"
                        value={formData.diaPago}
                        onChange={handleInputChange}
                        placeholder="Ingrese el día de pago de nómina"
                      />
                    </div>
                    {errors.diaPago && (
                      <div className="text-red-500 text-sm mt-1">{errors.diaPago}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Festivas Diurna
                      </label>

                      <NumericFormat
                        id="valorHorasFD"
                        name="valorHorasFD"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasFD}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de festivas diurnas"
                      />
                    </div>
                    {errors.valorHorasFD && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasFD}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Festivas Nocturna
                      </label>

                      <NumericFormat
                        id="valorHorasFN"
                        name="valorHorasFN"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasFN}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de festivas nocturnas"
                      />
                    </div>
                    {errors.valorHorasFN && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasFN}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Valor UVT Vigente
                      </label>

                      <NumericFormat
                        id="valUVT"
                        name="valUVT"
                        className="input"
                        prefix={'$'}
                        value={formData.valUVT}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor UVT vigente"
                      />
                    </div>
                    {errors.valUVT && (
                      <div className="text-red-500 text-sm mt-1">{errors.valUVT}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Porcentaje Nivel Endeudamiento
                      </label>
                      <input
                        id="porcentajeNivelEndeudamineto"
                        name="porcentajeNivelEndeudamineto"
                        value={formData.porcentajeNivelEndeudamineto}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese el porcentaje"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeNivelEndeudamineto && (
                      <div className="text-red-500 text-sm mt-1">
                        {errors.porcentajeNivelEndeudamineto}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="2">
                  <h3 className="card-title">Auxilio de Transporte</h3>
                </div>
                <div className="card-body">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Valor</label>

                      <NumericFormat
                        id="valAuxTransporte"
                        name="valAuxTransporte"
                        className="input"
                        prefix={'$'}
                        value={formData.valAuxTransporte}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor"
                      />
                    </div>
                    {errors.valAuxTransporte && (
                      <div className="text-red-500 text-sm mt-1">{errors.valAuxTransporte}</div>
                    )}
                  </div>

                  <div className="w-full mt-4">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Límite</label>
                      <select
                        className="select"
                        name="comparacionAuxTrans"
                        value={formData.comparacionAuxTrans}
                        onChange={handleInputChange}
                      >
                        <option value="" disabled selected>
                          Elija una opción
                        </option>
                        <option value="MAYOR">MAYOR</option>
                        <option value="MENOR">MENOR</option>
                        <option value="IGUAL">IGUAL</option>
                      </select>{' '}
                      a{' '}
                      <input
                        className="input w-[150px]"
                        type="text"
                        id="numAuxTrans"
                        name="numAuxTrans"
                        value={formData.numAuxTrans}
                        onChange={handleInputChange}
                        placeholder="Ingrese un valor"
                      />{' '}
                      SLVM
                    </div>
                    {errors.comparacionAuxTrans && (
                      <div className="text-red-500 text-sm mt-1">{errors.comparacionAuxTrans}</div>
                    )}
                    {errors.numAuxTrans && (
                      <div className="text-red-500 text-sm mt-1">{errors.numAuxTrans}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="3">
                  <h3 className="card-title">Horas Extras</h3>
                </div>
                <div className="card-body grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Diurnas</label>

                      <NumericFormat
                        id="valorHorasExD"
                        name="valorHorasExD"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasExD}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de horas extra diurnas"
                      />
                    </div>
                    {errors.valorHorasExD && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasExD}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Nocturnas
                      </label>

                      <NumericFormat
                        id="valorHorasExN"
                        name="valorHorasExN"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasExN}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de horas extra nocturnas"
                      />
                    </div>
                    {errors.valorHorasExN && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasExN}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Festivas Diurnas
                      </label>

                      <NumericFormat
                        id="valorHorasExFD"
                        name="valorHorasExFD"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasExFD}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de horas extra festivas diurnas"
                      />
                    </div>
                    {errors.valorHorasExFD && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasExFD}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Festivas Nocturnas
                      </label>

                      <NumericFormat
                        id="valorHorasExFN"
                        name="valorHorasExFN"
                        className="input"
                        prefix={'$'}
                        value={formData.valorHorasExFN}
                        decimalScale={3}
                        onChange={handleInputChange}
                        thousandsGroupStyle="thousand"
                        thousandSeparator=","
                        placeholder="Ingrese el valor de horas extra festivas nocturnas"
                      />
                    </div>
                    {errors.valorHorasExFN && (
                      <div className="text-red-500 text-sm mt-1">{errors.valorHorasExFN}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="4">
                  <h3 className="card-title">Deducciones (%)</h3>
                </div>
                <div className="card-body grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Salud</label>
                      <input
                        id="porcentajeSalud"
                        name="porcentajeSalud"
                        value={formData.porcentajeSalud}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese porcentaje de salud"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeSalud && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeSalud}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Pensión</label>
                      <input
                        className="input"
                        type="text"
                        id="porcentajePension"
                        name="porcentajePension"
                        value={formData.porcentajePension}
                        onChange={handleInputChange}
                        placeholder="Ingrese porcentaje de pensión"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajePension && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajePension}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="5">
                  <h3 className="card-title">Configuración de Auxilio FSP</h3>
                </div>
                <div className="card-body">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Porcentaje
                      </label>
                      <input
                        id="porcentajeFsp"
                        name="porcentajeFsp"
                        value={formData.porcentajeFsp}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese el porcentaje"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeFsp && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeFsp}</div>
                    )}
                  </div>

                  <div className="w-full mt-4">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Límite</label>
                      <select
                        className="select"
                        name="comparacionFsp"
                        value={formData.comparacionFsp}
                        onChange={handleInputChange}
                      >
                        <option value="" disabled selected>
                          Elija una opción
                        </option>
                        <option value="MAYOR">MAYOR</option>
                        <option value="MENOR">MENOR</option>
                        <option value="IGUAL">IGUAL</option>
                      </select>{' '}
                      a{' '}
                      <input
                        className="input w-[150px]"
                        type="text"
                        id="numAuxFsp"
                        name="numAuxFsp"
                        value={formData.numAuxFsp}
                        onChange={handleInputChange}
                        placeholder="Ingrese un valor"
                      />{' '}
                      SMLV
                    </div>
                    {errors.comparacionFsp && (
                      <div className="text-red-500 text-sm mt-1">{errors.comparacionFsp}</div>
                    )}
                    {errors.numAuxFsp && (
                      <div className="text-red-500 text-sm mt-1">{errors.numAuxFsp}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="6">
                  <h3 className="card-title">Parafiscales (%)</h3>
                </div>
                <div className="card-body grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Caja de Compensación
                      </label>
                      <input
                        id="porcentajeCajaComp"
                        name="porcentajeCajaComp"
                        value={formData.porcentajeCajaComp}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese porcentaje de caja de Compensación"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeCajaComp && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeCajaComp}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">ICBF</label>
                      <input
                        className="input"
                        type="text"
                        id="porcentajeIcbf"
                        name="porcentajeIcbf"
                        value={formData.porcentajeIcbf}
                        onChange={handleInputChange}
                        placeholder="Ingrese porcentaje de ICBF"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeIcbf && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeIcbf}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">SENA</label>
                      <input
                        className="input"
                        type="text"
                        id="porcentajeSena"
                        name="porcentajeSena"
                        value={formData.porcentajeSena}
                        onChange={handleInputChange}
                        placeholder="Ingrese porcentaje de SENA"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeSena && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeSena}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="7">
                  <h3 className="card-title">Apropiaciones (%)</h3>
                </div>
                <div className="card-body grid gap-5">
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Cesantías
                      </label>
                      <input
                        id="porcentajeCesantias"
                        name="porcentajeCesantias"
                        value={formData.porcentajeCesantias}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese porcentaje de Cesantías"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeCesantias && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeCesantias}</div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Interés / Cesantías
                      </label>
                      <input
                        className="input"
                        type="text"
                        id="porcentajeIntCesantias"
                        name="porcentajeIntCesantias"
                        value={formData.porcentajeIntCesantias}
                        onChange={handleInputChange}
                        placeholder="Ingrese porcentaje de Interés / Cesantías"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeIntCesantias && (
                      <div className="text-red-500 text-sm mt-1">
                        {errors.porcentajeIntCesantias}
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Prima de Servicios
                      </label>
                      <input
                        className="input"
                        type="text"
                        id="porcentajePrima"
                        name="porcentajePrima"
                        value={formData.porcentajePrima}
                        onChange={handleInputChange}
                        placeholder="Ingrese porcentaje de prima"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajePrima && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajePrima}</div>
                    )}
                  </div>
                  <div className="w-full">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">
                        Vacaciones
                      </label>
                      <input
                        id="porcentajeVacaciones"
                        name="porcentajeVacaciones"
                        value={formData.porcentajeVacaciones}
                        onChange={handleInputChange}
                        className="input"
                        type="text"
                        placeholder="Ingrese el porcentaje"
                      />{' '}
                      %
                    </div>
                    {errors.porcentajeVacaciones && (
                      <div className="text-red-500 text-sm mt-1">{errors.porcentajeVacaciones}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card pb-2.5">
                <div className="card-header" id="8">
                  <h3 className="card-title">Configuración de Retenciones</h3>
                </div>
                <div className="card-body">
                  <div className="w-full mt-4">
                    <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                      <label className="form-label flex items-center gap-1 max-w-56">Límite</label>
                      <select
                        className="select"
                        name="comparacionRetefuente"
                        value={formData.comparacionRetefuente}
                        onChange={handleInputChange}
                      >
                        <option value="" disabled selected>
                          Elija una opción
                        </option>
                        <option value="MAYOR">MAYOR</option>
                        <option value="MENOR">MENOR</option>
                        <option value="IGUAL">IGUAL</option>
                      </select>{' '}
                      a{' '}
                      <input
                        className="input w-[150px]"
                        type="text"
                        id="numAuxUVTRetefuente"
                        name="numAuxUVTRetefuente"
                        value={formData.numAuxUVTRetefuente}
                        onChange={handleInputChange}
                        placeholder="Ingrese un valor"
                      />{' '}
                      UVT
                    </div>
                    {errors.comparacionRetefuente && (
                      <div className="text-red-500 text-sm mt-1">
                        {errors.comparacionRetefuente}
                      </div>
                    )}
                    {errors.numAuxUVTRetefuente && (
                      <div className="text-red-500 text-sm mt-1">{errors.numAuxUVTRetefuente}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header" id="9">
                  <h3 className="card-title">Confirmar</h3>
                </div>
                <div className="card-body lg:py-7.5 lg:gap-7.5 gap-5">
                  <div className="flex flex-col gap-5">
                    <div className="text-2sm text-gray-800">
                      Por favor, revise detenidamente la información ingresada antes de proceder con
                      el guardado de los datos. Asegúrese de que todos los campos sean correctos
                      para evitar posibles errores.
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 mt-2">
                    <button className="btn btn-primary" onClick={handleSubmit}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-[450px]"></div>
            </div>
          </form>
        </div>
      </Container>
    </Fragment>
  );
};

export { ConfiguracionNominaPage };
