import React, { useEffect, useState } from 'react';

interface TemporizadorProps {
  estado: string;
  id: number;
  onTimeUpdate?: (time: number) => void;
}

const Temporizador: React.FC<TemporizadorProps> = ({ estado, id, onTimeUpdate }) => {
  const [badgeClass, setBadgeClass] = useState<string>('');
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(() => {
    const savedTime = localStorage.getItem(`tiempoTranscurrido_${id}`);
    return savedTime ? parseInt(savedTime, 10) : 0;
  });

  // Mapeo de estilos tipo "badge"
  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      PLANILLA: 'border border-yellow-400 text-yellow-600 bg-yellow-220',
      'EN VIAJE': 'border border-green-400 text-green-600 bg-green-220',
      CANCELADO: 'border border-red-400 text-red-600 bg-red-220',
      PENDIENTE: 'border border-gray-400 text-gray-600 bg-gray-200'
    };
    return badges[estado] || 'border border-gray-300 text-gray-600 bg-gray-50';
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    setBadgeClass(getEstadoBadge(estado));

    if (estado === 'PLANILLA' || estado === 'EN VIAJE') {
      interval = setInterval(() => {
        setTiempoTranscurrido((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`tiempoTranscurrido_${id}`, newTime.toString());
          if (onTimeUpdate) onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estado, id, onTimeUpdate]);

  const formatTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos
      .toString()
      .padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${badgeClass} px-3 py-1 rounded-md text-xs font-medium w-fit`}>
      {estado === 'PLANILLA' || estado === 'EN VIAJE' || estado === 'CANCELADO'
        ? formatTiempo(tiempoTranscurrido)
        : estado}
    </div>
  );
};

export default Temporizador;
