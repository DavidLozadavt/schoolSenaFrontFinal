import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';

export interface MaterialApoyoFichaItem {
  id: number;
  titulo: string;
  descripcion?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
  idMateria?: number;
  idFicha?: number | null;
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
  if (url.startsWith('storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/' + url;
  }
  const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
  return base + '/storage/' + url;
};

const tienePdf = (mat: MaterialApoyoFichaItem): boolean => {
  const d = mat.urlDocumento || mat.urlDocumentoUrl;
  return Boolean(d && String(d).trim());
};

const tieneLink = (mat: MaterialApoyoFichaItem): boolean => Boolean(mat.urlAdicional && String(mat.urlAdicional).trim());

const TipoMaterialBadges: React.FC<{ mat: MaterialApoyoFichaItem }> = ({ mat }) => {
  const pdf = tienePdf(mat);
  const link = tieneLink(mat);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {pdf && (
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          PDF
        </span>
      )}
      {link && (
        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:border-violet-700/60 dark:bg-violet-900/25 dark:text-violet-200">
          Link
        </span>
      )}
      {!pdf && !link && <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>}
    </div>
  );
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
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [link, setLink] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const idMateriaNum = useMemo(() => {
    const n = typeof idMateria === 'string' ? parseInt(idMateria, 10) : idMateria;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [idMateria]);

  const totalPaginas = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const itemsPagina = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, pagina]);

  useEffect(() => {
    setPagina((p) => Math.min(Math.max(1, p), totalPaginas));
  }, [items.length, totalPaginas]);

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
        'No se pudo cargar el material de apoyo de la ficha.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    setPagina(1);
  }, [idFicha]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setTitulo('');
    setDescripcion('');
    setLink('');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModo('formulario');
  };

  const abrirEditar = (row: MaterialApoyoFichaItem) => {
    setEditandoId(row.id);
    setTitulo(row.titulo || '');
    setDescripcion(row.descripcion || '');
    setLink(row.urlAdicional || '');
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
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMateriaNum) {
      alert('No se identificó la materia de la clase. No se puede guardar el material.');
      return;
    }
    if (!titulo.trim()) {
      alert('El título es obligatorio');
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
    if (!window.confirm('¿Eliminar este material de apoyo de la ficha? Si estaba asociado a actividades, también se desvinculará.')) return;
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
        No hay materia asociada a esta clase; no se puede gestionar el material de apoyo general por ficha.
      </div>
    );
  }

  const desde = items.length === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, items.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Material de apoyo</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-gray-200/90 bg-gray-50/80 px-3 py-2.5 dark:border-gray-600 dark:bg-coal-500/25">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Ficha</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fichaCodigo?.trim() || '—'}</p>
            </div>
            <div className="min-w-0 flex-1 sm:max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programa</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{programaNombre?.trim() || '—'}</p>
            </div>
          </div>
        </div>
        {modo === 'lista' && (
          <button type="button" onClick={abrirNuevo} className="btn btn-primary text-sm shrink-0 self-start">
            <KeenIcon icon="plus" className="text-sm mr-1.5" />
            Nuevo material
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
          {error}
        </div>
      )}

      {modo === 'formulario' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400/40 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {editandoId ? 'Editar material' : 'Crear material'}
          </h3>
          <form onSubmit={enviar} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Título</label>
              <input
                type="text"
                className="input w-full p-2 text-sm"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
              <textarea
                className="input w-full p-2 text-sm min-h-[80px] resize-y"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
                maxLength={3000}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Documento PDF</label>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)} />
                <button type="button" className="btn btn-light btn-sm" onClick={() => fileInputRef.current?.click()}>
                  Seleccionar PDF
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {documentoFile ? documentoFile.name : editandoId ? 'Opcional (conservar el actual si no elige archivo)' : 'Obligatorio si no hay enlace'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Enlace (web o YouTube)</label>
              <input type="url" className="input w-full p-2 text-sm" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className="btn btn-primary text-sm" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" className="btn btn-light text-sm" onClick={cancelarForm} disabled={saving}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {modo === 'lista' && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-coal-400/30">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-coal-500/30">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 w-[100px]">Tipo</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 w-[min(28%,220px)]">Título</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Descripción</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 w-[128px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-b-transparent border-primary" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay material de apoyo general para esta ficha. Cree el primero con &quot;Nuevo material&quot;.
                    </td>
                  </tr>
                ) : (
                  itemsPagina.map((mat) => {
                    const docUrl = getDocumentUrl(mat.urlDocumentoUrl || mat.urlDocumento);
                    return (
                      <tr key={mat.id} className="border-b border-gray-100 dark:border-gray-600/80 hover:bg-gray-50/80 dark:hover:bg-coal-500/20 align-top">
                        <td className="py-3 px-3 align-top">
                          <TipoMaterialBadges mat={mat} />
                        </td>
                        <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-white align-top min-w-0">
                          <span className="line-clamp-2">{mat.titulo}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 align-top min-w-0">
                          <div className="line-clamp-3 whitespace-pre-wrap break-words">{mat.descripcion || '—'}</div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {docUrl && (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                                title="Ver PDF"
                              >
                                <KeenIcon icon="eye" className="text-sm" />
                              </a>
                            )}
                            {mat.urlAdicional && (
                              <a
                                href={mat.urlAdicional}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                                title="Abrir enlace"
                              >
                                <KeenIcon icon="share" className="text-sm" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => abrirEditar(mat)}
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                              title="Editar"
                            >
                              <KeenIcon icon="notepad-edit" className="text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminar(mat)}
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600"
                              title="Eliminar"
                            >
                              <KeenIcon icon="trash" className="text-sm" />
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
          {!loading && items.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-coal-500/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                {desde}–{hasta} de {items.length}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="btn btn-sm btn-light disabled:opacity-40"
                >
                  <KeenIcon icon="left" className="text-sm" />
                </button>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 tabular-nums min-w-[4.5rem] text-center">
                  Pág. {pagina} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas}
                  className="btn btn-sm btn-light disabled:opacity-40"
                >
                  <KeenIcon icon="right" className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialApoyoFichaView;
