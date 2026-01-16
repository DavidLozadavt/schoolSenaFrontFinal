import axios from 'axios';

export const fetchViajes = async (page: number = 1) => {
  try {
    const response = await axios.get('viajes', {
      params: {
        page: page,
      },
    });
    return {
      viajes: response.data.viajes,
      total: response.data.total,
    };
  } catch (err) {
    throw new Error(`Error fetching viajes: ${err}`);
  }
};

export const actualizarEstadoViaje = async (id: number) => {
  try {
    await axios.patch(`/viajes/${id}`, {
      estado: 'EN VIAJE',
    });
  } catch (err) {
    throw new Error(`Error actualizando el estado del viaje: ${err}`);
  }
};

export const cambiarEstadoAPlanilla = async (id: number) => {
  try {
    await axios.patch(`/viajes/${id}`, {
      estado: 'PLANILLA',
    });
  } catch (err) {
    throw new Error(`Error cambiando el estado a planilla: ${err}`);
  }
};

export const cambiarEstadoCancelado = async (id: number) => {
  try {
    await axios.patch(`/viajes/${id}`, {
      estado: 'CANCELADO',
    });
  } catch (err) {
    throw new Error(`Error cambiando el estado a cancelado: ${err}`);
  }
};

export const deleteViajes = async (id: number) => {
  try {
    await axios.delete(`viajes/${id}`);
  } catch (err) {
    throw new Error(`Error deleting viaje: ${err}`);
  }
};