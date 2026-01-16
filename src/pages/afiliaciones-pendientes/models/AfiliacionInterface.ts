import { MarcaInterface } from "@/pages/afiliacion-vehiculos/models/MarcaInterface";
import { ModeloInterface } from "@/pages/afiliacion-vehiculos/models/ModeloInterface";
import { TipoVehiculoInterface } from "@/pages/afiliacion-vehiculos/models/TipoVehiculoInterface";

export interface VehiculoInterface {
    id: number;
    placa: string;
    chasis: string;
    serie: string | null;
    runt: string | null;
    foto: string;
    idModelo: number;
    idTipo: number;
    idMarca: number;
    idEstado: number;
    idEmpresa: number;
    created_at: string;
    updated_at: string;
    numPuestos: string;
    rutaUrl: string;
    pivot: {
      idAfiliacion: number;
      idVehiculo: number;
    };
    marca: MarcaInterface;
    modelo: ModeloInterface;
    tipo_vehiculo: TipoVehiculoInterface;
    estado: EstadoInterface;
  }
  
export  interface AfiliacionInterface {
    id: number;
    fechaAfiliacion: string;
    fechaFinalAfiliacion: string | null;
    numero: string;
    idEmpresa: number;
    estado: string;
    vehiculo: VehiculoInterface[];
  }

  export interface EstadoInterface {
    id: number;
    estado: string;
    descripcion: string;
  }
  