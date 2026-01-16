import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCOP } from '@/utils/formatters';


interface TimeLineProps {
    idRutaPadre: number;
}
const Timeline = ({idRutaPadre}:TimeLineProps) => {
    const [hoveredStop, setHoveredStop] = useState<number | null>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`get_rutas_hijas/${idRutaPadre}`);
                const data = response.data;

                const formattedStops = [
                    {
                        name: data.ciudad_origen.descripcion,
                        type: 'origen',
                        time: '06:00 AM',
                        distance: '0 km',
                        description: 'Punto de partida del recorrido.',
                        price: data.precio
                    },
                    ...data.rutas_hijas.map((ruta: any) => ({
                        name: ruta.lugar ? ruta.lugar.nombre : 'Parada intermedia',
                        type: 'parada',
                        time: '07:00 AM', 
                        distance: ruta.distancia,
                        description: ruta.descripcion || 'Parada intermedia.',
                        price: ruta.precio,
                    })),
                    {
                        name: data.ciudad_destino.descripcion,
                        type: 'destino',
                        time: '08:00 AM', 
                        distance: data.distancia,
                        description: 'Punto de llegada del recorrido.',
                        price: data.precio

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
    }, []);

    const handleStopClick = (stop: any) => {
        alert(`Has hecho clic en: ${stop.name}`);
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
        <div className="flex flex-col items-center py-8">
            <h1 className="mb-8 text-3xl font-bold">
               {origen} → {destino}
            </h1>
            <div className="relative w-full">
                <div className="absolute w-full h-1 transform -translate-y-1/2 bg-gray-300 top-1/2"></div>

                <div className="flex flex-col justify-between md:flex-row">
                    {stops.map((stop, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center mb-8 md:mb-0"
                            onMouseEnter={() => setHoveredStop(index)}
                            onMouseLeave={() => setHoveredStop(null)}
                            onClick={() => handleStopClick(stop)}
                        >
                            <div
                                className={`w-10 h-10 rounded-full z-10 flex items-center justify-center transform transition-transform duration-300 hover:scale-110 ${
                                    stop.type === 'origen'
                                        ? 'bg-green-500'
                                        : stop.type === 'destino'
                                        ? 'bg-red-500' 
                                        : 'bg-blue-500'
                                }`}
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

                            <div className="mt-2 text-center">
                                <h3
                                    className={`text-lg font-bold ${
                                        stop.type === 'origen'
                                            ? 'text-green-600'
                                            : stop.type === 'destino'
                                            ? 'text-red-600' 
                                            : 'text-blue-600' 
                                    }`}
                                >
                                    {stop.name}
                                </h3>
                                {stop.type === 'origen' && (
                                    <p className="text-sm text-gray-500">(Origen)</p>
                                )}
                                {stop.type === 'destino' && (
                                    <p className="text-sm text-gray-500">(Destino)</p>
                                )}
                                {stop.type === 'parada' && (
                                    <p className="text-sm text-gray-500">(Parada {index})</p>
                                )}
                            </div>

                            {index < stops.length - 1 && (
                                <div className="absolute w-16 h-1 transform -translate-y-1/2 bg-gray-300 top-1/2 left-full">
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

                            {hoveredStop === index && (
                                <div className="absolute w-64 p-4 border border-gray-200 rounded-lg shadow-lg top-16">
                                    <h3 className="text-lg font-bold ">{stop.name}</h3>
                                    <p className="text-lg font-bold ">{formatCOP(stop.price)}</p>
                                    <p className="text-sm">{stop.distance}</p>
                                    <p className="text-sm">{stop.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Timeline;