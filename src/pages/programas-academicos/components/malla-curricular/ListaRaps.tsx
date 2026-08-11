import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertCircle, BookOpen, X, FileText, Plus } from 'lucide-react';
import { CardRap } from './CardRap';
import { HorariosMateria } from './HorariosMateria';
import { FormCompetencia } from './FormCompetencia';
import { enqueueSnackbar } from 'notistack';

interface ListaRapsProps {
  isOpen: boolean;
  onClose: () => void;
  idMateriaPadre: number;
  nombreCompetencia?: string;
  idFicha: number;
  nivelId?: number;
  porcentajeEjecucion?: number;
  programId: number;
  /** Misma ficha/programa que Planeación (encabezado unificado). */
  program?: any;
  ficha?: any;
  onEditCompetencia?: (competenciaId: number, callback?: () => void) => void;
  onUpdate?: () => void;
  esEditable?: boolean;
}

export const ListaRaps: React.FC<ListaRapsProps> = ({
  isOpen,
  onClose,
  idMateriaPadre,
  nombreCompetencia = "Competencia",
  idFicha,
  nivelId,
  porcentajeEjecucion,
  programId,
  program,
  ficha,
  onEditCompetencia,
  onUpdate,
  esEditable = true
}) => {
  const [raps, setRaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agregarRap, setAgregarRap] = useState<boolean>(false);
  /** Evita spinner de pantalla completa en refrescos: desmontar CardRap cerraba el calendario. */
  const hasLoadedRef = useRef(false);
  const [modalHorarios, setModalHorarios] = useState<{
    open: boolean;
    idGradoMateria?: number;
    idFicha?: number;
    totalHoras?: number;
    horasActuales?: number;
    horasFaltantes?: number;
    fechaInicioPrefill?: string;
    horaInicioPrefill?: string;
    horaFinPrefill?: string;
    fechaFinalRap?: string;
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

    // Solo bloquear UI en la primera carga; en refrescos conservar CardRap/calendario abiertos.
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
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

      const fetchedRaps = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
          ? response.data 
          : [];

      setRaps(fetchedRaps);

      if (fetchedRaps.length === 0 && !hasLoadedRef.current) {
        enqueueSnackbar('Cargar juicios evaluativos para mostrar RAPs asignados a la ficha', { variant: 'warning' });
      }

      if (!Array.isArray(response.data?.data) && !Array.isArray(response.data)) {
        setError('No se encontraron RAPs para esta competencia');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los RAPs');
      setRaps([]);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  };
  
  useEffect(() => {
    hasLoadedRef.current = false;
    cargarRaps();
  }, [isOpen, idMateriaPadre]);
  
  if (!isOpen) return null;

  const nombrePrograma =
    program?.name ||
    program?.nombrePrograma ||
    ficha?.programa?.nombrePrograma ||
    'Programa sin nombre';
  const numeroFicha = ficha?.codigo ?? ficha?.numeroFicha ?? '—';
  const jornadaFicha =
    ficha?.jornada?.nombreJornada ||
    ficha?.jornadaFicha ||
    'Sin jornada';
  const bannerUrl =
    program?.imageUrl ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/10 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* Encabezado unificado con Planeación de Fichas */}
        <div className="relative flex-shrink-0 w-full overflow-hidden">
          <img
            src={bannerUrl}
            className="absolute inset-0 object-cover w-full h-full brightness-[0.4]"
            alt="Banner del programa"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute z-10 flex items-center justify-center w-9 h-9 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/40 hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>

          <div className="relative z-[1] flex flex-col px-6 pb-5 pt-12 pr-16 text-white">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 mb-0.5">
                  Programa
                </p>
                <h2 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight leading-snug text-white/95 drop-shadow line-clamp-2">
                  {nombrePrograma}
                </h2>
                <p className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none drop-shadow-lg">
                  FICHA {numeroFicha}
                </p>
              </div>

              <div className="shrink-0 sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 mb-1">
                  Jornada
                </p>
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-white/15 border border-white/35 backdrop-blur-sm text-sm sm:text-base font-black uppercase tracking-widest text-white shadow-lg">
                  {jornadaFicha}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contexto RAPs (sin alterar listado / progreso) */}
        <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-coal-400 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-tight text-gray-800 dark:text-white truncate">
                Resultados de Aprendizaje (RAPs)
              </p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                Total: {raps.length} · Pendientes: {raps.filter((rap: any) => rap.estado === 'PENDIENTE').length} · Finalizados: {raps.filter((rap: any) => rap.estado === 'FINALIZADO').length} · {nombreCompetencia}
              </p>
            </div>
          </div>
          {porcentajeEjecucion != null && (
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Porcentaje de Ejecución
              </p>
              <p className="text-sm font-black text-primary">{porcentajeEjecucion}%</p>
            </div>
          )}
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
                Esta competencia aún no tiene resultados de aprendizaje asignados,
                por favor cargar juicios evaluativos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de RAPs usando CardRap */}
              <div className="space-y-4 sm:space-y-5">
                {raps.sort((b: any, a: any) => a.estado.localeCompare(b.estado)).map((rap, index) => {
                  // Transformar el RAP al formato que espera CardRap
                  const materiaTransformada = {
                    id: rap.id,
                    nombre: rap.nombre,
                    estado: rap.estado,
                    idMateria: rap.idMateria,
                    fechaFinalRap: rap.fechaFinalRap,
                    idGradoMateria: rap.idGradoMateria,
                    idMateriaPadre: rap.idMateriaPadre,
                    codigo: rap.codigo,
                    horasTotales: rap.horas,
                    horasActuales: rap.horasActuales || 0,
                    horasFaltantes: rap.horasFaltantes || 0,
                    porcentajeAvance: rap.porcentajeAvance || 0,
                    descripcion: rap.descripcion,
                    horarios: rap.horarios || []
                  };

                  return (
                    <div key={rap.id} className="rounded-xl">
                      <CardRap
                        materia={materiaTransformada}
                        idTrimestre={nivelId}
                        idFicha={idFicha}
                        setModalHorarios={setModalHorarios}
                        cargarRaps={cargarRaps}
                        onAsignacionSuccess={() => {
                          cargarRaps();
                          if (onUpdate) onUpdate();
                        }}
                        onEditCompetencia={(id) => onEditCompetencia && onEditCompetencia(id, cargarRaps)}
                        esEditable={esEditable}
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
            <button onClick={()=> setAgregarRap(true)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-md">
              <Plus size={14} />Agregar RAP
            </button>
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
          idFicha={modalHorarios.idFicha || idFicha || 0}
          totalHoras={modalHorarios.totalHoras}
          horasActuales={modalHorarios.horasActuales}
          horasFaltantes={modalHorarios.horasFaltantes}
          porcentajeEjecucion={porcentajeEjecucion ?? 0}
          jornada={jornadaFicha}
          fechaInicioPrefill={modalHorarios.fechaInicioPrefill}
          horaInicioPrefill={
            modalHorarios.horaInicioPrefill ||
            (ficha?.jornada?.horaInicial
              ? String(ficha.jornada.horaInicial).slice(0, 5)
              : undefined)
          }
          horaFinPrefill={
            modalHorarios.horaFinPrefill ||
            (ficha?.jornada?.horaFinal
              ? String(ficha.jornada.horaFinal).slice(0, 5)
              : undefined)
          }
          fechaFinalRap={modalHorarios.fechaFinalRap}
          onGuardado={() => {
            cargarRaps();
            if (onUpdate) onUpdate();
          }}
        />
      }

      {agregarRap && (
        <FormCompetencia
          isOpen={agregarRap}
          onClose={() => setAgregarRap(false)}
          programId={programId||0}
          idGradoPrograma={nivelId}
          idFicha={idFicha}
          idMateriaPadre={idMateriaPadre}
          onSuccess={() => {
            cargarRaps();
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default ListaRaps;