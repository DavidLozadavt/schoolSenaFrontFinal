import { Container, KeenIcon } from '@/components';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import axios from 'axios';
import Select from 'react-select'

import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { PersonaInterface } from './model/PersonaInterface';
import { ContratoInterface } from './model/ContratoInterface';
import { validateFieldPersona } from './utils/validationPersona';
import { validateUbicacionField } from './utils/validationUbicacion';
import { validateContratoField } from './utils/validationContrato';
import { TipoContratoModal } from './ModalTipoContrato';
import { RolModal } from './RolModal';
import { NivelAcademicoModal } from './ModalNivelAcademico';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { TipoDocumentoInterface } from './model/TipoDocumentoInterface';
import Spinner from '@/components/loaders/Spinner';
import { ModalLinksAntecedentes } from '../contratos/ModalLinksAntecedentes';
import { ModalInfoDocumentos } from '../contratos/ModalInfoDocumentos';
import { BancoModal } from './BancoModal';
import { RiesgosProfesionalesModal } from './RiesgosProfesionalesModal';
import { AuthContext } from '@/auth/providers/JWTProvider';

interface FormErrors {
  [key: string]: string;
}

const tiposCuentaBancaria = ['CUENTA DE AHORROS', 'CUENTA CORRIENTE'];
const tipoSalario = ['INTEGRAL', 'FIJO', 'VARIABLE'];

