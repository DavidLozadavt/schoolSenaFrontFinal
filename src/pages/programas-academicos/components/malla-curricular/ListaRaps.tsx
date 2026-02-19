import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, BookOpen, X, FileText } from 'lucide-react';
import { CardRap } from './CardRap';
import { HorariosMateria } from './HorariosMateria';

interface ListaRapsProps {
  isOpen: boolean;
  onClose: () => void;
  idMateriaPadre: number;
  nombreCompetencia?: string;
  idFicha: number;
  nivelId?: number;
  porcentajeEjecucion?: number;
}

export const ListaRaps: React.FC<ListaRapsProps> = ({
  isOpen,
  onClose,
  idMateriaPadre,
  nombreCompetencia = "Competencia",
  idFicha,
  nivelId,
  porcentajeEjecucion
}) => {
  const [raps, setRaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalHorarios, setModalHorarios] = useState<{
    open: boolean;
    idGradoMateria?: number;
    idFicha?: number;
    totalHoras?: number;
    horasActuales?: number;
    horasFaltantes?: number;
  }>({
    open: false,
    idGradoMateria: undefined,
    idFicha: undefined,
    totalHoras: 0,
    horasActuales: 0,
    horasFaltantes: 0
  });

    const cargarRaps = async () => {
      if (!isOpen || !idMateriaPadre) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`materias/raps`, {
          params:
          {
            idFicha: idFicha,
            idMateriaPadre: idMateriaPadre,
            idGradoPrograma: nivelId
          }
        });

        if (Array.isArray(response.data?.data)) {
          setRaps(response.data.data);
        } else if (Array.isArray(response.data)) {
          setRaps(response.data);
        } else {
          setRaps([]);
          setError('No se encontraron RAPs para esta competencia');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar los RAPs');
        setRaps([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    cargarRaps();
  }, [isOpen, idMateriaPadre]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/10 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="flex-shrink-0 bg-primary-active p-4 text-white">
          <div className="flex items-center justify-between flex-col md:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    Resultados de Aprendizaje (RAPs)
                  </h2>
                  <span className="text-sm font-bold text-gray-300">
                    Total: {raps.length} - {nombreCompetencia}
                  </span>
                </div>
              </div>
            </div>
     
            <span className="text-md font-bold text-gray-300 mr-12">
              Porcentaje de Ejecución
              <p className="text-center text-lg font-bold">{porcentajeEjecucion}%</p>
            </span>
       
            <button
              onClick={onClose}
              className="absolute z-10 flex items-center justify-center w-9 h-9 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/40 hover:scale-110"
              aria-label="Cerrar modal"
            >
              <i className="text-lg ki-outline ki-cross"></i>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50 dark:bg-coal-600 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Cargando RAPs...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 border-l-4 border-danger bg-danger/10 rounded-lg flex items-start gap-4">
              <AlertCircle size={24} className="text-danger flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-danger mb-1">Error al cargar los RAPs</h3>
                <p className="text-sm text-danger/80">{error}</p>
              </div>
            </div>
          ) : raps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <FileText size={56} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                No hay RAPs disponibles
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta competencia aún no tiene resultados de aprendizaje asignados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de RAPs usando CardRap */}
              <div className="space-y-3">
                {raps.map((rap, index) => {
                  // Transformar el RAP al formato que espera CardRap
                  const materiaTransformada = {
                    id: rap.id,
                    nombre: rap.nombre,
                    idMateria: rap.idMateria,
                    idGradoMateria: rap.idGradoMateria,
                    idMateriaPadre: rap.idMateriaPadre,
                    codigo: rap.codigo,
                    horasTotales: rap.horas,
                    horasActuales: 0,
                    horasFaltantes: rap.horas,
                    porcentajeAvance: 0,
                    descripcion: rap.descripcion,
                    horarios: rap.horarios || []
                  };

                  return (
                    <div key={rap.id} className="rounded-xl p-1">
                      <CardRap
                        materia={materiaTransformada}
                        idTrimestre={nivelId}
                        idFicha={idFicha}
                        setModalHorarios={setModalHorarios}
                        onAsignacionSuccess={cargarRaps}
                      />

                      {/* Información adicional del RAP */}
                      {(rap.descripcion !== rap.nombreMateria || rap.creditos || rap.DocUrl) && (
                        <div className="px-4 pb-4 space-y-2">

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {rap.DocUrl && rap.DocUrl !== 'http://localhost:8000/default/auto.png' && (
                              <a
                                href={rap.DocUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <FileText size={12} />
                                Ver Documento
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 bg-white dark:bg-coal-400 border-t-2 border-gray-200 dark:border-gray-600 shadow-inner">
          <div className="hidden sm:flex items-center gap-2">
            <i className="text-base ki-outline ki-information-2 text-primary"></i>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {raps.length > 0
                ? `${raps.length} resultado${raps.length !== 1 ? 's' : ''} de aprendizaje encontrado${raps.length !== 1 ? 's' : ''}`
                : 'No hay resultados de aprendizaje'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-lg hover:shadow-xl"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal Horarios */}
      {modalHorarios.open &&
        <HorariosMateria
          open={modalHorarios.open}
          onClose={() => setModalHorarios({
            open: false,
            idGradoMateria: undefined
          })}
          idGradoMateria={modalHorarios.idGradoMateria ?? 0}
          idFicha={modalHorarios.idFicha ?? 0}
          totalHoras={modalHorarios.totalHoras}
          horasActuales={modalHorarios.horasActuales}
          horasFaltantes={modalHorarios.horasFaltantes}
          porcentajeEjecucion={porcentajeEjecucion??0}
          onGuardado={() => { }}
        />
      }
    </div>
  );
};

export default ListaRaps;