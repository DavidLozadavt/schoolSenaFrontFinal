import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, ImageZoomModal } from '@/components';
import axios from 'axios';
import Select from 'react-select';
import type { Actividad } from './ModalCrearActividad';
import type { ConfigCuestionariosMap } from './cuestionarioAsignacion';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
  filterOptionNormalized
} from '@/components/forms/compactReactSelect';

const AVATAR_DEFAULT = '/media/avatars/blank.png';

/** Valor para input datetime-local en hora local del navegador (YYYY-MM-DDTHH:mm). */
const ahoraDatetimeLocal = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const getFotoUrl = (rutaFoto: string | null | undefined): string => {
  if (!rutaFoto) return AVATAR_DEFAULT;
  const url = getDocumentUrl(rutaFoto);
  return url || AVATAR_DEFAULT;
};

interface Aprendiz {
  id: number;
  idMatriculaAcademica: number;
  idMateria?: number;
  nombre: string;
  identificacion?: string | null;
  nombreCompleto?: string | null;
  email?: string | null;
  /** Misma ruta de storage que otras pantallas; opcional. */
  rutaFoto?: string | null;
}

interface Grupo {
  id: number;
  nombreGrupo: string;
  cantidadParticipantes: number;
  integrantesActuales?: number;
}

type SelectOption = { value: string; label: string };

interface ModalAsignarActividadProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSuccess?: (message: string) => void;
  idFicha: number;
  actividad: Actividad | null;
  /** Varias actividades para asignar en bloque */
  actividades?: Actividad[] | null;
  /** Subconjunto de preguntas por cuestionario (paso previo de configuración) */
  configCuestionarios?: ConfigCuestionariosMap | null;
}

