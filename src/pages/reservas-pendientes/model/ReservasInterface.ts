export interface Reserva {
  id: number;
  codigo: string;
  qrPath: string;
  idViaje: number;
  idTercero: number;
  idAgendaViaje: number | null;
  idRuta: number;
  cantidad: number;
  estado: string;
  valor: number | null;
  created_at: string;
  updated_at: string;
  url_qr: string;
  viaje: {
    id: number;
    idVehiculo: number;
    idConductor: number;
    idRuta: number;
    estado: string;
    numeroPlanillaViaje: string;
    idConductorAuxiliar: number | null;
  };
  tercero: {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    direccion: string;
    telefono: string | null;
  };
  agenda_viaje: any | null;
  ruta: {
    id: number;
    distancia: string;
    tiempoEstimado: string;
    descripcion: string;
    precio: number;
    idCiudadOrigen: number;
    idCiudadDestino: number;
    ciudad_origen?: {
      id: number;
      codigo: string;
      descripcion: string;
      iddepartamento: number;
    };
    ciudad_destino?: {
      id: number;
      codigo: string;
      descripcion: string;
      iddepartamento: number;
    };
  };
}