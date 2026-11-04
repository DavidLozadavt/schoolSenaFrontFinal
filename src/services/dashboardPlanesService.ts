import axios from 'axios';

/**
 * Dashboard del Administrador VT para Planes de Mensajes. Solo lectura.
 */

export interface TarjetasDashboard {
  planesActivos: number;
  planesVendidos: number;
  ingresos: number;
  solicitudesPendientes: number;
  pagosAprobados: number;
  pagosRechazados: number;
  mensajesVendidos: number;
  mensajesConsumidos: number;
}

export interface TopPlan {
  planNombre: string;
  ventas: number;
  ingresos: string | number;
}

export interface TopUsuario {
  userId: number;
  email: string | null;
  nombre: string | null;
  mensajesConsumidos: number;
  mensajesDisponibles: number;
}

export interface VentasPorMes {
  mes: string;
  ventas: number;
  ingresos: string | number;
  mensajes: number;
}

export interface AgrupadoMetodo {
  metodo: string;
  transacciones: number;
  total: string | number;
}

export interface AgrupadoEstado {
  status: string;
  transacciones: number;
  total: string | number;
}

export interface ResumenDashboard {
  rango: { desde: string; hasta: string };
  tarjetas: TarjetasDashboard;
  topPlanes: TopPlan[];
  topUsuarios: TopUsuario[];
  porMes: VentasPorMes[];
  porMetodoPago: AgrupadoMetodo[];
  porEstadoPago: AgrupadoEstado[];
}

export const dashboardPlanesService = {
  getResumen: async (params: { desde?: string; hasta?: string } = {}): Promise<ResumenDashboard> => {
    const response = await axios.get<ResumenDashboard>('mensajes/dashboard', { params });
    return response.data;
  }
};