const ModalAsignarActividad: React.FC<ModalAsignarActividadProps> = ({
  open,
  onClose,
  onSave,
  onSuccess,
  idFicha,
  actividad,
  actividades: actividadesProp,
  configCuestionarios
}) => {
  const actividadesAAsignar = actividadesProp?.length ? actividadesProp : (actividad ? [actividad] : []);
  const [aprendices, setAprendices] = useState<Aprendiz[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [aprendicesSeleccionados, setAprendicesSeleccionados] = useState<number[]>([]);
  const [gruposSeleccionados, setGruposSeleccionados] = useState<number[]>([]);
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [mostrarPickerEstudiantes, setMostrarPickerEstudiantes] = useState(false);
  const [mostrarPickerGrupos, setMostrarPickerGrupos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomFoto, setZoomFoto] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (open && idFicha) {
      setLoading(true);
      axios
        .get(`fichas/${idFicha}/asignacion-actividades/datos`)
        .then((res) => {
          setError('');
          setAprendices(res.data?.aprendices ?? []);
          setGrupos(res.data?.grupos ?? []);
          setActividades(res.data?.actividades ?? []);
        })
        .catch((err: unknown) => {
          const ax = err as { response?: { status?: number; data?: { message?: string; error?: string } } };
          setAprendices([]);
          setGrupos([]);
          setActividades([]);
          const msg =
            ax?.response?.data?.message ||
            ax?.response?.data?.error ||
            (ax?.response?.status === 401 ? 'Sesión expirada. Vuelve a iniciar sesión.' : null) ||
            'No se pudieron cargar estudiantes ni grupos. Revisa la conexión o intenta de nuevo.';
          setError(msg);
        })
        .finally(() => setLoading(false));
    }
  }, [open, idFicha]);

  useEffect(() => {
    if (open) {
      setAprendicesSeleccionados([]);
      setGruposSeleccionados([]);
      setFechaInicial(ahoraDatetimeLocal());
      setFechaFinal('');
      setError('');
    }
  }, [open]);

  const toggleAprendiz = (id: number) => {
    setAprendicesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGrupo = (id: number) => {
    setGruposSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodosEstudiantes = () => {
    if (aprendicesSeleccionados.length === aprendices.length) {
      setAprendicesSeleccionados([]);
    } else {
      setAprendicesSeleccionados(aprendices.map((a) => a.id));
    }
  };

  const toggleTodosGrupos = () => {
    if (gruposSeleccionados.length === grupos.length) {
      setGruposSeleccionados([]);
    } else {
      setGruposSeleccionados(grupos.map((g) => g.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (actividadesAAsignar.length === 0) {
      setError('No hay actividad seleccionada');
      return;
    }
    const tieneDestinatarios =
      aprendicesSeleccionados.length > 0 || gruposSeleccionados.length > 0;
    if (!tieneDestinatarios) {
      setError('Selecciona al menos un estudiante o un grupo');
      return;
    }
    if (fechaInicial && fechaFinal) {
      const fIni = new Date(fechaInicial);
      const fFin = new Date(fechaFinal);
      if (fFin < fIni) {
        setError('La fecha y hora límite debe ser mayor o igual a la fecha y hora inicial');
        return;
      }
    }

    setSaving(true);
    try {
      // Añadir cada actividad a planeación si aplica
      try {
        const planeacionRes = await axios.get(`planeacion/ficha/${idFicha}`);
        const data = planeacionRes.data;
        const idPlaneacion = typeof data?.id === 'number' ? data.id : (typeof data?.id === 'string' ? parseInt(data.id, 10) : null);
        if (idPlaneacion && !Number.isNaN(idPlaneacion)) {
          for (const act of actividadesAAsignar) {
            if (act.id && act.idMateria) {
              await axios.post('planeacionactividades', {
                idActividad: act.id,
                idMateria: act.idMateria,
                idPlaneacion
              });
            }
          }
        }
      } catch {
        // Ya está en planeación o error; continuar con la asignación
      }

      const payload: any = {
        actividades: actividadesAAsignar.map((a) => a.id).filter((id): id is number => id != null)
      };
      if (fechaInicial) payload.fechaInicial = fechaInicial.includes('T') ? fechaInicial : fechaInicial + 'T00:00:00';
      if (fechaFinal) payload.fechaFinal = fechaFinal.includes('T') ? fechaFinal : fechaFinal + 'T23:59:59';
      if (aprendicesSeleccionados.length === aprendices.length && aprendices.length > 0) {
        payload.aprendices = 'todos';
      } else if (aprendicesSeleccionados.length > 0) {
        payload.aprendices = aprendicesSeleccionados;
      }
      if (gruposSeleccionados.length === grupos.length && grupos.length > 0) {
        payload.grupos = 'todos';
      } else if (gruposSeleccionados.length > 0) {
        payload.grupos = gruposSeleccionados;
      }
      if (configCuestionarios && Object.keys(configCuestionarios).length > 0) {
        const cfgPayload: Record<string, { idsPreguntas: number[] }> = {};
        Object.entries(configCuestionarios).forEach(([idAct, cfg]) => {
          cfgPayload[idAct] = { idsPreguntas: cfg.idsPreguntas };
        });
        payload.configCuestionarios = cfgPayload;
      }
      const res = await axios.post(`fichas/${idFicha}/asignacion-actividades`, payload);
      const data = res?.data;
      if (data?.exitosas === 0 && data?.omitidas === 0) {
        setError(
          'No se creó ninguna asignación. Verifica que los estudiantes o grupos seleccionados tengan matrícula académica.'
        );
        return;
      }
      onSuccess?.('Actividad asignada correctamente');
      onSave();
      onClose();
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.message ||
        (data?.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat().join(' ')
          : null) ||
        err.message ||
        'Error al asignar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const textoEstudiantes =
    aprendicesSeleccionados.length === 0
      ? 'Seleccionar estudiantes'
      : aprendicesSeleccionados.length === aprendices.length
        ? 'Todos los estudiantes'
        : `${aprendicesSeleccionados.length} seleccionado(s)`;

  const textoGrupos =
    gruposSeleccionados.length === 0
      ? 'Seleccionar grupos'
      : gruposSeleccionados.length === grupos.length
        ? 'Todos los grupos'
        : `${gruposSeleccionados.length} grupo(s) seleccionado(s)`;

  const optionsAprendices: SelectOption[] = React.useMemo(() => {
    return (aprendices || []).map((a) => ({
      value: String(a.id),
      label: (a.nombreCompleto || a.nombre || `Aprendiz ${a.id}`).trim()
    }));
  }, [aprendices]);

  const optionsGrupos: SelectOption[] = React.useMemo(() => {
    return (grupos || []).map((g) => ({
      value: String(g.id),
      label: `${g.nombreGrupo || `Grupo ${g.id}`} (${g.integrantesActuales ?? 0}/${g.cantidadParticipantes})`
    }));
  }, [grupos]);

  const valueAprendices: SelectOption[] = React.useMemo(() => {
    const set = new Set(aprendicesSeleccionados.map((n) => String(n)));
    return optionsAprendices.filter((o) => set.has(o.value));
  }, [aprendicesSeleccionados, optionsAprendices]);

  const valueGrupos: SelectOption[] = React.useMemo(() => {
    const set = new Set(gruposSeleccionados.map((n) => String(n)));
    return optionsGrupos.filter((o) => set.has(o.value));
  }, [gruposSeleccionados, optionsGrupos]);

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={110}>
        <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:px-5 sm:py-10 box-border pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl md:max-w-4xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ModalContent className="!flex w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 sm:min-w-0 max-h-[min(94dvh,960px)]">
            <ModalHeader className="!shrink-0 border-b border-gray-100 dark:border-gray-600/80 px-5 sm:px-6 py-3.5">
              <ModalTitle className="dark:text-white">Asignar actividad</ModalTitle>
              <button type="button" className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose} title="Cerrar">
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="!flex !min-h-0 !flex-1 !flex-col !gap-0 !overflow-y-auto [scrollbar-gutter:stable] !p-0">
              {loading && (
                <div className="flex justify-center py-10">
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                </div>
              )}
              {!loading && (
                <div className="px-5 py-4 sm:px-6 sm:py-5">
                  {actividadesAAsignar.length > 0 && (
                    <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/80 px-3.5 py-2.5 dark:border-gray-600/50 dark:bg-coal-500/20">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-white">
                        {actividadesAAsignar.length === 1 ? (
                          <>
                            <span className="font-medium text-gray-500 dark:text-white">Actividad: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">{actividadesAAsignar[0].tituloActividad}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-primary">{actividadesAAsignar.length} actividades</span> seleccionadas
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-white">Seleccionar estudiantes</label>
                      <Select
                        inputId="asignar-actividad-aprendices"
                        isMulti
                        isClearable
                        isSearchable
                        closeMenuOnSelect={false}
                        options={optionsAprendices}
                        value={valueAprendices}
                        placeholder="Buscar o seleccionar estudiantes..."
                        classNamePrefix="react-select-ciudad-exp"
                        classNames={compactReactSelectClassNames}
                        noOptionsMessage={compactReactSelectNoOptions}
                        filterOption={(candidate, input) => {
                          const a = aprendices.find((x) => String(x.id) === candidate.value);
                          return filterOptionNormalized(
                            [
                              candidate.label,
                              candidate.value, // id matrícula
                              a?.nombre,
                              a?.nombreCompleto,
                              a?.identificacion,
                              a?.email
                            ],
                            input
                          );
                        }}
                        formatOptionLabel={(opt, meta) => {
                          const a = aprendices.find((x) => String(x.id) === opt.value);
                          if (!a) return opt.label;
                          const doc = (a.identificacion || '').trim();
                          const isValue = meta.context === 'value';
                          if (isValue) return opt.label;
                          const tieneFotoReal = !!(a.rutaFoto && String(a.rutaFoto).trim());
                          const avatarSrc = getFotoUrl(a.rutaFoto);
                          return (
                            <div className="flex items-center gap-2.5 py-1">
                              {tieneFotoReal ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setZoomFoto({ src: avatarSrc, alt: opt.label });
                                  }}
                                  className="h-10 w-10 shrink-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                  title="Ampliar foto"
                                >
                                  <img
                                    src={avatarSrc}
                                    alt=""
                                    className="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-gray-600"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = AVATAR_DEFAULT;
                                    }}
                                  />
                                </button>
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded-full border border-dashed border-primary flex items-center justify-center text-primary bg-white dark:bg-coal-400 dark:border-primary/60">
                                  <KeenIcon icon="user" className="text-sm" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{opt.label}</div>
                                <div className="truncate text-[11px] text-gray-500 dark:text-white">
                                  {doc ? doc : 'Sin documento'}
                                </div>
                              </div>
                            </div>
                          );
                        }}
                        onChange={(opts) => {
                          const arr = Array.isArray(opts) ? opts : [];
                          setAprendicesSeleccionados(arr.map((o) => Number(o.value)).filter((n) => Number.isFinite(n)));
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-500 dark:text-white">{textoEstudiantes}</p>
                        <button
                          type="button"
                          onClick={toggleTodosEstudiantes}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {aprendicesSeleccionados.length === aprendices.length && aprendices.length > 0 ? 'Quitar todos' : 'Seleccionar todos'}
                        </button>
                      </div>
                      {mostrarPickerEstudiantes && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner dark:border-gray-600 dark:bg-coal-500/20">
                          <div className="max-h-[min(52dvh,20rem)] overflow-y-auto p-1 sm:max-h-[min(50dvh,22rem)]">
                            <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-2 flex justify-end border-b border-gray-100 bg-white/95 px-2 py-2 dark:border-gray-600 dark:bg-coal-400/95">
                              <button
                                type="button"
                                onClick={toggleTodosEstudiantes}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {aprendicesSeleccionados.length === aprendices.length ? 'Quitar todos' : 'Seleccionar todos'}
                              </button>
                            </div>
                            <ul className="m-0 list-none space-y-0.5 p-1.5 pr-0.5">
                              {aprendices.map((a) => {
                                const idInput = `asig-apr-${a.id}`;
                                return (
                                  <li key={a.id} className="group">
                                    <div className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-gray-50/90 dark:hover:bg-white/5">
                                      <input
                                        id={idInput}
                                        type="checkbox"
                                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-500"
                                        checked={aprendicesSeleccionados.includes(a.id)}
                                        onChange={() => toggleAprendiz(a.id)}
                                      />
                                      <button
                                        type="button"
                                        className="shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
                                        onClick={() =>
                                          setZoomFoto({ src: getFotoUrl(a.rutaFoto), alt: a.nombre || 'Aprendiz' })
                                        }
                                        title="Ver foto"
                                      >
                                        <img
                                          src={getFotoUrl(a.rutaFoto)}
                                          alt=""
                                          className="h-10 w-10 sm:h-11 sm:w-11 cursor-zoom-in rounded-full border-2 border-gray-100 object-cover transition-opacity hover:opacity-90 dark:border-gray-600"
                                        />
                                      </button>
                                      <label htmlFor={idInput} className="min-w-0 flex-1 cursor-pointer text-left text-sm leading-snug text-gray-800 dark:text-white">
                                        {a.nombre}
                                      </label>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-800 dark:text-white">Seleccionar grupos</label>
                      <Select
                        inputId="asignar-actividad-grupos"
                        isMulti
                        isClearable
                        isSearchable
                        closeMenuOnSelect={false}
                        options={optionsGrupos}
                        value={valueGrupos}
                        placeholder="Buscar o seleccionar grupos..."
                        classNamePrefix="react-select-ciudad-exp"
                        classNames={compactReactSelectClassNames}
                        noOptionsMessage={compactReactSelectNoOptions}
                        filterOption={(candidate, input) => {
                          return filterOptionNormalized([candidate.label, candidate.value], input);
                        }}
                        onChange={(opts) => {
                          const arr = Array.isArray(opts) ? opts : [];
                          setGruposSeleccionados(arr.map((o) => Number(o.value)).filter((n) => Number.isFinite(n)));
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-500 dark:text-white">{textoGrupos}</p>
                        <button
                          type="button"
                          onClick={toggleTodosGrupos}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {gruposSeleccionados.length === grupos.length && grupos.length > 0 ? 'Quitar todos' : 'Seleccionar todos'}
                        </button>
                      </div>
                      {mostrarPickerGrupos && (
                        <div className="mt-3 max-h-[min(48dvh,18rem)] overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-600 dark:bg-coal-500/20">
                          <div className="mb-2 flex justify-end">
                            <button
                              type="button"
                              onClick={toggleTodosGrupos}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {gruposSeleccionados.length === grupos.length ? 'Quitar todos' : 'Seleccionar todos'}
                            </button>
                          </div>
                          <ul className="m-0 list-none space-y-1.5 p-0">
                            {grupos.map((g) => (
                              <li key={g.id}>
                                <label className="flex cursor-pointer items-center gap-3 rounded-md px-1.5 py-1.5 hover:bg-gray-50/90 dark:hover:bg-white/5">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-primary dark:border-gray-500"
                                    checked={gruposSeleccionados.includes(g.id)}
                                    onChange={() => toggleGrupo(g.id)}
                                  />
                                  <span className="text-sm text-gray-800 dark:text-white">
                                    {g.nombreGrupo}{' '}
                                    <span className="text-xs text-gray-500 dark:text-white">
                                      ({g.integrantesActuales ?? 0}/{g.cantidadParticipantes})
                                    </span>
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-white">Fecha y hora inicial</label>
                        <input
                          type="datetime-local"
                          value={fechaInicial}
                          onChange={(e) => setFechaInicial(e.target.value)}
                          className="input w-full !min-h-[2.6rem] text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-white">Fecha y hora límite</label>
                        <input
                          type="datetime-local"
                          value={fechaFinal}
                          onChange={(e) => setFechaFinal(e.target.value)}
                          className="input w-full !min-h-[2.6rem] text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2.5 border-t border-gray-100 pt-1 dark:border-gray-600/50 sm:flex-row sm:justify-end sm:gap-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full min-w-[8rem] rounded-lg border border-transparent bg-gray-200/90 py-2.5 text-sm font-medium text-gray-800 dark:bg-gray-600 dark:text-white sm:w-auto hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving || loading}
                        className="inline-flex w-full min-w-[8rem] items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-white sm:w-auto disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Asignando...
                          </>
                        ) : (
                          <>
                            <KeenIcon icon="check" className="text-sm" />
                            Asignar actividad
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </div>
      </div>
      </Modal>
      {zoomFoto && (
        <ImageZoomModal
          open={!!zoomFoto}
          onClose={() => setZoomFoto(null)}
          src={zoomFoto.src}
          alt={zoomFoto.alt}
          title={zoomFoto.alt}
        />
      )}
    </>
  );
};

export default ModalAsignarActividad;
