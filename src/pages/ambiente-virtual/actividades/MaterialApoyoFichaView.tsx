import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { KeenIcon, Toast } from '@/components';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/auth';
import { MisActividadesAvatarFallback } from '@/components/user/MisActividadesAvatarFallback';
import {
  filterOptionNormalized,
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
} from '@/components/forms/compactReactSelect';
import {
  MATERIAL_DOCUMENTO_ACCEPT,
  MATERIAL_DOCUMENTO_FORMATOS_LABEL,
  extensionFromPath,
  materialDocumentoActionLabel,
  materialDocumentoBadgeClass,
  materialDocumentoKeenIcon,
  materialDocumentoTypeLabel,
  validateMaterialDocumentoFile,
  validateVideoFile,
  VIDEO_ACCEPT,
  VIDEO_FORMATOS_LABEL,
} from './materialDocumentoSupport';
import {
  TIPO_MATERIAL_OPTIONS,
  tipoMaterialDisplay,
} from './tipoMaterialApoyo';
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
    idCompetencia?: number;
  } | null;
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
  idCompetencia?: number;
  nombreCompetencia?: string;
}

interface MenuState {
  id: number;
  top: number;
  left: number;
}

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
  control: () => `${compactReactSelectClassNames.control()} dark:text-white`,
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

const selectStylesBiblioteca = {
  singleValue: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  placeholder: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
  input: (base: Record<string, unknown>) => ({ ...base, color: 'inherit' }),
};

const idCompetenciaDeItem = (it: MaterialApoyoFichaItem): number | null => {
  const fromRap = it.rap?.idCompetencia;
  if (fromRap && fromRap > 0) return fromRap;
  if (it.idCompetencia && it.idCompetencia > 0) return it.idCompetencia;
  return null;
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
  idFicha: number;
  idMateria: string | number;
  fichaCodigo?: string;
  /** Texto del RAP actual (sustituye al programa en el encabezado). */
  rapContextLabel?: string;
  /** Si viene de la clase, el RAP está fijado y no se elige en el formulario. */
  idRapContext?: number;
}