// Estilos para scroll suave y delicado en áreas de conocimiento
const contratacionScrollStyles = `
  .contratacion-areas-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .contratacion-areas-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .contratacion-areas-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    transition: background 0.2s ease;
  }
  .contratacion-areas-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const tiposCotizante = [
  { id: 1, codigo: '1', tipoCotizante: 'DEPENDIENTE' },
  { id: 2, codigo: '2', tipoCotizante: 'SERVICIO DOMÉSTICO' },
  { id: 3, codigo: '3', tipoCotizante: 'INDEPENDIENTE' },
  { id: 4, codigo: '4', tipoCotizante: 'MADRE SUSTITUTA' },
  { id: 5, codigo: '12', tipoCotizante: 'APRENDICES EN ETAPA LECTIVA' },
  { id: 6, codigo: '16', tipoCotizante: 'INDEPENDIENTE AGREMIADO O ASOCIADO' },
  { id: 7, codigo: '18', tipoCotizante: 'FUNCIONARIOS PÚBLICOS SIN TOPE MÁXIMO EN EL IBC' },
  { id: 8, codigo: '19', tipoCotizante: 'APRENDICES EN ETAPA PRODUCTIVA' },
  { id: 9, codigo: '20', tipoCotizante: 'ESTUDIANTES (RÉGIMEN ESPECIAL - LEY 789/2002)' },
  { id: 10, codigo: '21', tipoCotizante: 'ESTUDIANTES DE POSGRADO EN SALUD Y RESIDENTES' },
  { id: 11, codigo: '22', tipoCotizante: 'PROFESOR DE ESTABLECIMIENTO PARTICULAR' },
  { id: 12, codigo: '23', tipoCotizante: 'ESTUDIANTES APORTE SOLO RIESGOS LABORALES' },
  {
    id: 13,
    codigo: '30',
    tipoCotizante:
      'DEPENDIENTE ENTIDADES O UNIVERSIDADES PÚBLICAS DE LOS REGÍMENES ESPECIAL Y DE EXCEPCIÓN'
  },
  { id: 14, codigo: '31', tipoCotizante: 'COOPERADOS O PRECOOPERATIVAS DE TRABAJO ASOCIADO' },
  {
    id: 15,
    codigo: '32',
    tipoCotizante:
      'COTIZANTE MIEMBRO DE LA CARRERA DIPLOMÁTICA O CONSULAR O FUNCIONARIO DE ORGANISMO MULTILATERAL'
  },
  { id: 16, codigo: '33', tipoCotizante: 'BENEFICIARIO DEL FONDO DE SOLIDARIDAD PENSIONAL' },
  {
    id: 17,
    codigo: '34',
    tipoCotizante:
      'CONCEJAL O EDIL DE JUNTA ADMINISTRADORA LOCAL DE BOGOTÁ D.C. AMPARADO POR PÓLIZA DE SALUD'
  },
  { id: 18, codigo: '35', tipoCotizante: 'CONCEJAL MUNICIPAL O DISTRITAL' },
  {
    id: 19,
    codigo: '36',
    tipoCotizante:
      'CONCEJAL MUNICIPAL, DISTRITAL O EDIL BENEFICIARIO DEL FONDO DE SOLIDARIDAD PENSIONAL'
  },
  { id: 20, codigo: '40', tipoCotizante: 'BENEFICIARIO UPC ADICIONAL' },
  { id: 21, codigo: '42', tipoCotizante: 'COTIZANTE INDEPENDIENTE PAGO SOLO SALUD' },
  { id: 22, codigo: '43', tipoCotizante: 'COTIZANTE A PENSIONES CON PAGO POR TERCERO' },
  {
    id: 23,
    codigo: '44',
    tipoCotizante:
      'COTIZANTE DEPENDIENTE DE EMPLEO DE EMERGENCIA CON DURACIÓN MAYOR O IGUAL A UN MES'
  },
  {
    id: 24,
    codigo: '45',
    tipoCotizante: 'COTIZANTE DEPENDIENTE DE EMPLEO DE EMERGENCIA CON DURACIÓN MENOR A UN MES'
  },
  {
    id: 25,
    codigo: '47',
    tipoCotizante:
      'TRABAJADOR DEPENDIENTE DE ENTIDAD BENEFICIARIA DEL SISTEMA GENERAL DE PARTICIPACIONES – APORTES PATRONALES'
  },
  { id: 26, codigo: '51', tipoCotizante: 'TRABAJADOR DE TIEMPO PARCIAL' },
  { id: 27, codigo: '52', tipoCotizante: 'BENEFICIARIO DEL MECANISMO DE PROTECCIÓN AL CESANTE' },
  { id: 28, codigo: '53', tipoCotizante: 'AFILIADO PARTICIPE' },
  { id: 29, codigo: '54', tipoCotizante: 'PREPENSIONADO DE ENTIDAD EN LIQUIDACIÓN' },
  { id: 30, codigo: '55', tipoCotizante: 'AFILIADO PARTICIPE DEPENDIENTE' },
  { id: 31, codigo: '56', tipoCotizante: 'PREPENSIONADO CON APORTE VOLUNTARIO A SALUD' },
  {
    id: 32,
    codigo: '57',
    tipoCotizante: 'INDEPENDIENTE VOLUNTARIO AL SISTEMA DE RIESGOS LABORALES'
  },
  {
    id: 33,
    codigo: '58',
    tipoCotizante: 'ESTUDIANTES DE PRÁCTICAS LABORALES EN EL SECTOR PÚBLICO'
  },
  {
    id: 34,
    codigo: '59',
    tipoCotizante: 'INDEPENDIENTE CON CONTRATO DE PRESTACIÓN DE SERVICIOS SUPERIOR A 1 MES'
  },
  {
    id: 35,
    codigo: '60',
    tipoCotizante:
      'EDIL JUNTA ADMINISTRADORA LOCAL NO BENEFICIARIO DEL FONDO DE SOLIDARIDAD PENSIONAL'
  },
  { id: 36, codigo: '61', tipoCotizante: 'BENEFICIARIO PROGRAMA DE REINCORPORACIÓN' },
  { id: 37, codigo: '62', tipoCotizante: 'PERSONAL DEL MAGISTERIO' },
  { id: 38, codigo: '63', tipoCotizante: 'BENEFICIARIO DE PRESTACIÓN HUMANITARIA' },
  { id: 39, codigo: '64', tipoCotizante: 'TRABAJADOR PENITENCIARIO' },
  { id: 40, codigo: '65', tipoCotizante: 'DEPENDIENTE VINCULADO AL PISO DE PROTECCIÓN SOCIAL' },
  { id: 41, codigo: '66', tipoCotizante: 'INDEPENDIENTE VINCULADO AL PISO DE PROTECCIÓN SOCIAL' },
  {
    id: 42,
    codigo: '67',
    tipoCotizante: 'VOLUNTARIO EN PRIMERA RESPUESTA APORTE SOLO AL SISTEMA DE RIESGOS LABORALES'
  },
  { id: 43, codigo: '68', tipoCotizante: 'DEPENDIENTE VETERANO DE LA FUERZA PÚBLICA' },
  { id: 44, codigo: '69', tipoCotizante: 'CONTRIBUYENTE SOLIDARIO' }
];

const subTiposCotizante = [
  { id: 1, codigo: '0', nombreSubTipo: 'CUANDO NO APLIQUE NINGÚN SUBTIPO DE COTIZANTE' },
  {
    id: 2,
    codigo: '1',
    nombreSubTipo: 'DEPENDIENTE PENSIONADO POR VEJEZ, JUBILACIÓN O INVALIDEZ ACTIVO'
  },
  {
    id: 3,
    codigo: '2',
    nombreSubTipo: 'INDEPENDIENTE PENSIONADO POR VEJEZ, JUBILACIÓN O INVALIDEZ ACTIVO'
  },
  { id: 4, codigo: '3', nombreSubTipo: 'COTIZANTE NO OBLIGADO A COTIZACIÓN A PENSIONES POR EDAD' },
  {
    id: 5,
    codigo: '4',
    nombreSubTipo:
      'COTIZANTE CON REQUISITOS CUMPLIDOS PARA PENSIÓN MÍNIMA O PARA INDEMNIZACIÓN SUSTITUTIVA O DEVOLUCIÓN DE SALDOS'
  },
  {
    id: 6,
    codigo: '5',
    nombreSubTipo:
      'COTIZANTE A QUIEN SE LE HA RECONOCIDO INDEMNIZACIÓN SUSTITUTIVA O DEVOLUCIÓN DE SALDOS'
  },
  {
    id: 7,
    codigo: '6',
    nombreSubTipo:
      'COTIZANTE PERTENECIENTE A UN RÉGIMEN EXCEPTUADO DE PENSIONES O A ENTIDADES AUTORIZADAS PARA RECIBIR APORTES EXCLUSIVAMENTE DE UN GRUPO DE SUS PROPIOS TRABAJADORES'
  },
  {
    id: 8,
    codigo: '9',
    nombreSubTipo: 'COTIZANTE PENSIONADO CON MESADA IGUAL O SUPERIOR A 25 SMLMV'
  },
  {
    id: 9,
    codigo: '10',
    nombreSubTipo:
      'RESIDENTE EN EL EXTERIOR AFILIADO VOLUNTARIO AL SISTEMA GENERAL DE PENSIONES Y/O AFILIADO FACULTATIVO AL SISTEMA DE SUBSIDIO FAMILIAR'
  },
  {
    id: 10,
    codigo: '11',
    nombreSubTipo:
      'CONDUCTORES DEL SERVICIO PÚBLICO DE TRANSPORTE TERRESTRE AUTOMOTOR INDIVIDUAL DE PASAJEROS EN VEHÍCULOS TAXI'
  },
  {
    id: 11,
    codigo: '12',
    nombreSubTipo:
      'CONDUCTORES DEL SERVICIO PÚBLICO DE TRANSPORTE TERRESTRE AUTOMOTOR INDIVIDUAL DE PASAJEROS EN VEHÍCULOS TAXI. NO OBLIGADO A COTIZAR A PENSIÓN'
  }
];

const ContratacionPage = () => {
  const { currentLayout } = useLayout();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(true);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [ciudadesUbicacion, setCiudadesUbicacion] = useState<any[]>([]);
  const [tipoIdentificaciones, setTipoIdentificacion] = useState<TipoDocumentoInterface[]>([]);
  const [tipoContratos, setTipoContratos] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [documentosContratos, setDocumentosContratos] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorsContrato, setErrorsContrato] = useState<Partial<ContratoInterface>>({});
  const [selectedFilePersona, setSelectedFilePersona] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [isFieldDisabled, setIsFieldDisabled] = useState(false);
  const [isSueldoDisabled, setIsSueldoDisabled] = useState(true);
  const [isValorTotalDisabled, setIsValorTotalDisabled] = useState(true);
  const [rolModal, setRolModal] = useState(false);
  const [bancoModal, setBancoModal] = useState(false);
  const [riesgosModal, setRiesgosModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [tipoContratoModal, setTipoContratoModal] = useState(false);
  const [nivelAcademicoModal, setNivelAcademicoModal] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [bancos, setBancos] = useState<any[]>([]);
  const [formasPagoContrato, setFormasPagoContrato] = useState<any[]>([]);
  const [gruposNomina, setGruposNomina] = useState<any[]>([]);
  const [modalLinkAntecedentes, setModalLinkAntecedentes] = useState(false);
  const [modalInfoDocuemntos, setModalInfoDocumentos] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [entidadesArl, setEntidadesArl] = useState<any[]>([]);
  const [entidadesEPS, setEntidadeEPS] = useState<any[]>([]);
  const [entidadesPension, setEntidadesPension] = useState<any[]>([]);
  const [entidadesCajaCompensacion, setEntidadesCajaCompensacion] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [nivelesEducativos, setNivelesEducativos] = useState<any[]>([]);
  const [areasConocimiento, setAreasConocimiento] = useState<any[]>([]);
  const [selectedAreasConocimiento, setSelectedAreasConocimiento] = useState<number[]>([]);
  const [formDataUbicacion, setFormDataUbicacion] = useState<PersonaInterface>({
    departamentoU: '',
    ciudadU: '',
    email: '',
    direccion: '',
    celular: '',
    telefonoFijo: ''
  });

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
    apellido2: ''
  });

  const [formDataContrato, setFormDataContrato] = useState<ContratoInterface>({
    salario_id: '',
    fechaContratacion: '',
    perfilProfesional: '',
    otrosi: '',
    periodoPago: '',
    formaPago: '',
    supervisorContrato: '',
    cargoSupervisor: '',
    idtipoContrato: '',
    fechaSistema: '',
    observacion: '',
    fechaFinalContrato: '',
    valorTotalContrato: '',
    objetoContrato: '',
    sueldo: '',
    rol: '',
    idPension: '',
    idSalud: '',
    idArl: '',
    idCajaCompensacion: '',
    tipoCuentaBancaria: '',
    idBanco: '',
    numeroCuentaBancaria: '',
    observacionPreocupacional: '',
    idArea: '',
    idTipoCotizante: '',
    idSubTipoCotizante: '',
    tipoComisiones: '',
    idActividadRiesgo: '',
    idTarifaRiesgo: '',
    tipoSalario: '',
    idGrupoNomina: '',
    horasmes: '',
    idNivelEducativo: '',
    idCentroFormacion: ''
  });

  const steps = [
    { id: 1, title: 'Paso 1', subtitle: 'Información Personal' },
    { id: 2, title: 'Paso 2', subtitle: 'Información de Ubicación' },
    { id: 3, title: 'Paso 3', subtitle: 'Información de Contrato' },
    { id: 4, title: 'Paso 4', subtitle: 'Documentos del Contrato' }
  ];

  const handleChangeFormUbicacion = (e: any) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name !== 'email') {
      value = value.toUpperCase();
    }

    const error = validateUbicacionField(name, value);

    setFormDataUbicacion((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));

    if (name === 'departamentoU') {
      fetchCiudadesUbicacion(value);
    }
  };

  const handleChangeFormPerson = (e: any) => {
    const { name } = e.target;
    let { value } = e.target;

    // No convertir a mayúsculas los campos numéricos (IDs)
    const numericFields = ['idciudadNac', 'departamento', 'idtipoIdentificacion'];
    if (!numericFields.includes(name)) {
      value = value.toUpperCase();
    }

    const error = validateFieldPersona(name, value);

    setFormDataPersona((prevData) => ({
      ...prevData,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));

    if (name === 'departamento') {
      // Limpiar ciudades anteriores y ciudad seleccionada cuando cambia el departamento
      setCiudades([]);
      setFormDataPersona((prevData) => ({
        ...prevData,
        idciudadNac: ''
      }));
      // Llamar a fetchCiudades con el valor como número
      if (value) {
        fetchCiudades(Number(value));
      }
    }
  };

  const handleChangeFormContrato = (e: any) => {
    const { name } = e.target;
    let { value } = e.target;
    // No convertir a mayúsculas campos numéricos o idCentroFormacion
    if (
      name !== 'idCentroFormacion' &&
      !name.startsWith('id') &&
      name !== 'horasmes' &&
      name !== 'sueldo' &&
      name !== 'valorTotalContrato' &&
      name !== 'formaPago' &&
      name !== 'periodoPago'
    ) {
      value = value.toUpperCase();
    }

    setFormDataContrato((prevState) => ({
      ...prevState,
      [name]: value,
      ...(name === 'idtipoContrato' && parseInt(value) === 6
        ? { fechaFinalContrato: '', valorTotalContrato: '' }
        : {})
    }));

    const error = validateContratoField(name, value);
    setErrorsContrato((prevErrors) => ({
      ...prevErrors,
      [name]: error || undefined
    }));

    if (name === 'idtipoContrato') {
      setIsSueldoDisabled(true);
    }

    if (name === 'tipoCotizante' && value === 'COTIZANTE PENSIONADO') {
      formDataContrato.idPension = '';
      formDataContrato.idSalud = '';
    }

    if (name === 'idtipoContrato' && parseInt(value) === 6) {
      setIsFieldDisabled(true);
      setIsSueldoDisabled(false);
    } else if (name === 'idtipoContrato') {
      setIsFieldDisabled(false);
    }

    if (name === 'idtipoContrato' && parseInt(value) === 8) {
      setIsSueldoDisabled(false);
      setIsValorTotalDisabled(false);
    } else if (name === 'idtipoContrato') {
      setIsValorTotalDisabled(true);
    }

    const selectedTipoContrato = tipoContratos.find(
      (tipoContrato) => tipoContrato.id === parseInt(value)
    );
    if (name === 'idtipoContrato') {
      const selectedTipoContrato = tipoContratos.find(
        (tipoContrato) => tipoContrato.id === parseInt(value)
      );

      if (selectedTipoContrato) {
        fetchDocumentosContrato(selectedTipoContrato.nombreTipoContrato);
      }
    }

    if (name === 'rol') {
      const selectedRol = roles.find((rol) => rol.id === parseInt(value));
      let salarioMensual = selectedRol?.salario?.valor || 0;
      let idSalario = selectedRol?.salario?.id || null;

      if (formDataContrato.fechaContratacion && formDataContrato.fechaFinalContrato) {
        const fechaInicio = new Date(formDataContrato.fechaContratacion);
        const fechaFin = new Date(formDataContrato.fechaFinalContrato);

        if (!isNaN(fechaInicio.getTime()) && !isNaN(fechaFin.getTime())) {
          let diffMonths =
            (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 +
            (fechaFin.getMonth() - fechaInicio.getMonth());

          if (fechaFin.getDate() >= fechaInicio.getDate()) {
            diffMonths += 1;
          }

          setFormDataContrato((prevState) => ({
            ...prevState,
            sueldo: salarioMensual.toString(),
            valorTotalContrato: (salarioMensual * diffMonths).toString(),
            salario_id: idSalario
          }));
        }
      }
    }
  };

  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const parseCurrency = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleCurrencyChange = (e: any) => {
    const { name, value } = e.target;
    const numericValue = parseCurrency(value);
    setFormDataContrato((prev) => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const validateContrato = () => {
    const newErrors: Partial<ContratoInterface> = {};

    if (!formDataContrato.fechaContratacion) {
      newErrors.fechaContratacion = 'La fecha de inicio de contrato es requerida';
    }

    if (formDataContrato.idtipoContrato !== '6' && !formDataContrato.fechaFinalContrato) {
      newErrors.fechaFinalContrato = 'La fecha de fin de contrato es requerida';
    }

    if (!formDataContrato.idtipoContrato) {
      newErrors.idtipoContrato = 'El tipo de contrato es requerido';
    }

    if (!formDataContrato.rol) {
      newErrors.rol = 'El cargo es requerido';
    }

    if (!formDataContrato.sueldo) {
      newErrors.sueldo = 'El sueldo es requerido';
    }

    if(!formDataContrato.tipoSalario){
      newErrors.tipoSalario = 'El tipo de salario es requerido';
    }

    if(!formDataContrato.idGrupoNomina){
      newErrors.idGrupoNomina = 'El grupo de nómina es requerido';
    }

    if (!formDataContrato.horasmes) {
      newErrors.horasmes = 'Las horas al mes son requeridas';
    } else if (!/^\d+$/.test(formDataContrato.horasmes)) {
      newErrors.horasmes = 'Las horas al mes deben ser un número entero';
    }

    if (formDataContrato.idtipoContrato !== '6' && !formDataContrato.valorTotalContrato) {
      newErrors.valorTotalContrato = 'El valor total del contrato es requerido';
    }

    if (!formDataContrato.periodoPago) {
      newErrors.periodoPago = 'El período de pago es requerido';
    }

    const errFormaPago = validateContratoField('formaPago', formDataContrato.formaPago ?? '');
    if (errFormaPago) newErrors.formaPago = errFormaPago;

    const errSup = validateContratoField('supervisorContrato', formDataContrato.supervisorContrato ?? '');
    if (errSup) newErrors.supervisorContrato = errSup;

    const errCargoSup = validateContratoField('cargoSupervisor', formDataContrato.cargoSupervisor ?? '');
    if (errCargoSup) newErrors.cargoSupervisor = errCargoSup;

    if (!formDataContrato.objetoContrato) {
      newErrors.objetoContrato = 'El objeto de contrato es requerido';
    }

    const errPerfil = validateContratoField(
      'perfilProfesional',
      formDataContrato.perfilProfesional ?? ''
    );
    if (errPerfil) newErrors.perfilProfesional = errPerfil;

    if (!formDataContrato.idTipoCotizante) {
      newErrors.idTipoCotizante = 'El tipo de cotizante es requerido';
    }

    if (!formDataContrato.idNivelEducativo) {
      newErrors.idNivelEducativo = 'El nivel educativo es requerido';
    }

    if (
      formDataContrato.numeroCuentaBancaria &&
      !/^\d+$/.test(formDataContrato.numeroCuentaBancaria)
    ) {
      newErrors.numeroCuentaBancaria = 'El número de cuenta bancaria solo debe contener números';
    }

    return newErrors;
  };

  const handleSaveContrato = () => {
    const missingFiles: Record<string, boolean> = {};

    documentosContratos.forEach((documento) => {
      if (!selectedFiles[documento.id]) {
        missingFiles[documento.id] = true;
      }
    });

    if (Object.keys(missingFiles).length > 0) {
      setFileErrors(missingFiles);
      const documentosFaltantes = documentosContratos
        .filter((doc) => missingFiles[doc.id])
        .map((doc) => doc.tipoDocumento?.tituloDocumento || doc.tituloDocumento)
        .join(', ');
      enqueueSnackbar(`Faltan los siguientes documentos: ${documentosFaltantes}`, {
        variant: 'error'
      });
      return;
    }

    // Validaciones de los datos de la persona y ubicación antes de tocar la BD.
    // Esto evita errores SQL visibles (por ejemplo, `fechaNac` null).
    const personaErrors = validatePerson();
    if (Object.keys(personaErrors).length > 0) {
      setErrors(personaErrors as unknown as FormErrors);
      setCurrentStep(1);
      enqueueSnackbar('Revisa los datos de la persona (la fecha de nacimiento es obligatoria).', {
        variant: 'error'
      });
      setLoading(false);
      return;
    }

    const ubicacionErrors = validateUbicacion();
    if (Object.keys(ubicacionErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...(ubicacionErrors as unknown as FormErrors) }));
      setCurrentStep(1);
      enqueueSnackbar('Revisa los datos de ubicación del contrato.', {
        variant: 'error'
      });
      setLoading(false);
      return;
    }

    // Validar nuevamente en Step 4 por si el usuario cambió datos sin volver a Step 3.
    const validationErrorsContrato = validateContrato();
    if (Object.keys(validationErrorsContrato).length > 0) {
      setErrorsContrato(validationErrorsContrato);
      setCurrentStep(3);
      enqueueSnackbar('Revisa los campos obligatorios del contrato antes de guardar.', {
        variant: 'error'
      });
      return;
    }

    // Evita que se repitan áreas por id y falle por constraints únicas en el pivot.
    const areasConocimientoUnicas = Array.from(new Set(selectedAreasConocimiento))
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    setLoading(true);
    const data = new FormData();

    // Evita enviar el texto "undefined"/"null" cuando falta un campo (rompe FKs en el servidor).
    const fv = (v: unknown): string => {
      if (v === undefined || v === null) return '';
      const s = String(v);
      if (s === 'undefined' || s === 'null') return '';
      return s;
    };

    data.append('fechaNac', fv(formDataPersona.fechaNac));
    data.append('idtipoIdentificacion', fv(formDataPersona?.idtipoIdentificacion));
    data.append('identificacion', fv(formDataPersona.identificacion));
    data.append('nombre1', (formDataPersona.nombre1 ?? '').toUpperCase());
    if (formDataPersona.nombre2) {
      data.append('nombre2', formDataPersona.nombre2.toUpperCase() + '');
    }
    data.append('apellido1', (formDataPersona.apellido1 ?? '').toUpperCase());
    if (formDataPersona.apellido2) {
      data.append('apellido2', formDataPersona.apellido2.toUpperCase() + '');
    }
    data.append('idciudadNac', fv(formDataPersona.idciudadNac));
    data.append('sexo', fv(formDataPersona.sexo));
    data.append('rh', fv(formDataPersona.rh));

    data.append('celular', fv(formDataUbicacion.celular));
    data.append('email', fv(formDataUbicacion.email));
    data.append('direccion', (formDataUbicacion.direccion ?? '').toUpperCase());
    data.append('idciudadUbicacion', fv(formDataUbicacion.idciudadUbicacion));
    data.append('telefonoFijo', fv(formDataUbicacion.telefonoFijo));

    if (selectedFilePersona) {
      data.append('rutaFotoFile', selectedFilePersona);
    }

    axios
      .post('contrato-persona', data)
      .then((response) => {
        // El backend devuelve la persona; `id` es el de persona/usuario (ej. 858), no el del contrato.
        const payload = response.data;
        const idPersonaGuardada =
          payload?.id ?? (typeof payload?.data === 'object' ? payload?.data?.id : undefined);
        if (idPersonaGuardada == null || idPersonaGuardada === '') {
          setLoading(false);
          enqueueSnackbar(
            'No se obtuvo el identificador de la persona al guardar. Reintenta o contacta soporte.',
            { variant: 'error' }
          );
          return;
        }

        const contratoData = {
          ...formDataContrato,
          fechaContratacion:
            formDataContrato.fechaContratacion['jsdate'] || formDataContrato.fechaContratacion,
          fechaFinalContrato:
            formDataContrato.fechaFinalContrato['jsdate'] || formDataContrato.fechaFinalContrato,
          idtipoContrato: formDataContrato.idtipoContrato,
          idPersona: idPersonaGuardada,
          valorTotalContrato: formDataContrato.valorTotalContrato,
          periodoPago: formDataContrato.periodoPago,
          formaPago: formDataContrato.formaPago,
          supervisorContrato: String(formDataContrato.supervisorContrato || '').trim(),
          cargoSupervisor: String(formDataContrato.cargoSupervisor || '').trim(),
          objetoContrato: formDataContrato.objetoContrato,
          observacion: formDataContrato.observacion,
          perfilProfesional: formDataContrato.perfilProfesional,
          otrosi: formDataContrato.otrosi,
          rol: formDataContrato.rol,
          salario_id: formDataContrato.salario_id,
          idPension: formDataContrato.idPension,
          idArl: formDataContrato.idArl,
          idSalud: formDataContrato.idSalud,
          idCajaCompensacion: formDataContrato.idCajaCompensacion,
          tipoCuentaBancaria: formDataContrato.tipoCuentaBancaria,
          idBanco: formDataContrato.idBanco,
          numeroCuentaBancaria: formDataContrato.numeroCuentaBancaria,
          idCaja: formDataContrato.idArea,
          tipoComisiones: formDataContrato.tipoComisiones,
          idActividadRiesgo: formDataContrato.idActividadRiesgo,
          idTarifaRiesgo: formDataContrato.idTarifaRiesgo,
          idTipoCotizante: formDataContrato.idTipoCotizante,
          idSubTipoCotizante: formDataContrato.idSubTipoCotizante,
          tipoSalario: formDataContrato.tipoSalario,
          idGrupoNomina: formDataContrato.idGrupoNomina,
          horasmes: formDataContrato.horasmes ? Number(formDataContrato.horasmes) : undefined,
          idNivelEducativo: formDataContrato.idNivelEducativo,
          idCentroFormacion: formDataContrato.idCentroFormacion,
          areasConocimiento: areasConocimientoUnicas
        };

        axios
          .post('contrato', { ...contratoData })
          .then((response) => {
            const idContrato = response.data.id;
            const tipoDocumentos = Object.keys(selectedFiles);
            let successCount = 0;
            let errorOccurred = false;

            const documentRequests = tipoDocumentos.map((tipoId) => {
              const documentoData = new FormData();
              const file = selectedFiles[tipoId];
              if (file) {
                documentoData.append('rutaFile', file);
                documentoData.append('idContrato', idContrato + '');
                documentoData.append('idAsignacionTipoDocumentoProceso', tipoId);

                return axios
                  .post('contrato-documento', documentoData)
                  .then(() => {
                    successCount++;
                  })
                  .catch(() => {
                    errorOccurred = true;
                  });
              }
              return null;
            });

            Promise.all(documentRequests)
              .then(() => {
                // El contrato ya quedó creado en BD (si llegamos aquí).
                // No mostramos errores de documentos al usuario para no "asustarlo"
                // si falló alguna subida (puede intentarlo luego).
                setToastMessage('Contrato guardado con éxito.');
                setShowToast(true);
                setLoading(false);
                resetFormAndGoToStep1();
              })
              .catch(() => {
                setLoading(false);
                // Igual: no bloqueamos ni mostramos error técnico de documentos.
                setToastMessage('Contrato guardado con éxito.');
                setShowToast(true);
                resetFormAndGoToStep1();
              });
          })
          .catch((error) => {
            setLoading(false);
            setCurrentStep(1);
            enqueueSnackbar('No se pudo crear el contrato. Por favor, intente nuevamente.', {
              variant: 'error'
            });
          });
      })
      .catch((error) => {
        setLoading(false);
        setCurrentStep(1);
        const body = error?.response?.data;
        const errorMessage =
          (typeof body?.message === 'string' && body.message) ||
          (typeof body?.error === 'string' && body.error) ||
          'Error al guardar la persona.';
        enqueueSnackbar(errorMessage, {
          variant: 'error'
        });
      });
  };

  const resetFormAndGoToStep1 = () => {
    setFormDataPersona({
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
      apellido2: ''
    });

    setFormDataUbicacion({
      departamentoU: '',
      ciudadU: '',
      email: '',
      direccion: '',
      celular: '',
      telefonoFijo: ''
    });

    setFormDataContrato({
      salario_id: '',
      fechaContratacion: '',
      perfilProfesional: '',
      otrosi: '',
      periodoPago: '',
      formaPago: '',
      supervisorContrato: '',
      cargoSupervisor: '',
      idtipoContrato: '',
      fechaSistema: '',
      observacion: '',
      fechaFinalContrato: '',
      valorTotalContrato: '',
      objetoContrato: '',
      sueldo: '',
      rol: '',
      idSalud: '',
      idArl: '',
      idPension: '',
      idCajaCompensacion: '',
      tipoCuentaBancaria: '',
      idBanco: '',
      numeroCuentaBancaria: '',
      observacionPreocupacional: '',
      idArea: '',
      idTipoCotizante: '',
      idSubTipoCotizante: '',
      tipoComisiones: '',
      idActividadRiesgo: '',
      idTarifaRiesgo: '',
      tipoSalario: '',
      idGrupoNomina: '',
      horasmes: '',
      idNivelEducativo: '',
      idCentroFormacion: ''
    });
    setSelectedAreasConocimiento([]);
    setFotoUrl('');
    setSelectedFiles({});
    setSelectedFilePersona(null);
    setCurrentStep(1);
  };

  const authContext = useContext(AuthContext);

  const [centroFormacion, setCentroFormacion] = useState<any[]>([])
  useEffect(()=>{
    const loadCentros = async () =>{
      try {
        const res = await axios.get(`centrosFormacion`)
        setCentroFormacion(res.data || [])
      } catch {
        setCentroFormacion([])
      }
    }
    loadCentros()
  },[])

  const optionsCF = centroFormacion.map((val)=>({
    value:val.id,
    label:`${val.nombre}, ${val.empresa?.razonSocial || ''}, ${val.ciudad?.descripcion || ''}`
  }))

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
    setFotoUrl('');
    setSelectedFilePersona(null);
  };

  const validatePerson = () => {
    const newErrors: Partial<PersonaInterface> = {};
    if (!formDataPersona.nombre1) {
      newErrors.nombre1 = 'El primer nombre es requerido';
    } else if (
      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(formDataPersona.nombre1) ||
      formDataPersona.nombre1.length <= 2
    ) {
      newErrors.nombre1 = 'El primer nombre debe contener solo letras y ser mayor a 2 caracteres';
    }

    if (!formDataPersona.apellido1) {
      newErrors.apellido1 = 'El primer apellido es requerido';
    } else if (
      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(formDataPersona.apellido1) ||
      formDataPersona.apellido1.length <= 2
    ) {
      newErrors.apellido1 =
        'El primer apellido debe contener solo letras y ser mayor a 2 caracteres';
    }

    if (!formDataPersona.idtipoIdentificacion) {
      newErrors.idtipoIdentificacion = 'El tipo de identificación es requerido';
    }

    if (!formDataPersona.identificacion) {
      newErrors.identificacion = 'La identificación es requerida';
    } else if (!/^\d{5,}$/.test(formDataPersona.identificacion)) {
      newErrors.identificacion = 'La identificación debe ser un número con más de 4 cifras';
    }

    if (!formDataPersona.rh) {
      newErrors.rh = 'El tipo de sangre es requerido';
    }

    if (!formDataPersona.sexo) {
      newErrors.sexo = 'El sexo es requerido';
    }

    if (!formDataPersona.fechaNac) {
      newErrors.fechaNac = 'La fecha de nacimiento es requerida';
    }

    if (!formDataPersona.idciudadNac) {
      newErrors.idciudadNac = 'La ciudad de nacimiento es requerida';
    }
    if (!formDataPersona.departamento) {
      newErrors.departamento = 'El departamento de nacimiento es requerido';
    }

    return newErrors;
  };

  const validateUbicacion = () => {
    const newErrors: Partial<PersonaInterface> = {};

    if (!formDataUbicacion.departamentoU)
      newErrors.departamentoU = 'El departamento de ubicación es requerido';
    if (!formDataUbicacion.idciudadUbicacion)
      newErrors.idciudadUbicacion = 'La ciudad de ubicación es requerida';
    if (!formDataUbicacion.email) newErrors.email = 'El correo electrónico es requerido';
    else if (!/\S+@\S+\.\S+/.test(formDataUbicacion.email))
      newErrors.email = 'El correo electrónico es inválido';
    if (!formDataUbicacion.direccion) newErrors.direccion = 'La dirección es requerida';
    if (!formDataUbicacion.celular) newErrors.celular = 'El celular es requerido';
    else if (!/^\d{10}$/.test(formDataUbicacion.celular))
      newErrors.celular = 'El celular debe tener 10 dígitos';

    return newErrors;
  };

  const handleNext = () => {
    let validationErrors: Partial<any> = {};
    let validationErrorsContrato: Partial<any> = {};

    if (currentStep === 1) {
      validationErrors = validatePerson();
    } else if (currentStep === 2) {
      validationErrors = validateUbicacion();
    } else if (currentStep === 3) {
      validationErrorsContrato = validateContrato();
    }

    const allErrors = {
      ...validationErrors,
      ...validationErrorsContrato
    };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setErrorsContrato(validationErrorsContrato);
    } else {
      setErrors({});
      setErrorsContrato({});
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleTipoContratoModalOpen = () => {
    setTipoContratoModal(true);
  };

  const handleTipoContratoModalClose = () => {
    setTipoContratoModal(false);
  };

  const handleRolModalOpen = () => {
    setRolModal(true);
  };

  const handleRolModalClose = () => {
    setRolModal(false);
  };

  const handleNivelAcademicoModalOpen = () => {
    setNivelAcademicoModal(true);
  };

  const handleNivelAcademicoModalClose = () => {
    setNivelAcademicoModal(false);
  };

  const fetchDepartamentos = async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchTipoIdentificacion = async () => {
    try {
      const response = await axios.get('contrato-tipos-identificacion');
      setTipoIdentificacion(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchTipoContratos = async () => {
    try {
      const response = await axios.get('contrato-tipos-contrato');
      setTipoContratos(response.data || []);
    } catch {
      setTipoContratos([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('contrato-roles');
      setRoles(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchEntidadesArl = async () => {
    try {
      const response = await axios.get('entidades/arl');
      setEntidadesArl(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchEntidadesEPS = async () => {
    try {
      const response = await axios.get('entidades/eps');
      setEntidadeEPS(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchEntidadesPension = async () => {
    try {
      const response = await axios.get('entidades/pensiones');
      setEntidadesPension(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchEntidadesCajaCompensacion = async () => {
    try {
      const response = await axios.get('entidades/caja_compensacion');
      setEntidadesCajaCompensacion(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };


  const fetchBancos = async () => {
    try {
      const response = await axios.get('bancos');
      setBancos(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchFormasPagoContrato = async () => {
    try {
      const response = await axios.get('contrato-formas-pago');
      setFormasPagoContrato(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFormasPagoContrato([]);
    }
  };

  useEffect(() => {
    fetchFormasPagoContrato();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGruposNomina = async () => {
    try {
      const response = await axios.get('grupos_nomina');
      setGruposNomina(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchDocumentosContrato = async (nombreProceso: string) => {
    try {
      const response = await axios.get(`contrato-tipo-documento?nombreProceso=${nombreProceso}`);
      // Todos los documentos son obligatorios
      const documentos = Array.isArray(response.data) 
        ? response.data.map((doc: any) => ({ ...doc, obligatorio: true }))
        : [];
      setDocumentosContratos(documentos);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchCiudades = async (idDepartamento: number) => {
    try {
      if (!idDepartamento || idDepartamento === 0) {
        setCiudades([]);
        return;
      }
      const response = await axios.get(`ciudades/departamento/${idDepartamento}`);
      if (response.data && Array.isArray(response.data)) {
        setCiudades(response.data);
      } else {
        setCiudades([]);
      }
    } catch {
      setCiudades([]);
    }
  };

  const fetchCiudadesUbicacion = async (idDepartamento: number) => {
    try {
      const response = await axios.get(`ciudades/departamento/${idDepartamento}`);
      setCiudadesUbicacion(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await axios.get(`all_areas`);
      setAreas(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchNivelesEducativos = async () => {
    try {
      const response = await axios.get('programas_recursos_crear');
      if (response.data?.data?.niveles_educativos) {
        setNivelesEducativos(response.data.data.niveles_educativos);
      }
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const fetchAreasConocimiento = async () => {
    try {
      const response = await axios.get('areas_conocimiento');
      if (response.data) {
        setAreasConocimiento(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      setAreasConocimiento([]);
    }
  };


  const [tarifas, setTarifas] = useState<any[]>([]);

  const fetchTarifas = async () => {
    try {
      const response = await axios.get('tarifas_arls');
      setTarifas(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const [riesgos, setRiesgos] = useState<any[]>([]);

  const fetchRiesgos = async () => {
    try {
      const response = await axios.get('actividades_riesgo_profesional');
      setRiesgos(response.data);
    } catch {
      // Error silencioso - el estado ya está inicializado
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0] || null;
    setSelectedFiles((prevFiles) => ({
      ...prevFiles,
      [id]: file
    }));

    setFileErrors((prevErrors) => ({
      ...prevErrors,
      [id]: false
    }));
  };

  const handleFileDelete = (id: string) => {
    setSelectedFiles((prevFiles) => ({
      ...prevFiles,
      [id]: null
    }));
  };

  const fetchContratoAbortRef = useRef<AbortController | null>(null);
  const fetchContratoRequestIdRef = useRef(0);

  const blurDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBlurIdentificacionRef = useRef<string>('');

  const handleIdentificacionBlur = () => {
    const identificacion = formDataPersona.identificacion;
    if (!identificacion) return;

    if (identificacion === lastBlurIdentificacionRef.current) return;

    if (blurDebounceRef.current) {
      clearTimeout(blurDebounceRef.current);
    }

    blurDebounceRef.current = setTimeout(() => {
      lastBlurIdentificacionRef.current = identificacion;
      fetchContrato(identificacion);
    }, 400);
  };

  const fetchContrato = async (identificacion: any) => {
    if (!identificacion) return;

    fetchContratoAbortRef.current?.abort();
    const controller = new AbortController();
    fetchContratoAbortRef.current = controller;
    const requestId = ++fetchContratoRequestIdRef.current;

    setLoading(true);

    try {
      const response = await axios.get(`contrato-persona/${identificacion}`, {
        signal: controller.signal
      });

      if (requestId !== fetchContratoRequestIdRef.current) return;

      const data = response.data;

      if (data && Object.keys(data).length > 0) {
        const idDepartamentoNac = data.ciudad_nac?.departamento?.id || '';
        const idCiudadNac = data.idCiudadNac || '';
        const idDepartamentoU = data.ciudad_ubicacion?.departamento?.id || '';
        const idCiudadU = data.idCiudadUbicacion || '';

        setFormDataPersona((prev) => ({
          ...prev,
          nombre1: data.nombre1 || '',
          nombre2: data.nombre2 || '',
          apellido1: data.apellido1 || '',
          apellido2: data.apellido2 || '',
          fechaNac: data.fechaNac || '',
          idtipoIdentificacion: data.idTipoIdentificacion || '',
          rh: data.rh || '',
          sexo: data.sexo || '',
          departamento: idDepartamentoNac
        }));

        setFormDataUbicacion((prev) => ({
          ...prev,
          direccion: data.direccion || '',
          email: data.email || '',
          celular: data.celular || '',
          telefonoFijo: data.telefonoFijo || '',
          departamentoU: idDepartamentoU
        }));

        setFotoUrl(data.rutaFotoUrl || '');

        if (idDepartamentoNac) {
          await fetchCiudades(idDepartamentoNac);
          if (requestId !== fetchContratoRequestIdRef.current) return;
          setFormDataPersona((prev) => ({
            ...prev,
            idciudadNac: idCiudadNac
          }));
        }

        if (idDepartamentoU) {
          await fetchCiudades(idDepartamentoU);
          if (requestId !== fetchContratoRequestIdRef.current) return;
          setFormDataUbicacion((prev) => ({
            ...prev,
            idciudadUbicacion: idCiudadU
          }));
        }
      } else {
        enqueueSnackbar('No se encontraron datos de contrato para esta identificación.', {
          variant: 'info'
        });
      }
    } catch (error: any) {
    
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;

      const mensajeError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Error desconocido al consultar contrato.';

      enqueueSnackbar(mensajeError, {
        variant: 'error'
      });
    } finally {
      if (requestId === fetchContratoRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        
        const essential = [
          fetchTipoIdentificacion(),
          fetchDepartamentos(),
          fetchTipoContratos(),
          fetchRoles(),
          fetchAreas(),
          fetchGruposNomina(),
          fetchNivelesEducativos()
        ];

        const background = [
          fetchEntidadesArl(),
          fetchEntidadesEPS(),
          fetchEntidadesPension(),
          fetchEntidadesCajaCompensacion(),
          fetchBancos(),
          fetchTarifas(),
          fetchRiesgos(),
          fetchAreasConocimiento()
        ];

        await Promise.allSettled(essential);

        if (!cancelled) setLoading(false);

        // Carga progresiva: no afecta el spinner global.
        void Promise.allSettled(background);
      } finally {
        // (en caso de error) si aún seguimos bloqueados, liberamos.
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      fetchContratoAbortRef.current?.abort();
    };
  }, []);

  return (
    <Fragment>
      <style>{contratacionScrollStyles}</style>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Crea contratos en el sistema</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                onClick={() => setModalLinkAntecedentes(true)}
                className="btn btn-sm btn-light"
              >
                <KeenIcon icon="information-1" />
                Consultar antecedentes
              </button>

              <button onClick={() => setModalInfoDocumentos(true)} className="btn btn-sm btn-light">
                <KeenIcon icon="information-1" />
                Consultar documentos necesarios
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        {loading && <Spinner />}

        <div data-stepper="true" className="max-w-5xl mx-auto">
          <div className="card">
            {/* Indicador de progreso horizontal */}
            <div className="card-header border-b border-gray-200 py-4 px-8">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center flex-shrink-0">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          currentStep === step.id
                            ? 'bg-primary text-white'
                            : currentStep > step.id
                            ? 'bg-success text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <i className="ki-outline ki-check text-sm"></i>
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="ml-2 flex flex-col">
                        <span
                          className={`text-xs font-medium whitespace-nowrap ${
                            currentStep === step.id
                              ? 'text-primary'
                              : currentStep > step.id
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`text-xs whitespace-nowrap ${
                            currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                          }`}
                        >
                          {step.subtitle}
                        </span>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 min-w-[60px] ${
                          currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="card-body py-5 px-8">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5">Información Personal</h2>
                  <form>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 gap-x-8">
                      {/* Columna Izquierda */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Tipo de Documento *
                          </label>
                          <select
                            name="idtipoIdentificacion"
                            value={formDataPersona.idtipoIdentificacion}
                            onChange={handleChangeFormPerson}
                            className="select text-sm h-9 w-full"
                          >
                            <option value="">Seleccione una opción</option>
                            {tipoIdentificaciones.map((tipoIdentificacion) => (
                              <option key={tipoIdentificacion.id} value={tipoIdentificacion.id}>
                                {tipoIdentificacion.codigo}
                              </option>
                            ))}
                          </select>
                          {errors.idtipoIdentificacion && (
                            <p className="text-red-500 text-xs mt-1">{errors.idtipoIdentificacion}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Primer Nombre *
                          </label>
                          <input
                            type="text"
                            name="nombre1"
                            placeholder="Ingrese el primer nombre"
                            value={formDataPersona.nombre1}
                            onChange={handleChangeFormPerson}
                            className={`input text-sm h-9 w-full ${errors.nombre1 ? 'border-red-500' : ''}`}
                          />
                          {errors.nombre1 && (
                            <p className="text-red-500 text-xs mt-1">{errors.nombre1}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Primer Apellido *
                          </label>
                          <input
                            type="text"
                            name="apellido1"
                            placeholder="Ingrese el primer apellido"
                            value={formDataPersona.apellido1}
                            onChange={handleChangeFormPerson}
                            className={`input text-sm h-9 w-full ${errors.apellido1 ? 'border-red-500' : ''}`}
                          />
                          {errors.apellido1 && (
                            <p className="text-red-500 text-xs mt-1">{errors.apellido1}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Fecha de Nacimiento *
                          </label>
                          <input
                            type="date"
                            name="fechaNac"
                            value={formDataPersona.fechaNac}
                            onChange={handleChangeFormPerson}
                            className={`input text-sm h-9 w-full ${errors.fechaNac ? 'border-red-500' : ''}`}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {errors.fechaNac && (
                            <p className="text-red-500 text-xs mt-1">{errors.fechaNac}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Departamento de Nacimiento *
                          </label>
                          <select
                            name="departamento"
                            value={formDataPersona.departamento}
                            onChange={handleChangeFormPerson}
                            className="select text-sm h-9 w-full"
                          >
                            <option value="">Seleccione un departamento</option>
                            {departamentos.map((departamento) => (
                              <option key={departamento.id} value={departamento.id}>
                                {departamento.descripcion} - {departamento.codigo}
                              </option>
                            ))}
                          </select>
                          {errors.departamento && (
                            <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Grupo Sanguíneo *
                          </label>
                          <select
                            name="rh"
                            value={formDataPersona.rh}
                            onChange={handleChangeFormPerson}
                            className="select text-sm h-9 w-full"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="A+">A POSITIVO</option>
                            <option value="A-">A NEGATIVO</option>
                            <option value="AB+">AB POSTITIVO</option>
                            <option value="AB-">AB NEGATIVO</option>
                            <option value="B+">B POSITIVO</option>
                            <option value="B-">B NEGATIVO</option>
                            <option value="O+">O POSITIVO</option>
                            <option value="O-">O NEGATIVO</option>
                          </select>
                          {errors.rh && <p className="text-red-500 text-xs mt-1">{errors.rh}</p>}
                        </div>
                      </div>

                      {/* Columna Derecha */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Número de Documento *
                          </label>
                          <input
                            type="text"
                            name="identificacion"
                            placeholder="Ingrese el número de documento"
                            value={formDataPersona.identificacion}
                            onChange={handleChangeFormPerson}
                            onBlur={handleIdentificacionBlur}
                            className={`input text-sm h-9 w-full ${errors.identificacion ? 'border-red-500' : ''}`}
                          />
                          {errors.identificacion && (
                            <p className="text-red-500 text-xs mt-1">{errors.identificacion}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Segundo Nombre
                          </label>
                          <input
                            type="text"
                            placeholder="Ingrese el segundo nombre"
                            name="nombre2"
                            value={formDataPersona.nombre2}
                            onChange={handleChangeFormPerson}
                            className="input text-sm h-9 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Segundo Apellido
                          </label>
                          <input
                            type="text"
                            name="apellido2"
                            placeholder="Ingrese el segundo apellido"
                            value={formDataPersona.apellido2}
                            onChange={handleChangeFormPerson}
                            className="input text-sm h-9 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Género *
                          </label>
                          <select
                            name="sexo"
                            value={formDataPersona.sexo}
                            onChange={handleChangeFormPerson}
                            className="select text-sm h-9 w-full"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="F">FEMENINO</option>
                            <option value="M">MASCULINO</option>
                            <option value="O">OTRO</option>
                          </select>
                          {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">
                            Ciudad de Nacimiento *
                          </label>
                          <select
                            name="idciudadNac"
                            value={formDataPersona.idciudadNac}
                            onChange={handleChangeFormPerson}
                            className="select text-sm h-9 w-full"
                          >
                            <option value="">Seleccione una ciudad</option>
                            {ciudades.map((ciudad) => (
                              <option key={ciudad.id} value={ciudad.id}>
                                {ciudad.descripcion} - {ciudad.codigo}
                              </option>
                            ))}
                          </select>
                          {errors.idciudadNac && (
                            <p className="text-red-500 text-xs mt-1">{errors.idciudadNac}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5 text-gray-700">Foto</label>
                          {!selectedFilePersona && !fotoUrl ? (
                            <input
                              type="file"
                              name="rutaFoto"
                              onChange={handleFilePersonaChange}
                              className="file-input"
                            />
                          ) : selectedFilePersona ? (
                            <div className="flex items-center">
                              <p className="text-sm input flex justify-between w-full items-center">
                                {selectedFilePersona.name}
                                <span
                                  onClick={handleFilePersonaDelete}
                                  className="ml-2 cursor-pointer"
                                >
                                  <KeenIcon icon="trash" />
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <img
                                src={fotoUrl}
                                alt="Foto cargada"
                                className="w-24 h-24 object-cover rounded mr-4 border"
                              />
                              <span onClick={() => setFotoUrl('')} className="ml-2 cursor-pointer">
                                <KeenIcon icon="trash" />
                              </span>
                            </div>
                          )}
                          {errors['rutaFoto'] && (
                            <p className="text-red-500 text-xs mt-1">{errors['rutaFoto']}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Departamento de Ubicación *
                      </label>
                      <select
                        name="departamentoU"
                        value={formDataUbicacion.departamentoU}
                        onChange={handleChangeFormUbicacion}
                        className="select"
                      >
                        <option value="">Seleccione un departamento</option>
                        {departamentos.map((departamento) => (
                          <option key={departamento.id} value={departamento.id}>
                            {departamento.descripcion} - {departamento.codigo}
                          </option>
                        ))}
                      </select>
                      {errors.departamentoU && (
                        <p className="text-red-500 text-sm mt-1">{errors.departamentoU}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ciudad de Ubicación *
                      </label>
                      <select
                        name="idciudadUbicacion"
                        value={formDataUbicacion.idciudadUbicacion}
                        onChange={handleChangeFormUbicacion}
                        className="select"
                      >
                        <option value="">Seleccione una ciudad</option>
                        {ciudadesUbicacion.map((ciudad) => (
                          <option key={ciudad.id} value={ciudad.id}>
                            {ciudad.descripcion} - {ciudad.codigo}
                          </option>
                        ))}
                      </select>
                      {errors.idciudadUbicacion && (
                        <p className="text-red-500 text-sm mt-1">{errors.idciudadUbicacion}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Dirección *</label>
                      <input
                        type="text"
                        name="direccion"
                        placeholder="Ingrese la dirección"
                        value={formDataUbicacion.direccion}
                        onChange={handleChangeFormUbicacion}
                        className={`input ${errors.direccion ? 'border-red-500' : ''}`}
                      />
                      {errors.direccion && (
                        <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Correo Electronico *</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Ingrese el Correo Electronico"
                        value={formDataUbicacion.email}
                        onChange={handleChangeFormUbicacion}
                        data-preserve-case
                        data-no-uppercase
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
                        value={formDataUbicacion.celular}
                        onChange={handleChangeFormUbicacion}
                        className={`input ${errors.celular ? 'border-red-500' : ''}`}
                      />
                      {errors.celular && (
                        <p className="text-red-500 text-sm mt-1">{errors.celular}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono Fijo</label>
                      <input
                        type="text"
                        name="telefonoFijo"
                        placeholder="Ingrese el teléfono "
                        value={formDataUbicacion.telefonoFijo}
                        onChange={handleChangeFormUbicacion}
                        className={`input ${errors.telefonoFijo ? 'border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div>
                  {/* 1. Fechas y Configuración */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fecha Inicio Contrato *
                      </label>
                      <input
                        type="date"
                        name="fechaContratacion"
                        value={formDataContrato.fechaContratacion}
                        onChange={handleChangeFormContrato}
                        className="input"
                      />
                      {errorsContrato.fechaContratacion && (
                        <p className="text-red-500 text-sm mt-1">
                          {errorsContrato.fechaContratacion}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Fecha Fin Contrato *</label>
                      <input
                        type="date"
                        name="fechaFinalContrato"
                        value={formDataContrato.fechaFinalContrato}
                        onChange={handleChangeFormContrato}
                        className="input"
                        disabled={isFieldDisabled}
                      />
                      {errorsContrato.fechaFinalContrato && (
                        <p className="text-red-500 text-sm mt-1">
                          {errorsContrato.fechaFinalContrato}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo Contrato *</label>
                      <div className="flex items-center">
                        <select
                          name="idtipoContrato"
                          value={formDataContrato.idtipoContrato}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione una Opción</option>
                          {tipoContratos.map((tipoContrato) => (
                            <option key={tipoContrato.id} value={tipoContrato.id}>
                              {tipoContrato.nombreTipoContrato}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleTipoContratoModalOpen}
                          className="w-10 h-10 btn btn-sm btn-light"
                        >
                          <KeenIcon icon="plus" />
                        </button>
                      </div>

                      {errorsContrato.idtipoContrato && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.idtipoContrato}</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Información Laboral */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Área</label>
                      <select
                        name="idArea"
                        value={formDataContrato.idArea}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione una Opción</option>
                        {areas.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/** Centro de formación */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Centro de formación</label>
                      <select
                        name="idCentroFormacion"
                        value={formDataContrato.idCentroFormacion}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione un centro de formación</option>
                        {optionsCF.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium mb-2">Cargo *</label>
                      <div className="flex items-center">
                        <select
                          name="rol"
                          value={formDataContrato.rol}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione una Opción</option>
                          {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                              {rol.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleRolModalOpen}
                          className="w-10 h-10 btn btn-sm btn-light"
                        >
                          <KeenIcon icon="plus" />
                        </button>
                      </div>
                      {errorsContrato.rol && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.rol}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sueldo mensual *</label>
                      <input
                        type="text"
                        name="sueldo"
                        placeholder="Ingrese el sueldo"
                        value={currencyFormatter.format(Number(formDataContrato.sueldo || 0))}
                        onChange={handleCurrencyChange}
                        className="input"
                        disabled={isSueldoDisabled}
                      />
                      {errorsContrato.sueldo && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.sueldo}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Valor total de contrato *
                      </label>
                      <input
                        type="text"
                        disabled={isValorTotalDisabled}
                        name="valorTotalContrato"
                        placeholder="Ingrese el valor del contrato"
                        value={currencyFormatter.format(
                          Number(formDataContrato.valorTotalContrato || 0)
                        )}
                        onChange={handleCurrencyChange}
                        className="input w-4/4 mr-2"
                      />
                      {errorsContrato.valorTotalContrato && (
                        <p className="text-red-500 text-sm mt-1">
                          {errorsContrato.valorTotalContrato}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de Salario *</label>
                      <select
                        name="tipoSalario"
                        value={formDataContrato.tipoSalario}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione una Opción</option>
                        {tipoSalario.map((tipo, index) => (
                          <option key={index} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                      {errorsContrato.tipoSalario && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.tipoSalario}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Periodo de Pago *</label>
                      <select
                        name="periodoPago"
                        value={formDataContrato.periodoPago}
                        onChange={handleChangeFormContrato}
                        className="select"
                      >
                        <option value="">Seleccione una Opción</option>
                        <option value="10">SEMANAL</option>
                        <option value="15">QUINCENAL</option>
                        <option value="30">MENSUAL</option>
                      </select>
                      {errorsContrato.periodoPago && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.periodoPago}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Forma de pago *</label>
                      <select
                        name="formaPago"
                        value={formDataContrato.formaPago}
                        onChange={handleChangeFormContrato}
                        className="select w-full"
                      >
                        <option value="">Seleccione una opción</option>
                        {formasPagoContrato.map((forma: string) => (
                          <option key={forma} value={forma}>
                            {forma}
                          </option>
                        ))}
                      </select>
                      {errorsContrato.formaPago && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.formaPago}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Grupo de nómina *</label>
                      <select
                        name="idGrupoNomina"
                        value={formDataContrato.idGrupoNomina}
                        onChange={handleChangeFormContrato}
                        className="select w-full"
                      >
                        <option value="">Seleccione una Opción</option>
                        {gruposNomina.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nombreGrupo}
                          </option>
                        ))}
                      </select>
                      {errorsContrato.idGrupoNomina && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.idGrupoNomina}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Supervisor del contrato
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                          <input
                            type="text"
                            name="supervisorContrato"
                            placeholder="Nombre del supervisor"
                            value={formDataContrato.supervisorContrato}
                            onChange={handleChangeFormContrato}
                            className="input w-full"
                            autoComplete="off"
                          />
                          {errorsContrato.supervisorContrato && (
                            <p className="text-red-500 text-sm mt-1">{errorsContrato.supervisorContrato}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Cargo *</label>
                          <input
                            type="text"
                            name="cargoSupervisor"
                            placeholder="Cargo del supervisor"
                            value={formDataContrato.cargoSupervisor}
                            onChange={handleChangeFormContrato}
                            className="input w-full"
                            autoComplete="off"
                          />
                          {errorsContrato.cargoSupervisor && (
                            <p className="text-red-500 text-sm mt-1">{errorsContrato.cargoSupervisor}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Horas al mes *</label>
                      <input
                        type="number"
                        name="horasmes"
                        min={0}
                        value={formDataContrato.horasmes || ''}
                        onChange={handleChangeFormContrato}
                        className="input"
                        placeholder="Ingrese las horas al mes"
                      />
                      {errorsContrato.horasmes && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.horasmes}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2 mt-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium mb-2">Objeto contrato *</label>
                      <textarea
                        rows={5}
                        name="objetoContrato"
                        placeholder="Describa el objeto del contrato (máximo 500 caracteres)"
                        value={formDataContrato.objetoContrato}
                        onChange={handleChangeFormContrato}
                        className="textarea"
                        maxLength={500}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        {formDataContrato.objetoContrato?.length || 0}/500 caracteres
                      </p>
                      {errorsContrato.objetoContrato && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.objetoContrato}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Observaciones</label>
                      <textarea
                        rows={5}
                        name="observacion"
                        placeholder="Observaciones del contrato (opcional)"
                        value={formDataContrato.observacion}
                        onChange={handleChangeFormContrato}
                        className="textarea"
                      />
                      {errorsContrato.observacion && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.observacion}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Perfil profesional *</label>
                      <textarea
                        rows={5}
                        name="perfilProfesional"
                        placeholder="Describa el perfil profesional requerido"
                        value={formDataContrato.perfilProfesional}
                        onChange={handleChangeFormContrato}
                        className="textarea"
                      />
                      {errorsContrato.perfilProfesional && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.perfilProfesional}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Otrosí</label>
                      <textarea
                        rows={3}
                        name="otrosi"
                        placeholder="Ej: S, N o aclaración breve (opcional)"
                        value={formDataContrato.otrosi}
                        onChange={handleChangeFormContrato}
                        className="textarea"
                      />
                      {errorsContrato.otrosi && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.otrosi}</p>
                      )}
                    </div>
                  </div>

                  {/* 3. Seguridad Social */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo Cotizante *</label>
                      <div className="flex items-center">
                        <select
                          name="idTipoCotizante"
                          value={formDataContrato.idTipoCotizante}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione</option>
                          {tiposCotizante.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.codigo} - {tipo.tipoCotizante}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errorsContrato.idTipoCotizante && (
                        <p className="text-red-500 text-sm mt-1">
                          {errorsContrato.idTipoCotizante}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sub Tipo Cotizante *</label>
                      <div className="flex items-center">
                        <select
                          name="idSubTipoCotizante"
                          value={formDataContrato.idSubTipoCotizante}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione</option>
                          {subTiposCotizante.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.codigo} - {tipo.nombreSubTipo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Pensión *</label>
                      <select
                        name="idPension"
                        value={formDataContrato.idPension}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {entidadesPension.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nombre} - {res.codigo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Salud *</label>
                      <select
                        name="idSalud"
                        value={formDataContrato.idSalud}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {entidadesEPS.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nombre} - {res.codigo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">ARL *</label>
                      <select
                        name="idArl"
                        value={formDataContrato.idArl}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {entidadesArl.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nombre} - {res.codigo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Riesgo ARL *</label>
                      <select
                        name="idTarifaRiesgo"
                        value={formDataContrato.idTarifaRiesgo}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {tarifas.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nivel} - {res.porcentajeCotizacion}%
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Actividad Riesgo Profesional
                      </label>
                      <div className="flex items-center">
                        <select
                          name="idActividadRiesgo"
                          value={formDataContrato.idActividadRiesgo}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione</option>
                          {riesgos.map((res) => (
                            <option key={res.id} value={res.id}>
                              {res.codigo} - {res.clase}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setRiesgosModal(true)}
                          className="w-10 h-10 btn btn-sm btn-light"
                        >
                          <KeenIcon icon="plus" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Caja de Compensación *</label>
                      <select
                        name="idCajaCompensacion"
                        value={formDataContrato.idCajaCompensacion}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {entidadesCajaCompensacion.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.nombre} - {res.codigo}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* 4. Información Bancaria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tipo de Cuenta *
                      </label>
                      <select
                        name="tipoCuentaBancaria"
                        value={formDataContrato.tipoCuentaBancaria}
                        onChange={handleChangeFormContrato}
                        className="select w-4/4 mr-2"
                      >
                        <option value="">Seleccione</option>
                        {tiposCuentaBancaria.map((tipo, index) => (
                          <option key={index} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Banco *</label>
                      <div className="flex items-center">
                        <select
                          name="idBanco"
                          value={formDataContrato.idBanco}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione</option>
                          {bancos.map((res) => (
                            <option key={res.id} value={res.id}>
                              {res.nombre}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setBancoModal(true)}
                          className="w-10 h-10 btn btn-sm btn-light"
                        >
                          <KeenIcon icon="plus" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Número de Cuenta *</label>
                      <input
                        type="text"
                        name="numeroCuentaBancaria"
                        placeholder="Número de cuenta"
                        value={formDataContrato.numeroCuentaBancaria}
                        onChange={handleChangeFormContrato}
                        className="input"
                      />
                      {errorsContrato.numeroCuentaBancaria && (
                        <p className="text-red-500 text-sm mt-1">
                          {errorsContrato.numeroCuentaBancaria}
                        </p>
                      )}
                    </div>

                    <div>
                      {/* Campo de observación preocupacional removido a solicitud */}
                    </div>
                  </div>

                  {/* 5. Información Adicional */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo Comisión *</label>
                      <select
                        name="tipoComisiones"
                        value={formDataContrato.tipoComisiones}
                        onChange={handleChangeFormContrato}
                        className="select"
                      >
                        <option value="">Seleccione</option>
                        <option value="ESCALA DE VENTAS">ESCALA DE VENTAS</option>
                        <option value="PORCENTAJE FIJO">PORCENTAJE FIJO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Nivel Educativo *</label>
                      <div className="flex items-center">
                        <select
                          name="idNivelEducativo"
                          value={formDataContrato.idNivelEducativo ?? ''}
                          onChange={handleChangeFormContrato}
                          className="select w-4/4 mr-2"
                        >
                          <option value="">Seleccione</option>
                          {nivelesEducativos && nivelesEducativos.length > 0 ? (
                            nivelesEducativos.map((nivel) => (
                              <option key={nivel.id} value={nivel.id}>
                                {nivel.nombre}
                              </option>
                            ))
                          ) : null}
                        </select>
                        <button
                          type="button"
                          onClick={handleNivelAcademicoModalOpen}
                          className="w-10 h-10 btn btn-sm btn-light"
                        >
                          <KeenIcon icon="plus" />
                        </button>
                      </div>
                      {errorsContrato.idNivelEducativo && (
                        <p className="text-red-500 text-sm mt-1">{errorsContrato.idNivelEducativo}</p>
                      )}
                    </div>
                  </div>

                  {/* Áreas de Conocimiento - Sección separada abajo */}
                  <div className="mb-2 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Áreas de Conocimiento</label>
                      <button
                        onClick={() => {
                          if (selectedAreasConocimiento.length === areasConocimiento.length) {
                            setSelectedAreasConocimiento([]);
                          } else {
                            setSelectedAreasConocimiento(areasConocimiento.map((area) => area.id));
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                      >
                        {selectedAreasConocimiento.length === areasConocimiento.length && areasConocimiento.length > 0 ? (
                          <>
                            <KeenIcon icon="check-circle" className="text-sm" />
                            Deseleccionar Todos
                          </>
                        ) : (
                          <>
                            <KeenIcon icon="check-circle" className="text-sm" />
                            Seleccionar Todos
                          </>
                        )}
                      </button>
                    </div>
                    <div className="card">
                      <div className="card-body py-3 px-3">
                        {areasConocimiento && areasConocimiento.length > 0 ? (
                          <>
                            <div 
                              className="contratacion-areas-scroll max-h-[400px] overflow-y-auto pr-2 scroll-smooth"
                              style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9',
                              }}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-1">
                                {areasConocimiento.map((area) => {
                                  const isSelected = selectedAreasConocimiento.includes(area.id);
                                  return (
                                    <label
                                      key={area.id}
                                      className={`flex items-start gap-3 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-blue-50 dark:bg-blue-900/20 border-primary'
                                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          const newSelected = isSelected
                                            ? selectedAreasConocimiento.filter((id) => id !== area.id)
                                            : [...selectedAreasConocimiento, area.id];
                                          setSelectedAreasConocimiento(newSelected);
                                        }}
                                        className="w-4 h-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                                      />
                                      <div className="flex-1">
                                        <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                          {area.nombreAreaConocimiento}
                                        </p>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                                <p className="text-xs font-semibold text-primary">
                                  {selectedAreasConocimiento.length} área{selectedAreasConocimiento.length !== 1 ? 's' : ''} seleccionada{selectedAreasConocimiento.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 p-2">Cargando áreas de conocimiento...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Documentos del Contrato</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Adjunte los documentos requeridos para completar la contratación del instructor</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {documentosContratos.map((documento) => {
                      const isRequired = true; // Todos los documentos son requeridos
                      const hasFile = selectedFiles[documento.id];
                      const fileName = hasFile ? selectedFiles[documento.id]?.name : '';
                      
                      return (
                        <div
                          key={documento.id}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 relative"
                        >
                          {/* Ícono de nube en la esquina superior derecha */}
                          <div className="absolute top-2 right-2">
                            <i className="ki-outline ki-cloud text-success text-base"></i>
                          </div>

                          {/* Título */}
                          <div className="mb-2 pr-6">
                            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                              {documento.tipoDocumento?.tituloDocumento || documento.tituloDocumento}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                          </div>

                          {/* Área de selección de archivo */}
                          {!hasFile ? (
                            <label className="block cursor-pointer">
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-700">
                                <input
                                  type="file"
                                  name={`file-${documento.id}`}
                                  onChange={(e) => handleFileChange(e, documento.id)}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Haga clic para seleccionar archivo
                                </p>
                              </div>
                            </label>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {fileName}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleFileDelete(documento.id)}
                                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                  type="button"
                                >
                                  <KeenIcon icon="trash" className="text-sm" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Mensaje de error */}
                          {fileErrors[documento.id] && (
                            <p className="text-red-500 text-xs mt-1">
                              Este documento es requerido.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="card-footer py-3 px-6 border-t border-gray-200 flex justify-between">
              <button
                className={`btn btn-light text-sm py-2 px-4 ${currentStep === 1 ? 'hidden' : ''}`}
                onClick={handleBack}
              >
                Anterior
              </button>
              {currentStep < steps.length ? (
                <button className="btn btn-primary text-sm py-2 px-4" onClick={handleNext}>
                  Siguiente
                </button>
              ) : (
                <button onClick={handleSaveContrato} className="btn btn-primary text-sm py-2 px-4">
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      </Container>
      <TipoContratoModal
        open={tipoContratoModal}
        onClose={handleTipoContratoModalClose}
        onSave={fetchTipoContratos}
      />

      <ModalLinksAntecedentes
        open={modalLinkAntecedentes}
        onClose={() => setModalLinkAntecedentes(false)}
      />

      <ModalInfoDocumentos
        open={modalInfoDocuemntos}
        onClose={() => setModalInfoDocumentos(false)}
      />

      <BancoModal open={bancoModal} onClose={() => setBancoModal(false)} onSave={fetchBancos} />

      <RiesgosProfesionalesModal
        open={riesgosModal}
        onClose={() => setRiesgosModal(false)}
        onSave={fetchRiesgos}
      />

      <RolModal open={rolModal} onClose={handleRolModalClose} onSave={fetchRoles} />

      <NivelAcademicoModal
        open={nivelAcademicoModal}
        onClose={handleNivelAcademicoModalClose}
        onSave={fetchNivelesEducativos}
      />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </Fragment>
  );
};

export { ContratacionPage };
