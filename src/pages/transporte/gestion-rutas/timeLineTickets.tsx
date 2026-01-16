import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ViajesModel } from '../cronograma-rutas/model/ViajesInterface';
import ModalCreateTicket from '@/pages/puntos-de-venta/Caja/VentaTickets/ModalCreateTicket';
import { formatCOP } from '@/utils/formatters';

interface TimelineTicketsProps {
    viajeData: ViajesModel | null;
    idCaja: any;
}

const TimelineTickets = ({ viajeData, idCaja }: TimelineTicketsProps) => {
    const [hoveredStop, setHoveredStop] = useState<number | null>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalVentaTicketsOpen, setIsModalVentaTicketsOpen] = useState<boolean>(false); 
    const [selectedRutaId, setSelectedRutaId] = useState<number | null>(null);
    const [selectedStop, setSelectedStop] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!viajeData) return;
    
            try {
                const response = await axios.get(`get_rutas_hijas/${viajeData.idRuta}`);
                const data = response.data;
    
                const formattedStops = [
                    {
                        name: data.ciudad_origen.descripcion,
                        type: 'origen',
                        time: '06:00 AM',
                        distance: '0 km',
                        description: 'Punto de partida del recorrido.',
                        price: data.precio,
                        id: viajeData.idRuta, 
                    },
                    ...data.rutas_hijas.map((ruta: any) => ({
                        name: ruta.lugar ? ruta.lugar.nombre : 'Parada intermedia',
                        type: 'parada',
                        time: '07:00 AM',
                        distance: ruta.distancia,
                        description: ruta.descripcion || 'Parada intermedia.',
                        price: ruta.precio,
                        id: ruta.id, 
                    })),
                    {
                        name: data.ciudad_destino.descripcion,
                        type: 'destino',
                        time: '08:00 AM',
                        distance: data.distancia,
                        description: 'Punto de llegada del recorrido.',
                        price: data.precio,
                        id: viajeData.idRuta, 
                    },
                ];
    
                setStops(formattedStops);
                setLoading(false);
            } catch (error) {
                setError('Error al cargar los datos');
                setLoading(false);
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, [viajeData]);


      

    const handleStopClick = (stop: any) => {
        const rutaId = stop.type === 'origen' || stop.type === 'destino' ? viajeData?.idRuta : stop.id;
        setSelectedRutaId(rutaId);
        setSelectedStop(stop);
        setIsModalVentaTicketsOpen(true); 
    };

    const getNombreLugar = (stop: any) => {
        if (stop.type === 'parada') {
            return stop.name;
        }
        return undefined;
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const origen = stops.find(stop => stop.type === 'origen')?.name || 'Origen';
    const destino = stops.find(stop => stop.type === 'destino')?.name || 'Destino';

    return (
        <div className="flex flex-col items-center py-8 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3 justify-center">
                    <span className="text-green-600">{origen}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-red-600">{destino}</span>
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                    📍 Haz clic en cualquier parada para vender tickets
                </p>
            </div>


            <div className="relative w-full">
                <div className="absolute w-full h-1 bg-gray-300 top-[30px] left-0"></div>

                <div className="flex flex-col justify-between md:flex-row gap-8">
                    {stops.map((stop, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center mb-16 md:mb-0 cursor-pointer group"
                            onMouseEnter={() => setHoveredStop(index)}
                            onMouseLeave={() => setHoveredStop(null)}
                            onClick={() => handleStopClick(stop)} 
                        >
                            <div
                                className={`w-12 h-12 rounded-full z-10 flex items-center justify-center transform transition-all duration-300 hover:scale-125 hover:shadow-lg ${
                                    stop.type === 'origen'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : stop.type === 'destino'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                } ${hoveredStop === index ? 'ring-4 ring-white ring-opacity-50' : ''}`}
                            >
                                {stop.type === 'origen' && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                )}
                                {stop.type === 'destino' && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                                        />
                                    </svg>
                                )}
                                {stop.type === 'parada' && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Nombre de la parada */}
                            <div className="mt-4 text-center min-h-[80px] flex flex-col justify-start">
                                <h3
                                    className={`text-base font-bold transition-colors group-hover:scale-105 mb-1 ${
                                        stop.type === 'origen'
                                            ? 'text-green-600 group-hover:text-green-700'
                                            : stop.type === 'destino'
                                            ? 'text-red-600 group-hover:text-red-700'
                                            : 'text-blue-600 group-hover:text-blue-700'
                                    }`}
                                >
                                    {stop.name}
                                </h3>
                                <div className="flex flex-col items-center gap-1">
                                    {stop.type === 'origen' && (
                                        <p className="text-xs text-gray-500 font-medium">(Origen)</p>
                                    )}
                                    {stop.type === 'destino' && (
                                        <p className="text-xs text-gray-500 font-medium">(Destino)</p>
                                    )}
                                    {stop.type === 'parada' && (
                                        <p className="text-xs text-gray-500 font-medium">(Parada {index})</p>
                                    )}
                                    <p className="text-sm font-bold text-gray-700">
                                        {formatCOP(stop.price)}
                                    </p>
                                </div>
                            </div>

                            {/* Flecha entre paradas */}
                            {index < stops.length - 1 && (
                                <div className="absolute w-16 h-1 bg-gray-300 top-[30px] left-full hidden md:block">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="absolute right-0 w-4 h-4 text-gray-500 transform -translate-y-1/2 top-1/2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Tooltip al hacer hover */}
                            {hoveredStop === index && (
                                <div className="absolute w-72 p-4 transition-opacity duration-300 ease-in-out transform -translate-x-1/2 border border-gray-200 rounded-lg shadow-xl top-16 left-1/2 backdrop-blur-sm  z-50">
                                    <div className="absolute w-4 h-4 transform rotate-45 -translate-x-1/2 border-t border-l border-gray-200 -top-2 left-1/2 "></div>
                                    <h3 className="mb-2 text-lg font-bold text-gray-800">{stop.name}</h3>
                                    <p className="flex items-center mb-2 text-xl font-bold text-green-600">
                                        <span className="mr-2">💰</span>{formatCOP(stop.price)}
                                    </p>
                                    <p className="flex items-center mb-3 text-sm text-gray-600">
                                        <span className="mr-2">📍</span>{stop.distance}
                                    </p>
                                    <button 
                                        className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStopClick(stop);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        Vender Ticket
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

           <ModalCreateTicket
                open={isModalVentaTicketsOpen}
                onClose={() => setIsModalVentaTicketsOpen(false)}
                viajeData={viajeData}
                selectedRutaId={selectedRutaId}
                nombreLugarSeleccionado={selectedStop ? getNombreLugar(selectedStop) : undefined}
                onSave={(ticketData: any) => {
                    setIsModalVentaTicketsOpen(false);
                }}
                idCaja={idCaja}
                />

        </div>
    );
};

export default TimelineTickets;