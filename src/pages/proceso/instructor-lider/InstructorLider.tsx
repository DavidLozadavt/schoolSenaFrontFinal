import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Ficha {
    id: number;
    codigo: string;
    asignacion?: {
        programa?: {
            nombrePrograma: string;
        }
    };
    jornada?: {
        nombreJornada?: string;
    };
    sede?: {
        nombreSede: string;
    };
}

interface Aprendiz {
    idMatricula: number;
    idPersona: number;
    identificacion: string;
    nombreCompleto: string;
    rutaFoto: string | null;
    email: string | null;
    estadoMatricula: string;
}

const InstructorLider: React.FC = () => {
    const [fichas, setFichas] = useState<Ficha[]>([]);
    const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
    const [aprendices, setAprendices] = useState<Aprendiz[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingAprendices, setLoadingAprendices] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const loadFichas = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`instructor-lider`);
                setFichas(res.data);
            } catch (error) {
                console.error("Error loading fichas:", error);
            } finally {
                setLoading(false);
            }
        };
        loadFichas();
    }, []);

    const loadAprendices = async (ficha: Ficha) => {
        try {
            setSelectedFicha(ficha);
            setLoadingAprendices(true);
            const res = await axios.get(`instructor-lider/ficha/${ficha.id}/aprendices`);
            setAprendices(res.data);
        } catch (error) {
            console.error("Error loading aprendices:", error);
        } finally {
            setLoadingAprendices(false);
        }
    };

    const filteredAprendices = aprendices.filter(a => 
        a.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.identificacion.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 animate-pulse font-medium">Cargando información...</p>
            </div>
        );
    }

    if (selectedFicha) {
        return (
            <div className="min-h-screen p-6 max-w-7xl mx-auto animate-fade-in">
                {/* Header with Back Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedFicha(null)}
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg hover:bg-gray-50 dark:hover:bg-coal-400 transition-colors shadow-sm"
                        >
                            <i className="ki-outline ki-left text-lg text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Ficha: <span className="text-blue-600">{selectedFicha.codigo}</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedFicha.asignacion?.programa?.nombrePrograma || 'Programa no definido'}
                            </p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-72">
                        <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input 
                            type="text"
                            placeholder="Buscar aprendiz..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Container */}
                <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 bg-gray-50/50 dark:bg-coal-500 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                <i className="ki-outline ki-people text-blue-600 dark:text-blue-400 text-base" />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                                Listado de Aprendices
                            </h2>
                        </div>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-coal-400 px-2.5 py-1 rounded-full">
                            {filteredAprendices.length} aprendices
                        </span>
                    </div>

                    <div className="p-6">
                        {loadingAprendices ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500">Cargando aprendices...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAprendices.length > 0 ? (
                                    filteredAprendices.map((aprendiz) => (
                                        <div 
                                            key={aprendiz.idMatricula}
                                            className="group bg-white dark:bg-coal-600 rounded-xl p-5 border border-gray-100 dark:border-coal-300 hover:border-blue-500/30 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="relative">
                                                    {aprendiz.rutaFoto ? (
                                                        <img 
                                                            src={aprendiz.rutaFoto} 
                                                            alt={aprendiz.nombreCompleto}
                                                            className="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-50 dark:ring-coal-400"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-coal-400 flex items-center justify-center text-gray-400">
                                                            <i className="ki-outline ki-user text-3xl" />
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-coal-600 ${
                                                        aprendiz.estadoMatricula === 'ACTIVO' ? 'bg-green-500' : 'bg-amber-500'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors text-sm">
                                                        {aprendiz.nombreCompleto}
                                                    </h3>
                                                    <div className="space-y-1.5 mt-2">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <i className="ki-outline ki-badge text-sm" />
                                                            <span>{aprendiz.identificacion}</span>
                                                        </div>
                                                        {aprendiz.email && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <i className="ki-outline ki-sms text-sm" />
                                                                <span className="truncate">{aprendiz.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-coal-300 flex justify-between items-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                                                    aprendiz.estadoMatricula === 'ACTIVO' 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                }`}>
                                                    {aprendiz.estadoMatricula}
                                                </span>
                                                <button className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                                                    Perfil <i className="ki-outline ki-right text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-16 text-center">
                                        <i className="ki-outline ki-magnifier text-5xl text-gray-200 dark:text-coal-300 mb-4 inline-block" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron aprendices con ese criterio</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Instructor Líder
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gestiona tus fichas asignadas y realiza seguimiento a tus aprendices.
                </p>
            </div>

            {/* Fichas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fichas.map((ficha) => (
                    <div 
                        key={ficha.id}
                        onClick={() => loadAprendices(ficha)}
                        className="group bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-6 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <i className="ki-outline ki-book text-2xl" />
                            </div>
                            <span className="bg-gray-100 dark:bg-coal-400 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">
                                {ficha.codigo}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Programa</p>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa asignado'}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <i className="ki-outline ki-calendar text-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Jornada</p>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{ficha.jornada?.nombreJornada || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600">
                                        <i className="ki-outline ki-geolocation text-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sede</p>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{ficha.sede?.nombreSede || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-coal-300 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                                <span>Ver aprendices</span>
                                <i className="ki-outline ki-right text-sm group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                ))}

                {fichas.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-coal-500/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-coal-300">
                        <div className="bg-white dark:bg-coal-500 w-16 h-16 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                            <i className="ki-outline ki-people text-3xl text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">No tienes fichas asignadas</h3>
                        <p className="text-sm text-gray-500 mt-1">Contacta con el administrador si crees que esto es un error.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorLider;

