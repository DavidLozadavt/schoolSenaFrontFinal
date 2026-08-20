import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { MisActividadesAvatarFallback } from '@/components/user/MisActividadesAvatarFallback';
import {
  filterOptionNormalized,
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
} from '@/components/forms/compactReactSelect';
import Select from 'react-select';
import { useSettings } from '@/providers';
import {
  extensionFromPath,
  materialDocumentoActionLabel,
  materialDocumentoBadgeClass,
  materialDocumentoTypeLabel,
} from './materialDocumentoSupport';
import { tipoMaterialDisplay } from './tipoMaterialApoyo';

interface MaterialApoyoCreador {
  idPersona?: number | null;
  nombreCompleto?: string | null;
  email?: string | null;
  rutaFoto?: string | null;
  rutaFotoUrl?: string | null;
}

interface MaterialApoyoAprendizItem {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipoMaterial?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
  urlVideo?: string | null;
  urlVideoUrl?: string | null;
  idMateria?: number;
  materiaNombre?: string | null;
  competenciaNombre?: string | null;
  idCompetencia?: number | null;
  idFicha?: number;
  fichaCodigo?: string | null;
  idRap?: number | null;
  rapNombre?: string | null;
  idPersona?: number | null;
  creador?: MaterialApoyoCreador | null;
  created_at?: string | null;
}

const getDocumentUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
      return base + path;
    } catch {
      return url;
    }
  }
  if (url.startsWith('/storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + url;
  }
  const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
  return base + '/storage/' + url.replace(/^storage\//, '');
};

const normalizeExternalUrl = (raw?: string | null): string | null => {
  const u = String(raw ?? '').trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

/** Si la URL es de YouTube, devuelve URL embed; si no, null. */
const youtubeEmbedUrl = (raw: string): string | null => {
  const u = raw.trim();
  if (!u) return null;
  try {
    const url = new URL(u.startsWith('http') ? u : `https://${u}`);
    if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}?rel=0`;
    }
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
  } catch {
    return null;
  }
  return null;
};

const formatearFechaCorta = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

/** Foto del creador: misma regla que Mis Actividades (URLs absolutas intactas). */
const getPerfilPublicUrl = (path?: string | null): string | null => {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = p.startsWith('/') ? p.slice(1) : p;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const AvatarCreadorBiblioteca: React.FC<{ src: string | null; nombre: string }> = ({ src, nombre }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <MisActividadesAvatarFallback variant="md" />;
  }
  return (
    <img
      src={src}
      alt=""
      className="w-10 h-10 rounded-full object-cover border-2 border-primary/50"
      referrerPolicy="no-referrer"
      title={nombre}
      onError={() => setBroken(true)}
    />
  );
};

interface RecursosMenuState {
  id: number;
  top: number;
  left: number;
}

const clsLabelFiltro =
  'text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-white mb-1.5 block';

const selectClassNamesBiblioteca = {
  ...compactReactSelectClassNames,
  control: (state: { isFocused: boolean; menuIsOpen: boolean }) =>
    clsx(
      'min-h-9 text-sm rounded-md border bg-white text-gray-900',
      'border-gray-300 dark:bg-coal-400 dark:text-white',
      state.isFocused || state.menuIsOpen
        ? 'border-primary dark:border-primary ring-1 ring-primary/20 dark:ring-primary/30'
        : 'dark:border-gray-500 hover:dark:border-gray-400'
    ),
  valueContainer: () => 'text-gray-900 dark:text-white text-sm',
  singleValue: () => 'text-gray-900 dark:!text-white text-sm',
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm',
  input: () => 'text-gray-900 dark:!text-white text-sm',
  menu: () => `${compactReactSelectClassNames.menu()} dark:text-white`,
  menuList: () => `${compactReactSelectClassNames.menuList()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option(state)} dark:!text-white ${
      state.isSelected ? '!text-white' : ''
    }`,
  dropdownIndicator: () =>
    'text-gray-500 dark:!text-white hover:text-gray-700 dark:hover:!text-white/80',
  clearIndicator: () =>
    'text-gray-400 dark:!text-white/80 hover:text-gray-600 dark:hover:!text-white',
};

const selectStylesBibliotecaLight = {
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  input: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
};

/** react-select aplica color inline; en oscuro forzar blanco y borde siempre visible. */
const selectStylesBibliotecaDark = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean; menuIsOpen: boolean }) => ({
    ...base,
    backgroundColor: '#0F1014',
    borderColor: state.isFocused || state.menuIsOpen ? '#6366f1' : '#6B7280',
    borderWidth: '1px',
    borderStyle: 'solid',
    color: '#ffffff',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(99, 102, 241, 0.25)' : 'none',
  }),
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: '#ffffff' }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: 'rgba(255,255,255,0.92)' }),
  input: (base: Record<string, unknown>) => ({ ...base, color: '#ffffff' }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: '#0F1014',
    color: '#ffffff',
  }),
  menuList: (base: Record<string, unknown>) => ({ ...base, backgroundColor: '#0F1014' }),
  option: (base: Record<string, unknown>, state: { isFocused: boolean; isSelected: boolean }) => ({
    ...base,
    color: '#ffffff',
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#374151' : '#0F1014',
  }),
  dropdownIndicator: (base: Record<string, unknown>) => ({ ...base, color: '#ffffff' }),
  clearIndicator: (base: Record<string, unknown>) => ({ ...base, color: 'rgba(255,255,255,0.9)' }),
  indicatorSeparator: (base: Record<string, unknown>) => ({ ...base, backgroundColor: '#4B5563' }),
};

const idCompetenciaDeItem = (it: MaterialApoyoAprendizItem): number | null => {
  if (it.idCompetencia && it.idCompetencia > 0) return it.idCompetencia;
  return null;
};

export interface MaterialApoyoAprendizProps {
  idFicha?: number;
  idRap?: number;
  fichaCodigo?: string;
  /** Misma línea de contexto RAP que en la vista del instructor. */
  rapContextLabel?: string;
  emptyMessage?: string;
  hideGroupHeaders?: boolean;
  /** Vista Aula Virtual: biblioteca completa del programa (sin encabezado de ficha/RAP de clase). */
  modoBibliotecaGlobal?: boolean;
}

const MaterialApoyoAprendiz: React.FC<MaterialApoyoAprendizProps> = ({
  idFicha,
  idRap,
  fichaCodigo,
  rapContextLabel,
  emptyMessage,
  hideGroupHeaders = false,
  modoBibliotecaGlobal = false
}) => {
  const { getThemeMode } = useSettings();
  const isDarkTheme = getThemeMode() === 'dark';
  const selectStyles = isDarkTheme ? selectStylesBibliotecaDark : selectStylesBibliotecaLight;

  const [items, setItems] = useState<MaterialApoyoAprendizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [competenciaSel, setCompetenciaSel] = useState<number | null>(null);
  const [rapFiltroSel, setRapFiltroSel] = useState<number | null>(null);
  const [videoModalItem, setVideoModalItem] = useState<MaterialApoyoAprendizItem | null>(null);
  const [recursosMenu, setRecursosMenu] = useState<RecursosMenuState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cerrarModalVideo = useCallback(() => {
    videoRef.current?.pause();
    setVideoModalItem(null);
  }, []);

  const abrirMenuRecursos = useCallback((id: number, button: HTMLButtonElement) => {
    const menuWidth = 240;
    const menuHeight = 200;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setRecursosMenu({ id, top, left });
  }, []);

  useEffect(() => {
    if (!recursosMenu) return;
    const onWindowChange = () => setRecursosMenu(null);
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-id="ma-aprendiz-recursos-menu"]')) return;
      if (target.closest('[data-id="ma-aprendiz-recursos-btn"]')) return;
      setRecursosMenu(null);
    };
    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [recursosMenu]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (idFicha && idFicha > 0) params.idFicha = String(idFicha);
      if (idRap && idRap > 0) params.idRap = String(idRap);
      const res = await axios.get<MaterialApoyoAprendizItem[]>('ambiente-virtual/material-apoyo', { params });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar la biblioteca de conocimiento.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha, idRap]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const emptyMsg =
    emptyMessage ??
    (modoBibliotecaGlobal
      ? 'No hay recursos en la biblioteca de conocimiento para tu programa.'
      : 'No hay material de apoyo disponible para este RAP.');

  const opcionesCompetencia = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach((it) => {
      const idComp = idCompetenciaDeItem(it);
      const nombre = it.competenciaNombre || it.materiaNombre;
      if (idComp && idComp > 0 && nombre) {
        map.set(idComp, nombre);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [items]);

  const opcionesRapFiltro = useMemo(() => {
    const map = new Map<number, string>();
    items
      .filter((it) => {
        if (!competenciaSel) return true;
        return idCompetenciaDeItem(it) === competenciaSel;
      })
      .forEach((it) => {
        const id = it.idRap;
        const label = it.rapNombre || it.materiaNombre;
        if (id && label) map.set(id, label);
      });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [items, competenciaSel]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return items.filter((item) => {
      const idComp = idCompetenciaDeItem(item);
      if (competenciaSel && idComp !== competenciaSel) return false;
      if (rapFiltroSel && item.idRap !== rapFiltroSel) return false;

      if (!q) return true;
      const hasDoc = Boolean(item.urlDocumentoUrl || item.urlDocumento);
      const hasLink = Boolean(item.urlAdicional);
      const hasVid = Boolean(item.urlVideoUrl || item.urlVideo);
      const docExt = hasDoc
        ? extensionFromPath(item.urlDocumentoUrl || item.urlDocumento || item.titulo)
        : '';
      const tipoTokens = [
        hasDoc ? 'Documento' : '',
        hasLink ? 'Enlace' : '',
        hasVid ? 'Video' : '',
        docExt ? materialDocumentoTypeLabel(docExt) : '',
        tipoMaterialDisplay(item.tipoMaterial),
      ].filter(Boolean);
      return filterOptionNormalized(
        [
          item.titulo,
          item.descripcion,
          item.rapNombre,
          item.materiaNombre,
          item.competenciaNombre,
          item.creador?.nombreCompleto,
          item.creador?.email,
          tipoMaterialDisplay(item.tipoMaterial),
          ...tipoTokens
        ],
        q
      );
    });
  }, [items, search, competenciaSel, rapFiltroSel]);

  const grouped = useMemo(() => {
    const map = new Map<string, MaterialApoyoAprendizItem[]>();
    for (const item of filtered) {
      const key = `${item.idFicha || 0}_${item.idRap || 0}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([key, arr]) => ({
      key,
      fichaCodigo: arr[0]?.fichaCodigo || '?',
      rapNombre: arr[0]?.rapNombre || 'Sin RAP',
      materiaNombre: arr[0]?.materiaNombre || 'Sin materia',
      items: arr
    }));
  }, [filtered]);

  const videoResuelto = useMemo(() => {
    if (!videoModalItem) return null;
    const src = getDocumentUrl(videoModalItem.urlVideoUrl || videoModalItem.urlVideo);
    if (!src) return null;
    const yt = youtubeEmbedUrl(src);
    if (yt) return { kind: 'iframe' as const, src: yt };
    return { kind: 'html5' as const, src };
  }, [videoModalItem]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  const renderRows = (list: MaterialApoyoAprendizItem[]) => (
    <div className="space-y-4 p-4">
      {list.map((item) => {
        const docUrl = getDocumentUrl(item.urlDocumentoUrl || item.urlDocumento);
        const docExt = extensionFromPath(item.urlDocumentoUrl || item.urlDocumento || item.titulo);
        const hasDoc = Boolean(docUrl);
        const hasLink = Boolean(item.urlAdicional);
        const hasVideoRes = Boolean(item.urlVideoUrl || item.urlVideo);
        const tieneAlguno = hasDoc || hasLink || hasVideoRes;

        const tituloFull = item.titulo || '-';
        const descripcionFull = item.descripcion || 'Sin descripción.';
        const rapFull = item.rapNombre || 'Sin RAP';
        const competenciaFull = item.competenciaNombre || item.materiaNombre || '';
        const materiaEtiqueta = item.materiaNombre || '';
        const nombreCreador = item.creador?.nombreCompleto?.trim() || 'Instructor';
        const fotoCreador =
          getPerfilPublicUrl(item.creador?.rutaFotoUrl || item.creador?.rutaFoto) || null;
        const fechaTxt = formatearFechaCorta(item.created_at || undefined);

        const linkUrl = item.urlAdicional?.startsWith('http')
          ? item.urlAdicional
          : item.urlAdicional
            ? `https://${item.urlAdicional}`
            : null;

        const menuAbierto = recursosMenu?.id === item.id;

        const chips: { key: string; label: string; className: string }[] = [];
        if (hasDoc) {
          chips.push({
            key: 'd',
            label: docExt ? materialDocumentoTypeLabel(docExt) : 'Documento',
            className: docExt
              ? materialDocumentoBadgeClass(docExt)
              : 'bg-red-50 text-red-900 dark:bg-red-900/35 dark:text-red-100',
          });
        }
        if (hasLink) chips.push({ key: 'l', label: 'Enlace', className: 'bg-sky-50 text-sky-900 dark:bg-sky-900/35 dark:text-sky-100' });
        if (hasVideoRes) chips.push({ key: 'v', label: 'Video', className: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100' });

        return (
          <div
            key={item.id}
            className={clsx(
              'rounded-xl border bg-white shadow-sm dark:bg-coal-400 overflow-hidden',
              'border-gray-200 dark:border-gray-700 border-l-4 border-l-primary'
            )}
          >
            <div className="px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between min-w-0">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="shrink-0 pt-0.5">
                    <AvatarCreadorBiblioteca src={fotoCreador} nombre={nombreCreador} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug"
                      title={nombreCreador}
                    >
                      {nombreCreador}
                    </p>
                    {item.creador?.email ? (
                      <p
                        className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white truncate leading-relaxed mt-0.5"
                        title={item.creador.email}
                      >
                        {item.creador.email}
                      </p>
                    ) : null}
                    <h4
                      className="text-base font-bold text-gray-900 dark:text-white mt-2 leading-snug truncate"
                      title={tituloFull}
                    >
                      {tituloFull}
                    </h4>
                    <p
                      className="text-sm font-medium leading-relaxed text-gray-700 dark:text-white mt-1.5 line-clamp-4 break-words"
                      title={descripcionFull}
                    >
                      {descripcionFull}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 min-w-0">
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-900 dark:bg-violet-900/35 dark:text-violet-100">
                    {tipoMaterialDisplay(item.tipoMaterial)}
                  </span>
                  {chips.map((c) => (
                    <span
                      key={c.key}
                      className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', c.className)}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 min-w-0 text-xs sm:text-sm">
                  {competenciaFull ? (
                    <span
                      className="inline-flex max-w-full rounded-full px-2.5 py-1.5 bg-amber-50 text-amber-950 dark:bg-amber-900/35 dark:text-amber-50 font-medium"
                      title={competenciaFull}
                    >
                      <span className="font-semibold shrink-0 mr-1">Competencia:</span>
                      <span className="truncate min-w-0">{competenciaFull}</span>
                    </span>
                  ) : null}
                  {materiaEtiqueta && materiaEtiqueta !== competenciaFull ? (
                    <span
                      className="inline-flex max-w-full rounded-full px-2.5 py-1.5 bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100 font-medium"
                      title={materiaEtiqueta}
                    >
                      <span className="font-semibold shrink-0 mr-1">Materia:</span>
                      <span className="truncate min-w-0">{materiaEtiqueta}</span>
                    </span>
                  ) : null}
                  <span
                    className="inline-flex max-w-full rounded-full px-2.5 py-1.5 bg-violet-50 text-violet-900 dark:bg-violet-900/35 dark:text-violet-100 font-medium"
                    title={rapFull}
                  >
                    <span className="font-semibold shrink-0 mr-1">RAP:</span>
                    <span className="truncate min-w-0">{rapFull}</span>
                  </span>
                  {!modoBibliotecaGlobal && item.fichaCodigo ? (
                    <span className="inline-flex max-w-full rounded-full px-2.5 py-1.5 bg-gray-100 text-gray-800 dark:bg-gray-800/80 dark:text-gray-100 text-xs font-medium">
                      Ficha {item.fichaCodigo}
                    </span>
                  ) : null}
                  {fechaTxt ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1.5 text-gray-700 dark:text-white text-xs font-medium">
                      {fechaTxt}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto">
                {tieneAlguno ? (
                  <button
                    data-id="ma-aprendiz-recursos-btn"
                    type="button"
                    onClick={(e) => {
                      if (menuAbierto) {
                        setRecursosMenu(null);
                        return;
                      }
                      abrirMenuRecursos(item.id, e.currentTarget);
                    }}
                    className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/35 dark:text-blue-100 dark:hover:bg-blue-900/50 w-full lg:w-auto"
                  >
                    Ver recursos
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-white text-center lg:text-right">
                    Sin recursos
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {!modoBibliotecaGlobal && (fichaCodigo || rapContextLabel) && (
        <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-gray-200/90 bg-gray-50/80 px-4 py-3 dark:border-gray-600 dark:bg-coal-500/25 min-w-0">
          <div className="min-w-0 shrink max-w-[min(100%,220px)]">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-white">Ficha</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1" title={fichaCodigo?.trim()}>
              {fichaCodigo?.trim() || '—'}
            </p>
          </div>
          <div className="min-w-0 flex-1 basis-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-white">RAP</p>
            <p
              className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1 break-words mt-1"
              title={rapContextLabel?.trim()}
            >
              {rapContextLabel?.trim() || '—'}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-coal-400 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={clsLabelFiltro}>Competencia</label>
            <Select
              isClearable
              placeholder="Todas las competencias"
              options={opcionesCompetencia}
              value={opcionesCompetencia.find((o) => o.value === competenciaSel) ?? null}
              onChange={(opt) => {
                setCompetenciaSel(opt?.value ?? null);
                setRapFiltroSel(null);
              }}
              isDisabled={opcionesCompetencia.length === 0}
              classNames={selectClassNamesBiblioteca}
              styles={selectStyles}
              noOptionsMessage={compactReactSelectNoOptions}
            />
          </div>
          <div>
            <label className={clsLabelFiltro}>RAP</label>
            <Select
              isClearable
              placeholder="Todos los RAP"
              options={opcionesRapFiltro}
              value={opcionesRapFiltro.find((o) => o.value === rapFiltroSel) ?? null}
              onChange={(opt) => setRapFiltroSel(opt?.value ?? null)}
              isDisabled={opcionesRapFiltro.length === 0}
              classNames={selectClassNamesBiblioteca}
              styles={selectStyles}
              noOptionsMessage={compactReactSelectNoOptions}
            />
          </div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          className="input material-apoyo-aprendiz-search w-full text-sm font-medium text-gray-900 placeholder:text-gray-500 dark:bg-[#111827] dark:!text-white dark:border-gray-600"
          placeholder="Buscar por título, descripción, competencia, RAP, materia o recurso..."
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
          <KeenIcon icon="book-open" className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{emptyMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
          <KeenIcon icon="magnifier" className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            No se encontraron materiales con ese criterio.
          </p>
        </div>
      ) : hideGroupHeaders ? (
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-coal-400 dark:border-gray-700">
          {renderRows(filtered)}
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.key} className="rounded-xl border border-gray-200 bg-white dark:bg-coal-400 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 px-5 py-3.5">
              <span className="inline-flex rounded-full px-2.5 py-1 bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100 text-sm font-medium">
                Ficha de origen: {group.fichaCodigo}
              </span>
            </div>
            {renderRows(group.items)}
          </section>
        ))
      )}

      {recursosMenu &&
        createPortal(
          (() => {
            const active = items.find((it) => it.id === recursosMenu.id);
            if (!active) return null;
            const docUrl = getDocumentUrl(active.urlDocumentoUrl || active.urlDocumento);
            const docExt = extensionFromPath(active.urlDocumentoUrl || active.urlDocumento || active.titulo);
            const linkUrl = normalizeExternalUrl(active.urlAdicional);
            const hasVid = Boolean(active.urlVideoUrl || active.urlVideo);
            const acciones: Array<{ key: string; label: string; href?: string; onClick?: () => void }> = [];

            if (docUrl) {
              acciones.push({
                key: 'doc',
                label: docExt ? materialDocumentoActionLabel(docExt) : 'Abrir documento',
                href: docUrl,
              });
            }
            if (linkUrl) {
              acciones.push({ key: 'link', label: 'Abrir enlace adicional', href: linkUrl });
            }
            if (hasVid) {
              acciones.push({
                key: 'video',
                label: 'Ver video',
                onClick: () => {
                  setRecursosMenu(null);
                  setVideoModalItem(active);
                },
              });
            }
            return (
              <div
                data-id="ma-aprendiz-recursos-menu"
                className="fixed z-[9999] min-w-[240px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1.5"
                style={{ top: recursosMenu.top, left: recursosMenu.left }}
              >
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-white border-b border-gray-100 dark:border-gray-600">
                  Recursos disponibles
                </p>
                {acciones.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-white">
                    Sin recursos disponibles
                  </div>
                ) : (
                  acciones.map((a) =>
                    a.href ? (
                      <a
                        key={a.key}
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setRecursosMenu(null)}
                        className="block px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-400 rounded-md"
                      >
                        {a.label}
                      </a>
                    ) : (
                      <button
                        key={a.key}
                        type="button"
                        onClick={a.onClick}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-400 rounded-md"
                      >
                        {a.label}
                      </button>
                    )
                  )
                )}
              </div>
            );
          })(),
          document.body
        )}

      <Modal open={Boolean(videoModalItem)} onClose={cerrarModalVideo} zIndex={120}>
        <ModalContent className="max-w-4xl w-[calc(100%-2rem)] top-[4vh] max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-xl mx-auto">
          <ModalHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <ModalTitle className="text-base font-semibold text-gray-900 dark:text-white truncate pr-2">
              {videoModalItem?.titulo || 'Video'}
            </ModalTitle>
            <button
              type="button"
              onClick={cerrarModalVideo}
              className="btn btn-sm btn-light shrink-0"
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="text-base" />
            </button>
          </ModalHeader>
          <ModalBody className="p-4 overflow-auto flex-1 min-h-0 bg-gray-950/5 dark:bg-black/20">
            {videoResuelto?.kind === 'iframe' && (
              <iframe
                title={videoModalItem?.titulo || 'Video'}
                src={videoResuelto.src}
                className="w-full rounded-lg bg-black aspect-video max-h-[72vh]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
            {videoResuelto?.kind === 'html5' && (
              <video
                key={videoModalItem?.id}
                ref={videoRef}
                src={videoResuelto.src}
                controls
                controlsList="nodownload"
                className="w-full rounded-lg bg-black max-h-[70vh]"
                style={{ width: '100%', maxHeight: '70vh' }}
              />
            )}
            {!videoResuelto && videoModalItem && (
              <p className="text-sm font-medium text-gray-700 dark:text-white">No se pudo cargar la URL del video.</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default MaterialApoyoAprendiz;
