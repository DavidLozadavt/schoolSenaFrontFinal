/** Tiempo límite de cuestionario: UI en minutos y horas; persistencia en minutos. */

export const minutosDesdeCamposTiempo = (minutosRaw: string, horasRaw: string): number | null => {
  const minTxt = minutosRaw.trim();
  const hrsTxt = horasRaw.trim();
  if (minTxt === '' && hrsTxt === '') return null;

  const minutos = minTxt === '' ? 0 : Number(minTxt);
  const horas = hrsTxt === '' ? 0 : Number(hrsTxt);
  if (!Number.isInteger(minutos) || minutos < 0 || minutos > 59 || !Number.isInteger(horas) || horas < 0) {
    return null;
  }

  const total = horas * 60 + minutos;
  return total > 0 && total <= 10080 ? total : null;
};

export const camposTiempoDesdeMinutos = (
  minutos: number | null | undefined
): { minutos: string; horas: string } => {
  if (minutos == null || !Number.isFinite(minutos) || minutos <= 0) {
    return { minutos: '', horas: '' };
  }
  const total = Math.round(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return {
    horas: horas > 0 ? String(horas) : '',
    minutos: resto > 0 ? String(resto) : horas > 0 ? '' : String(total)
  };
};

export const validarCamposTiempo = (minutosRaw: string, horasRaw: string): string | null => {
  const minTxt = minutosRaw.trim();
  const hrsTxt = horasRaw.trim();
  if (minTxt === '' && hrsTxt === '') return null;

  const minutos = minTxt === '' ? 0 : Number(minTxt);
  const horas = hrsTxt === '' ? 0 : Number(hrsTxt);
  if (minTxt !== '' && (!Number.isInteger(minutos) || minutos < 0 || minutos > 59)) {
    return 'Los minutos deben ser un entero entre 0 y 59.';
  }
  if (hrsTxt !== '' && (!Number.isInteger(horas) || horas < 0)) {
    return 'Las horas deben ser un entero mayor o igual a 0.';
  }
  if (horas * 60 + minutos > 10080) {
    return 'El tiempo límite no puede superar 168 horas (7 días).';
  }
  return null;
};

export const formatearLimiteCuestionario = (minutos: number | null | undefined): string => {
  if (minutos == null || !Number.isFinite(minutos) || minutos <= 0) return 'Sin límite';
  const m = Math.round(minutos);
  if (m % 60 === 0) {
    const h = m / 60;
    return h === 1 ? '1 h' : `${h} h`;
  }
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h} h ${r} min`;
};

/** Cuenta regresiva siempre HH:MM:SS (00:59:32). */
export const formatearCuentaRegresivaCuestionario = (ms: number): string => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const formatearTiempoUtilizado = (segundos: number | null | undefined): string => {
  if (segundos == null || !Number.isFinite(segundos) || segundos < 0) return '—';
  const s = Math.round(segundos);
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const rest = s % 60;
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  return rest > 0 ? `${min} min ${rest} s` : `${min} min`;
};

export const formatearHoraIntento = (value: string | null | undefined): string => {
  if (!value) return '—';
  const v = value.trim();
  if (!v) return '—';
  const normalized = v.includes('T') ? v : v.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const MSG_TIEMPO_FINALIZADO = 'El tiempo del cuestionario ha finalizado';
export const MSG_TIEMPO_GUARDADO =
  'El tiempo del cuestionario ha finalizado. Sus respuestas fueron guardadas.';

export interface IntentoCuestionarioPayload {
  tiempoCuestionario?: number | null;
  fechaInicio?: string | null;
  fechaVencimiento?: string | null;
  segundosRestantes?: number | null;
  servidorAhora?: string | null;
  vencido?: boolean;
  cierrePorTiempo?: boolean;
  finalizado?: boolean;
  tiempoUtilizadoSegundos?: number | null;
  estadoCierre?: string | null;
}
