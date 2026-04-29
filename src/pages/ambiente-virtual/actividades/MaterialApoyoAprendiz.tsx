import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';

interface MaterialApoyoAprendizItem {
  id: number;
  titulo: string;
  descripcion?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
  idMateria?: number;
  materiaNombre?: string | null;
  idFicha?: number;
  fichaCodigo?: string | null;
  idRap?: number | null;
  rapNombre?: string | null;
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

const normalizar = (v?: string | null): string => String(v || '').toLowerCase();

export interface MaterialApoyoAprendizProps {
  idFicha?: number;
  idRap?: number;
  emptyMessage?: string;
  hideGroupHeaders?: boolean;
}

const MaterialApoyoAprendiz: React.FC<MaterialApoyoAprendizProps> = ({
  idFicha,
  idRap,
  emptyMessage = 'No hay material de apoyo disponible para este RAP.',
  hideGroupHeaders = false
}) => {
  const [items, setItems] = useState<MaterialApoyoAprendizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
        'No se pudo cargar el material de apoyo.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha, idRap]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hasDoc = Boolean(item.urlDocumentoUrl || item.urlDocumento);
      const hasLink = Boolean(item.urlAdicional);
      const tipoTokens = [
        hasDoc ? 'Documento' : '',
        hasLink ? 'Enlace' : '',
      ].filter(Boolean);

      const haystack = [
        item.titulo,
        item.descripcion,
        item.rapNombre,
        item.materiaNombre,
        ...tipoTokens,
      ]
        .map(normalizar)
        .join(' ');
      return haystack.includes(q);
    });
  }, [items, search]);

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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {list.map((item) => {
        const docUrl = getDocumentUrl(item.urlDocumentoUrl || item.urlDocumento);
        const hasDoc = Boolean(docUrl);
        const hasLink = Boolean(item.urlAdicional);

        const tituloFull = item.titulo || '-';
        const descripcionFull = item.descripcion || 'Sin Descripcion.';
        const rapFull = item.rapNombre || 'Sin RAP';

        return (
          <div
            key={item.id}
            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <h4
                className="text-sm font-semibold text-gray-900 dark:text-white truncate whitespace-nowrap"
                title={tituloFull}
              >
                {tituloFull}
              </h4>
              <p
                className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate whitespace-nowrap"
                title={descripcionFull}
              >
                {descripcionFull}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex rounded-full px-2 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 max-w-full"
                  title={rapFull}
                >
                  RAP:{' '}
                  <span className="inline-block max-w-[240px] truncate whitespace-nowrap align-middle">
                    {rapFull}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              {(hasDoc || hasLink) && (
                <div className="flex flex-wrap items-center justify-end gap-2 text-[11px]">
                  {hasDoc && (
                    <span className="inline-flex rounded-full px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Documento disponible
                    </span>
                  )}
                  {hasLink && (
                    <span className="inline-flex rounded-full px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Enlace externo
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasDoc && (
                  <a
                    href={docUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary text-xs"
                  >
                    Ver documento
                  </a>
                )}
                {hasLink && (
                  <a
                    href={item.urlAdicional!.startsWith('http') ? item.urlAdicional! : `https://${item.urlAdicional}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-light text-xs"
                  >
                    Abrir enlace
                  </a>
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
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:bg-coal-400 dark:border-gray-700">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          className="input w-full"
          placeholder="Buscar material por Titulo, Descripcion o RAP..."
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
          <KeenIcon icon="book-open" className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">{emptyMessage}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
          <KeenIcon icon="magnifier" className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">No se encontraron materiales con ese criterio.</p>
        </div>
      ) : hideGroupHeaders ? (
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-coal-400 dark:border-gray-700">
          {renderRows(filtered)}
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.key} className="rounded-xl border border-gray-200 bg-white dark:bg-coal-400 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
              <span className="inline-flex rounded-full px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs">
                Ficha: {group.fichaCodigo}
              </span>
            </div>
            {renderRows(group.items)}
          </section>
        ))
      )}
    </div>
  );
};

export default MaterialApoyoAprendiz;
