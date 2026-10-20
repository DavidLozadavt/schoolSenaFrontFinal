import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Download, ImagePlus, Loader2, Palette, Plus, Save, Trash2, X } from 'lucide-react';
import { EscarapelaCard, MENSAJE_ESCARAPELA, type EscarapelaDatos, type PlantillaEscarapela } from '../public/EscarapelaCard';
import { descargarEscarapelas, nombreArchivo, type FormatoEscarapela } from '../public/escarapelaExport';

interface Diseno {
  plantilla: PlantillaEscarapela;
  colorPrimario: string;
  colorFondo: string;
  colorTexto: string;
  fondoImagen: string | null;
  logo: string | null;
  /** Null = el del evento o el formulario */
  titulo: string | null;
  mensaje: string | null;
  ubicacion: string | null;
  /** Null = la del evento */
  fecha: string | null;
  /** Mostrar la foto que el inscrito subió en una pregunta "Subir archivo" */
  mostrarFoto: boolean;
  /** Pregunta de la que sale; null = la que hable de "foto" en el título */
  preguntaFoto: number | null;
  /** Respuestas del formulario que se imprimen en la escarapela, en este orden */
  campos: { idPregunta: number; etiqueta: string | null }[];
}

/** Tope de campos extra: la tarjeta mide 10 x 14 cm (el backend valida lo mismo) */
const MAX_CAMPOS = 3;

/** Preguntas para agregar que se listan antes de pedir "Ver todos los campos" */
const CAMPOS_A_LA_VISTA = 5;

