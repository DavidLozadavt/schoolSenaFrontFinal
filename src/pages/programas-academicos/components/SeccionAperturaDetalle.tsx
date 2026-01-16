import React, { useState } from 'react';
import axios from 'axios';

interface SeccionAperturaDetalleProps {
  programId: number;
}

const SeccionAperturaDetalle = ({ programId }: SeccionAperturaDetalleProps) => {
  const [aperturaData, setAperturaData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!aperturaData) {
      setLoading(true);
      try {
        const response = await axios.get(`/asignacion_detalle/${programId}`);
        if (response.data.status === 'success') {
          setAperturaData(response.data.data);
        }
      } catch (error) {
        console.error("Error al cargar apertura", error);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(true);
  };

  const InfoItem = ({ label, value, color = "text-gray-700" }: { label: string, value: any, color?: string }) => (
    <div className="flex flex-col p-2 border border-gray-300 rounded-lg shadow-sm bg-white/50 dark:bg-black/10 dark:border-white/5">
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className={`text-[11px] font-black uppercase truncate ${color} dark:text-white`}>
        {value !== null && value !== undefined ? value : '---'}
      </span>
    </div>
  );

  return (
    
    <div className={`flex flex-col transition-all duration-500 border border-dashed rounded-xl bg-gray-200 dark:bg-white/5 border-gray-400 dark:border-white/10 shadow-sm ${isExpanded ? 'md:col-span-3 h-auto' : 'h-[85px]'}`}>
      <div className="p-3 flex flex-col h-[85px]">
        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-auto">
          Información de Apertura
        </span>
        <button 
          onClick={handleToggle}
          className={`flex items-center justify-between w-full px-3 py-1.5 text-[9px] font-bold uppercase transition-all border rounded-lg shadow-sm active:scale-95 ${isExpanded ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 dark:bg-coal-500 dark:text-white border-gray-300 dark:border-white/10 hover:bg-primary hover:text-white'}`}
        >
          {isExpanded ? 'Ocultar Detalles' : 'Ver Más'}
          <i className={`transition-transform ki-filled ${isExpanded ? 'ki-up' : 'ki-right'} text-[10px]`}></i>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 duration-300 animate-in slide-in-from-top-2">
            
          <div className="pt-3 border-t border-gray-400 dark:border-white/10">
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 rounded-full border-primary border-t-transparent animate-spin"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Consultando datos...</span>
              </div>
            ) : aperturaData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <InfoItem label="Periodo" value={aperturaData.periodo?.nombrePeriodo} color="text-primary" />
                  <InfoItem label="Estado Apertura" value={aperturaData.estado} />
                  <InfoItem label="Sede" value={aperturaData.sede?.nombre} />
                  <InfoItem label="Tipo Calificación" value={aperturaData.tipoCalificacion} />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <InfoItem label="Valor Pensión" value={`$${aperturaData.valorPension}`} color="text-success" />
                  <InfoItem label="Día Cobro" value={aperturaData.diaCobro} />
                  <InfoItem label="Mora Matrícula" value={`${aperturaData.diasMoraMatricula} días / ${aperturaData.porcentajeMoraMatricula}%`} color="text-danger" />
                  <InfoItem label="Mora Pensión" value={`${aperturaData.diasMoraPension} días / ${aperturaData.porcentajeMoraPension}%`} color="text-danger" />
                  <InfoItem label="Pensión activa" value={aperturaData.pension === 1 ? 'SÍ' : 'NO'} />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <InfoItem label="Inicio Clases" value={aperturaData.fechaInicialClases} />
                  <InfoItem label="Fin Clases" value={aperturaData.fechaFinalClases} />
                  <InfoItem label="Inicio Plan Mejora" value={aperturaData.fechaInicialPlanMejoramiento} />
                  <InfoItem label="Fin Plan Mejora" value={aperturaData.fechaFinalPlanMejoramiento} />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <InfoItem label="Inicio Inscripción" value={aperturaData.fechaInicialInscripciones} />
                  <InfoItem label="Fin Inscripción" value={aperturaData.fechaFinalInscripciones} />
                  <InfoItem label="Inicio Matrícula" value={aperturaData.fechaInicialMatriculas} />
                  <InfoItem label="Fin Matrícula" value={aperturaData.fechaFinalMatriculas} />
                </div>

                {/* Observación */}
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-black/5 dark:border-white/5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Observación</span>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-1 font-medium leading-tight">
                    {aperturaData.observacion || 'Sin observaciones registradas.'}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-danger uppercase italic py-4 block text-center">
                El programa no tiene una apertura configurada.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeccionAperturaDetalle;