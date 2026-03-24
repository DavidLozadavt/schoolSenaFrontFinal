import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';

const InformeGeneralInstructor: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [anioGestion, setAnioGestion] = useState<number>(0);
  const [aniosContrato, setAniosContrato] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('get_years_contract_person', {
        params: { idPerson: authContext.persona.id }
      });
      setAniosContrato(res.data);
    };
    loadData();
  }, [authContext]);
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Informes instructor</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión y seguimiento de centros de formación</p>
      </div>
      <div>
        <select
          value={anioGestion}
          onChange={(e) => setAnioGestion(Number(e.target.value))}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0} disabled>
            Seleccione un año
          </option>
          {aniosContrato.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
        Contenido de CF - En desarrollo
      </div>
    </div>
  );
};

export default InformeGeneralInstructor;
