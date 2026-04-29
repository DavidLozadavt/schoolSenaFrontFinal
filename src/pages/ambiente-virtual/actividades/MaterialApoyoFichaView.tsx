import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { createPortal } from 'react-dom';

export interface MaterialApoyoFichaItem {
  id: number;
  titulo: string;
  descripcion?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
  idMateria?: number;
  idFicha?: number | null;
  idRap?: number | null;
  rap?: {
    id: number;
    nombre: string;
    idCompetencia?: number;
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

const PAGE_SIZE = 20;

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

const resolverRecurso = (mat: MaterialApoyoFichaItem): 'documento' | 'enlace' | 'mixto' | 'ninguno' => {
  const hasDoc = Boolean(mat.urlDocumento || mat.urlDocumentoUrl);
  const hasLink = Boolean(mat.urlAdicional);
  if (hasDoc && hasLink) return 'mixto';
  if (hasDoc) return 'documento';
  if (hasLink) return 'enlace';
  return 'ninguno';
};

export interface MaterialApoyoFichaViewProps {
  idFicha: number;
  idMateria: string | number;
  fichaCodigo?: string;
  programaNombre?: string;
}

const MaterialApoyoFichaView: React.FC<MaterialApoyoFichaViewProps> = ({ idFicha, idMateria, fichaCodigo, programaNombre }) => {
  const [items, setItems] = useState<MaterialApoyoFichaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<'lista' | 'formulario'>('lista');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [link, setLink] = useState('');
  const [idRap, setIdRap] = useState<number | ''>('');
  const [raps, setRaps] = useState<RapOption[]>([]);
  const [loadingRaps, setLoadingRaps] = useState(false);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const abrirMenuAcciones = (id: number, button: HTMLButtonElement) => {
    const menuWidth = 190;
    const menuHeight = 190;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setMenuState({ id, top, left });
  };

  const idMateriaNum = useMemo(() => {
    const n = typeof idMateria === 'string' ? parseInt(idMateria, 10) : idMateria;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [idMateria]);

  const itemsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const tipo = resolverRecurso(it);
      const recursosTokens = [
        tipo === 'documento' || tipo === 'mixto' ? 'Documento' : '',
        tipo === 'enlace' || tipo === 'mixto' ? 'Enlace' : '',
      ].filter(Boolean);

      const texto = [it.titulo, it.descripcion, it.rap?.nombre, ...recursosTokens]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return texto.includes(q);
    });
  }, [items, search]);

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE));
  const itemsPagina = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return itemsFiltrados.slice(start, start + PAGE_SIZE);
  }, [itemsFiltrados, pagina]);

  const rapSeleccionadoNombre = useMemo(() => {
    if (typeof idRap !== 'number') return '';
    return raps.find((r) => r.id === idRap)?.nombre || '';
  }, [idRap, raps]);

  useEffect(() => {
    setPagina((p) => Math.min(Math.max(1, p), totalPaginas));
  }, [itemsFiltrados.length, totalPaginas]);

  const cargar = useCallback(async () => {
    if (!idFicha) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<MaterialApoyoFichaItem[]>(`fichas/${idFicha}/materiales-apoyo`, {
        params: idMateriaNum ? { idMateria: idMateriaNum } : undefined
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar el material de apoyo de la ficha.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha, idMateriaNum]);

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
        if (prev && options.some((r) => r.id === prev)) return prev;
        return options[0]?.id ?? '';
      });
    } catch {
      setRaps([]);
      setIdRap('');
    } finally {
      setLoadingRaps(false);
    }
  }, [idFicha, idMateriaNum]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarRaps();
  }, [cargarRaps]);

  useEffect(() => {
    setPagina(1);
  }, [idFicha, search]);

  useEffect(() => {
    if (!menuState) return;
    const onWindowChange = () => setMenuState(null);
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-id="material-apoyo-menu"]')) return;
      if (target.closest('[data-id="material-apoyo-menu-btn"]')) return;
      setMenuState(null);
    };
    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [menuState]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setLink('');
    setIdRap(raps[0]?.id ?? '');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModo('formulario');
  };

  const abrirEditar = (row: MaterialApoyoFichaItem) => {
    setEditandoId(row.id);
    setTitulo(row.titulo || '');
    setDescripcion(row.descripcion || '');
    setLink(row.urlAdicional || '');
    setIdRap(row.idRap || row.rap?.id || '');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModo('formulario');
  };

  const cancelarForm = () => {
    setModo('lista');
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setLink('');
    setIdRap(raps[0]?.id ?? '');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMateriaNum) {
      alert('No se identifico la materia de la clase. No se puede guardar el material.');
      return;
    }
    if (!titulo.trim()) {
      alert('El titulo es obligatorio');
      return;
    }
    if (!idRap) {
      alert('Debe seleccionar el RAP del material de apoyo.');
      return;
    }
    if (!editandoId && !documentoFile && !link.trim()) {
      alert('Ingrese un documento PDF o un enlace');
      return;
    }
    if (documentoFile && !documentoFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se permiten archivos PDF');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('idMateria', String(idMateriaNum));
      fd.append('idRap', String(idRap));
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim().slice(0, 3000));
      if (documentoFile) fd.append('documento', documentoFile);
      if (link.trim()) fd.append('urlAdicional', link.trim());

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
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]>; error?: string } } };
      const errs = ax.response?.data?.errors;
      const msg = errs
        ? Object.values(errs)
            .flat()
            .join('\n')
        : ax.response?.data?.error || 'Error al guardar';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (row: MaterialApoyoFichaItem) => {
    if (!window.confirm('Eliminar este material de apoyo?')) return;
    try {
      await axios.delete(`fichas/${idFicha}/materiales-apoyo/${row.id}`);
      await cargar();
    } catch {
      alert('No se pudo eliminar el material');
    }
  };

  if (!idMateriaNum) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        No hay materia asociada a esta clase; no se puede gestionar el material de apoyo por RAP.
      </div>
    );
  }

  const desde = itemsFiltrados.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, itemsFiltrados.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-coal-400">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Material de apoyo</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-gray-200/90 bg-gray-50/80 px-3 py-2.5 dark:border-gray-600 dark:bg-coal-500/25">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ficha</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fichaCodigo?.trim() || '-'}</p>
            </div>
            <div className="min-w-0 flex-1 sm:max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programa</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{programaNombre?.trim() || '-'}</p>
            </div>
          </div>
        </div>
        {modo === 'lista' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xl">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                className="input w-full"
                placeholder="Buscar material por Titulo, Descripcion o RAP..."
              />
            </div>
            <button type="button" onClick={abrirNuevo} className="btn btn-primary text-sm shrink-0">
              <KeenIcon icon="plus" className="text-sm mr-1.5" />
              Agregar material de apoyo
            </button>
          </div>
        )}
      </div>

      {modo === 'formulario' ? (
        <form onSubmit={enviar} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{editandoId ? 'Editar material' : 'Nuevo material'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Titulo</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Titulo del material"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">RAP</label>
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
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripcion</label>
            <textarea
              className="textarea w-full min-h-[110px]"
              placeholder="Descripcion del material"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
              maxLength={3000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Documento PDF</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Enlace adicional</label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://ejemplo.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>

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
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 w-[120px]">Recurso</th>
                  <th className="text-left py-2.5 pl-7 pr-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Titulo</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">RAP</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Descripcion</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 w-[140px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay material de apoyo disponible para este RAP.
                    </td>
                  </tr>
                ) : itemsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron materiales con ese criterio.
                    </td>
                  </tr>
                ) : (
                  itemsPagina.map((mat) => {
                    const tipo = resolverRecurso(mat);
                    const docUrl = getDocumentUrl(mat.urlDocumentoUrl || mat.urlDocumento);
                    const linkUrl = mat.urlAdicional?.startsWith('http') ? mat.urlAdicional : mat.urlAdicional ? `https://${mat.urlAdicional}` : null;
                    const rapFull = mat.rap?.nombre || 'Sin RAP';
                    const tituloFull = mat.titulo || '-';
                    const descripcionFull = mat.descripcion || '-';
                    const menuOpen = menuState?.id === mat.id;
                    return (
                      <tr key={mat.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-3 pl-3 pr-6 text-xs min-w-0">
                          <div className="flex items-center gap-1 flex-nowrap">
                            {(tipo === 'documento' || tipo === 'mixto') && (
                              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                Documento
                              </span>
                            )}
                            {(tipo === 'enlace' || tipo === 'mixto') && (
                              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
                                Enlace
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pl-7 pr-3 text-sm font-medium text-gray-900 dark:text-white min-w-0">
                          <span className="block w-full truncate" title={tituloFull}>
                            {tituloFull}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-700 dark:text-gray-200 min-w-0">
                          <span className="block w-full truncate whitespace-nowrap" title={rapFull}>
                            {rapFull}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300 min-w-0">
                          <span className="block w-full truncate whitespace-nowrap" title={descripcionFull}>
                            {descripcionFull}
                          </span>
                        </td>
                        <td className="py-3 px-3 w-[140px] text-right min-w-0">
                          <div className="relative inline-block">
                            <button
                              data-id="material-apoyo-menu-btn"
                              type="button"
                              onClick={(e) => {
                                if (menuOpen) {
                                  setMenuState(null);
                                  return;
                                }
                                abrirMenuAcciones(mat.id, e.currentTarget);
                              }}
                              className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            >
                              VER ACCIONES
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span>{desde}-{hasta} de {itemsFiltrados.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="btn btn-sm btn-light">Anterior</button>
              <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas} className="btn btn-sm btn-light">Siguiente</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-600 dark:text-red-300">{error}</div>}

      {menuState &&
        createPortal(
          (() => {
            const active = items.find((mat) => mat.id === menuState.id);
            if (!active) return null;
            const docUrl = getDocumentUrl(active.urlDocumentoUrl || active.urlDocumento);
            const linkUrl = active.urlAdicional?.startsWith('http')
              ? active.urlAdicional
              : active.urlAdicional
                ? `https://${active.urlAdicional}`
                : null;
            return (
              <div
                data-id="material-apoyo-menu"
                className="fixed z-[9999] min-w-[190px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1"
                style={{ top: menuState.top, left: menuState.left }}
              >
                <button
                  type="button"
                  onClick={() => {
                    abrirEditar(active);
                    setMenuState(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                >
                  Editar material
                </button>
                {docUrl && (
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuState(null)}
                    className="block px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                  >
                    Abrir documento
                  </a>
                )}
                {linkUrl && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuState(null)}
                    className="block px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                  >
                    Abrir enlace
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void eliminar(active);
                    setMenuState(null);
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