const MaterialApoyoFichaView: React.FC<MaterialApoyoFichaViewProps> = ({
  idFicha,
  idMateria,
  fichaCodigo,
  rapContextLabel,
  idRapContext
}) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    const n = typeof idMateria === 'string' ? parseInt(idMateria, 10) : idMateria;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [idMateria]);

  const filaEdicion = useMemo(
    () => (editandoId ? items.find((i) => i.id === editandoId) ?? null : null),
    [items, editandoId]
  );

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
        const id = it.idRap ?? it.rap?.id;
        const label = it.rap?.nombre || it.materiaNombre;
        if (id && label) map.set(id, label);
      });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [items, competenciaSel]);

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
          it.materiaNombre,
          it.competenciaNombre,
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

  useEffect(() => {
    setPagina((p) => Math.min(Math.max(1, p), totalPaginas));
  }, [itemsFiltrados.length, totalPaginas]);

  useEffect(() => {
    if (idRapContext && idRapContext > 0) {
      setIdRap(idRapContext);
    }
  }, [idRapContext]);

  const cargar = useCallback(async () => {
    if (!idFicha) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<MaterialApoyoFichaItem[]>(`fichas/${idFicha}/materiales-apoyo`);
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar la biblioteca de conocimiento del programa.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha]);

  const cargarRaps = useCallback(async () => {
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
  }, [idFicha, idMateriaNum, idRapContext]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarRaps();
  }, [cargarRaps]);

  useEffect(() => {
    setPagina(1);
  }, [idFicha, search, competenciaSel, rapFiltroSel]);

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
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setTipoMaterial('');
    setLink('');
    setIdRap(idRapContext ?? raps[0]?.id ?? '');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
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
    setIdRap(idRapContext ?? (row.idRap || row.rap?.id || ''));
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setModo('formulario');
  };

  const cancelarForm = () => {
    setModo('lista');
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setTipoMaterial('');
    setLink('');
    setIdRap(idRapContext ?? raps[0]?.id ?? '');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setVideoFile(null);
    setQuitarVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMateriaNum) {
      showToast('No se identificó la materia de la clase. No se puede guardar el material.', 'error');
      return;
    }
    if (!titulo.trim()) {
      showToast('El título es obligatorio.', 'error');
      return;
    }
    const idRapEnvio = idRapContext ?? idRap;
    if (!idRapEnvio) {
      showToast('Debe seleccionar el RAP del material de apoyo.', 'error');
      return;
    }
    if (
      !editandoId &&
      !documentoFile &&
      !link.trim() &&
      !videoFile
    ) {
      showToast('Ingrese al menos un recurso: documento, enlace o video (archivo).', 'error');
      return;
    }
    if (documentoFile) {
      const docErr = validateMaterialDocumentoFile(documentoFile);
      if (docErr) {
        showToast(docErr, 'error');
        return;
      }
    }
    if (videoFile) {
      const videoErr = validateVideoFile(videoFile);
      if (videoErr) {
        showToast(videoErr, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('idMateria', String(idMateriaNum));
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

      if (editandoId) {
        await axios.put(`fichas/${idFicha}/materiales-apoyo/${editandoId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`fichas/${idFicha}/materiales-apoyo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await cargar();
      cancelarForm();
      showToast(editandoId ? 'Material actualizado correctamente.' : 'Material creado correctamente.', 'success');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]>; error?: string } } };
      const errs = ax.response?.data?.errors;
      const msg = errs
        ? Object.values(errs)
            .flat()
            .join('\n')
        : ax.response?.data?.error || 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (row: MaterialApoyoFichaItem) => {
    if (!puedeMutarMaterial(row)) {
      showToast('No tienes permiso para eliminar este recurso.', 'error');
      return;
    }
    if (!window.confirm('¿Eliminar este recurso de la biblioteca de conocimiento?')) return;
    try {
      await axios.delete(`fichas/${idFicha}/materiales-apoyo/${row.id}`);
      await cargar();
      showToast('Material eliminado correctamente.', 'success');
    } catch {
      showToast('No se pudo eliminar el material.', 'error');
    }
  };

  if (!idMateriaNum) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        No hay materia asociada a esta clase; no se puede gestionar la biblioteca de conocimiento por RAP.
      </div>
    );
  }

  const desde = itemsFiltrados.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, itemsFiltrados.length);

  return (
    <div className="space-y-5">
      <Toast
        isOpen={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-coal-400">
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
        {modo === 'lista' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  styles={selectStylesBiblioteca}
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
                  styles={selectStylesBiblioteca}
                  noOptionsMessage={compactReactSelectNoOptions}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xl">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  className="input w-full dark:bg-[#111827] dark:text-white dark:border-gray-600 dark:placeholder:text-gray-300"
                  placeholder="Buscar por título, descripción, competencia, RAP, materia, instructor o recurso..."
                />
              </div>
              <button type="button" onClick={abrirNuevo} className="btn btn-primary text-sm shrink-0">
                <KeenIcon icon="plus" className="text-sm mr-1.5" />
                Agregar recurso a la biblioteca
              </button>
            </div>
          </div>
        )}
      </div>

      {modo === 'formulario' ? (
        <form onSubmit={enviar} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{editandoId ? 'Editar material' : 'Nuevo material'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Titulo</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Titulo del material"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                data-preserve-case
                required
              />
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Documento</label>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={MATERIAL_DOCUMENTO_ACCEPT}
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
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
                  {documentoFile ? documentoFile.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-200 mt-1">{MATERIAL_DOCUMENTO_FORMATOS_LABEL}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Enlace adicional</label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://ejemplo.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-200 mt-1">
                Puedes usar este campo para páginas web, YouTube, Drive u otros enlaces externos.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Video (archivo)</label>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <input
                ref={videoInputRef}
                type="file"
                accept={VIDEO_ACCEPT}
                onChange={(e) => {
                  setVideoFile(e.target.files?.[0] || null);
                  setQuitarVideo(false);
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
                {videoFile ? videoFile.name : 'Ningún archivo seleccionado'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-200 mt-1">{VIDEO_FORMATOS_LABEL}</p>
          </div>

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
            <button type="button" className="btn btn-light" onClick={cancelarForm}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar material'}</button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-visible">
          <div>
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-white w-[120px]">Recurso</th>
                  <th className="text-left py-2.5 pl-2 pr-2 text-xs font-semibold text-gray-600 dark:text-white min-w-0">Título</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[150px]">Tipo</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[140px]">Creador</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[110px]">RAP</th>
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white min-w-0">Descripción</th>
                  <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[120px]">Acciones</th>
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
                      No hay recursos en la biblioteca de conocimiento para este programa.
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
                    const rapFull = mat.rap?.nombre || 'Sin RAP';
                    const tituloFull = mat.titulo || '-';
                    const descripcionFull = mat.descripcion || '-';
                    const tipoFull = tipoMaterialDisplay(mat.tipoMaterial);
                    const accionesMenuOpen = accionesMenu?.id === mat.id;
                    const tieneAlguno =
                      tieneDocumento(mat) || tieneEnlace(mat) || tieneVideo(mat);
                    const nombreCreador = mat.creador?.nombreCompleto?.trim() || '—';
                    const fotoCreador = getPerfilPublicUrl(mat.creador?.rutaFotoUrl || mat.creador?.rutaFoto);
                    const puedeMutar = puedeMutarMaterial(mat);
                    return (
                      <tr key={mat.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 pl-3 pr-2 text-xs min-w-0 align-middle">
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
                              className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/25 dark:text-blue-200 dark:hover:bg-blue-900/40"
                            >
                              Ver recursos
                            </button>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 pl-2 pr-2 text-sm font-medium text-gray-900 dark:text-white min-w-0">
                          <span className="block w-full truncate" title={tituloFull}>
                            {tituloFull}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                          <span className="block w-full truncate" title={tipoFull}>
                            {tipoFull}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <AvatarListaInstructor src={fotoCreador} nombre={nombreCreador} />
                            <div className="min-w-0 flex-1">
                              <span className="block w-full truncate font-medium" title={nombreCreador}>
                                {nombreCreador}
                              </span>
                              {mat.creador?.email ? (
                                <span className="block w-full truncate text-[10px] text-gray-600 dark:text-gray-200" title={mat.creador.email}>
                                  {mat.creador.email}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                          <span className="block w-full truncate" title={rapFull}>
                            {rapFull}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-600 dark:text-gray-200 min-w-0">
                          <span className="block w-full truncate" title={descripcionFull}>
                            {descripcionFull}
                          </span>
                        </td>
                        <td className="py-3 px-2 w-[120px] text-right min-w-0">
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
                                className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                              >
                                Acciones
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 dark:text-gray-300">Solo lectura</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-200">
            <span>{desde}-{hasta} de {itemsFiltrados.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="btn btn-sm btn-light">Anterior</button>
              <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas} className="btn btn-sm btn-light">Siguiente</button>
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
            const acciones: Array<{ key: string; label: string; href?: string }> = [];

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
            if (videoUrl) {
              acciones.push({ key: 'video', label: 'Ver video', href: videoUrl });
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
                  acciones.map((a) => (
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
                  ))
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
    </div>
  );
};

export default MaterialApoyoFichaView;
