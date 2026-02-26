import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';

/**
 * Página de entrada a Programas.
 * Si hay redes, redirige a los programas de la primera red.
 * Si no hay redes, muestra mensaje para crear una.
 */
const ProgramasEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        const res = await axios.get('red');
        const redes = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (redes.length > 0) {
          const primeraRed = redes[0];
          navigate(`/gestion-academica/configuracion/redes/programas/${primeraRed.id}`, { replace: true });
          return;
        }
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las redes.');
      } finally {
        setLoading(false);
      }
    };
    loadAndRedirect();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando programas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <KeenIcon icon="information" className="text-5xl text-amber-500 mb-4" />
        <p className="text-center text-gray-700 dark:text-gray-300 mb-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Programas</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        No hay redes configuradas. Crea una red primero para gestionar programas.
      </p>
      <button
        onClick={() => navigate('/redes')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Ir a Gestión de Redes
      </button>
    </div>
  );
};

export default ProgramasEntryPage;
