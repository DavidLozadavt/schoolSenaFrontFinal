import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lock, TrendingUp } from 'lucide-react';
import { numeroGradoDesdeTrimestre } from './utils/trimestreNumeroGrado';
import { CardRap } from './CardRap';

interface CardTrimestreProps {
  setSelectedNivelId: any;
  trimestre: any;
  index: number;
  onAbrirMaterias: (nivelId: any) => void;
  onVerRaps?: (competenciaId: number, competenciaNombre: string, idTrimestre: number) => void;
  onEditCompetencia?: (competenciaId: number, callback?: () => void) => void;
  onAsignacionSuccess?: () => void;
  setModalHorarios?: any;
  idFicha?: number;
  esEditable?: boolean;
}

const formatearFecha = (fecha: Date): string => {
  return new Date(fecha).toISOString().split('T')[0];
};

const calcularProgreso = (fechaInicio: string, fechaFin: string): number => {
  const inicio = new Date(fechaInicio).getTime();
  const fin = new Date(fechaFin).getTime();
  const hoy = Date.now();

  if (hoy <= inicio) return 0;
  if (hoy >= fin) return 100;

  const total = fin - inicio;
  const transcurrido = hoy - inicio;

  return Math.round((transcurrido / total) * 100);
};

const obtenerClaseEstado = (estado: string) => {
  const estados: Record<string, string> = {
    FINALIZADO: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'EN CURSO': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    CANCELADO: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    NUEVO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  };
  return estados[estado] || '';
};

const MSG_SOLO_ACTUAL = 'Solo puede modificarse el trimestre actual.';

export const CardTrimestre: React.FC<CardTrimestreProps> = ({
  trimestre,
  index,
  onAbrirMaterias,
  setSelectedNivelId,
  onVerRaps,
  onEditCompetencia,
  onAsignacionSuccess,
  setModalHorarios,
  idFicha,
  esEditable = true
}) => {
  const [expandido, setExpandido] = useState(false);

  const materiasArray = Array.isArray(trimestre.materias) ? trimestre.materias : [];
  const tieneObjetosCompletos = materiasArray.length > 0 && typeof materiasArray[0] === 'object';
  const numero = numeroGradoDesdeTrimestre(trimestre) ?? index + 1;
  const progreso =
    trimestre.grado.fechaInicio && trimestre.grado.fechaFin
      ? calcularProgreso(trimestre.grado.fechaInicio, trimestre.grado.fechaFin)
      : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-expanded={expandido}
        aria-controls={`trimestre-panel-${numero}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-600">
          <h3 className="text-2xl font-black text-gray-700 dark:text-gray-200 flex items-center gap-2 min-w-0">
            <ChevronDown
              size={22}
              className={`shrink-0 text-primary transition-transform duration-300 ${
                expandido ? 'rotate-0' : '-rotate-90'
              }`}
              aria-hidden
            />
            <span className="text-primary">#{numero}</span>
            TRIMESTRE
            {!esEditable && (
              <span
                className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-coal-400 text-gray-500 dark:text-gray-400"
                title={MSG_SOLO_ACTUAL}
              >
                <Lock size={12} aria-hidden />
                Histórico
              </span>
            )}
          </h3>
          <span
            className={`self-start sm:self-auto rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${obtenerClaseEstado(
              trimestre.grado.estado
            )}`}
          >
            {trimestre.grado.estado || 'Sin estado'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1">Inicio</p>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {trimestre.grado.fechaInicio ? formatearFecha(trimestre.grado.fechaInicio) : '--:--:--'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1">Fin</p>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {trimestre.grado.fechaFin ? formatearFecha(trimestre.grado.fechaFin) : '--:--:--'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1">Competencias</p>
            <p className="font-bold text-primary text-sm">{materiasArray.length || 0}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1">Progreso</p>
            <p className="font-bold text-green-600 dark:text-green-400 text-sm flex items-center justify-center gap-1">
              <TrendingUp size={14} />
              {progreso}%
            </p>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expandido ? (
          <motion.div
            id={`trimestre-panel-${numero}`}
            key="contenido"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <h4 className="text-sm font-black uppercase text-gray-700 dark:text-gray-200 border-l-4 border-primary pl-3 mb-4">
                Competencias Asignadas
              </h4>

              {materiasArray.length > 0 ? (
                <div className="space-y-3">
                  {tieneObjetosCompletos ? (
                    materiasArray.map((materia: any) => (
                      <CardRap
                        key={materia.id}
                        materia={materia}
                        idTrimestre={trimestre.grado.idGradoPrograma}
                        onVerRaps={onVerRaps}
                        onEditCompetencia={onEditCompetencia}
                        onAsignacionSuccess={onAsignacionSuccess}
                        setModalHorarios={setModalHorarios}
                        idFicha={idFicha || trimestre.idFicha}
                        materiasLength={materiasArray.length}
                        esEditable={esEditable}
                      />
                    ))
                  ) : (
                    <div />
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-coal-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No hay competencias asignadas
                  </p>
                </div>
              )}

              {esEditable ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbrirMaterias(trimestre.idGradoPrograma);
                    setSelectedNivelId(trimestre.grado.idGradoPrograma);
                  }}
                  className="w-full py-3 mt-4 font-bold text-gray-600 dark:text-gray-300 uppercase transition-all border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-sm hover:shadow-lg active:scale-95"
                >
                  <i className="mr-2 ki-outline ki-plus"></i>
                  Agregar Competencia
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={MSG_SOLO_ACTUAL}
                  className="w-full py-3 mt-4 font-bold text-gray-400 dark:text-gray-500 uppercase border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-lg text-sm cursor-not-allowed opacity-70 flex items-center justify-center gap-2"
                >
                  <Lock size={14} aria-hidden />
                  Agregar Competencia
                </button>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