/** Silueta que ocupa el lugar de la foto en la vista previa */
const SILUETA = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><circle cx="50" cy="38" r="18" fill="#94a3b8"/><path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="#94a3b8"/></svg>'
)}`;

/** Lo que la escarapela hereda del evento y la empresa cuando el diseño no lo cambia */
interface Base {
  titulo: string | null;
  fecha: string | null;
  hora: string | null;
  razonSocial: string | null;
}

interface Props {
  open: boolean;
  formId: number | null;
  onClose: () => void;
  onToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const PLANTILLAS: { valor: PlantillaEscarapela; titulo: string; ayuda: string }[] = [
  { valor: 'clasica', titulo: 'Clásica', ayuda: 'Cabecera de color y QR grande' },
  { valor: 'moderna', titulo: 'Moderna', ayuda: 'Logo arriba, nombre destacado y fecha' },
];

const COLORES: { campo: 'colorPrimario' | 'colorFondo' | 'colorTexto'; titulo: string }[] = [
  { campo: 'colorPrimario', titulo: 'Principal' },
  { campo: 'colorFondo', titulo: 'Fondo' },
  { campo: 'colorTexto', titulo: 'Texto' },
];

/**
 * Reduce una imagen y la devuelve como data URL que quepa en `maxCaracteres`
 * (el diseño viaja y se guarda como JSON). Si no cabe, se achica hasta que sí.
 */
const reducirImagen = async (archivo: File, lado: number, tipo: 'image/png' | 'image/jpeg', maxCaracteres: number): Promise<string> => {
  const original = await new Promise<HTMLImageElement>((listo, fallo) => {
    const img = new Image();
    img.onload = () => listo(img);
    img.onerror = () => fallo(new Error('Imagen no válida'));
    img.src = URL.createObjectURL(archivo);
  });

  try {
    for (let maximo = lado; maximo >= 80; maximo = Math.round(maximo * 0.75)) {
      const escala = Math.min(1, maximo / Math.max(original.width, original.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.round(original.width * escala));
      lienzo.height = Math.max(1, Math.round(original.height * escala));
      lienzo.getContext('2d')!.drawImage(original, 0, 0, lienzo.width, lienzo.height);

      const url = lienzo.toDataURL(tipo, 0.8);
      if (url.length <= maxCaracteres) return url;
    }
    throw new Error('Imagen demasiado pesada');
  } finally {
    URL.revokeObjectURL(original.src);
  }
};

const inputClass =
  'w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 rounded-xl outline-none focus:border-violet-500';
const labelClass = 'text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400';

/** Editor del diseño de la escarapela de un formulario, con vista previa en vivo. */
export const EscarapelaDesignModal: React.FC<Props> = ({ open, formId, onClose, onToast }) => {
  const [diseno, setDiseno] = useState<Diseno | null>(null);
  const [base, setBase] = useState<Base | null>(null);
  const [preguntasArchivo, setPreguntasArchivo] = useState<{ id: number; titulo: string }[]>([]);
  const [preguntas, setPreguntas] = useState<{ id: number; titulo: string }[]>([]);
  const [verTodos, setVerTodos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState<FormatoEscarapela | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const fondoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !formId) return;
    setDiseno(null);
    setVerTodos(false);
    axios
      .get(`formularios/${formId}/escarapela`)
      .then((res) => {
        // Un campo guardado puede ya no ofrecerse: su pregunta se borró o pasó a ser el nombre
        const ofrecidas: { id: number }[] = res.data.preguntas || [];
        setDiseno({
          ...res.data.diseno,
          campos: (res.data.diseno.campos || []).filter((c: { idPregunta: number }) => ofrecidas.some((q) => q.id === c.idPregunta)),
        });
        setBase(res.data.base);
        setPreguntasArchivo(res.data.preguntasArchivo || []);
        setPreguntas(res.data.preguntas || []);
      })
      .catch((error) => {
        console.error(error);
        onToast('No se pudo cargar el diseño de la escarapela', 'error');
        onClose();
      });
  }, [open, formId]);

  if (!open || !formId) return null;

  const cambiar = (cambios: Partial<Diseno>) => setDiseno((actual) => (actual ? { ...actual, ...cambios } : actual));

  const alternarCampo = (pregunta: { id: number; titulo: string }) => {
    if (!diseno) return;
    const puesto = diseno.campos.some((c) => c.idPregunta === pregunta.id);
    cambiar({
      campos: puesto
        ? diseno.campos.filter((c) => c.idPregunta !== pregunta.id)
        : [...diseno.campos, { idPregunta: pregunta.id, etiqueta: pregunta.titulo.slice(0, 40) }],
    });
  };

  const moverCampo = (indice: number, salto: -1 | 1) => {
    if (!diseno) return;
    const campos = [...diseno.campos];
    [campos[indice], campos[indice + salto]] = [campos[indice + salto], campos[indice]];
    cambiar({ campos });
  };

  const subirImagen = async (campo: 'logo' | 'fondoImagen', archivo?: File) => {
    if (!archivo) return;
    try {
      // Mismos topes que valida el backend: 300.000 y 600.000 caracteres
      const url = campo === 'logo' ? await reducirImagen(archivo, 420, 'image/png', 290000) : await reducirImagen(archivo, 1000, 'image/jpeg', 590000);
      cambiar({ [campo]: url });
    } catch (error) {
      console.error(error);
      onToast('No se pudo usar esa imagen. Prueba con otra más liviana.', 'error');
    }
  };

  const disponibles = preguntas.filter((q) => !diseno?.campos.some((c) => c.idPregunta === q.id));

  const muestra: EscarapelaDatos | null = diseno && {
    codigo: 'muestra',
    nombre: 'Nombre del participante',
    identificacion: '1061000111',
    evento: { nombre: diseno.titulo || base?.titulo || 'Evento', fechaInicial: diseno.fecha || base?.fecha || null, hora: base?.hora || null },
    empresa: { razonSocial: base?.razonSocial || null },
    color: diseno.colorPrimario,
    colorFondo: diseno.colorFondo,
    colorTexto: diseno.colorTexto,
    plantilla: diseno.plantilla,
    mensaje: diseno.mensaje,
    ubicacion: diseno.ubicacion,
    logo: diseno.logo,
    fondoImagen: diseno.fondoImagen,
    fotoUrl: diseno.mostrarFoto ? SILUETA : null,
    campos: diseno.campos.map((c) => ({ etiqueta: c.etiqueta, valor: 'Respuesta del inscrito' })),
    urlVerificacion: `${window.location.origin}/escarapela/muestra`,
  };

  const guardar = async () => {
    if (!diseno) return;
    setGuardando(true);
    try {
      await axios.put(`formularios/${formId}/escarapela`, {
        diseno: {
          ...diseno,
          titulo: diseno.titulo?.trim() || null,
          mensaje: diseno.mensaje?.trim() || null,
          ubicacion: diseno.ubicacion?.trim() || null,
          fecha: diseno.fecha || null,
          campos: diseno.campos.map((c) => ({ idPregunta: c.idPregunta, etiqueta: c.etiqueta?.trim() || null })),
        },
      });
      onToast('Diseño de la escarapela guardado', 'success');
      onClose();
    } catch (error: any) {
      console.error(error);
      onToast(error.response?.data?.error || 'No se pudo guardar el diseño', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargarMuestra = async (formato: FormatoEscarapela) => {
    if (!muestra) return;
    setDescargando(formato);
    try {
      await descargarEscarapelas([muestra], formato, `escarapela-muestra-${nombreArchivo(muestra.evento.nombre)}`);
    } catch (error) {
      console.error(error);
      onToast('No se pudo generar la muestra', 'error');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl rounded-[2.5rem] border border-neutral-100 dark:border-white/10 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        <div className="p-6 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white">Diseño de la escarapela</h3>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">{base?.titulo || ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!diseno || !muestra ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_auto]">
            {/* Controles */}
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className={labelClass}>Plantilla</span>
                <div className="grid grid-cols-2 gap-3">
                  {PLANTILLAS.map((p) => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => cambiar({ plantilla: p.valor })}
                      className={`text-left p-4 rounded-2xl border transition-colors ${
                        diseno.plantilla === p.valor
                          ? 'border-violet-500 bg-violet-500/[0.06]'
                          : 'border-neutral-200 dark:border-white/10 hover:border-violet-300'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white">{p.titulo}</span>
                      <span className="block text-[11px] text-neutral-400 font-medium mt-1 leading-snug">{p.ayuda}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className={labelClass}>Colores</span>
                <div className="grid grid-cols-3 gap-3">
                  {COLORES.map(({ campo, titulo }) => (
                    <label key={campo} className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-white/10 cursor-pointer">
                      <input
                        type="color"
                        value={diseno[campo]}
                        onChange={(e) => cambiar({ [campo]: e.target.value })}
                        className="w-9 h-9 shrink-0 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                      <span className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-200">{titulo}</span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">{diseno[campo]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { campo: 'logo', titulo: 'Logo', ayuda: 'Reemplaza el nombre de la empresa', ref: logoInput },
                    { campo: 'fondoImagen', titulo: 'Imagen de fondo', ayuda: 'Vertical, 10 x 14 cm', ref: fondoInput },
                  ] as const
                ).map(({ campo, titulo, ayuda, ref }) => (
                  <div key={campo} className="flex flex-col gap-2">
                    <span className={labelClass}>{titulo}</span>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-white/10">
                      <div
                        className="w-12 h-12 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 bg-center bg-no-repeat bg-contain flex items-center justify-center text-neutral-300"
                        style={diseno[campo] ? { backgroundImage: `url("${diseno[campo]}")` } : undefined}
                      >
                        {!diseno[campo] && <ImagePlus className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <span className="text-[11px] text-neutral-400 font-medium leading-snug">{ayuda}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => ref.current?.click()}
                            className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            {diseno[campo] ? 'Cambiar' : 'Subir'}
                          </button>
                          {diseno[campo] && (
                            <button
                              type="button"
                              onClick={() => cambiar({ [campo]: null })}
                              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Quitar
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={ref}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          subirImagen(campo, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <span className={labelClass}>Foto del inscrito</span>
                <div className="flex flex-col gap-3 p-4 rounded-2xl border border-neutral-200 dark:border-white/10">
                  <label className={`flex items-start justify-between gap-3 select-none ${preguntasArchivo.length ? 'cursor-pointer' : 'opacity-60'}`}>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium leading-snug">
                      {preguntasArchivo.length
                        ? 'Muestra en la escarapela la foto que la persona subió al llenar el formulario.'
                        : 'Este formulario no tiene preguntas de tipo "Subir archivo". Agrega una (por ejemplo "Foto de perfil") para usarla aquí.'}
                    </span>
                    <input
                      type="checkbox"
                      checked={diseno.mostrarFoto}
                      disabled={!preguntasArchivo.length}
                      onChange={(e) => cambiar({ mostrarFoto: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${diseno.mostrarFoto ? 'bg-violet-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${diseno.mostrarFoto ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </label>
                  {diseno.mostrarFoto && preguntasArchivo.length > 0 && (
                    <select
                      className={inputClass}
                      value={diseno.preguntaFoto ?? ''}
                      onChange={(e) => cambiar({ preguntaFoto: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Automática: la pregunta que diga "foto" en el título</option>
                      {preguntasArchivo.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titulo}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className={labelClass}>
                  Campos del formulario ({diseno.campos.length}/{MAX_CAMPOS})
                </span>
                <div className="flex flex-col gap-1 p-3 rounded-2xl border border-neutral-200 dark:border-white/10">
                  <p className="px-1 pb-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium leading-snug">
                    {preguntas.length
                      ? 'Agrega respuestas del formulario a la escarapela y ordénalas con las flechas. El nombre y la identificación ya salen siempre. La etiqueta es opcional.'
                      : 'Este formulario no tiene más preguntas para agregar.'}
                  </p>
                  {/* Elegidos, en el orden en que salen en la escarapela */}
                  {diseno.campos.map((campo, i) => (
                    <div key={campo.idPregunta} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-violet-500/[0.06]">
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => moverCampo(i, -1)}
                          disabled={i === 0}
                          title="Subir"
                          className="p-0.5 rounded text-neutral-500 hover:text-violet-600 hover:bg-violet-500/10 disabled:opacity-25 disabled:pointer-events-none"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverCampo(i, 1)}
                          disabled={i === diseno.campos.length - 1}
                          title="Bajar"
                          className="p-0.5 rounded text-neutral-500 hover:text-violet-600 hover:bg-violet-500/10 disabled:opacity-25 disabled:pointer-events-none"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="w-5 h-5 shrink-0 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate min-w-0 flex-1">
                        {preguntas.find((q) => q.id === campo.idPregunta)?.titulo}
                      </span>
                      <input
                        className={`${inputClass} !w-32 sm:!w-44 shrink-0 !py-1.5`}
                        maxLength={40}
                        value={campo.etiqueta || ''}
                        placeholder="Sin etiqueta"
                        title="Etiqueta que acompaña la respuesta en la escarapela"
                        onChange={(e) =>
                          cambiar({ campos: diseno.campos.map((c) => (c.idPregunta === campo.idPregunta ? { ...c, etiqueta: e.target.value } : c)) })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => cambiar({ campos: diseno.campos.filter((c) => c.idPregunta !== campo.idPregunta) })}
                        title="Quitar de la escarapela"
                        className="p-1.5 shrink-0 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Disponibles para agregar: unas pocas a la vista y el resto a pedido */}
                  <div className={`flex flex-col gap-1 ${verTodos ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
                    {(verTodos ? disponibles : disponibles.slice(0, CAMPOS_A_LA_VISTA)).map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => alternarCampo(q)}
                        disabled={diseno.campos.length >= MAX_CAMPOS}
                        title={diseno.campos.length >= MAX_CAMPOS ? `Máximo ${MAX_CAMPOS} campos` : 'Agregar a la escarapela'}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/40 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Plus className="w-4 h-4 shrink-0 text-violet-600" />
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 truncate">{q.titulo}</span>
                      </button>
                    ))}
                  </div>
                  {disponibles.length > CAMPOS_A_LA_VISTA && (
                    <button
                      type="button"
                      onClick={() => setVerTodos(!verTodos)}
                      className="self-start flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      {verTodos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{verTodos ? 'Ver menos' : `Ver todos los campos (${disponibles.length})`}</span>
                    </button>
                  )}
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Título</span>
                <input
                  className={inputClass}
                  maxLength={120}
                  value={diseno.titulo || ''}
                  placeholder={base?.titulo || 'Nombre del evento'}
                  onChange={(e) => cambiar({ titulo: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>Ubicación</span>
                  <input
                    className={inputClass}
                    maxLength={120}
                    value={diseno.ubicacion || ''}
                    placeholder="Ej: Bolívar, Cauca"
                    onChange={(e) => cambiar({ ubicacion: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>Fecha</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={(diseno.fecha || base?.fecha || '').slice(0, 10)}
                    onChange={(e) => cambiar({ fecha: e.target.value || null })}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className={labelClass}>Mensaje</span>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  maxLength={160}
                  value={diseno.mensaje || ''}
                  placeholder={MENSAJE_ESCARAPELA}
                  onChange={(e) => cambiar({ mensaje: e.target.value })}
                />
              </label>
            </div>

            {/* Vista previa */}
            <div className="p-6 md:p-8 bg-neutral-100/70 dark:bg-neutral-950/40 flex flex-col items-center gap-4 lg:border-l border-neutral-100 dark:border-white/5">
              <span className={labelClass}>Vista previa</span>
              <EscarapelaCard datos={muestra} />
              <div className="flex gap-2">
                {(['pdf', 'png'] as FormatoEscarapela[]).map((formato) => (
                  <button
                    key={formato}
                    type="button"
                    onClick={() => descargarMuestra(formato)}
                    disabled={descargando !== null}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 bg-white dark:bg-neutral-800 text-neutral-500 hover:text-violet-600 border border-neutral-200 dark:border-white/10"
                  >
                    {descargando === formato ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Muestra {formato}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-5 border-t border-neutral-100 dark:border-white/5 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={!diseno || guardando}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-violet-600 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar diseño</span>
          </button>
        </div>
      </div>
    </div>
  );
};
