import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Tercero } from '@/pages/puntos-de-venta/models/TerceroInterface';

interface TicketAsignacion {
  numeroTicket: number;
  tercero: Tercero | null;
  identificacion: string;
}

export const useTicketSearch = (initialQuantity: number = 1) => {
  const [asignacionTickets, setAsignacionTickets] = useState<TicketAsignacion[]>([
    { numeroTicket: 1, tercero: null, identificacion: '222222222222' }
  ]);
  
  const tercerosCacheRef = useRef<Map<string, Tercero | null>>(new Map());
  
  const busquedasEnProgresoRef = useRef<Set<string>>(new Set());

  
  const buscarTercero = useCallback(async (identificacion: string): Promise<Tercero | null> => {
    const identClean = identificacion.trim();
    
    if (!identClean) return null;

    if (tercerosCacheRef.current.has(identClean)) {
      return tercerosCacheRef.current.get(identClean) || null;
    }

    if (busquedasEnProgresoRef.current.has(identClean)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!busquedasEnProgresoRef.current.has(identClean)) {
            clearInterval(checkInterval);
            resolve(tercerosCacheRef.current.get(identClean) || null);
          }
        }, 100);
      });
    }

    busquedasEnProgresoRef.current.add(identClean);

    try {
      const response = await axios.get(`terceros?identificacion=${identClean}`);
      const tercero = response.data.length > 0 ? response.data[0] : null;
      
      tercerosCacheRef.current.set(identClean, tercero);
      
      return tercero;
    } catch (error) {
      tercerosCacheRef.current.set(identClean, null);
      return null;
    } finally {
      busquedasEnProgresoRef.current.delete(identClean);
    }
  }, []);

 
  const actualizarIdentificacionTicket = useCallback((numeroTicket: number, identificacion: string) => {
    setAsignacionTickets((prev) =>
      prev.map((a) =>
        a.numeroTicket === numeroTicket ? { ...a, identificacion, tercero: null } : a
      )
    );
  }, []);

  /**
   * Actualiza el tercero de un ticket específico
   */
  const actualizarTerceroTicket = useCallback((numeroTicket: number, tercero: Tercero | null) => {
    setAsignacionTickets((prev) =>
      prev.map((a) => (a.numeroTicket === numeroTicket ? { ...a, tercero } : a))
    );
  }, []);

  /**
   * Aplica un tercero a todos los tickets
   */
  const aplicarATodos = useCallback((tercero: Tercero) => {
    setAsignacionTickets((prev) =>
      prev.map((a) => ({
        ...a,
        tercero,
        identificacion: tercero.identificacion
      }))
    );
  }, []);

  /**
   * Ajusta la cantidad de tickets (añade o elimina)
   */
  const ajustarCantidad = useCallback(async (nuevaCantidad: number) => {
    setAsignacionTickets((prev) => {
      const cantidadActual = prev.length;

      // Si aumenta la cantidad
      if (nuevaCantidad > cantidadActual) {
        const nuevasAsignaciones = [...prev];
        
        for (let i = cantidadActual; i < nuevaCantidad; i++) {
          nuevasAsignaciones.push({
            numeroTicket: i + 1,
            tercero: null,
            identificacion: '222222222222'
          });
        }

        buscarTercero('222222222222').then((tercero) => {
          if (tercero) {
            setAsignacionTickets((current) =>
              current.map((a) =>
                a.identificacion === '222222222222' && !a.tercero ? { ...a, tercero } : a
              )
            );
          }
        });

        return nuevasAsignaciones;
      }

      return prev.slice(0, nuevaCantidad);
    });
  }, [buscarTercero]);

  /**
   * Effect para buscar terceros cuando cambia la identificación
   * Con debounce de 500ms
   */
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    asignacionTickets.forEach((asignacion) => {
      if (asignacion.identificacion && !asignacion.tercero) {
        const timer = setTimeout(() => {
          buscarTercero(asignacion.identificacion).then((tercero) => {
            actualizarTerceroTicket(asignacion.numeroTicket, tercero);
          });
        }, 500); 
        
        timers.push(timer);
      }
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [asignacionTickets.map((a) => `${a.numeroTicket}-${a.identificacion}-${a.tercero ? '1' : '0'}`).join(',')]);

  /**
   * Limpia el caché (útil cuando se cierra el modal)
   */
  const limpiarCache = useCallback(() => {
    tercerosCacheRef.current.clear();
    busquedasEnProgresoRef.current.clear();
  }, []);

  /**
   * Resetea todos los tickets
   */
  const resetear = useCallback(() => {
    setAsignacionTickets([{ numeroTicket: 1, tercero: null, identificacion: '222222222222' }]);
    limpiarCache();
  }, [limpiarCache]);

  /**
   * Inicializa con el tercero por defecto
   */
  useEffect(() => {
    buscarTercero('222222222222').then((tercero) => {
      if (tercero) {
        actualizarTerceroTicket(1, tercero);
      }
    });
  }, []);

  return {
    asignacionTickets,
    actualizarIdentificacionTicket,
    actualizarTerceroTicket,
    aplicarATodos,
    ajustarCantidad,
    resetear,
    limpiarCache,
    getCacheSize: () => tercerosCacheRef.current.size,
    getBusquedasEnProgreso: () => busquedasEnProgresoRef.current.size
  };
};