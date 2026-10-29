import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeenIcon, Toast } from '@/components';
import { MisActividadesAvatarFallback } from '@/components/user/MisActividadesAvatarFallback';
import { tipoMaterialDisplay } from '@/pages/ambiente-virtual/actividades/tipoMaterialApoyo';
import ModalSubirMaterialCompetencia from './ModalSubirMaterialCompetencia';
import ModalIncorporarMaterialCompetencia from './ModalIncorporarMaterialCompetencia';
import ModalMoverMaterialCompetencia from './ModalMoverMaterialCompetencia';
import MaterialVideoPlayerModal from './MaterialVideoPlayerModal';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { CompetenciaAccesible, MaterialCompetenciaItem, MaterialCompetenciaRecursoItem } from './materialCompetencia.types';
import {
  accionRecurso,
  etiquetaTipoRecurso,
  nombreRecurso,
  recursosPorTipo,
  tieneDocumentoMaterial,
  tieneEnlaceMaterial,
  tieneVideoMaterial,
} from './materialCompetenciaRecurso';

interface MaterialCompetenciaViewProps {
  competencia: CompetenciaAccesible;
  puedeAdministrar: boolean;
}

interface MenuState {
  id: number;
  top: number;
  left: number;
}

const PAGE_SIZE = 20;

const getPerfilPublicUrl = (path?: string | null): string | null => {
  if (!path || !String(path).trim()) return null;
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return p;
};

