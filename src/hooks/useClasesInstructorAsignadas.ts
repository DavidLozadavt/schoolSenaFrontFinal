import { useCallback, useEffect, useState } from 'react';
import {
  fetchClasesAsignadasInstructor,
  type ClaseAsignadaInstructorBase
} from '@/utils/clasesAsignadasLogica';

/**
 * Fuente única de clases a dictar: `GET fichas/instructor/clases-asignadas`
 * (misma ruta que Mi horario / `FichaController::clasesAsignadasInstructor`).
 */
export function useClasesInstructorAsignadas(idInstructor?: number | string | null) {
  const [clases, setClases] = useState<(ClaseAsignadaInstructorBase & Record<string, unknown>)[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchClasesAsignadasInstructor(idInstructor);
      setClases(list);
    } catch (e) {
      setClases([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [idInstructor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { clases, loading, error, refetch: cargar };
}
