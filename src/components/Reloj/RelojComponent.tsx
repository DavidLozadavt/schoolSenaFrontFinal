import { useState, useEffect } from 'react';

const RelojComponent = () => {
  const getHoraActual = () => {
    const fecha = new Date();
    return fecha.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).replace(/a\.\s*m\.|p\.\s*m\./, (match) => match.includes('a') ? 'am' : 'pm');
  };

  const [hora, setHora] = useState(getHoraActual());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHora(getHoraActual());
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="inline-block p-4 bg-gray-100 border border-gray-200 rounded-lg shadow-lg bg backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <span className="text-lg font-semibold text-gray-800">
          🕒
        </span>
        <span className="text-xl font-bold text-blue-600 ">
          {hora}
        </span>
      </div>
    </div>
  );
};

export default RelojComponent;