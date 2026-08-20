import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  UserPlus,
  Send,
  Upload,
  File,
  FileText,
  X,
  Eye,
  Calendar,
  Clock
} from 'lucide-react';
import {
  aspiranteInscripcionService,
  InscripcionAspiranteResponse
} from './aspiranteInscripcionService';

type FilePreview = { name: string; url: string };

const FormularioAspirantePublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<InscripcionAspiranteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [filePreviews, setFilePreviews] = useState<Record<number, FilePreview[]>>({});
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    aspiranteInscripcionService
      .getFormulario(token)
      .then((res) => {
        setData(res);
        const prev: Record<number, string> = {};
        const previews: Record<number, FilePreview[]> = {};
        (res.respuestaPrevia || []).forEach((r) => {
          prev[r.idPregunta] = r.valor;
          const pregunta = res.formulario.preguntas.find((p) => p.id === r.idPregunta);
          if (pregunta?.tipo === 'archivo' && r.valor) {
            const urls = r.valor.split(',').filter(Boolean);
            previews[r.idPregunta] = urls.map((url) => ({ name: url.split('/').pop() || 'archivo', url }));
          }
        });
        setValores(prev);
        setFilePreviews(previews);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const fechaLimite = data?.formulario.fechaLimite;
    if (!fechaLimite || data?.motivoNoDisponible) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const target = new Date(String(fechaLimite).replace(' ', 'T')).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data?.formulario.fechaLimite, data?.motivoNoDisponible]);

  const colorTema = data?.formulario.colorTema || '#16a34a';

  const handleChange = (idPregunta: number, valor: string) => {
    setValores((prev) => ({ ...prev, [idPregunta]: valor }));
    setValidationErrors((prev) => prev.filter((id) => id !== idPregunta));
  };

  const handleCheckboxToggle = (idPregunta: number, texto: string, checked: boolean) => {
    const actuales = (valores[idPregunta] || '').split(',').filter(Boolean);
    const nuevos = checked ? [...actuales, texto] : actuales.filter((v) => v !== texto);
    handleChange(idPregunta, nuevos.join(','));
  };

  const handleFilesUpload = async (idPregunta: number, filesList: FileList) => {
    setUploadingId(idPregunta);
    let accumulated = filePreviews[idPregunta] || [];

    for (const file of Array.from(filesList)) {
      if (file.size > 20 * 1024 * 1024) {
        enqueueSnackbar(`"${file.name}" supera el tamaño máximo de 20MB.`, { variant: 'warning' });
        continue;
      }
      try {
        const res = await aspiranteInscripcionService.uploadAdjunto(file);
        accumulated = [...accumulated, { name: file.name, url: res.url }];
        setFilePreviews((prev) => ({ ...prev, [idPregunta]: accumulated }));
        handleChange(idPregunta, accumulated.map((f) => f.url).join(','));
      } catch {
        enqueueSnackbar(`Error al subir "${file.name}".`, { variant: 'error' });
      }
    }
    setUploadingId(null);
  };

  const handleRemoveFile = (idPregunta: number, index: number) => {
    const updated = (filePreviews[idPregunta] || []).filter((_, i) => i !== index);
    setFilePreviews((prev) => ({ ...prev, [idPregunta]: updated }));
    handleChange(idPregunta, updated.map((f) => f.url).join(','));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !data) return;

    const errors = data.formulario.preguntas
      .filter((p) => p.esObligatoria && !valores[p.id]?.trim())
      .map((p) => p.id);

    if (errors.length > 0) {
      setValidationErrors(errors);
      enqueueSnackbar('Completa todos los campos obligatorios.', { variant: 'warning' });
      setTimeout(() => {
        document.getElementById(`pregunta-${errors[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setSubmitting(true);
    try {
      const respuestas = Object.entries(valores).map(([idPregunta, valor]) => ({
        idPregunta: Number(idPregunta),
        valor
      }));
      const res = await aspiranteInscripcionService.responder(token, respuestas);
      setEnviado(res.estadoDocumental);
      window.scrollTo(0, 0);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al enviar el formulario.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-neutral-900 px-10 py-14 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800 border-t-green-600 animate-spin" />
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 dark:text-white mt-2">Cargando formulario</h3>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] shadow-2xl border border-red-500/10 w-full max-w-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white">Enlace no disponible</h2>
          <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
            El enlace es inválido, expiró, o el formulario de inscripción aún no ha sido configurado.
          </p>
        </div>
      </div>
    );
  }

  const { aspirante, formulario, motivoNoDisponible } = data;

  if (motivoNoDisponible) {
    const mensajes: Record<string, string> = {
      borrador: 'Este formulario aún no ha sido publicado.',
      pausado: 'El formulario está pausado temporalmente. Intenta más tarde.',
      no_iniciado: 'El periodo de inscripción todavía no ha comenzado.',
      expirado: 'El periodo de inscripción ya finalizó.',
      limite_alcanzado: 'Se alcanzó el límite de inscripciones para este programa.'
    };
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] shadow-2xl border border-amber-500/10 w-full max-w-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white">Formulario no disponible</h2>
          <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
            {formulario.mensajeCierre || mensajes[motivoNoDisponible] || 'Este formulario no está disponible actualmente.'}
          </p>
        </div>
      </div>
    );
  }

  if (enviado) {
    const completa = enviado === 'pendiente_revision';
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
        <div
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-white/5 w-full max-w-lg text-center overflow-hidden"
          style={{ borderTop: `10px solid ${colorTema}` }}
        >
          <div className="p-10 md:p-16 flex flex-col items-center gap-6">
            <div
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-2 shadow-lg shadow-black/5"
              style={{ backgroundColor: `${colorTema}10`, color: colorTema }}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-800 dark:text-white">
              ¡Formulario enviado!
            </h1>
            <p className="text-xs text-neutral-450 dark:text-neutral-400 font-semibold leading-relaxed">
              {completa
                ? 'Tu documentación fue recibida completa y quedó en revisión. Te notificaremos por correo el resultado.'
                : 'Tu documentación fue recibida, pero falta algún documento obligatorio. Puedes volver a ingresar a este mismo enlace para completarla.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-neutral-950" data-no-uppercase>
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-28">
        {timeLeft && (
          <div className="w-full bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 dark:border-orange-500/20 p-5 rounded-[2rem] mb-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  Vigencia de inscripción activa
                </span>
                <span className="text-xs font-bold text-neutral-800 dark:text-white">Este formulario vencerá en:</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              {timeLeft.days > 0 && (
                <div className="flex flex-col items-center bg-white dark:bg-neutral-900 border border-orange-500/20 px-3.5 py-2 rounded-2xl shadow-sm min-w-[50px]">
                  <span className="text-base font-black text-orange-600 dark:text-orange-400">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Días</span>
                </div>
              )}
              <div className="flex flex-col items-center bg-white dark:bg-neutral-900 border border-orange-500/20 px-3.5 py-2 rounded-2xl shadow-sm min-w-[50px]">
                <span className="text-base font-black text-orange-600 dark:text-orange-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Horas</span>
              </div>
              <span className="text-orange-500 font-black text-xl">:</span>
              <div className="flex flex-col items-center bg-white dark:bg-neutral-900 border border-orange-500/20 px-3.5 py-2 rounded-2xl shadow-sm min-w-[50px]">
                <span className="text-base font-black text-orange-600 dark:text-orange-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Min</span>
              </div>
              <span className="text-orange-500 font-black text-xl">:</span>
              <div className="flex flex-col items-center bg-white dark:bg-neutral-900 border border-orange-500/20 px-3.5 py-2 rounded-2xl shadow-sm min-w-[50px]">
                <span className="text-base font-black text-rose-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Seg</span>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Card principal */}
          <div
            className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl mb-8 overflow-hidden relative"
            style={{ borderTop: `10px solid ${colorTema}` }}
          >
            {formulario.imagenCabecera && (
              <img
                src={formulario.imagenCabecera}
                alt="Cabecera"
                className="w-full h-40 sm:h-56 object-cover"
              />
            )}
            <div className="p-8 md:p-12">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: colorTema }} />

            <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-neutral-100/10 dark:border-white/5 mb-8 shadow-inner">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-coal-300 shadow-lg text-green-600">
                <UserPlus className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 dark:bg-neutral-800 shadow-sm text-green-600">
                  Inscripción de aspirante
                </span>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-400 font-bold uppercase tracking-widest mt-1.5">
                  Completa este formulario para continuar tu proceso
                </p>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-4">
              {formulario.titulo}
            </h1>
            {formulario.descripcion && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed mb-6" style={{ whiteSpace: 'pre-wrap' }}>
                {formulario.descripcion}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-150 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Aspirante</span>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{aspirante.nombre} {aspirante.apellido}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Programa</span>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{aspirante.programa}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Ficha</span>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{aspirante.ficha}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Centro</span>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{aspirante.centroFormacion}</span>
              </div>
            </div>

            <div className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-6 pt-4 border-t border-neutral-100 dark:border-white/5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> <span>* Indica que el documento/campo es obligatorio</span>
            </div>
            </div>
          </div>

          {/* Preguntas */}
          {formulario.preguntas
            .sort((a, b) => a.orden - b.orden)
            .map((p) => {
              const isError = validationErrors.includes(p.id);
              const files = filePreviews[p.id] || [];

              return (
                <div
                  key={p.id}
                  id={`pregunta-${p.id}`}
                  className={`bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border mb-6 transition-all duration-300 shadow-xl ${
                    isError ? 'border-red-500/40' : 'border-neutral-100 dark:border-white/5 hover:shadow-2xl'
                  }`}
                  style={{ borderLeft: `6px solid ${colorTema}30` }}
                >
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2 leading-relaxed flex items-center gap-2">
                    {p.titulo} {p.esObligatoria && <span className="text-rose-500 ml-1">*</span>}
                  </h3>
                  {p.descripcion && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mb-6">{p.descripcion}</p>
                  )}

                  <div className="mt-6">
                    {p.tipo === 'archivo' ? (
                      <div className="w-full max-w-md flex flex-col gap-4">
                        {files.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {files.map((f, idx) => {
                              const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(f.url);
                              const isWord = /\.(doc|docx)$/i.test(f.url);
                              return (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-white/5 shadow-inner">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center border border-neutral-200/20">
                                      {isImage ? (
                                        <img src={f.url} alt="archivo" className="w-full h-full object-cover" />
                                      ) : isWord ? (
                                        <FileText className="w-5 h-5 text-blue-500" />
                                      ) : (
                                        <File className="w-5 h-5 text-rose-500" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white truncate max-w-[100px]">{f.name}</h4>
                                      <a href={f.url} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1 mt-1">
                                        <Eye className="w-3 h-3" /> Ver
                                      </a>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(p.id, idx)}
                                    className="w-8 h-8 rounded-full hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-coal-100 rounded-2xl cursor-pointer hover:border-green-500 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,image/*"
                            multiple
                            onChange={(e) => e.target.files && handleFilesUpload(p.id, e.target.files)}
                            disabled={uploadingId === p.id}
                          />
                          <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                            {uploadingId === p.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 text-neutral-450" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-neutral-850 dark:text-neutral-250">Seleccionar archivo</span>
                          <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-widest mt-1">PDF, Word o Imagen (Máx 20MB)</span>
                        </label>
                      </div>
                    ) : p.tipo === 'texto_largo' ? (
                      <textarea
                        className="w-full border px-5 py-4 text-xs font-semibold rounded-2xl outline-none bg-neutral-50 dark:bg-neutral-800/40 border-neutral-250 dark:border-neutral-700 text-neutral-700 dark:text-white"
                        rows={4}
                        value={valores[p.id] || ''}
                        onChange={(e) => handleChange(p.id, e.target.value)}
                      />
                    ) : p.tipo === 'fecha' ? (
                      <div className="flex items-center gap-3 bg-neutral-50 dark:bg-coal-400 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-coal-200">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <input
                          type="date"
                          className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-700 dark:text-white"
                          value={valores[p.id] || ''}
                          onChange={(e) => handleChange(p.id, e.target.value)}
                        />
                      </div>
                    ) : p.tipo === 'hora' ? (
                      <div className="flex items-center gap-3 bg-neutral-50 dark:bg-coal-400 px-5 py-4 rounded-2xl w-full max-w-xs border border-neutral-250 dark:border-coal-200">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <input
                          type="time"
                          className="bg-transparent border-0 text-xs font-bold uppercase tracking-wider outline-none w-full text-neutral-700 dark:text-white"
                          value={valores[p.id] || ''}
                          onChange={(e) => handleChange(p.id, e.target.value)}
                        />
                      </div>
                    ) : p.tipo === 'desplegable' ? (
                      <div className="w-full max-w-xs">
                        <select
                          className="w-full bg-neutral-50 dark:bg-coal-400 border border-neutral-250 dark:border-coal-200 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none text-neutral-700 dark:text-white"
                          value={valores[p.id] || ''}
                          onChange={(e) => handleChange(p.id, e.target.value)}
                        >
                          <option value="" disabled>Elige una opción...</option>
                          {(p.opciones || []).map((opt) => (
                            <option key={opt.id} value={opt.texto}>{opt.texto}</option>
                          ))}
                        </select>
                      </div>
                    ) : p.tipo === 'casillas' ? (
                      <div className="flex flex-col gap-3">
                        {(p.opciones || []).map((opt) => {
                          const seleccionados = (valores[p.id] || '').split(',').filter(Boolean);
                          const isChecked = seleccionados.includes(opt.texto);
                          return (
                            <label
                              key={opt.id}
                              className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                              style={{
                                borderColor: isChecked ? colorTema : 'rgba(0,0,0,0.06)',
                                backgroundColor: isChecked ? `${colorTema}0b` : 'rgba(0,0,0,0.015)'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxToggle(p.id, opt.texto, e.target.checked)}
                                className="w-4 h-4 rounded"
                                style={{ accentColor: colorTema }}
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : p.tipo === 'opcion_multiple' ? (
                      <div className="flex flex-col gap-3">
                        {(p.opciones || []).map((opt) => {
                          const isSelected = valores[p.id] === opt.texto;
                          return (
                            <label
                              key={opt.id}
                              className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                              style={{
                                borderColor: isSelected ? colorTema : 'rgba(0,0,0,0.06)',
                                backgroundColor: isSelected ? `${colorTema}0b` : 'rgba(0,0,0,0.015)'
                              }}
                            >
                              <input
                                type="radio"
                                name={`p_${p.id}`}
                                checked={isSelected}
                                onChange={() => handleChange(p.id, opt.texto)}
                                className="w-4 h-4"
                                style={{ accentColor: colorTema }}
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">{opt.texto}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : p.tipo === 'escala_lineal' ? (
                      (() => {
                        const cfg = p.configuracion || {};
                        const min = cfg.min ?? 1;
                        const max = cfg.max ?? 5;
                        const escala = Array.from({ length: max - min + 1 }, (_, i) => min + i);
                        return (
                          <div className="flex flex-col gap-6 py-6 px-8 bg-neutral-50/50 dark:bg-coal-400 rounded-[2.5rem] border border-neutral-100/50 dark:border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
                              {escala.map((n) => {
                                const isSelected = valores[p.id] === String(n);
                                return (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => handleChange(p.id, String(n))}
                                    className="w-12 h-12 rounded-full font-black text-sm flex items-center justify-center transition-all border"
                                    style={{
                                      borderColor: isSelected ? colorTema : 'rgba(0,0,0,0.08)',
                                      backgroundColor: isSelected ? colorTema : 'rgba(0,0,0,0.02)',
                                      color: isSelected ? '#ffffff' : 'inherit'
                                    }}
                                  >
                                    {n}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex justify-between items-center px-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                              <span>{cfg.minLabel || 'Bajo'}</span>
                              <span>{cfg.maxLabel || 'Alto'}</span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <input
                        type="text"
                        className="w-full max-w-md border px-5 py-4 text-xs font-semibold rounded-2xl outline-none bg-neutral-50 dark:bg-neutral-800/40 border-neutral-250 dark:border-neutral-700 text-neutral-700 dark:text-white"
                        value={valores[p.id] || ''}
                        onChange={(e) => handleChange(p.id, e.target.value)}
                      />
                    )}
                  </div>

                  {isError && (
                    <div className="flex items-center gap-2 mt-4 text-rose-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Este campo es obligatorio</span>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Enviar */}
          <div className="flex justify-center mt-10 mb-16">
            <button
              type="submit"
              disabled={submitting}
              className="text-white font-black uppercase tracking-widest text-[9px] py-4 px-10 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              style={{ backgroundColor: colorTema, boxShadow: `0 10px 15px -3px ${colorTema}35` }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar formulario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { FormularioAspirantePublicPage };
