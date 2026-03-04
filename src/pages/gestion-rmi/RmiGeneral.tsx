import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import Select from 'react-select';

interface Regional {
  id: number;
  razonSocial: string;
}

interface Centro {
  id: number;
  nombre: string;
}

const RmiGeneral: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('AuthContext debe usarse dentro de AuthProvider');
  }

  const [admin, setAdmin] = useState<boolean>(false);
  const [adminRegional, setAdminRegional] = useState<boolean>(false);

  //Selects:
  const [idRegional, setIdRegional] = useState<number>(0);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [idCentroFormacion, setIdCentroFormacion] = useState<number>(0);
  const [centroFormacion, setCentroFormacion] = useState<Centro[]>([]);

  useEffect(() => {
    if (authContext?.roles.includes('ADMINISTRADOR VT')) {
      setAdmin(true);
      return;
    }
    if (authContext?.roles.includes('ADMIN REGIONAL')) {
      setAdminRegional(true);
      return;
    }
  }, [authContext]);

  useEffect(() => {
    if (admin) {
      const loadRegional = async () => {
        const res = await axios.get('regional');
        setRegionales(res.data);
      };
      loadRegional();
    }
  }, []);

  const optionsRegional = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));
  return (
    <div>
      {admin && (
        <div className="m-2">
          <Select
            options={optionsRegional}
            placeholder="Selecciona la regional"
            className="w-full max-w-md"
            onChange={(e) => {
              const newRegionalId = Number(e?.value) || 0;
              setIdRegional(newRegionalId);
              setIdCentroFormacion(0);
              setCentroFormacion([]);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RmiGeneral;
