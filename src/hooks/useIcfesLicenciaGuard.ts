import { useEffect, useRef } from 'react';
import axios from 'axios';
import { canAccessModuloIcfes } from '@/utils/permissionUtils';
import {
  cerrarSesionPorLicenciaRevocada,
  esCodigoLicenciaIcfesInactiva
} from '@/utils/icfesLicenciaLogout';

const INTERVAL_MS = 5000;

/** Cierra sesión en School si VT revoca la licencia ICFES mientras el admin navega. */
export function useIcfesLicenciaGuard(
  permissions: string[],
  roles: string[],
  user: unknown,
  centroF: number
) {
  const vigilar = canAccessModuloIcfes(permissions, roles, user, centroF);
  const licenciaActivaRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!vigilar) return undefined;

    licenciaActivaRef.current = null;

    const interval = window.setInterval(async () => {
      try {
        const res = await axios.get<{ servicio_eduexce_activo?: boolean }>('eduexce/configuracion');
        const activa = res.data.servicio_eduexce_activo !== false;

        if (licenciaActivaRef.current === null) {
          licenciaActivaRef.current = activa;
          return;
        }

        if (licenciaActivaRef.current && !activa) {
          cerrarSesionPorLicenciaRevocada();
          return;
        }

        licenciaActivaRef.current = activa;
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { code?: string } } };
        if (esCodigoLicenciaIcfesInactiva(ax?.response?.data?.code)) {
          cerrarSesionPorLicenciaRevocada();
        }
      }
    }, INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [vigilar]);
}
