import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CardRap } from './CardRap';

interface CardTrimestreProps {
  setSelectedNivelId: any;
  trimestre: any;
  index: number;
  onAbrirMaterias: (nivelId: any) => void;
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
    'FINALIZADO': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    'EN CURSO': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'CANCELADO': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    'NUEVO': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  };
  return estados[estado] || '';
};

export const CardTrimestre: React.FC<CardTrimestreProps> = ({ trimestre, index, onAbrirMaterias, setSelectedNivelId }) => {
  // Verificar si materias es un array de objetos o de IDs
  const materiasArray = Array.isArray(trimestre.materias) ? trimestre.materias : [];
  const tieneObjetosCompletos = materiasArray.length > 0 && typeof materiasArray[0] === 'object';

  return (
    <>
      {/* Header del Trimestre */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 pb-4 border-b-2 border-gray-100 dark:border-gray-600">
        <h3 className="text-2xl font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <span className="text-primary">#{trimestre.grado.numeroGrado || index + 1}</span>
          TRIMESTRE
        </h3>
        <span className={`mt-2 sm:mt-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${obtenerClaseEstado(trimestre.grado.estado)}`}>
          {trimestre.grado.estado || 'Sin estado'}
        </span>
      </div>

      {/* Estadísticas del Trimestre */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Inicio</p>
          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
            {trimestre.grado.fechaInicio ? formatearFecha(trimestre.grado.fechaInicio) : '--:--:--'}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Fin</p>
          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
            {trimestre.grado.fechaFin ? formatearFecha(trimestre.grado.fechaFin) : '--:--:--'}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Competencias</p>
          <p className="font-bold text-primary text-sm">
            {materiasArray.length || 0}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Progreso</p>
          <p className="font-bold text-green-600 dark:text-green-400 text-sm flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            {trimestre.grado.fechaInicio && trimestre.grado.fechaFin 
              ? calcularProgreso(trimestre.grado.fechaInicio, trimestre.grado.fechaFin) 
              : 0}%
          </p>
        </div>
      </div>

      {/* Competencias */}
      <div>
        <h4 className="text-sm font-black uppercase text-gray-700 dark:text-gray-200 border-l-4 border-primary pl-3 mb-4">
          Competencias Asignadas
        </h4>
        
        {materiasArray.length > 0 ? (
          <div className="space-y-3">
            {tieneObjetosCompletos ? (
              // Si son objetos completos (trimestres existentes de la API)
              materiasArray.map((materia: any) => (
                <CardRap key={materia.id} materia={materia} />
              ))
            ) : (
              // Si son solo IDs (nuevo trimestre temporal)
              materiasArray.map((idMateria: number) => (
                <div 
                  key={idMateria}
                  className="p-3 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <i className="ki-outline ki-book text-lg font-bold"></i>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 dark:text-white">
                      Competencia ID: {idMateria}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pendiente de guardar
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 dark:bg-coal-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No hay competencias asignadas
            </p>
          </div>
        )}

        <button
          onClick={() => {
            onAbrirMaterias(trimestre.id);
            setSelectedNivelId(trimestre.id);
          }}
          className="w-full py-3 mt-4 font-bold text-gray-600 dark:text-gray-300 uppercase transition-all border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-sm hover:shadow-lg active:scale-95"
        >
          <i className="mr-2 ki-outline ki-plus"></i>
          Agregar Competencia
        </button>
      </div>
    </>
  );
};