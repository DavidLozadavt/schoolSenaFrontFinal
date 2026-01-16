export interface TarifasInterface {
  id: number;
  idClaseVehiculo: number;
  tarifa: number;
  porcentaje: number | null;
  clase_vehiculo?: {
    id: number;
    nombre: string;
  };
}