const formatearFecha = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const MaterialCompetenciaView: React.FC<MaterialCompetenciaViewProps> = ({ competencia, puedeAdministrar }) => {
  const [items, setItems] = useState<MaterialCompetenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [subirOpen, setSubirOpen] = useState(false);
  const [materialEditar, setMaterialEditar] = useState<MaterialCompetenciaItem | null>(null);
  const [incorporarOpen, setIncorporarOpen] = useState(false);
  const [materialMover, setMaterialMover] = useState<MaterialCompetenciaItem | null>(null);
  const [recursosMenu, setRecursosMenu] = useState<MenuState | null>(null);
  const [reproduciendo, setReproduciendo] = useState<{
    material: MaterialCompetenciaItem;
    recurso: MaterialCompetenciaRecursoItem;
  } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const cargar = useCallback(async (idCompetencia: number) => {
    setLoading(true);
    setError(null);
    try {
      return {
        idCompetencia,
        items: await materialCompetenciaService.listarMateriales(idCompetencia),
        error: null as string | null,
      };
    } catch (err) {
      return {
        idCompetencia,
        items: [] as MaterialCompetenciaItem[],
        error: materialCompetenciaService.errorMessage(err, 'No se pudo cargar el material de la competencia.'),
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const idActual = competencia.id;
    setSearch('');
    setPagina(1);
    setItems([]);
    setLoading(true);
    setError(null);
    (async () => {
      const result = await cargar(idActual);
      if (cancelled || result.idCompetencia !== idActual) return;
      setItems(result.items);
      setError(result.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [cargar, competencia.id]);

  const itemsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [
        it.titulo,
        it.descripcion,
        it.origenLabel,
        it.tipoMaterial,
        it.actividadOrigen?.titulo,
        it.rapOrigen?.nombre,
        it.creador?.nombreCompleto,
        tipoMaterialDisplay(it.tipoMaterial),
        etiquetaTipoRecurso(it),
        ...(it.recursos || []).map((r) => `${r.titulo || ''} ${r.nombre || ''} ${r.urlExterna || ''}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE));
  const paginaSafe = Math.min(pagina, totalPaginas);
  const itemsPagina = itemsFiltrados.slice((paginaSafe - 1) * PAGE_SIZE, paginaSafe * PAGE_SIZE);
  const desde = itemsFiltrados.length === 0 ? 0 : (paginaSafe - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(paginaSafe * PAGE_SIZE, itemsFiltrados.length);

  const abrirMenuRecursos = (id: number, button: HTMLButtonElement) => {
    const menuWidth = 240;
    const menuHeight = 220;
    const rect = button.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abreArriba = espacioAbajo < menuHeight && rect.top > menuHeight;
    const top = abreArriba ? Math.max(8, rect.top - menuHeight - 6) : Math.max(8, rect.bottom + 6);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setRecursosMenu({ id, top, left });
  };

  useEffect(() => {
    if (!recursosMenu) return;
    const onWindowChange = () => setRecursosMenu(null);
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('[data-id="material-competencia-recursos-menu"]')) return;
      if (target.closest('[data-id="material-competencia-recursos-btn"]')) return;
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

  const manejarRecurso = async (
    item: MaterialCompetenciaItem,
    inline: boolean,
    recurso?: MaterialCompetenciaRecursoItem
  ) => {
    setRecursosMenu(null);
    const naturaleza = recurso?.naturaleza;
    if (recurso && (naturaleza === 'video' || naturaleza === 'audio' || naturaleza === 'youtube')) {
      setReproduciendo({ material: item, recurso });
      return;
    }
    if (recurso && naturaleza === 'pdf_externo') {
      setReproduciendo({ material: item, recurso });
      return;
    }
    if (recurso && naturaleza === 'enlace') {
      const href = recurso.urlExterna || recurso.url;
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await materialCompetenciaService.descargarOPrevisualizar(item, competencia.id, inline, recurso);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Descarga o previsualización no disponible.', 'error');
    }
  };

  const desvincular = async (item: MaterialCompetenciaItem) => {
    if (!item.puedeDesvincular) return;
    if (
      !window.confirm(
        '¿Desvincular este material de la competencia? El archivo original de la actividad, si existe, no se eliminará.'
      )
    ) {
      return;
    }
    try {
      await materialCompetenciaService.desvincular(competencia.id, item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      showToast('Material desvinculado de la competencia.');
    } catch (err) {
      showToast(materialCompetenciaService.errorMessage(err, 'No se pudo desvincular el material.'), 'error');
    }
  };

  const competenciaNombre = competencia.nombreMateria;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-5 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
            Material de apoyo
          </p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white break-words leading-snug">
            {competenciaNombre}
          </h2>
          {competencia.totalRaps ? (
            <p className="text-xs text-gray-600 dark:text-gray-200 mt-0.5">
              {competencia.totalRaps} RAP asociados
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            className="input w-full sm:max-w-xl dark:bg-[#111827] dark:text-white dark:border-gray-600"
            placeholder="Buscar documentos por nombre, origen, actividad o instructor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagina(1);
            }}
          />
          {puedeAdministrar ? (
            <div className="flex flex-wrap gap-2 shrink-0">
              <button type="button" className="btn btn-light text-sm" onClick={() => setIncorporarOpen(true)}>
                <KeenIcon icon="document" className="text-sm mr-1.5" />
                Agregar material existente
              </button>
              <button
                type="button"
                className="btn btn-primary text-sm"
                onClick={() => {
                  setMaterialEditar(null);
                  setSubirOpen(true);
                }}
              >
                <KeenIcon icon="plus" className="text-sm mr-1.5" />
                Agregar material
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[31%]" />
              <col className="w-[17%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2.5 pl-3 pr-2 text-xs font-semibold text-gray-600 dark:text-white whitespace-nowrap">Recurso</th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white">Título</th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white">Origen</th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white">Actividad</th>
                <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-600 dark:text-white">Incorporado por</th>
                <th className="text-right py-2.5 pl-2 pr-5 text-xs font-semibold text-gray-600 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">Cargando materiales...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-red-600 dark:text-red-300">{error}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-600 dark:text-gray-200">
                  Esta competencia aún no tiene material asociado.
                </td>
              </tr>
            ) : itemsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-600 dark:text-gray-200">
                  No se encontraron materiales con ese criterio.
                </td>
              </tr>
            ) : (
              itemsPagina.map((mat) => {
                const tituloFull = mat.titulo || '—';
                const origenFull = mat.origenLabel || mat.origen;
                const actividadFull = mat.actividadOrigen?.titulo || '—';
                const nombreCreador = mat.creador?.nombreCompleto?.trim() || '—';
                const fotoCreador = getPerfilPublicUrl(mat.creador?.rutaFotoUrl || mat.creador?.rutaFoto);
                const tieneRecurso =
                  tieneDocumentoMaterial(mat) || tieneEnlaceMaterial(mat) || tieneVideoMaterial(mat);
                const rapOrigenFull = mat.rapOrigen?.nombre
                  ? `${mat.rapOrigen.codigo ? `${mat.rapOrigen.codigo} · ` : ''}${mat.rapOrigen.nombre}`
                  : '';
                return (
                  <tr
                    key={mat.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 pl-3 pr-2 text-xs align-middle">
                      {tieneRecurso ? (
                        <button
                          data-id="material-competencia-recursos-btn"
                          type="button"
                          onClick={(e) => {
                            if (recursosMenu?.id === mat.id) {
                              setRecursosMenu(null);
                              return;
                            }
                            abrirMenuRecursos(mat.id, e.currentTarget);
                          }}
                          className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-primary/40 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/25"
                        >
                          Ver recursos
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white min-w-0">
                      <span className="block line-clamp-2 break-words" title={tituloFull}>
                        {tituloFull}
                      </span>
                      <span className="block truncate text-[10px] text-gray-500 dark:text-gray-300" title={etiquetaTipoRecurso(mat)}>
                        {etiquetaTipoRecurso(mat)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                      <span className="block line-clamp-2 break-words" title={origenFull}>
                        {origenFull}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                      <span className="block line-clamp-2 break-words" title={actividadFull}>
                        {actividadFull}
                      </span>
                      {mat.rapOrigen?.nombre ? (
                        <span className="block truncate text-[10px] text-gray-500 dark:text-gray-300" title={rapOrigenFull}>
                          {rapOrigenFull}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-gray-500 dark:text-gray-300">{formatearFecha(mat.created_at)}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {fotoCreador ? (
                          <img src={fotoCreador} alt="" className="w-8 h-8 rounded-full object-cover border border-primary/40 shrink-0" />
                        ) : (
                          <MisActividadesAvatarFallback variant="sm" />
                        )}
                        <span className="block truncate" title={nombreCreador}>
                          {nombreCreador}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pl-2 pr-5 text-right align-middle">
                      <div className="flex flex-col items-end gap-1">
                        {mat.puedeDesvincular && mat.origen === 'DIRECTO' ? (
                          <button
                            type="button"
                            className="text-[10px] font-bold uppercase tracking-wide text-primary hover:underline"
                            onClick={() => {
                              setMaterialEditar(mat);
                              setSubirOpen(true);
                            }}
                          >
                            Editar
                          </button>
                        ) : null}
                        {mat.puedeDesvincular ? (
                          <button
                            type="button"
                            className="text-[10px] font-bold uppercase tracking-wide text-primary hover:underline"
                            onClick={() => setMaterialMover(mat)}
                          >
                            Mover
                          </button>
                        ) : null}
                        {mat.puedeDesvincular ? (
                          <button
                            type="button"
                            className="text-[10px] font-bold uppercase tracking-wide text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                            onClick={() => void desvincular(mat)}
                          >
                            Desvincular
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500 dark:text-gray-300">Solo lectura</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pl-3 pr-5 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-200">
          <span>
            {desde}-{hasta} de {itemsFiltrados.length}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-sm btn-light" disabled={paginaSafe <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))}>
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              disabled={paginaSafe >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {recursosMenu &&
        createPortal(
          (() => {
            const active = items.find((mat) => mat.id === recursosMenu.id);
            if (!active) return null;
            const lista = recursosPorTipo(active).todos;
            return (
              <div
                data-id="material-competencia-recursos-menu"
                className="fixed z-[9999] min-w-[240px] max-w-[min(100vw-1rem,22rem)] max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 shadow-xl p-1"
                style={{ top: recursosMenu.top, left: recursosMenu.left }}
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200 border-b border-gray-100 dark:border-gray-600">
                  Recursos disponibles
                </p>
                {lista.map((rec, i) => (
                  <button
                    key={rec.id ?? `rec-${i}`}
                    type="button"
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-coal-400 rounded"
                    onClick={() => void manejarRecurso(active, true, rec)}
                  >
                    <span className="block truncate">{nombreRecurso(rec)}</span>
                    <span className="block text-[11px] text-gray-500">{accionRecurso(rec)}</span>
                  </button>
                ))}
                {active.actividadOrigen?.titulo ? (
                  <div className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-300 border-t border-gray-100 dark:border-gray-600">
                    Origen: {active.actividadOrigen.titulo}
                  </div>
                ) : null}
                {lista.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-200">Sin recursos disponibles</div>
                ) : null}
              </div>
            );
          })(),
          document.body
        )}

      {puedeAdministrar ? (
        <>
          <ModalSubirMaterialCompetencia
            open={subirOpen}
            idCompetencia={competencia.id}
            competenciaNombre={competenciaNombre}
            material={materialEditar}
            onClose={() => {
              setSubirOpen(false);
              setMaterialEditar(null);
            }}
            onSuccess={(msg, saved) => {
              showToast(msg);
              if (saved) {
                setItems((prev) => {
                  const idx = prev.findIndex((row) => row.id === saved.id);
                  if (idx === -1) return [saved, ...prev];
                  const next = [...prev];
                  next[idx] = saved;
                  return next;
                });
              }
              void cargar(competencia.id).then((result) => {
                setItems(result.items);
                setError(result.error);
                setLoading(false);
              });
            }}
            onError={(msg) => showToast(msg, 'error')}
          />
          <ModalIncorporarMaterialCompetencia
            open={incorporarOpen}
            idCompetencia={competencia.id}
            competenciaNombre={competenciaNombre}
            onClose={() => setIncorporarOpen(false)}
            onSuccess={(msg) => {
              showToast(msg);
              void cargar(competencia.id).then((result) => {
                setItems(result.items);
                setError(result.error);
                setLoading(false);
              });
            }}
            onError={(msg) => showToast(msg, 'error')}
          />
          <ModalMoverMaterialCompetencia
            open={Boolean(materialMover)}
            material={materialMover}
            competenciaActual={competencia}
            onClose={() => setMaterialMover(null)}
            onSuccess={(msg) => {
              const idMovido = materialMover?.id;
              setMaterialMover(null);
              if (idMovido != null) {
                setItems((prev) => prev.filter((row) => row.id !== idMovido));
              }
              showToast(msg);
            }}
            onError={(msg) => showToast(msg, 'error')}
          />
        </>
      ) : null}

      <MaterialVideoPlayerModal
        open={Boolean(reproduciendo)}
        titulo={reproduciendo?.material.titulo}
        urlVideo={reproduciendo?.recurso.urlExterna || reproduciendo?.recurso.url}
        urlVideoUrl={reproduciendo?.recurso.url}
        recurso={reproduciendo?.recurso}
        onClose={() => setReproduciendo(null)}
      />

      <Toast isOpen={toastOpen} message={toastMessage} type={toastType} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default MaterialCompetenciaView;
