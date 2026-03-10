import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface Grupo {
  id: number;
  nombreGrupo: string;
  descripcion?: string;
  cantidadParticipantes: number;
  integrantesActuales: number;
  estado: string;
  yaUnido: boolean;
  tipoGrupo?: { nombreTipoGrupo: string };
}

interface FichaGrupos {
  idFicha: number;
  idMatricula: number;
  codigoFicha?: string;
  grupos: Grupo[];
}

const ListaGruposAprendiz: React.FC = () => {
  const [fichas, setFichas] = useState<FichaGrupos[]>([]);
  const [loading, setLoading] = useState(true);
  const [uniriendo, setUniriendo] = useState<number | null>(null);

  useEffect(() => {
    axios.get('grupos-estudiante').then((r) => {
      setFichas(r.data?.data || []);
    }).catch(() => setFichas([])).finally(() => setLoading(false));
  }, []);

  const handleUnirse = async (idFicha: number, idGrupo: number, idMatricula: number) => {
    setUniriendo(idGrupo);
    try {
      await axios.post(`fichas/${idFicha}/grupos/${idGrupo}/unirse`, { idMatricula });
      const r = await axios.get('grupos-estudiante');
      setFichas(r.data?.data || []);
    } catch (e: any) {
      alert(e.response?.data?.error || e.response?.data?.errors?.idMatricula?.[0] || 'Error al unirse');
    } finally {
      setUniriendo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  const totalGrupos = fichas.reduce((acc, f) => acc + f.grupos.length, 0);
  if (totalGrupos === 0) {
    return (
      <div className="text-center py-8">
        <KeenIcon icon="users" className="text-4xl text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">No hay grupos disponibles</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Los grupos de tus fichas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fichas.map((ficha) => (
        <div key={ficha.idFicha} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-coal-400">
          <div className="px-4 py-3 bg-gray-50 dark:bg-coal-500/50 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ficha {ficha.codigoFicha || ficha.idFicha}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {ficha.grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-50/50 dark:bg-coal-500/30 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{grupo.nombreGrupo}</p>
                  {grupo.descripcion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{grupo.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {grupo.integrantesActuales}/{grupo.cantidadParticipantes} integrantes
                    </span>
                    {grupo.tipoGrupo && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {grupo.tipoGrupo.nombreTipoGrupo}
                      </span>
                    )}
                    {grupo.yaUnido && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Ya eres miembro
                      </span>
                    )}
                  </div>
                </div>
                {grupo.estado === 'ACTIVO' && !grupo.yaUnido && grupo.integrantesActuales < grupo.cantidadParticipantes && (
                  <button
                    onClick={() => handleUnirse(ficha.idFicha, grupo.id, ficha.idMatricula)}
                    disabled={uniriendo === grupo.id}
                    className="btn btn-sm btn-primary shrink-0"
                  >
                    {uniriendo === grupo.id ? 'Uniendo...' : 'Unirse'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaGruposAprendiz;
