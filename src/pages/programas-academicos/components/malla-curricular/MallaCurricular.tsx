import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MallaCurricularProps } from '../../types';
import AsignarMateria from './AsignarMateria';

interface Recurso {
  id: number;
  nombre: string;
}

interface DetalleAsignacion {
  id: number;
  idPeriodo: number;
  idSede: number;
  idEmpresa?: number;
  jornadas: Recurso[];
  programa: {
    id: number;
    nombrePrograma: string;
    idTipoGrado: number; // Para preseleccionar el tipo de grado
    tipo_grado?: Recurso;
  };
}

export const MallaCurricular = ({ isOpen, onClose, program }: MallaCurricularProps) => {
  const [niveles, setNiveles] = useState([{ id: 'A1', nombre: 'Transición Inicial' }]);
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  
  // Catálogos de la API
  const [recursos, setRecursos] = useState<{
    periodos: Recurso[];
    tipos_grado: Recurso[];
    jornadas_disponibles: Recurso[];
  } | null>(null);
  
  const [detalle, setDetalle] = useState<DetalleAsignacion | null>(null);
  
  // --- ESTADOS PARA SINCRONIZAR SELECTORES ---
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | string>('');
  const [selectedTipoGrado, setSelectedTipoGrado] = useState<number | string>('');

  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState('');

  useEffect(() => {
    const fetchConfiguracion = async () => {
      if (isOpen && program?.id) {
        setLoading(true);
        setErrorApi(null);
        setDetalle(null); 

        try {
          const response = await axios.get(`/asignacion_detalle_completo/${program.id}`);
          const { data } = response.data;
          
          setDetalle(data.detalle);
          setRecursos(data.recursos);

          // SINCRONIZACIÓN INICIAL CON LA BASE DE DATOS
          if (data.detalle) {
            setSelectedPeriodo(data.detalle.idPeriodo);
            // Priorizamos idTipoGrado del objeto programa para el selector
            setSelectedTipoGrado(data.detalle.programa.idTipoGrado || '');
          }
        } catch (error: any) {
          console.error("Error cargando malla:", error);
          setErrorApi(error.response?.data?.message || "Error al cargar la configuración");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchConfiguracion();
  }, [isOpen, program?.id]);

  if (!isOpen || !program) return null;

  const agregarNivel = () => {
    const nuevoId = `A${niveles.length + 1}`;
    setNiveles([...niveles, { id: nuevoId, nombre: 'Nuevo Nivel Académico' }]);
  };

  const quitarNivel = () => {
    if (niveles.length > 0) setNiveles(niveles.slice(0, -1));
  };

  const handleOpenMateria = (nivelId: string) => {
    setSelectedNivelId(nivelId);
    setIsMateriaModalOpen(true);
  };

  // Función para manejar el cambio de periodo (Simula la lógica de la imagen 4)
  const handlePeriodoChange = (id: string) => {
    setSelectedPeriodo(id);
    // Aquí podrías disparar una petición adicional si las jornadas dependen estrictamente del periodo seleccionado
    console.log("Cambiando a periodo:", id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-coal-500 rounded-xl shadow-card flex flex-col max-h-[95vh] overflow-hidden border border-gray-300 dark:border-gray-dark-300">
        
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-coal-500/60 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-2 text-xs font-bold text-primary uppercase tracking-widest">Sincronizando...</span>
            </div>
          </div>
        )}

        {/* Header con Banner */}
        <div className="relative flex-shrink-0 w-full h-32 md:h-40 overflow-hidden">
          <img src={program.imageUrl || '/default-banner.jpg'} className="absolute inset-0 object-cover w-full h-full brightness-[0.35]" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-coal-500 via-coal-500/20 to-transparent" />

          <button onClick={onClose} className="absolute z-10 flex items-center justify-center w-8 h-8 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/30">
            <i className="text-lg ki-outline ki-cross"></i>
          </button>

          <div className="absolute text-white bottom-4 left-6">
            <span className="px-2 py-0.5 text-4xs font-extrabold tracking-widest uppercase bg-primary rounded mb-1 inline-block">
              {detalle?.programa.tipo_grado?.nombre || "SIN ASIGNAR"}
            </span>
            <h2 className="text-1.5xl font-bold uppercase tracking-tight leading-none text-white">
              {detalle?.programa.nombrePrograma || program.name}
            </h2>
            <p className="mt-1 font-bold tracking-tighter text-gray-300 uppercase text-2xs">
              Código: {program.codigo} • Malla Curricular
            </p>
          </div>
        </div>

        {/* Área de Contenido */}
        <div className="flex-grow p-5 overflow-y-auto bg-gray-100 md:p-7 no-scrollbar dark:bg-coal-600">

          {errorApi ? (
            <div className="p-4 mb-6 border border-danger/30 bg-danger/10 rounded-xl text-danger text-center font-bold text-xs uppercase italic animate-pulse">
              <i className="ki-outline ki-information-2 mr-2"></i> {errorApi}
            </div>
          ) : (
            <div className="flex flex-col items-stretch justify-between gap-4 p-4 mb-6 bg-white border border-gray-300 shadow-sm xl:flex-row dark:bg-coal-300 rounded-xl dark:border-gray-dark-100">
              <div className="grid flex-grow grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-2">

                {/* 1. Periodo Lectivo Sincronizado */}
                <div className="flex items-center gap-3 px-2">
                  <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-9 h-9 bg-primary-light dark:bg-primary-clarity text-primary">
                    <i className="text-lg ki-outline ki-calendar"></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <label className="font-bold text-gray-500 uppercase truncate text-3xs dark:text-gray-400">Periodo Lectivo</label>
                    <select 
                      value={selectedPeriodo}
                      onChange={(e) => handlePeriodoChange(e.target.value)}
                      className="p-0 font-extrabold text-gray-800 bg-transparent border-none cursor-pointer dark:text-white focus:ring-0 text-2sm"
                    >
                      <option value="">SELECCIONE...</option>
                      {recursos?.periodos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Jornadas (Muestra lo que está en 'detalle') */}
                <div className="flex items-center gap-3 px-2 border-gray-200 sm:border-l dark:border-gray-dark-300">
                  <div className="flex flex-col w-full min-w-0">
                    <label className="font-bold text-gray-500 uppercase truncate text-3xs dark:text-gray-400">Jornadas Asignadas</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detalle?.jornadas && detalle.jornadas.length > 0 ? (
                        detalle.jornadas.map((j) => (
                          <span key={j.id} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-black uppercase tracking-tighter">
                            {j.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="italic font-bold uppercase text-danger text-3xs tracking-tighter">SIN REGISTROS</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Tipo de Programa Sincronizado */}
                <div className="flex items-center gap-3 px-2 border-gray-200 sm:border-l dark:border-gray-dark-300">
                  <div className="flex flex-col w-full min-w-0">
                    <label className="font-bold text-gray-500 uppercase truncate text-3xs dark:text-gray-400">Tipo de Programa</label>
                    <select 
                      value={selectedTipoGrado}
                      onChange={(e) => setSelectedTipoGrado(e.target.value)}
                      className="p-0 font-extrabold uppercase bg-transparent border-none cursor-pointer text-primary focus:ring-0 text-2sm"
                    >
                      <option value="">SELECCIONE...</option>
                      {recursos?.tipos_grado.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de Nivel */}
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 xl:pt-0 xl:border-t-0 xl:pl-4 xl:border-l dark:border-gray-dark-300">
                <button onClick={quitarNivel} className="flex items-center justify-center w-10 h-10 transition-all border border-gray-300 rounded-lg bg-gray-50 dark:bg-coal-400 text-danger hover:bg-danger hover:text-white">
                  <i className="text-xl ki-outline ki-minus"></i>
                </button>
                <button onClick={agregarNivel} className="flex items-center justify-center w-10 h-10 text-white transition-all rounded-lg bg-primary shadow-primary hover:bg-primary-active">
                  <i className="text-xl ki-outline ki-plus"></i>
                </button>
              </div>
            </div>
          )}

          {/* Grid de Niveles Académicos */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {niveles.map((nivel) => (
              <div key={nivel.id} className="p-5 transition-all bg-white border border-gray-400 shadow-sm group dark:bg-coal-300 rounded-xl dark:border-gray-dark-100 hover:border-gray-500 hover:shadow-md animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2.5xl font-black text-gray-500 italic">{nivel.id}</span>
                </div>

                <div className="space-y-4">
                  <h4 className="pl-3 text-xs font-black tracking-tight text-gray-800 uppercase border-l-3 dark:text-white border-primary">
                    {nivel.nombre}
                  </h4>
                  <div className="p-3 border border-gray-300 border-dashed rounded-lg bg-gray-50 dark:bg-coal-400">
                    <p className="italic font-medium text-gray-600 text-2xs dark:text-gray-500">No se han registrado materias.</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenMateria(nivel.id)}
                  className="w-full py-2.5 mt-5 font-bold text-gray-500 uppercase transition-all border border-gray-400 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-4xs "
                >
                  <i className="mr-1.5 ki-outline ki-plus"></i> Asignar Materia
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 bg-white border-t border-gray-300 dark:bg-coal-400 dark:border-gray-dark-100">
          <div className="items-center hidden gap-2 sm:flex">
            <i className="text-sm ki-outline ki-information-2 text-primary"></i>
            <p className="italic font-bold text-gray-600 text-3xs dark:text-gray-400">
              {detalle ? "CONFIGURACIÓN ACTIVA VINCULADA." : "ESPERANDO ASIGNACIÓN."}
            </p>
          </div>
          <button onClick={onClose} className="px-10 py-2.5 bg-primary text-white rounded-lg text-3xs font-black uppercase tracking-widest hover:bg-primary-active active:scale-95 transition-all shadow-lg">
            Cerrar
          </button>
        </div>

      </div>

      <AsignarMateria isOpen={isMateriaModalOpen} onClose={() => setIsMateriaModalOpen(false)} nivelId={selectedNivelId} />
    </div>
  );
};

export default MallaCurricular;