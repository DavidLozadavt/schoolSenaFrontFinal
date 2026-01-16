import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  idCaja?: any;
  idPunto?: any | null;
}

const ModalReporteVentanillas = ({ open, onClose, idPunto }: ModalProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [planillas, setPlanillas] = useState<any[]>([]);
  const [idCajaTienda, setIdCajaTienda] = useState<number | null>(null);
  const [relacionPlanillas, setRelacionPlanillas] = useState<any[]>([]);

  const [totales, setTotales] = useState<{
    totalTickets: number;
    valorTiqueteado: number;
    totalDespachado: number;
    totalPorDespachar: number;
    valorDespachado?: number;
    valorPorDespachar?: number;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get(`caja-latest/${idPunto}`)
        .then((res) => {
          const id = res.data.id;
          setIdCajaTienda(id);
          return Promise.all([
            axios.get(`planillas_usuario/${id}`),
            axios.get(`planillas_despachadas_usuario/${id}`)
          ]);
        })
        .then(([response, respPlanillasDespachadas]) => {
          setPlanillas(response.data.viajes);
          setTotales({
            totalTickets: response.data.totalTickets,
            valorTiqueteado: response.data.valorTiqueteado,
            totalDespachado: response.data.totalDespachado,
            totalPorDespachar: response.data.totalPorDespachar,
            valorDespachado: response.data.valorDespachado,
            valorPorDespachar: response.data.valorPorDespachar
          });
          setRelacionPlanillas(respPlanillasDespachadas.data.planillas);
        })
        .catch((error) => {
          console.error('Error al obtener datos:', error);
          enqueueSnackbar('Error al cargar las planillas', { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idPunto]);
  



  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };






  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[800px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Reporte de Planillas</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="px-0 py-4">
          {loading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="space-y-6">
              {/* mostrar totales globales */}
              {totales && (
                <div className="border rounded-xl shadow p-4">
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    {/* Total Tiqueteado */}
                    <div>
                      <p className="font-bold text-gray-900">🎟️ Total Tiqueteado</p>
                      <p className="text-gray-800">
                        Cantidad de Tickets:{' '}
                        <span className="text-blue-600 font-semibold">{totales.totalTickets}</span>
                      </p>
                      <p className="text-gray-800">
                        Valor:{' '}
                        <span className="text-green-600 font-semibold">
                          {formatCOP(totales.valorTiqueteado)}
                        </span>
                      </p>
                    </div>

                    {/* Total Despachado */}
                    <div>
                      <p className="font-bold text-gray-900">🚌 Total Despachado</p>
                      <p className="text-gray-800">
                        Cantidad de Tickets:{' '}
                        <span className="text-blue-600 font-semibold">
                          {totales.totalDespachado}
                        </span>
                      </p>
                      <p className="text-gray-800">
                        Valor:{' '}
                        <span className="text-green-600 font-semibold">
                          {formatCOP(totales.valorDespachado!)}
                        </span>
                      </p>
                    </div>

                    {/* Total por Despachar */}
                    <div>
                      <p className="font-bold text-gray-900">📦 Total por Despachar</p>
                      <p className="text-gray-800">
                        Cantidad de Tickets:{' '}
                        <span className="text-blue-600 font-semibold">
                          {totales.totalPorDespachar || 0}
                        </span>
                      </p>
                      <p className="text-gray-800">
                        Valor:{' '}
                        <span className="text-green-600 font-semibold">
                          {formatCOP(totales.valorPorDespachar! || 0)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* listar los viajes */}
              {planillas.map((planilla) => (
                <div key={planilla.id} className="border rounded-xl shadow-sm p-4 ">
                  {planilla.viaje.rutas.map((ruta: any) => (
                    <div key={ruta.idRutaPadre} className="mb-4">
                      <h4 className="font-medium text-blue-600">
                        Trayecto: {ruta.nombreRuta} (Tickets: {ruta.totalTicketsRuta}) - 💵{' '}
                        {formatCOP(ruta.valorTotalRuta)}
                      </h4>
                      <table className="w-full text-sm border mt-2">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left">Lugar</th>
                            <th className="p-2 text-right">Cantidad</th>
                            <th className="p-2 text-right">Vr-Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ruta.lugares.map((lugar: any) => (
                            <tr
                              key={lugar.idLugar || lugar.nombre}
                              className={`border-t ${lugar.estado === 'PORDESPACHAR' ? ' text-red-600 font-semibold' : ''
                                }`}
                            >
                              <td className="p-2">{lugar.nombre}</td>
                              <td className="p-2 text-right">{lugar.cantidadTickets}</td>
                              <td className="p-2 text-right font-semibold">
                                💵 {formatCOP(lugar.valorTotalLugar)}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>


                  ))}


                </div>
              ))}

              {relacionPlanillas.length > 0 && (
                <div className="border rounded-xl shadow p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Relación de Planillas Despachadas</h4>
                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Planilla</th>
                        <th className="p-2 text-left">Vehículo</th>
                        <th className="p-2 text-left">Trayecto</th>
                        <th className="p-2 text-right">Psj</th>
                        <th className="p-2 text-right">Valor Total</th>
                        <th className="p-2 text-right"></th>


                      </tr>
                    </thead>
                    <tbody>
                      {relacionPlanillas.map((item, index) => (
                        <tr key={item.idEstadoViaje} className="border-t hover:bg-gray-50 transition">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 font-semibold text-blue-600">{item.numeroPlanilla}</td>
                          <td className="p-2">{item.vehiculo}</td>
                          <td className="p-2">{item.trayecto}</td>
                          <td className="p-2 text-right">{item.cantidadTickets}</td>
                          <td className="p-2 text-right">{0}</td>
                          <td className="p-2 text-right">{'D'}</td>

                          
                        </tr>
                      ))}

                      {relacionPlanillas.length > 1 && (
                        <tr className="bg-gray-50 font-semibold border-t">
                          <td colSpan={4} className="p-2 text-right">Total Pasajeros:</td>
                          <td className="p-2 text-right text-green-600">
                            {relacionPlanillas.reduce((sum, i) => sum + i.cantidadTickets, 0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalReporteVentanillas;