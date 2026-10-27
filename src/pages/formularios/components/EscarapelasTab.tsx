import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Calendar, ChevronDown, Download, FileText, IdCard, Loader2, MessageSquare, Palette, Users } from 'lucide-react';
import type { EscarapelaDatos } from '../public/EscarapelaCard';
import { descargarEscarapelas, nombreArchivo, type FormatoEscarapela } from '../public/escarapelaExport';
import { EscarapelaDesignModal } from './EscarapelaDesignModal';

interface FormularioEscarapela {
  id: number;
  titulo: string;
  estado: string;
  colorTema: string | null;
  respuestas_count: number;
  /** Nombre del evento al que está vinculado, si lo está */
  evento: string | null;
  alRegistrar: boolean;
  individual: boolean;
  masiva: boolean;
}

interface Inscrito {
  id: number;
  nombre: string | null;
  identificacion: string | null;
  registradoEn: string | null;
}

type Modo = 'alRegistrar' | 'individual' | 'masiva';

const MODOS: { modo: Modo; titulo: string; ayuda: string }[] = [
  { modo: 'alRegistrar', titulo: 'Al registrarse', ayuda: 'Quien llena el formulario recibe su escarapela al enviarlo.' },
  { modo: 'individual', titulo: 'Una por una', ayuda: 'Genera desde aquí la escarapela de cada inscrito.' },
  { modo: 'masiva', titulo: 'Masivas', ayuda: 'Descarga todas las escarapelas en un solo PDF.' },
];

