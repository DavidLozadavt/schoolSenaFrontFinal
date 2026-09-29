import React, { useEffect, useRef, useState } from 'react';
import {
  formatearCuentaRegresivaMs,
  parseFechaBackend
} from './intervaloReintentoCuestionario';

interface CuentaRegresivaReintentoProps {
  /** Fecha/hora del próximo intento calculada por el backend. */
  proximoIntentoDisponibleEn: string;
  /** Fecha límite de la asignación (tiene prioridad sobre el reintento). */
  fechaFinal?: string | null;
  /** Se dispara una vez al llegar a cero (para refetch). */
  onElapsed: () => void;
  className?: string;
}

/**
 * Contador local por tarjeta. Cada tick recalcula `objetivo - Date.now()`
 * (no decrementa un contador interno) para corregir pestañas en segundo plano.
 */
const CuentaRegresivaReintento: React.FC<CuentaRegresivaReintentoProps> = ({
  proximoIntentoDisponibleEn,
  fechaFinal,
  onElapsed,
  className
}) => {
  const [texto, setTexto] = useState<string | null>(null);
  const [ocultar, setOcultar] = useState(false);
  const firedRef = useRef(false);
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  useEffect(() => {
    firedRef.current = false;
    setOcultar(false);

    const objetivo = parseFechaBackend(proximoIntentoDisponibleEn);
    if (!objetivo) {
      setTexto(null);
      return;
    }

    const limite = parseFechaBackend(fechaFinal ?? null);

    const tick = (): boolean => {
      const now = Date.now();

      // Fecha límite ya pasó o vence antes del próximo intento → no hay reintento útil.
      if (limite) {
        const limMs = limite.getTime();
        if (limMs <= now) {
          setOcultar(true);
          setTexto(null);
          return false;
        }
        if (limMs <= objetivo.getTime()) {
          setOcultar(true);
          setTexto(null);
          return false;
        }
      }

      const restante = objetivo.getTime() - now;
      if (restante <= 0) {
        setTexto('00:00:00');
        if (!firedRef.current) {
          firedRef.current = true;
          onElapsedRef.current();
        }
        return false;
      }

      setTexto(formatearCuentaRegresivaMs(restante));
      return true;
    };

    const seguir = tick();
    if (!seguir) return;

    const id = window.setInterval(() => {
      if (!tick()) {
        window.clearInterval(id);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [proximoIntentoDisponibleEn, fechaFinal]);

  if (ocultar || !texto) return null;

  return (
    <span className={className}>
      Podrás reintentar en:{' '}
      <span className="font-mono tabular-nums font-semibold text-gray-700 dark:text-white">{texto}</span>
    </span>
  );
};

export default CuentaRegresivaReintento;
