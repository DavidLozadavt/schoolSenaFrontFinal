import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { KeenIcon, Toast } from '@/components';
import { createPortal } from 'react-dom';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { useAuthContext } from '@/auth';
import { MisActividadesAvatarFallback } from '@/components/user/MisActividadesAvatarFallback';
import {
  filterOptionNormalized,
  compactReactSelectClassNames,
} from '@/components/forms/compactReactSelect';
import {
  MATERIAL_DOCUMENTO_ACCEPT,
  MATERIAL_DOCUMENTO_FORMATOS_LABEL,
  actOnMaterialDocumento,
  extensionFromPath,
  fileSizeInMb,
  formatMaterialUploadError,
  logSelectedAcademicFile,
  materialDocumentoActionLabel,
  materialDocumentoKeenIcon,
  validateMaterialDocumentoFile,
  validateVideoFile,
  VIDEO_ACCEPT,
  VIDEO_FORMATOS_LABEL,
  youtubeEmbedUrl,
} from './materialDocumentoSupport';
import {
  TIPO_MATERIAL_OPTIONS,
  tipoMaterialBadgeClass,
  tipoMaterialDisplay,
} from './tipoMaterialApoyo';
import {
  etiquetaAcademica,
  propsSelectAcademico,
  selectStylesBiblioteca,
  type SelectAcademicoOption,
} from './etiquetaAcademicaSelect';
import Select from 'react-select';

export interface MaterialApoyoFichaItem {
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
  idPersona?: number | null;
  idFicha?: number | null;
  idRap?: number | null;
  idCompetencia?: number | null;
  materiaNombre?: string | null;
  competenciaNombre?: string | null;
  rap?: {
    id: number;
    nombre: string;
    codigo?: string | null;
    idCompetencia?: number;
  } | null;
  competenciaCodigo?: string | null;
  creador?: {
    idPersona?: number;
    nombreCompleto?: string | null;
    email?: string | null;
    rutaFoto?: string | null;
    rutaFotoUrl?: string | null;
  } | null;
}

interface RapOption {
  id: number;
  nombre: string;
  codigo?: string | null;
  idCompetencia?: number;
  nombreCompetencia?: string;
  codigoCompetencia?: string | null;
}

interface MenuState {
  id: number;
  top: number;
  left: number;
}

type BibliotecaFormErrors = {
  competencia?: string;
  rap?: string;
  titulo?: string;
  documento?: string;
  video?: string;
  enlace?: string;
  recursos?: string;
};

const BIBLIOTECA_FIELD_ORDER: Array<keyof BibliotecaFormErrors> = [
  'competencia',
  'rap',
  'titulo',
  'documento',
  'video',
  'enlace',
  'recursos',
];

const clsFieldError = 'mt-1 text-xs text-red-600 dark:text-red-300';
const clsInputError = '!border-red-400 dark:!border-red-500';

const firstLaravelError = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const found = value.find((v) => typeof v === 'string' && String(v).trim());
    return typeof found === 'string' ? found : undefined;
  }
  return undefined;
};

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className={clsFieldError}>{message}</p> : null;

const getPerfilPublicUrl = (path?: string | null): string | null => {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = p.startsWith('/') ? p.slice(1) : p;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const PAGE_SIZE = 20;

const clsLabelFiltro =
  'text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block';

const selectClassNamesBiblioteca = {
  ...compactReactSelectClassNames,
  control: () =>
    `${compactReactSelectClassNames.control()} h-9 min-h-9 overflow-hidden dark:text-white`,
  valueContainer: () => 'text-gray-900 dark:text-white text-sm overflow-hidden min-w-0',
  singleValue: () =>
    'text-gray-900 dark:!text-white text-sm !whitespace-nowrap overflow-hidden text-ellipsis max-w-full',
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm truncate',
  input: () => 'text-gray-900 dark:!text-white text-sm',
  menu: () => `${compactReactSelectClassNames.menu()} dark:text-white`,
  menuList: () => `${compactReactSelectClassNames.menuList()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option(state)} dark:!text-white !whitespace-normal break-words leading-snug py-1.5 ${
      state.isSelected ? '!text-white' : ''
    }`,
  dropdownIndicator: () =>
    'text-gray-500 dark:!text-white hover:text-gray-700 dark:hover:!text-white/80',
  clearIndicator: () =>
    'text-gray-400 dark:!text-white/80 hover:text-gray-600 dark:hover:!text-white',
};

const clsBtnPagina =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none dark:border-gray-600 dark:bg-coal-500 dark:text-gray-200 dark:hover:bg-coal-400';

const idCompetenciaDeItem = (it: MaterialApoyoFichaItem): number | null => {
  const fromRap = it.rap?.idCompetencia;
  if (fromRap && fromRap > 0) return fromRap;
  if (it.idCompetencia && it.idCompetencia > 0) return it.idCompetencia;
  return null;
};

type RecursoVisualKind = 'video' | 'documento' | 'enlace' | 'vacio';

type RecursoVisual = {
  kind: RecursoVisualKind;
  label: string;
  icon: string;
  iconClass: string;
  badgeClass: string;
};

const recursoVisualDeItem = (mat: MaterialApoyoFichaItem): RecursoVisual => {
  if (tieneVideo(mat)) {
    return {
      kind: 'video',
      label: 'Video',
      icon: 'youtube',
      iconClass: 'text-violet-600 dark:text-violet-300',
      badgeClass:
        'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800/60',
    };
  }
  if (tieneDocumento(mat)) {
    const ext = extensionFromPath(mat.urlDocumentoUrl || mat.urlDocumento || mat.titulo);
    const isPdf = ext === 'pdf';
    return {
      kind: 'documento',
      label: isPdf ? 'PDF' : 'Documento',
      icon: materialDocumentoKeenIcon(ext),
      iconClass: isPdf ? 'text-red-500 dark:text-red-300' : 'text-blue-600 dark:text-blue-300',
      badgeClass: isPdf
        ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/60'
        : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60',
    };
  }
  if (tieneEnlace(mat)) {
    return {
      kind: 'enlace',
      label: 'Enlace',
      icon: 'exit-up-right',
      iconClass: 'text-emerald-600 dark:text-emerald-300',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60',
    };
  }
  const tipo = tipoMaterialDisplay(mat.tipoMaterial);
  return {
    kind: 'vacio',
    label: tipo === 'Sin tipo' ? '—' : tipo,
    icon: 'document',
    iconClass: 'text-gray-400 dark:text-gray-500',
    badgeClass:
      'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700',
  };
};

const paginasVisibles = (actual: number, total: number): number[] => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const start = Math.max(1, Math.min(actual - 2, total - 4));
  return Array.from({ length: 5 }, (_, i) => start + i);
};

const getDocumentUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
      return base + path;
    } catch {
      const pathMatch = url.match(/\/storage\/.*$/);
      if (pathMatch) {
        const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
        return base + pathMatch[0];
      }
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

const tieneDocumento = (mat: MaterialApoyoFichaItem) =>
  Boolean(mat.urlDocumento || mat.urlDocumentoUrl);
const tieneEnlace = (mat: MaterialApoyoFichaItem) => Boolean(mat.urlAdicional?.trim());
const tieneVideo = (mat: MaterialApoyoFichaItem) =>
  Boolean((mat.urlVideo || mat.urlVideoUrl)?.toString().trim());

const AvatarListaInstructor: React.FC<{ src: string | null; nombre: string }> = ({ src, nombre }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <MisActividadesAvatarFallback variant="sm" />;
  }
  return (
    <img
      src={src}
      alt=""
      className="w-8 h-8 rounded-full object-cover border border-primary/40 shrink-0"
      title={nombre}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
};

export interface MaterialApoyoFichaViewProps {
  idFicha?: number | null;
  idMateria?: string | number;
  fichaCodigo?: string;
  /** Texto del RAP actual (sustituye al programa en el encabezado). */
  rapContextLabel?: string;
  /** Si viene de la clase, el RAP está fijado y no se elige en el formulario. */
  idRapContext?: number;
  /** Biblioteca general: listado inmediato, filtros opcionales Competencia/RAP, sin ficha. */
  modoGeneral?: boolean;
}

const MaterialApoyoFichaView: React.FC<MaterialApoyoFichaViewProps> = ({
  idFicha,
  idMateria,
  fichaCodigo,
  rapContextLabel,
  idRapContext,
  modoGeneral = false,
}) => {
  /** Regla de negocio: Biblioteca no depende de ficha, jornada ni clase. */
  const esBibliotecaGeneral = Boolean(modoGeneral);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const [items, setItems] = useState<MaterialApoyoFichaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<'lista' | 'formulario'>('lista');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [accionesMenu, setAccionesMenu] = useState<MenuState | null>(null);
  const [recursosMenu, setRecursosMenu] = useState<MenuState | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<string>('');
  const [link, setLink] = useState('');
  const [idRap, setIdRap] = useState<number | ''>('');
  const [raps, setRaps] = useState<RapOption[]>([]);
  const [loadingRaps, setLoadingRaps] = useState(false);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [quitarVideo, setQuitarVideo] = useState(false);
  const [competenciaSel, setCompetenciaSel] = useState<number | null>(null);
  const [rapFiltroSel, setRapFiltroSel] = useState<number | null>(null);
  const [competenciaFormSel, setCompetenciaFormSel] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<BibliotecaFormErrors>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [videoModalItem, setVideoModalItem] = useState<MaterialApoyoFichaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const formFieldRefs = useRef<Partial<Record<keyof BibliotecaFormErrors, HTMLElement | null>>>({});

  const setFieldRef = (key: keyof BibliotecaFormErrors) => (el: HTMLElement | null) => {
    formFieldRefs.current[key] = el;
  };

  const clearFormError = (key: keyof BibliotecaFormErrors) => {
    setFormErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const selectClassNamesForm = useMemo(
    () => ({
      ...selectClassNamesBiblioteca,
      control: () =>
        `${selectClassNamesBiblioteca.control()} ${formErrors.competencia ? clsInputError : ''}`,
    }),
    [formErrors.competencia]
  );

  const auth = useAuthContext();
  const miPersonaId = auth?.persona?.id;
  const esGestionUsuario = auth?.permissions?.includes('GESTION_USUARIO') ?? false;

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const puedeMutarMaterial = (mat: MaterialApoyoFichaItem) => {
    if (mat.idPersona != null && Number(mat.idPersona) > 0) {
      return Number(mat.idPersona) === Number(miPersonaId) || esGestionUsuario;
    }
    return esGestionUsuario;
  };

  const abrirMenuAcciones = (id: number, button: HTMLButtonElement) => {
    const menuWidth = 200;
    const menuHeight = 120;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setAccionesMenu({ id, top, left });
    setRecursosMenu(null);
  };

  const abrirMenuRecursos = (id: number, button: HTMLButtonElement) => {
    const menuWidth = 240;
    const menuHeight = 200;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setRecursosMenu({ id, top, left });
    setAccionesMenu(null);
  };

  const idMateriaNum = useMemo(() => {
    const n = typeof idMateria === 'string' ? parseInt(idMateria, 10) : Number(idMateria ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [idMateria]);

  const filaEdicion = useMemo(
    () => (editandoId ? items.find((i) => i.id === editandoId) ?? null : null),
    [items, editandoId]
  );

  const opcionesCompetencia = useMemo(() => {
    const map = new Map<number, SelectAcademicoOption>();
    items.forEach((it) => {
      const idComp = idCompetenciaDeItem(it);
      const nombre = it.competenciaNombre || it.materiaNombre;
      if (idComp && idComp > 0 && nombre) {
        map.set(idComp, {
          value: idComp,
          label: etiquetaAcademica(it.competenciaCodigo, nombre),
          codigo: it.competenciaCodigo ?? undefined,
          nombre,
        });
      }
    });
    if (esBibliotecaGeneral) {
      raps.forEach((rap) => {
        if (rap.idCompetencia && rap.idCompetencia > 0 && rap.nombreCompetencia) {
          map.set(rap.idCompetencia, {
            value: rap.idCompetencia,
            label: etiquetaAcademica(rap.codigoCompetencia, rap.nombreCompetencia),
            codigo: rap.codigoCompetencia ?? undefined,
            nombre: rap.nombreCompetencia,
          });
        }
      });
    }
    return Array.from(map.values()).sort((x, y) => x.label.localeCompare(y.label, 'es'));
  }, [items, esBibliotecaGeneral, raps]);

  const opcionesRapFiltro = useMemo(() => {
    const map = new Map<number, SelectAcademicoOption>();
    items
      .filter((it) => {
        if (!competenciaSel) return true;
        return idCompetenciaDeItem(it) === competenciaSel;
      })
      .forEach((it) => {
        const id = it.idRap ?? it.rap?.id;
        const nombre = it.rap?.nombre || it.materiaNombre;
        if (id && nombre) {
          map.set(id, {
            value: id,
            label: etiquetaAcademica(it.rap?.codigo, nombre),
            codigo: it.rap?.codigo ?? undefined,
            nombre,
          });
        }
      });
    if (esBibliotecaGeneral) {
      raps
        .filter((rap) => !competenciaSel || rap.idCompetencia === competenciaSel)
        .forEach((rap) => {
          if (rap.id && rap.nombre) {
            map.set(rap.id, {
              value: rap.id,
              label: etiquetaAcademica(rap.codigo, rap.nombre),
              codigo: rap.codigo ?? undefined,
              nombre: rap.nombre,
            });
          }
        });
    }
    return Array.from(map.values()).sort((x, y) => x.label.localeCompare(y.label, 'es'));
  }, [items, competenciaSel, esBibliotecaGeneral, raps]);

  const opcionesCompetenciaForm = useMemo(() => {
    const map = new Map<number, SelectAcademicoOption>();
    raps.forEach((rap) => {
      if (rap.idCompetencia && rap.idCompetencia > 0) {
        const nombre = rap.nombreCompetencia || `Competencia ${rap.idCompetencia}`;
        map.set(rap.idCompetencia, {
          value: rap.idCompetencia,
          label: etiquetaAcademica(rap.codigoCompetencia, nombre),
          codigo: rap.codigoCompetencia ?? undefined,
          nombre,
        });
      }
    });
    return Array.from(map.values()).sort((x, y) => x.label.localeCompare(y.label, 'es'));
  }, [raps]);

  const rapsDelFormulario = useMemo(() => {
    if (!competenciaFormSel) return [];
    return raps.filter((rap) => rap.idCompetencia === competenciaFormSel);
  }, [raps, competenciaFormSel]);

  const opcionesRapForm = useMemo(
    () =>
      rapsDelFormulario.map((rap) => ({
        value: rap.id,
        label: etiquetaAcademica(rap.codigo, rap.nombre),
        codigo: rap.codigo ?? undefined,
        nombre: rap.nombre,
      })),
    [rapsDelFormulario]
  );

  const itemsFiltrados = useMemo(() => {
    const q = search.trim();
    return items.filter((it) => {
      const idComp = idCompetenciaDeItem(it);
      if (competenciaSel && idComp !== competenciaSel) return false;
      if (rapFiltroSel && (it.idRap ?? it.rap?.id) !== rapFiltroSel) return false;

      if (!q) return true;
      const recursosTokens = [
        tieneDocumento(it) ? 'Documento' : '',
        tieneEnlace(it) ? 'Enlace' : '',
        tieneVideo(it) ? 'Video' : '',
        tipoMaterialDisplay(it.tipoMaterial),
      ].filter(Boolean);

      return filterOptionNormalized(
        [
          it.titulo,
          it.descripcion,
          it.rap?.nombre,
          it.rap?.codigo,
          it.materiaNombre,
          it.competenciaNombre,
          it.competenciaCodigo,
          it.creador?.nombreCompleto,
          it.creador?.email,
          tipoMaterialDisplay(it.tipoMaterial),
          ...recursosTokens,
        ],
        q
      );
    });
  }, [items, search, competenciaSel, rapFiltroSel]);

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE));
  const itemsPagina = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return itemsFiltrados.slice(start, start + PAGE_SIZE);
  }, [itemsFiltrados, pagina]);

  const rapSeleccionadoNombre = useMemo(() => {
    if (typeof idRap !== 'number') return '';
    return raps.find((r) => r.id === idRap)?.nombre || '';
  }, [idRap, raps]);

  const rapFormularioSoloLectura = useMemo(() => {
    if (idRapContext && rapContextLabel?.trim()) return rapContextLabel.trim();
    if (idRapContext) return rapSeleccionadoNombre || `RAP #${idRapContext}`;
    return '';
  }, [idRapContext, rapContextLabel, rapSeleccionadoNombre]);

  const videoResuelto = useMemo(() => {
    if (!videoModalItem) return null;
    const src = getDocumentUrl(videoModalItem.urlVideoUrl || videoModalItem.urlVideo);
    if (!src) return null;
    const yt = youtubeEmbedUrl(src);
    if (yt) return { kind: 'iframe' as const, src: yt };
    return { kind: 'html5' as const, src };
  }, [videoModalItem]);

  const cerrarModalVideo = useCallback(() => {
    videoPlayerRef.current?.pause();
    setVideoModalItem(null);
  }, []);

  useEffect(() => {
    setPagina((p) => Math.min(Math.max(1, p), totalPaginas));
  }, [itemsFiltrados.length, totalPaginas]);

  useEffect(() => {
    if (esBibliotecaGeneral) return;
    if (idRapContext && idRapContext > 0) {
      setIdRap(idRapContext);
    }
  }, [idRapContext, esBibliotecaGeneral]);

  const apiBase = esBibliotecaGeneral
    ? 'ambiente-virtual/biblioteca-conocimiento'
    : idFicha
      ? `fichas/${idFicha}/materiales-apoyo`
      : '';

  const cargar = useCallback(async () => {
    if (!esBibliotecaGeneral && !idFicha) return;
    setLoading(true);
    setError(null);
    try {
      const url = esBibliotecaGeneral
        ? 'ambiente-virtual/biblioteca-conocimiento'
        : `fichas/${idFicha}/materiales-apoyo`;
      const res = await axios.get<MaterialApoyoFichaItem[]>(url);
      const list = Array.isArray(res.data) ? res.data : [];
      const seen = new Set<number>();
      setItems(list.filter((row) => {
        const id = Number(row?.id);
        if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return false;
        seen.add(id);
        return true;
      }));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar la biblioteca de conocimiento.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha, esBibliotecaGeneral]);

  const cargarRaps = useCallback(async () => {
    if (esBibliotecaGeneral) {
      setLoadingRaps(true);
      try {
        const res = await axios.get<RapOption[]>('ambiente-virtual/biblioteca-conocimiento/raps');
        const options = Array.isArray(res.data) ? res.data : [];
        setRaps(options);
        setIdRap((prev) => {
          if (prev && options.some((r) => r.id === prev)) return prev as number;
          return '';
        });
      } catch {
        setRaps([]);
        setIdRap('');
      } finally {
        setLoadingRaps(false);
      }
      return;
    }
    if (!idFicha || !idMateriaNum) {
      setRaps([]);
      setIdRap('');
      return;
    }
    setLoadingRaps(true);
    try {
      const res = await axios.get<RapOption[]>(`fichas/${idFicha}/materiales-apoyo/raps`, {
        params: { idMateria: idMateriaNum }
      });
      const options = Array.isArray(res.data) ? res.data : [];
      setRaps(options);
      setIdRap((prev) => {
        if (idRapContext && idRapContext > 0) return idRapContext;
        if (prev && options.some((r) => r.id === prev)) return prev as number;
        return options[0]?.id ?? '';
      });
    } catch {
      setRaps([]);
      setIdRap(idRapContext && idRapContext > 0 ? idRapContext : '');
    } finally {
      setLoadingRaps(false);
    }
  }, [idFicha, idMateriaNum, idRapContext, esBibliotecaGeneral]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarRaps();
  }, [cargarRaps]);

  useEffect(() => {
    setPagina(1);
  }, [search, competenciaSel, rapFiltroSel]);

  useEffect(() => {
    if (!accionesMenu && !recursosMenu) return;
    const onWindowChange = () => {
      setAccionesMenu(null);
      setRecursosMenu(null);
    };
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-id="material-apoyo-acciones-menu"]')) return;
      if (target.closest('[data-id="material-apoyo-acciones-btn"]')) return;
      if (target.closest('[data-id="material-apoyo-recursos-menu"]')) return;
      if (target.closest('[data-id="material-apoyo-recursos-btn"]')) return;
      setAccionesMenu(null);
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
  }, [accionesMenu, recursosMenu]);

  const abrirNuevo = () => {
    if (!esBibliotecaGeneral && !idMateriaNum) {
      showToast('No hay materia asociada para agregar un recurso a la biblioteca.', 'warning');
      return;
    }
    if (esBibliotecaGeneral && raps.length === 0) {
      showToast('No hay RAP disponibles para agregar un recurso a la biblioteca.', 'warning');
      return;
    }
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setTipoMaterial('');
    setLink('');
    setCompetenciaFormSel(null);
    setIdRap(esBibliotecaGeneral ? '' : (idRapContext ?? raps[0]?.id ?? ''));
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setFormErrors({});
    setUploadProgress(null);
    setModo('formulario');
  };

  const abrirEditar = (row: MaterialApoyoFichaItem) => {
    if (!puedeMutarMaterial(row)) {
      showToast('No tienes permiso para editar este recurso.', 'error');
      return;
    }
    setEditandoId(row.id);
    setTitulo(row.titulo || '');
    setDescripcion(row.descripcion || '');
    setTipoMaterial(row.tipoMaterial || '');
    setLink(row.urlAdicional || '');
    const rapId = row.idRap || row.rap?.id || '';
    const compId = row.rap?.idCompetencia || row.idCompetencia || null;
    setCompetenciaFormSel(compId && compId > 0 ? compId : null);
    setIdRap(esBibliotecaGeneral ? rapId : (idRapContext ?? rapId));
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setFormErrors({});
    setUploadProgress(null);
    setModo('formulario');
  };

  const cancelarForm = () => {
    setModo('lista');
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setTipoMaterial('');
    setLink('');
    setCompetenciaFormSel(null);
    setIdRap(esBibliotecaGeneral ? '' : (idRapContext ?? raps[0]?.id ?? ''));
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setFormErrors({});
    setUploadProgress(null);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: BibliotecaFormErrors = {};
    const idRapEnvio = esBibliotecaGeneral ? idRap : (idRapContext ?? idRap);
    const rapSel = typeof idRapEnvio === 'number' ? raps.find((r) => r.id === idRapEnvio) : undefined;
    const idMateriaEnvio = rapSel?.idCompetencia || competenciaFormSel || idMateriaNum;

    if (esBibliotecaGeneral && !competenciaFormSel) {
      next.competencia = 'Seleccione una competencia.';
    }
    if (!idRapEnvio) {
      next.rap = 'Seleccione un RAP.';
    }
    if (!titulo.trim()) {
      next.titulo = 'El título es obligatorio.';
    }

    const tieneRecursoNuevo = Boolean(documentoFile || link.trim() || videoFile);
    const tieneRecursoExistente = Boolean(
      editandoId &&
        filaEdicion &&
        (tieneDocumento(filaEdicion) || tieneEnlace(filaEdicion) || (tieneVideo(filaEdicion) && !quitarVideo))
    );
    if (!tieneRecursoNuevo && !tieneRecursoExistente) {
      next.recursos = 'Ingrese al menos un recurso: documento, enlace o video.';
    }
    if (documentoFile) {
      const docErr = validateMaterialDocumentoFile(documentoFile);
      if (docErr) next.documento = docErr;
    }
    if (videoFile) {
      logSelectedAcademicFile(videoFile, 'submit video');
      const videoErr = validateVideoFile(videoFile);
      if (videoErr) next.video = videoErr;
    }

    setFormErrors(next);
    const firstKey = BIBLIOTECA_FIELD_ORDER.find((key) => next[key]);
    if (firstKey) {
      showToast('Revisa los campos marcados antes de guardar.', 'warning');
      requestAnimationFrame(() => {
        const el = formFieldRefs.current[firstKey];
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          el.focus();
        } else {
          el?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
        }
      });
      return;
    }

    if (!apiBase) {
      showToast('No se pudo determinar el destino del recurso.', 'error');
      return;
    }
    if (!idMateriaEnvio) {
      showToast(
        esBibliotecaGeneral
          ? 'Seleccione competencia y RAP para guardar el recurso.'
          : 'No se identificó la materia de la clase. No se puede guardar el material.',
        'error'
      );
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('idMateria', String(idMateriaEnvio));
      fd.append('idRap', String(idRapEnvio));
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim().slice(0, 3000));
      if (tipoMaterial) {
        fd.append('tipoMaterial', tipoMaterial);
      } else if (editandoId) {
        fd.append('tipoMaterial', '');
      }
      if (documentoFile) fd.append('documento', documentoFile);
      if (link.trim()) fd.append('urlAdicional', link.trim());

      if (videoFile) {
        fd.append('video', videoFile);
      } else if (editandoId && quitarVideo) {
        fd.append('urlVideo', '');
      }

      const onUploadProgress = (ev: { loaded: number; total?: number }) => {
        if (ev.total && ev.total > 0) {
          setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };

      if (editandoId) {
        await axios.post(`${apiBase}/${editandoId}`, fd, { onUploadProgress });
      } else {
        await axios.post(apiBase, fd, { onUploadProgress });
      }
      await cargar();
      cancelarForm();
      showToast(editandoId ? 'Material actualizado correctamente.' : 'Material creado correctamente.', 'success');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, unknown> } } };
      const backend = ax.response?.data?.errors;
      if (backend && typeof backend === 'object') {
        const mapped: BibliotecaFormErrors = {
          competencia: firstLaravelError(backend.idMateria),
          rap: firstLaravelError(backend.idRap),
          titulo: firstLaravelError(backend.titulo),
          documento: firstLaravelError(backend.documento),
          video: firstLaravelError(backend.video),
          enlace: firstLaravelError(backend.urlAdicional),
          recursos: firstLaravelError(backend.recursos),
        };
        if (mapped.video && /uploaded|failed to upload|tamaño máximo/i.test(mapped.video) && videoFile) {
          const sizeErr = validateVideoFile(videoFile);
          if (sizeErr) mapped.video = sizeErr;
        }
        if (Object.values(mapped).some(Boolean)) {
          setFormErrors(mapped);
        }
      }
      showToast(formatMaterialUploadError(err, { videoFile, documentoFile }), 'error');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const eliminar = async (row: MaterialApoyoFichaItem) => {
    if (!puedeMutarMaterial(row)) {
      showToast('No tienes permiso para eliminar este recurso.', 'error');
      return;
    }
    if (!window.confirm('¿Eliminar este recurso de la biblioteca de conocimiento?')) return;
    try {
      if (!apiBase) {
        showToast('No se pudo determinar el destino del recurso.', 'error');
        return;
      }
      await axios.delete(`${apiBase}/${row.id}`);
      await cargar();
      showToast('Material eliminado correctamente.', 'success');
    } catch {
      showToast('No se pudo eliminar el material.', 'error');
    }
  };

  const avisoSinMateria =
    !esBibliotecaGeneral && !idMateriaNum ? (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        No hay materia asociada a esta clase; puede consultar los recursos, pero no agregar uno nuevo hasta seleccionar un RAP.
      </div>
    ) : null;

  const desde = itemsFiltrados.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, itemsFiltrados.length);

  return (
    <div className="space-y-4">
      <Toast
        isOpen={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
      {(!esBibliotecaGeneral || modo === 'lista') && (
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:px-4 sm:py-3 dark:border-gray-700 dark:bg-coal-400">
        {esBibliotecaGeneral ? null : (
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Biblioteca de conocimiento</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-gray-200/90 bg-gray-50/80 px-3 py-2.5 dark:border-gray-600 dark:bg-coal-500/25 min-w-0">
              <div className="min-w-0 shrink max-w-[min(100%,220px)]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200">Ficha</p>
                <p
                  className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                  title={fichaCodigo?.trim() || undefined}
                >
                  {fichaCodigo?.trim() || '-'}
                </p>
              </div>
              <div className="min-w-0 flex-1 basis-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200">RAP</p>
                <p
                  className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1 break-words"
                  title={rapContextLabel?.trim() || undefined}
                >
                  {rapContextLabel?.trim() || '—'}
                </p>
              </div>
            </div>
          </div>
        )}
        {avisoSinMateria}
        {modo === 'lista' && (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,25%)_minmax(0,20%)_minmax(0,1fr)] gap-3 flex-1 min-w-0">
              <div className="min-w-0">
                <label className={clsLabelFiltro}>Competencia</label>
                <div className="relative">
                  <KeenIcon
                    icon="book"
                    className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                  />
                  <Select
                    {...propsSelectAcademico}
                    isClearable
                    placeholder="Todas las competencias"
                    options={opcionesCompetencia}
                    value={opcionesCompetencia.find((o) => o.value === competenciaSel) ?? null}
                    onChange={(opt) => {
                      setCompetenciaSel(opt?.value ?? null);
                      setRapFiltroSel(null);
                    }}
                    classNames={{
                      ...selectClassNamesBiblioteca,
                      control: () => `${selectClassNamesBiblioteca.control()} !pl-7`,
                    }}
                    styles={selectStylesBiblioteca}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className={clsLabelFiltro}>RAP</label>
                <div className="relative">
                  <KeenIcon
                    icon="notepad"
                    className="pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                  />
                  <Select
                    {...propsSelectAcademico}
                    isClearable
                    placeholder="Todos los RAP"
                    options={opcionesRapFiltro}
                    value={opcionesRapFiltro.find((o) => o.value === rapFiltroSel) ?? null}
                    onChange={(opt) => setRapFiltroSel(opt?.value ?? null)}
                    classNames={{
                      ...selectClassNamesBiblioteca,
                      control: () => `${selectClassNamesBiblioteca.control()} !pl-7`,
                    }}
                    styles={selectStylesBiblioteca}
                  />
                </div>
              </div>
              <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                <label className={`${clsLabelFiltro} xl:opacity-0 xl:select-none`}>Buscar</label>
                <div className="relative">
                  <KeenIcon
                    icon="magnifier"
                    className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400 dark:text-gray-300"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type="search"
                    className="input h-9 w-full pl-9 dark:bg-[#111827] dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                    placeholder="Buscar por título, descripción o creador..."
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={abrirNuevo}
              className="btn btn-primary h-9 text-sm shrink-0 self-stretch sm:self-end xl:self-end"
              disabled={esBibliotecaGeneral ? raps.length === 0 : !idMateriaNum}
            >
              <KeenIcon icon="plus" className="text-sm mr-1.5" />
              Agregar recurso
            </button>
          </div>
        )}
      </div>
      )}

      {modo === 'formulario' ? (
        <form noValidate onSubmit={enviar} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-6 space-y-4 w-full max-w-[1050px]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{editandoId ? 'Editar material' : 'Nuevo material'}</h3>

          {esBibliotecaGeneral ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div ref={setFieldRef('competencia')}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">
                  Competencia <span className="text-red-500">*</span>
                </label>
                <Select
                  {...propsSelectAcademico}
                  placeholder={loadingRaps ? 'Cargando competencias...' : 'Seleccione competencia'}
                  options={opcionesCompetenciaForm}
                  value={opcionesCompetenciaForm.find((o) => o.value === competenciaFormSel) ?? null}
                  onChange={(opt) => {
                    const next = opt?.value ?? null;
                    setCompetenciaFormSel(next);
                    clearFormError('competencia');
                    setIdRap((prev) => {
                      if (!next || typeof prev !== 'number') return '';
                      const rap = raps.find((r) => r.id === prev);
                      return rap?.idCompetencia === next ? prev : '';
                    });
                  }}
                  classNames={selectClassNamesForm}
                  styles={selectStylesBiblioteca}
                />
                <FieldError message={formErrors.competencia} />
              </div>
              <div ref={setFieldRef('rap')}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">
                  RAP <span className="text-red-500">*</span>
                </label>
                <Select
                  {...propsSelectAcademico}
                  isDisabled={!competenciaFormSel}
                  placeholder={
                    !competenciaFormSel
                      ? 'Seleccione primero una competencia'
                      : loadingRaps
                        ? 'Cargando RAP...'
                        : 'Seleccione RAP'
                  }
                  options={opcionesRapForm}
                  value={typeof idRap === 'number' ? opcionesRapForm.find((o) => o.value === idRap) ?? null : null}
                  onChange={(opt) => {
                    setIdRap(opt?.value ?? '');
                    clearFormError('rap');
                  }}
                  classNames={{
                    ...selectClassNamesBiblioteca,
                    control: () =>
                      `${selectClassNamesBiblioteca.control()} ${formErrors.rap ? clsInputError : ''}`,
                  }}
                  styles={selectStylesBiblioteca}
                  noOptionsMessage={() =>
                    competenciaFormSel ? 'No hay RAP para esta competencia.' : 'Seleccione primero una competencia'
                  }
                />
                <FieldError message={formErrors.rap} />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={setFieldRef('titulo')} className={esBibliotecaGeneral ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input w-full ${formErrors.titulo ? clsInputError : ''}`}
                placeholder="Título del material"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  clearFormError('titulo');
                }}
                data-preserve-case
              />
              <FieldError message={formErrors.titulo} />
            </div>

            {esBibliotecaGeneral ? null : (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">RAP</label>
              {idRapContext ? (
                <div
                  className="input w-full bg-gray-50 dark:bg-coal-500/40 text-sm text-gray-800 dark:text-gray-100 truncate cursor-default select-none"
                  title={rapFormularioSoloLectura || undefined}
                >
                  <span className="block truncate">{rapFormularioSoloLectura || '—'}</span>
                </div>
              ) : (
                <select
                  className="select w-full"
                  value={idRap}
                  title={rapSeleccionadoNombre || undefined}
                  onChange={(e) => setIdRap(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">{loadingRaps ? 'Cargando RAP...' : 'Seleccione RAP'}</option>
                  {raps.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Descripcion</label>
            <textarea
              className="textarea w-full min-h-[110px]"
              placeholder="Descripcion del material"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
              data-preserve-case
              maxLength={3000}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Tipo de material</label>
            <select
              className="select w-full"
              value={tipoMaterial}
              onChange={(e) => setTipoMaterial(e.target.value)}
            >
              <option value="">Sin tipo</option>
              {TIPO_MATERIAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div ref={setFieldRef('recursos')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={setFieldRef('documento')}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Documento</label>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={MATERIAL_DOCUMENTO_ACCEPT}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDocumentoFile(file);
                    if (file) {
                      logSelectedAcademicFile(file, 'documento');
                      const err = validateMaterialDocumentoFile(file);
                      setFormErrors((prev) => ({ ...prev, documento: err || undefined, recursos: undefined }));
                    } else {
                      clearFormError('documento');
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary text-sm shrink-0"
                >
                  Subir documento
                </button>
                <span
                  className="text-xs text-gray-600 dark:text-gray-200 truncate min-w-0 flex-1 max-w-full sm:max-w-[min(100%,280px)]"
                  title={documentoFile?.name}
                >
                  {documentoFile
                    ? `${documentoFile.name} (${fileSizeInMb(documentoFile.size)} MB)`
                    : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-200 mt-1">{MATERIAL_DOCUMENTO_FORMATOS_LABEL}</p>
              <FieldError message={formErrors.documento} />
            </div>
            <div ref={setFieldRef('enlace')}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Enlace adicional</label>
              <input
                type="url"
                className={`input w-full ${formErrors.enlace ? clsInputError : ''}`}
                placeholder="https://ejemplo.com"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  clearFormError('enlace');
                  if (e.target.value.trim()) clearFormError('recursos');
                }}
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-200 mt-1">
                Puedes usar este campo para páginas web, YouTube, Drive u otros enlaces externos.
              </p>
              <FieldError message={formErrors.enlace} />
            </div>
          </div>

          <div ref={setFieldRef('video')}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Video (archivo)</label>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <input
                ref={videoInputRef}
                type="file"
                accept={VIDEO_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setVideoFile(file);
                  setQuitarVideo(false);
                  if (file) {
                    logSelectedAcademicFile(file, 'video');
                    const err = validateVideoFile(file);
                    setFormErrors((prev) => ({ ...prev, video: err || undefined, recursos: undefined }));
                  } else {
                    clearFormError('video');
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="btn btn-primary text-sm shrink-0"
              >
                Subir video
              </button>
              <span
                className="text-xs text-gray-600 dark:text-gray-200 truncate min-w-0 flex-1 max-w-full sm:max-w-[min(100%,280px)]"
                title={videoFile?.name}
              >
                {videoFile
                  ? `${videoFile.name} (${fileSizeInMb(videoFile.size)} MB)`
                  : 'Ningún archivo seleccionado'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-200 mt-1">{VIDEO_FORMATOS_LABEL}</p>
            <FieldError message={formErrors.video} />
          </div>
          <FieldError message={formErrors.recursos} />

          {filaEdicion && tieneVideo(filaEdicion) && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={quitarVideo}
                onChange={(e) => setQuitarVideo(e.target.checked)}
              />
              Quitar video actual del material
            </label>
          )}

          <div className="flex flex-wrap items-center gap-2 justify-end pt-2">
            <button type="button" className="btn btn-light" onClick={cancelarForm} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? uploadProgress != null
                  ? `Subiendo... ${uploadProgress}%`
                  : 'Guardando...'
                : 'Guardar material'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recursos registrados ({itemsFiltrados.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[56rem]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-coal-500/30">
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 w-[72px]">Acciones</th>
                  <th className="text-left py-2.5 pl-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 min-w-0">Título</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 w-[150px]">Tipo de material</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 w-[168px]">Creador</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 w-[180px]">RAP</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 min-w-0">Descripción</th>
                  <th className="text-right py-2.5 pl-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 w-[118px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-600 dark:text-gray-200">
                      No hay recursos en la biblioteca de conocimiento.
                    </td>
                  </tr>
                ) : itemsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-gray-600 dark:text-gray-200">
                      No se encontraron materiales con ese criterio.
                    </td>
                  </tr>
                ) : (
                  itemsPagina.map((mat) => {
                    const rapFull = mat.rap?.nombre
                      ? etiquetaAcademica(mat.rap.codigo, mat.rap.nombre)
                      : 'Sin RAP';
                    const tituloFull = mat.titulo || '-';
                    const descripcionFull = mat.descripcion?.trim() || '—';
                    const tipoAcademico = tipoMaterialDisplay(mat.tipoMaterial);
                    const visual = recursoVisualDeItem(mat);
                    const accionesMenuOpen = accionesMenu?.id === mat.id;
                    const tieneAlguno =
                      tieneDocumento(mat) || tieneEnlace(mat) || tieneVideo(mat);
                    const nombreCreador = mat.creador?.nombreCompleto?.trim() || '—';
                    const fotoCreador = getPerfilPublicUrl(mat.creador?.rutaFotoUrl || mat.creador?.rutaFoto);
                    const puedeMutar = puedeMutarMaterial(mat);
                    return (
                      <tr
                        key={mat.id}
                        className="h-14 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-2 pl-3 pr-2 text-xs min-w-0 align-middle">
                          {tieneAlguno ? (
                            <button
                              data-id="material-apoyo-recursos-btn"
                              type="button"
                              onClick={(e) => {
                                if (recursosMenu?.id === mat.id) {
                                  setRecursosMenu(null);
                                  return;
                                }
                                abrirMenuRecursos(mat.id, e.currentTarget);
                              }}
                              className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/25 dark:text-blue-200 dark:hover:bg-blue-900/40"
                            >
                              Ver
                            </button>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2 pl-2 pr-2 text-sm font-medium text-gray-900 dark:text-white min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-coal-500/60 ${visual.iconClass}`}
                              aria-hidden
                            >
                              <KeenIcon icon={visual.icon} className="text-sm" />
                            </span>
                            <span className="block min-w-0 flex-1 truncate" title={tituloFull}>
                              {tituloFull}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-xs min-w-0 align-middle">
                          <span
                            className={`inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[11px] font-medium ${tipoMaterialBadgeClass(mat.tipoMaterial)}`}
                            title={tipoAcademico}
                          >
                            {tipoAcademico}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <AvatarListaInstructor src={fotoCreador} nombre={nombreCreador} />
                            <div className="min-w-0 flex-1">
                              <span className="block w-full truncate font-medium text-gray-900 dark:text-white" title={nombreCreador}>
                                {nombreCreador}
                              </span>
                              {mat.creador?.email ? (
                                <span className="block w-full truncate text-[10px] text-gray-500 dark:text-gray-300" title={mat.creador.email}>
                                  {mat.creador.email}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                          <span className="block w-full truncate" title={rapFull}>
                            {rapFull}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-300 min-w-0">
                          <span className="block w-full truncate whitespace-nowrap" title={descripcionFull === '—' ? undefined : descripcionFull}>
                            {descripcionFull}
                          </span>
                        </td>
                        <td className="py-2 pl-2 pr-4 w-[118px] text-right min-w-0 align-middle">
                          {puedeMutar ? (
                            <div className="relative inline-block">
                              <button
                                data-id="material-apoyo-acciones-btn"
                                type="button"
                                onClick={(e) => {
                                  if (accionesMenuOpen) {
                                    setAccionesMenu(null);
                                    return;
                                  }
                                  abrirMenuAcciones(mat.id, e.currentTarget);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                              >
                                Acciones
                                <KeenIcon icon="down" className="text-[10px]" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Solo lectura</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
            <span>
              Mostrando {desde} – {hasta} de {itemsFiltrados.length} recurso{itemsFiltrados.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Primera página"
                onClick={() => setPagina(1)}
                disabled={pagina <= 1}
                className={clsBtnPagina}
              >
                «
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className={clsBtnPagina}
              >
                ‹
              </button>
              {paginasVisibles(pagina, totalPaginas).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPagina(n)}
                  className={
                    n === pagina
                      ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-2 text-xs font-semibold text-white'
                      : clsBtnPagina
                  }
                  aria-current={n === pagina ? 'page' : undefined}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="Página siguiente"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
                className={clsBtnPagina}
              >
                ›
              </button>
              <button
                type="button"
                aria-label="Última página"
                onClick={() => setPagina(totalPaginas)}
                disabled={pagina >= totalPaginas}
                className={clsBtnPagina}
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-600 dark:text-red-300">{error}</div>}

      {recursosMenu &&
        createPortal(
          (() => {
            const active = items.find((mat) => mat.id === recursosMenu.id);
            if (!active) return null;
            const docUrl = getDocumentUrl(active.urlDocumentoUrl || active.urlDocumento);
            const docExt = extensionFromPath(active.urlDocumentoUrl || active.urlDocumento || active.titulo);
            const linkUrl = normalizeExternalUrl(active.urlAdicional);
            const videoUrl = getDocumentUrl(active.urlVideoUrl || active.urlVideo);
            const acciones: Array<{
              key: string;
              label: string;
              href?: string;
              onClick?: () => void;
            }> = [];

            if (docUrl) {
              acciones.push({
                key: 'doc',
                label: docExt ? materialDocumentoActionLabel(docExt) : 'Abrir documento',
                onClick: () => {
                  setRecursosMenu(null);
                  void actOnMaterialDocumento(docUrl, docExt, {
                    titulo: active.titulo,
                    urlPath: active.urlDocumentoUrl || active.urlDocumento,
                  });
                },
              });
            }
            if (linkUrl) {
              acciones.push({ key: 'link', label: 'Abrir enlace adicional', href: linkUrl });
            }
            if (videoUrl) {
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
                data-id="material-apoyo-recursos-menu"
                className="fixed z-[9999] min-w-[220px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1"
                style={{ top: recursosMenu.top, left: recursosMenu.left }}
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200 border-b border-gray-100 dark:border-gray-600">
                  Recursos disponibles
                </p>
                {acciones.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-200">
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
                        className="block px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                      >
                        {a.label}
                      </a>
                    ) : (
                      <button
                        key={a.key}
                        type="button"
                        onClick={a.onClick}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
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

      {accionesMenu &&
        createPortal(
          (() => {
            const active = items.find((mat) => mat.id === accionesMenu.id);
            if (!active || !puedeMutarMaterial(active)) return null;
            return (
              <div
                data-id="material-apoyo-acciones-menu"
                className="fixed z-[9999] min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1"
                style={{ top: accionesMenu.top, left: accionesMenu.left }}
              >
                <button
                  type="button"
                  onClick={() => {
                    abrirEditar(active);
                    setAccionesMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                >
                  Editar material
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void eliminar(active);
                    setAccionesMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Eliminar material
                </button>
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
            <button type="button" onClick={cerrarModalVideo} className="btn btn-sm btn-light shrink-0" aria-label="Cerrar">
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
                ref={videoPlayerRef}
                src={videoResuelto.src}
                controls
                className="w-full rounded-lg bg-black max-h-[70vh]"
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

export default MaterialApoyoFichaView;