interface Props {
  onToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

/**
 * Escarapelas de un formulario listas para dibujar: la de un inscrito o las de
 * todos. El logo y el fondo llegan una sola vez y se reparten a cada una.
 */
const cargarEscarapelas = async (idFormulario: number, idRespuesta?: number): Promise<EscarapelaDatos[]> => {
  const { escarapelas, logo, fondoImagen } = (
    await axios.get(`formularios/${idFormulario}/escarapelas/datos`, { params: idRespuesta ? { respuesta: idRespuesta } : undefined })
  ).data;

  return escarapelas.map((e: EscarapelaDatos) => ({ ...e, logo, fondoImagen }));
};

/**
 * Pestaña "Escarapelas": lista los formularios internos y deja habilitar en cada
 * uno la escarapela al registrarse, la generación una por una y la masiva.
 */
export const EscarapelasTab: React.FC<Props> = ({ onToast }) => {
  const [formularios, setFormularios] = useState<FormularioEscarapela[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);
  // Avance de la descarga masiva: "12/50"
  const [avance, setAvance] = useState('');
  const [disenando, setDisenando] = useState<number | null>(null);
  // Formulario con la lista de inscritos desplegada
  const [abierto, setAbierto] = useState<number | null>(null);
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState(false);

  useEffect(() => {
    axios
      .get('escarapelas/formularios')
      .then((res) => {
        setFormularios(res.data.formularios || []);
        setDisponible(res.data.disponible !== false);
      })
      .catch((error) => {
        console.error('Error cargando escarapelas:', error);
        onToast('No se pudieron cargar los formularios', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const cambiarModo = async (f: FormularioEscarapela, modo: Modo) => {
    setGuardando(`${f.id}-${modo}`);
    try {
      const res = await axios.put(`formularios/${f.id}/escarapela`, { [modo]: !f[modo] });
      setFormularios((prev) => prev.map((x) => (x.id === f.id ? { ...x, ...res.data } : x)));
      if (modo === 'individual' && abierto === f.id) setAbierto(null);
    } catch (error: any) {
      console.error(error);
      onToast(error.response?.data?.error || 'No se pudo guardar el cambio', 'error');
    } finally {
      setGuardando(null);
    }
  };

  const verInscritos = async (f: FormularioEscarapela) => {
    if (abierto === f.id) {
      setAbierto(null);
      return;
    }
    setAbierto(f.id);
    setInscritos([]);
    setLoadingInscritos(true);
    try {
      setInscritos((await axios.get(`formularios/${f.id}/escarapelas`)).data);
    } catch (error) {
      console.error(error);
      onToast('No se pudieron cargar los inscritos', 'error');
    } finally {
      setLoadingInscritos(false);
    }
  };

  /** Sin `inscrito` descarga todas las del formulario en un solo PDF. */
  const descargar = async (clave: string, f: FormularioEscarapela, formato: FormatoEscarapela, inscrito?: Inscrito) => {
    setDescargando(clave);
    setAvance('');
    try {
      const escarapelas = await cargarEscarapelas(f.id, inscrito?.id);
      const nombre = inscrito ? `escarapela-${nombreArchivo(inscrito.nombre || f.titulo)}` : `escarapelas-${nombreArchivo(f.titulo)}`;
      await descargarEscarapelas(escarapelas, formato, nombre, (hechas, total) => !inscrito && setAvance(`${hechas}/${total}`));
    } catch (error: any) {
      console.error(error);
      onToast(error.response?.data?.error || 'No se pudo generar el archivo', 'error');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl flex flex-col gap-8">
      <div className="border-b border-neutral-100 dark:border-white/5 pb-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-neutral-800 dark:text-white flex items-center gap-3">
          <span className="w-2.5 h-8 bg-violet-600 rounded-full inline-block" />
          <span>Escarapelas</span>
        </h2>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mt-1">
          Elige qué formularios generan escarapela y cómo
        </p>
      </div>

      {!disponible && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">Las escarapelas aún no están disponibles para esta empresa.</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
          <div className="w-8 h-8 rounded-full border-4 border-t-violet-500 border-neutral-200 dark:border-neutral-800 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Cargando formularios...</span>
        </div>
      ) : formularios.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-white/10 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-800/5 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/40 rounded-2xl flex items-center justify-center mb-4 text-neutral-300">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-1">No tienes formularios creados</h3>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed font-semibold">
            Crea un formulario interno y aquí podrás habilitarle la escarapela.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {formularios.map((f) => (
            <div key={f.id} className="border border-neutral-200/60 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white truncate" title={f.titulo}>
                    {f.titulo}
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-2">
                    <span className={f.estado === 'publicado' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                      {f.estado === 'publicado' ? 'Publicado' : f.estado}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
                      <span>{`${f.respuestas_count} ${f.respuestas_count === 1 ? 'Inscrito' : 'Inscritos'}`}</span>
                    </span>
                    {f.evento && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                        <span>{f.evento}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDisenando(f.id)}
                    disabled={!disponible}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none bg-neutral-50 hover:bg-violet-500/10 text-neutral-500 hover:text-violet-600 dark:bg-neutral-800/40 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/5"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Diseñar</span>
                  </button>
                  {f.individual && (
                    <button
                      onClick={() => verInscritos(f)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                    >
                      <Users className="w-4 h-4" />
                      <span>Inscritos</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abierto === f.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {f.masiva && (
                    <button
                      onClick={() => descargar(`masiva-${f.id}`, f, 'pdf')}
                      disabled={f.respuestas_count === 0 || descargando !== null}
                      title={f.respuestas_count === 0 ? 'Este formulario todavía no tiene inscritos' : undefined}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    >
                      {descargando === `masiva-${f.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>{descargando === `masiva-${f.id}` && avance ? `Generando ${avance}` : 'Descargar todas (PDF)'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MODOS.map(({ modo, titulo, ayuda }) => (
                  <label
                    key={modo}
                    className={`flex items-start justify-between gap-3 p-4 rounded-2xl border cursor-pointer select-none transition-colors ${
                      f[modo]
                        ? 'border-violet-500/30 bg-violet-500/[0.04]'
                        : 'border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-neutral-800/20'
                    } ${!disponible ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <span className="flex flex-col gap-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-200">{titulo}</span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium leading-snug">{ayuda}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={f[modo]}
                      disabled={!disponible || guardando === `${f.id}-${modo}`}
                      onChange={() => cambiarModo(f, modo)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${f[modo] ? 'bg-violet-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${f[modo] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </label>
                ))}
              </div>

              {abierto === f.id && f.individual && (
                <div className="border-t border-neutral-100 dark:border-white/5 pt-4">
                  {loadingInscritos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                  ) : inscritos.length === 0 ? (
                    <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Este formulario todavía no tiene inscritos
                    </p>
                  ) : (
                    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-white/5 max-h-[360px] overflow-y-auto pr-1">
                      {inscritos.map((i) => (
                        <div key={i.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <IdCard className="w-4 h-4 text-neutral-300 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-neutral-800 dark:text-white truncate">{i.nombre || 'Sin nombre'}</span>
                              <span className="text-[10px] text-neutral-400">
                                {[i.identificacion, i.registradoEn && new Date(i.registradoEn).toLocaleString()].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex gap-2">
                            {(['pdf', 'png'] as FormatoEscarapela[]).map((formato) => (
                              <button
                                key={formato}
                                onClick={() => descargar(`inscrito-${i.id}-${formato}`, f, formato, i)}
                                disabled={descargando !== null}
                                title={formato === 'pdf' ? 'Descargar escarapela en PDF' : 'Descargar escarapela como imagen'}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 bg-neutral-50 hover:bg-violet-500/10 text-neutral-500 hover:text-violet-600 dark:bg-neutral-800/40 dark:text-neutral-400"
                              >
                                {descargando === `inscrito-${i.id}-${formato}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                <span>{formato}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EscarapelaDesignModal open={disenando !== null} formId={disenando} onClose={() => setDisenando(null)} onToast={onToast} />
    </div>
  );
};
