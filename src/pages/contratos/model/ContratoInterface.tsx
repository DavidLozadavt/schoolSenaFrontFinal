import { DocumentoContrato } from "./DocumentosContratoInterface";

export interface ContratoInterface {
  id?: any;
  fechaContratacion?: any;
  perfilProfesional?: string;
  otrosi?: string;
  periodoPago?: string;
  horasmes?: number | string;
  idpersona?: string;
  idempresa?: number; // Agregado
  idCentroFormacion?: number; // Agregado
  idtipoContrato?: string;
  // Datos de supervisión y forma de pago (API puede enviar formaDePago, formaPago o forma_pago)
  formaPago?: string | Record<string, unknown>;
  forma_pago?: string | Record<string, unknown>;
  formaDePago?: string | Record<string, unknown>;
  supervisorContrato?: string;
  cargoSupervisor?: string;
  observacion?: string;
  fechaFinalContrato?: any;
  valorTotalContrato?: any;
  objetoContrato?: string;
  sueldo?: string;
  banco: any;
  tipoCuentaBancaria: any;
  numeroCuentaBancaria: any;
  idCompany?: number; // Agregado

  actividadRiesgo: {
    nombre: string;
    descripcion: string;
  };

  persona?: {
    id?: number;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    identificacion: string;
    email: string;
    fechaNac: string;
    direccion: string;
    sexo: string;
    rh: string;
    celular: string;
    telefonoFijo?: string;
    rutaFotoUrl?: string;
    usuario?: {
      idCentroFormacion?: number;
      centroFormacion?: {
        id: number;
        nombre: string;
        ciudad?: {
          descripcion: string;
        };
        empresa?: {
          razonSocial: string;
        };
      };
    };
  };
  
  estado?: {
    id?: number; // Agregado
    estado: string;
    descripcion?: string; // Agregado
  };
  
  salario?: {
    id?: string;
    valor?: any;
    rol: {
      id: string;
      name: string;
    };
  };

  area?: {
    id?: string | number;
    nombre?: string;
  };

  empresa?: {
    id: string;
    razonSocial: string;
    rutaLogoUrl: string;
    nit: string;
    digitoVerificacion: string;
  };

  tipoContrato?: {
    nombreTipoContrato: string;
  };

  transacciones?: any;
  documentosContrato?: DocumentoContrato[];

  archivoContrato?: any;
  otrosContratos?: any;

  // Seguridad Social
  pension?: {
    id?: number;
    nombre?: string;
  };
  salud?: {
    id?: number;
    nombre?: string;
  };
  arl?: {
    id?: number;
    nombre?: string;
  };
  cajaCompensacion?: {
    id?: number;
    nombre?: string;
  };
  cesantias?: {
    id?: number;
    nombre?: string;
  };

  // Información Académica
  idNivelEducativo?: number;
  nivelEducativo?: {
    id?: number;
    nombre?: string;
  };
  areasConocimiento?: Array<{
    id?: number;
    nombreAreaConocimiento?: string;
  }>;
  programas?: Array<{
    id?: number;
    nombrePrograma?: string;
    codigoPrograma?: string;
  }>;

  // Centro de Formación - Objeto completo (opcional)
  centroFormacion?: {
    id?: number;
    nombre?: string;
    // otras propiedades según tu modelo
  } | null;
}

/** Unifica `formaPago` / `forma_pago` (string u objeto) para UI y formularios. */
export function resolveFormaPago(
  contrato: Partial<ContratoInterface> | Record<string, unknown> | null | undefined
): string {
  if (contrato == null || typeof contrato !== 'object') return '';
  const c = contrato as Record<string, unknown>;
  const raw = c.formaDePago ?? c.formaPago ?? c.forma_pago;
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (typeof o.nombre === 'string') return o.nombre;
    if (typeof o.descripcion === 'string') return o.descripcion;
    try {
      return JSON.stringify(raw);
    } catch {
      return '';
    }
  }
  return String(raw);
}

/** Alinea la respuesta del API con lo que esperan las pantallas de contrato (p. ej. camelCase). */
export function normalizeContratoForUi(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') {
    return {};
  }
  const b = body as Record<string, unknown>;
  const out = { ...b };
  if (out.formaPago == null && out.forma_pago != null) {
    out.formaPago = out.forma_pago;
  }
  if (out.formaPago == null && out.formaDePago != null) {
    out.formaPago = out.formaDePago;
  }
  return out;
}