import { TipoDocumentoInterface } from './TipoDocumentoInterface';

export interface PersonaInterface {
  rutaFotoUrl?: string | undefined;
  id?: number;
  fechaNac?: string;
  idtipoIdentificacion?: string;
  idTipoIdentificacion?: string;
  identificacion?: string;
  nombre1?: string;
  nombre2?: string;
  apellido2?: string;
  apellido1?: string;
  idciudadNac?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  idciudadUbicacion?: string;
  idCiudadUbicacion?: string;
  telefonoFijo?: string;
  sexo?: string;
  rh?: string;
  departamento?: string;
  departamentoU?: string;
  ciudadU?: string;
  porcentaje?: string;
  tipo_identificacion?: TipoDocumentoInterface;
  pivot?: {
    porcentaje?: number;
    administrador?: string;
  };
  idPersona?: string;
  foto?: any;
  contrasena?: string;
  celularExtra?: string;
  emailExtra?: string;
  tipoTitular?: string;
}
