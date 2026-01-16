import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, KeenIcon } from '@/components';

import { Sede } from '../puntos-de-venta/models/SedeInterface';
import { PuntoVenta } from '../puntos-de-venta/models/TypesInterface';
import ModalInfomacion from '../puntos-de-venta/Caja/ModalInfomacion';
import ModalAbrirCaja from '../puntos-de-venta/Caja/ModalAbrirCaja';

const PosTiendaPage = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoVenta[]>([]);
  const [selectedSede, setSelectedSede] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenBox, setModalOpenBox] = useState(false);
  const [selectedPuntoDeVentaId, setSelectedPuntoDeVentaId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchSedes();
  }, []);

  useEffect(() => {
    if (selectedSede) {
      fetchPuntosDeVenta(selectedSede);
    } else {
      setPuntosDeVenta([]);
    }
  }, [selectedSede]);

  const fetchSedes = async () => {
    try {
      const response = await axios.get<Sede[]>('sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
      enqueueSnackbar('Error al cargar las sedes', { variant: 'error' });
    }
  };

  const fetchPuntosDeVenta = async (sedeId: number) => {
    try {
      const response = await axios.get<PuntoVenta[]>(`get_point_sales_by_sede_tipe_shop/${sedeId}`);
      setPuntosDeVenta(response.data);
    } catch (error) {
      console.error('Error fetching puntos de venta:', error);
      enqueueSnackbar('Error al cargar los puntos de venta', { variant: 'error' });
    }
  };

  const handleSedeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sedeId = parseInt(event.target.value, 10);
    setSelectedSede(sedeId || null);
  };

  const handleInfoClick = (puntoDeVentaId: number) => {
    setSelectedPuntoDeVentaId(puntoDeVentaId);
    setModalOpen(true);
  };

  const handleIrACajaClick = async (puntoDeVentaId: number) => {
    const validacion = await validarPropietarioCaja(puntoDeVentaId);

    if (validacion && validacion.esPropietario) {
      navigate(`/tienda/caja/${puntoDeVentaId}`);
    } else if (validacion) {
      enqueueSnackbar(`La caja está abierta por otro usuario`, { variant: 'warning' });
    } else {
      enqueueSnackbar('No se pudo validar la caja', { variant: 'error' });
    }
  };

  const validarPropietarioCaja = async (puntoDeVentaId: number) => {
    try {
      const response = await axios.get(`puntos-de-venta/${puntoDeVentaId}/verificar-usuario`);
      return response.data;
    } catch (error) {
      console.error('Error validando propietario de la caja:', error);
      enqueueSnackbar('Error al validar la caja', { variant: 'error' });
      return null;
    }
  };

  const getEstadoBadge = (punto: PuntoVenta) => {
    if (punto.cajas?.length > 0 && punto.cajas[0]?.estado?.estado === 'ABIERTO') {
      return (
        <span className="badge badge-success badge-sm flex items-center gap-1">
          <KeenIcon icon="check-circle" className="text-xs" />
          Activa
        </span>
      );
    }
    return (
      <span className="badge badge-secondary badge-sm flex items-center gap-1">
        <KeenIcon icon="minus-circle" className="text-xs" />
        Cerrada
      </span>
    );
  };

  return (
    <div className="card max-w-6xl mx-auto my-6">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">Puntos de Venta Tiendas</h3>
      </div>

      <div className="card-body">
        {/* Selector de sede */}
        <div className="flex justify-center mb-6">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <select
              className="select w-full"
              value={selectedSede || ''}
              onChange={handleSedeChange}
            >
              <option value="">Selecciona una sede</option>
              {sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de puntos de venta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {puntosDeVenta.length > 0 ? (
            puntosDeVenta.map((punto) => {
              const isOpen =
                punto.cajas?.length > 0 && punto.cajas[0]?.estado?.estado === 'ABIERTO';

              return (
                <div
                  key={punto.id}
                  className="card cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  {/* Imagen */}
                  <div className="relative overflow-visible">
                    <img
                      src={punto.imagenUrl}
                      alt={punto.nombre}
                      className="w-full h-40 object-cover transform group-hover:scale-110 transition-transform duration-500"
                      style={{ clipPath: 'inset(0)' }}
                    />

                    {/* Estado */}
                    <div className="absolute top-3 right-3 z-10">{getEstadoBadge(punto)}</div>

                    {/* Gradiente overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Avatar del operador */}
                    {isOpen && punto.cajas[0]?.usuario?.persona && (
                      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="relative">
                          <img
                            src={punto.cajas[0].usuario.persona.rutaFotoUrl}
                            alt={punto.cajas[0].usuario.persona.nombre1}
                            className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                          />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className={`card-body ${isOpen ? 'pt-12' : 'pt-5'}`}>
                    <h4 className="text-base font-semibold text-gray-900 text-center mb-1 min-h-[3rem] flex items-center justify-center">
                      {punto.nombre}
                    </h4>

                    {/* Operador */}
                    {isOpen && punto.cajas[0]?.usuario?.persona ? (
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                          <KeenIcon icon="user" className="text-xs text-gray-500" />
                          <span className="truncate">
                            {punto.cajas[0].usuario.persona.nombre1}{' '}
                            {punto.cajas[0].usuario.persona.apellido1}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-center mb-4 h-12 flex items-center justify-center">
                        <p className="text-xs text-gray-400 italic">Sin operador asignado</p>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-2">
                      <button
                        className={`btn btn-sm flex-1 ${isOpen ? 'btn-primary' : 'btn-light'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOpen) {
                            handleIrACajaClick(punto.id);
                          } else {
                            setSelectedPuntoDeVentaId(punto.id);
                            setModalOpenBox(true);
                          }
                        }}
                      >
                        <KeenIcon icon={isOpen ? 'entrance-right' : 'lock-2'} />
                        {isOpen ? 'Ir a caja' : 'Abrir'}
                      </button>

                      <button
                        className="btn btn-sm btn-icon btn-light"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInfoClick(punto.id);
                        }}
                      >
                        <KeenIcon icon="information-2" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <KeenIcon icon="shop" className="text-gray-300 text-6xl mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {selectedSede
                  ? 'No hay puntos de venta para la sede seleccionada'
                  : 'Selecciona una sede para ver los puntos de venta'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <Container>
        <ModalInfomacion
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          data={selectedPuntoDeVentaId}
        />
        <ModalAbrirCaja
          open={modalOpenBox}
          onClose={() => setModalOpenBox(false)}
          idPunto={selectedPuntoDeVentaId}
          redirectTo={`/tienda/caja/${selectedPuntoDeVentaId}`}
        />
      </Container>
    </div>
  );
};

export default PosTiendaPage;
