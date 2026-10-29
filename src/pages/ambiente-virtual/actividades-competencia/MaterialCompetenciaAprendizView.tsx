import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Collapse } from '@mui/material';
import { DefaultTooltip, KeenIcon, Toast } from '@/components';
import { tipoMaterialDisplay } from '@/pages/ambiente-virtual/actividades/tipoMaterialApoyo';
import {
  materialDocumentoBadgeClass,
  materialDocumentoKeenIcon,
} from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import MaterialVideoPlayerModal from './MaterialVideoPlayerModal';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { MaterialCompetenciaItem, MaterialCompetenciaRecursoItem } from './materialCompetencia.types';
import {
  etiquetaTipoRecurso,
  nombreRecurso,
  recursosPorTipo,
} from './materialCompetenciaRecurso';

interface GrupoCompetencia {
  idCompetencia: number;
  codigo?: string | null;
  nombre: string;
  items: MaterialCompetenciaItem[];
}

const PAGE_SIZE = 20;
const COLLAPSE_MS = 220;

const ACENTOS_COMPETENCIA = [
  {
    wrap: 'border-sky-100 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/25',
    hover: 'hover:bg-sky-100/70 dark:hover:bg-sky-900/25',
    icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-200',
    label: 'text-sky-600 dark:text-sky-300',
    badge: 'bg-sky-100/90 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
  },
  {
    wrap: 'border-violet-100 bg-violet-50/80 dark:border-violet-900/40 dark:bg-violet-950/25',
    hover: 'hover:bg-violet-100/70 dark:hover:bg-violet-900/25',
    icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-200',
    label: 'text-violet-600 dark:text-violet-300',
    badge: 'bg-violet-100/90 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  },
  {
    wrap: 'border-amber-100 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20',
    hover: 'hover:bg-amber-100/70 dark:hover:bg-amber-900/25',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-200',
    label: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
] as const;

const TOOLTIP_TEXTO_LARGO =
  '!text-white !rounded-md !text-xs !font-normal !bg-[--tw-tooltip-background-color] !box-shadow[--tw-tooltip-box-shadow] !border[--tw-tooltip-border] !px-2.5 !py-1.5 !max-w-[min(100vw-1.5rem,22rem)] !whitespace-normal !leading-snug !text-left';

const botonOutline =
  'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-primary/40 bg-white text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-transparent dark:border-primary/50 dark:text-primary dark:hover:bg-primary/15';

const botonPlay =
  'inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500';

const contarRecursos = (item: MaterialCompetenciaItem) => {
  const { documentos, multimedia, enlaces } = recursosPorTipo(item);
  return {
    documentos: documentos.length,
    videos: multimedia.filter((r) => r.naturaleza !== 'audio').length,
    audios: multimedia.filter((r) => r.naturaleza === 'audio').length,
    enlaces: enlaces.length,
  };
};

const iconoDocumentoSeguro = (formato?: string | null): string => {
  const icono = materialDocumentoKeenIcon(String(formato || ''));
  return icono === 'file-pdf' ? 'files' : icono;
};

const iconoRecurso = (recurso: MaterialCompetenciaRecursoItem): string => {
  switch (recurso.naturaleza) {
    case 'video':
      return 'to-right';
    case 'audio':
      return 'speaker';
    case 'youtube':
      return 'youtube';
    case 'pdf_externo':
      return 'files';
    case 'documento':
      return iconoDocumentoSeguro(recurso.formato);
    default:
      return 'exit-right-corner';
  }
};

const etiquetaBadge = (recurso: MaterialCompetenciaRecursoItem): string => {
  if (recurso.naturaleza === 'video') return 'VIDEO';
  if (recurso.naturaleza === 'audio') return 'AUDIO';
  if (recurso.naturaleza === 'youtube') return 'YOUTUBE';
  if (recurso.naturaleza === 'pdf_externo') return 'PDF';
  if (recurso.naturaleza === 'documento') return String(recurso.formato || 'DOC').toUpperCase();
  if (recurso.formato === 'pdf_externo') return 'PDF';
  if (recurso.formato === 'youtube') return 'YOUTUBE';
  return 'PÁGINA EXTERNA';
};

const claseBadge = (recurso: MaterialCompetenciaRecursoItem): string => {
  if (recurso.naturaleza === 'video') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200';
  }
  if (recurso.naturaleza === 'audio') {
    return 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200';
  }
  if (recurso.naturaleza === 'youtube') {
    return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-200';
  }
  if (recurso.naturaleza === 'pdf_externo' || String(recurso.formato).toLowerCase() === 'pdf') {
    return materialDocumentoBadgeClass('pdf');
  }
  if (recurso.naturaleza === 'documento') {
    return materialDocumentoBadgeClass(String(recurso.formato || ''));
  }
  return 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200';
};

const etiquetaAccion = (recurso: MaterialCompetenciaRecursoItem): string => {
  switch (recurso.naturaleza) {
    case 'video':
    case 'youtube':
      return 'Reproducir';
    case 'audio':
      return 'Escuchar';
    case 'pdf_externo':
      return 'Ver PDF';
    case 'documento':
      return 'Ver';
    default:
      return 'Abrir enlace';
  }
};

const iconoAccion = (recurso: MaterialCompetenciaRecursoItem): string => {
  switch (recurso.naturaleza) {
    case 'video':
    case 'youtube':
    case 'audio':
      return 'to-right';
    case 'documento':
    case 'pdf_externo':
      return 'eye';
    default:
      return 'exit-right-corner';
  }
};

const metadataRecurso = (
  recurso: MaterialCompetenciaRecursoItem,
  material: MaterialCompetenciaItem
): string => {
  const formato = String(recurso.formato || '').toUpperCase();
  if (recurso.naturaleza === 'documento') {
    const tipo = tipoMaterialDisplay(material.tipoMaterial);
    return [formato || 'DOC', tipo].filter(Boolean).join(' · ');
  }
  if (recurso.naturaleza === 'video') {
    return [formato || 'MP4', 'Video'].filter(Boolean).join(' · ');
  }
  if (recurso.naturaleza === 'audio') {
    return [formato || 'MP3', 'Audio'].filter(Boolean).join(' · ');
  }
  return '';
};

const urlRecurso = (recurso: MaterialCompetenciaRecursoItem): string =>
  (recurso.urlExterna || recurso.youtubeWatchUrl || recurso.url || '').trim();

const toggleId = (set: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) => {
  set((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const TextoTruncado: React.FC<{ texto: string; className?: string; lineas?: 1 | 2 }> = ({
  texto,
  className,
  lineas = 1,
}) => {
  const valor = texto && String(texto).trim() ? String(texto).trim() : '—';
  return (
    <DefaultTooltip
      title={valor}
      placement="top"
      disableHoverListener={valor === '—'}
      classes={{ tooltip: TOOLTIP_TEXTO_LARGO }}
      enterDelay={250}
      leaveDelay={0}
    >
      <span
        className={`min-w-0 max-w-full ${lineas === 2 ? 'line-clamp-2 break-words' : 'block truncate'} ${className ?? ''}`}
      >
        {valor}
      </span>
    </DefaultTooltip>
  );
};

const ChipRecurso: React.FC<{ icono: string; texto: string; clase: string }> = ({ icono, texto, clase }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${clase}`}>
    <KeenIcon icon={icono} className="text-[10px]" />
    {texto}
  </span>
);

const ChipsResumen: React.FC<{ item: MaterialCompetenciaItem; className?: string }> = ({
  item,
  className,
}) => {
  const c = contarRecursos(item);
  if (!c.documentos && !c.videos && !c.audios && !c.enlaces) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? 'mt-2'}`}>
      {c.documentos ? (
        <ChipRecurso
          icono="document"
          texto={c.documentos === 1 ? '1 documento' : `${c.documentos} documentos`}
          clase="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
        />
      ) : null}
      {c.videos ? (
        <ChipRecurso
          icono="to-right"
          texto={c.videos === 1 ? '1 video' : `${c.videos} videos`}
          clase="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
        />
      ) : null}
      {c.audios ? (
        <ChipRecurso
          icono="speaker"
          texto={c.audios === 1 ? '1 audio' : `${c.audios} audios`}
          clase="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200"
        />
      ) : null}
      {c.enlaces ? (
        <ChipRecurso
          icono="exit-right-corner"
          texto={c.enlaces === 1 ? '1 enlace' : `${c.enlaces} enlaces`}
          clase="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
        />
      ) : null}
    </div>
  );
};

const MaterialCompetenciaAprendizView: React.FC = () => {
  const [items, setItems] = useState<MaterialCompetenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [competenciasAbiertas, setCompetenciasAbiertas] = useState<Set<number>>(new Set());
  const [materialesAbiertos, setMaterialesAbiertos] = useState<Set<number>>(new Set());
  const acordeonInicializado = useRef(false);
  const busquedaAnterior = useRef('');
  const [reproduciendo, setReproduciendo] = useState<{
    material: MaterialCompetenciaItem;
    recurso: MaterialCompetenciaRecursoItem;
  } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialCompetenciaService.listarMaterialesAutorizados();
      const vistos = new Set<number>();
      const unicos = data.filter((row) => {
        if (!row?.id || vistos.has(row.id)) return false;
        vistos.add(row.id);
        return true;
      });
      setItems(unicos);
    } catch (err) {
      setItems([]);
      setError(materialCompetenciaService.errorMessage(err, 'No se pudo cargar el material de apoyo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const itemsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const { todos } = recursosPorTipo(it);
      return [
        it.titulo,
        it.descripcion,
        it.origenLabel,
        it.tipoMaterial,
        it.actividadOrigen?.titulo,
        it.rapOrigen?.nombre,
        it.competencia?.nombre,
        it.competenciaNombre,
        it.competencia?.codigo,
        tipoMaterialDisplay(it.tipoMaterial),
        etiquetaTipoRecurso(it),
        ...todos.map((r) => `${nombreRecurso(r)} ${r.formato} ${r.urlExterna}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [items, search]);

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE));
  const paginaSafe = Math.min(pagina, totalPaginas);
  const itemsPagina = useMemo(
    () => itemsFiltrados.slice((paginaSafe - 1) * PAGE_SIZE, paginaSafe * PAGE_SIZE),
    [itemsFiltrados, paginaSafe]
  );
  const desde = itemsFiltrados.length === 0 ? 0 : (paginaSafe - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(paginaSafe * PAGE_SIZE, itemsFiltrados.length);

  const grupos: GrupoCompetencia[] = useMemo(() => {
    const map = new Map<number, GrupoCompetencia>();
    for (const item of itemsPagina) {
      const idCompetencia = Number(item.idCompetencia) || 0;
      if (idCompetencia <= 0) continue;
      const actual = map.get(idCompetencia);
      if (actual) actual.items.push(item);
      else {
        map.set(idCompetencia, {
          idCompetencia,
          codigo: item.competencia?.codigo || null,
          nombre: item.competencia?.nombre || item.competenciaNombre || 'Competencia',
          items: [item],
        });
      }
    }
    return Array.from(map.values());
  }, [itemsPagina]);

  useEffect(() => {
    if (acordeonInicializado.current || items.length === 0) return;
    acordeonInicializado.current = true;
    const primero = items[0];
    if (!primero) return;
    setCompetenciasAbiertas(new Set([primero.idCompetencia]));
    setMaterialesAbiertos(new Set([primero.id]));
  }, [items]);

  useEffect(() => {
    const q = search.trim();
    const previa = busquedaAnterior.current;
    busquedaAnterior.current = q;
    if (!q || q === previa) return;
    setCompetenciasAbiertas((prev) => {
      const next = new Set(prev);
      for (const it of itemsFiltrados) {
        const id = Number(it.idCompetencia);
        if (id > 0) next.add(id);
      }
      return next;
    });
    setMaterialesAbiertos((prev) => {
      const next = new Set(prev);
      for (const it of itemsFiltrados) next.add(it.id);
      return next;
    });
  }, [search, itemsFiltrados]);

  const abrirRecurso = async (material: MaterialCompetenciaItem, recurso: MaterialCompetenciaRecursoItem) => {
    const naturaleza = recurso.naturaleza;
    if (naturaleza === 'video' || naturaleza === 'audio' || naturaleza === 'youtube') {
      setReproduciendo({ material, recurso });
      return;
    }
    if (naturaleza === 'pdf_externo') {
      setReproduciendo({ material, recurso });
      return;
    }
    if (naturaleza === 'enlace') {
      const href = recurso.urlExterna || recurso.url;
      if (!href) {
        setToastMessage('El enlace no está disponible.');
        setToastOpen(true);
        return;
      }
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await materialCompetenciaService.descargarOPrevisualizar(material, material.idCompetencia, true, recurso);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Descarga o previsualización no disponible.');
      setToastOpen(true);
    }
  };

  const descargarRecurso = async (material: MaterialCompetenciaItem, recurso: MaterialCompetenciaRecursoItem) => {
    try {
      await materialCompetenciaService.descargarOPrevisualizar(material, material.idCompetencia, false, recurso);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Descarga no disponible.');
      setToastOpen(true);
    }
  };

  const FilaRecurso: React.FC<{
    material: MaterialCompetenciaItem;
    recurso: MaterialCompetenciaRecursoItem;
    variante: 'documento' | 'multimedia' | 'enlace';
  }> = ({ material, recurso, variante }) => {
    const url = urlRecurso(recurso);
    const meta = metadataRecurso(recurso, material);
    const esYoutube = recurso.naturaleza === 'youtube';
    const esMedia = recurso.naturaleza === 'video' || recurso.naturaleza === 'audio';
    const iconBg = esYoutube
      ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
      : variante === 'multimedia'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
        : variante === 'documento'
          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'
          : 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200';

    return (
      <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 min-w-0">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className={`size-10 shrink-0 rounded-lg flex items-center justify-center ${iconBg}`}>
            <KeenIcon icon={iconoRecurso(recurso)} className="text-base" />
          </div>
          <div className="min-w-0 flex-1">
            <TextoTruncado
              texto={nombreRecurso(recurso)}
              className="text-sm font-medium text-gray-800 dark:text-gray-100"
            />
            {variante === 'enlace' && url ? (
              <TextoTruncado texto={url} className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5" />
            ) : meta ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{meta}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap pl-[3.25rem] sm:pl-0">
          <span
            className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${claseBadge(recurso)}`}
          >
            {etiquetaBadge(recurso)}
          </span>
          <button
            type="button"
            className={esMedia ? botonPlay : botonOutline}
            onClick={() => void abrirRecurso(material, recurso)}
          >
            <KeenIcon icon={iconoAccion(recurso)} className="text-[11px]" />
            {etiquetaAccion(recurso)}
          </button>
          {recurso.naturaleza === 'documento' ? (
            <button type="button" className={botonOutline} onClick={() => void descargarRecurso(material, recurso)}>
              <KeenIcon icon="file-down" className="text-[11px]" />
              Descargar
            </button>
          ) : null}
        </div>
      </li>
    );
  };

  const BloqueRecursos: React.FC<{
    titulo: string;
    cantidad: number;
    variante: 'documento' | 'multimedia' | 'enlace';
    children: React.ReactNode;
  }> = ({ titulo, cantidad, variante, children }) => {
    const estilos =
      variante === 'documento'
        ? {
            wrap: 'border-sky-100 dark:border-sky-900/40',
            head: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
            icon: 'document',
          }
        : variante === 'multimedia'
          ? {
              wrap: 'border-emerald-100 dark:border-emerald-900/40',
              head: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
              icon: 'to-right',
            }
          : {
              wrap: 'border-violet-100 dark:border-violet-900/40',
              head: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-100',
              icon: 'exit-right-corner',
            };

    return (
      <div className={`rounded-lg border overflow-hidden ${estilos.wrap}`}>
        <p className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold ${estilos.head}`}>
          <KeenIcon icon={estilos.icon} className="text-xs" />
          {titulo} ({cantidad})
        </p>
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white/70 dark:bg-coal-500/20">{children}</ul>
      </div>
    );
  };

  const estadoVacio = (icono: string, mensaje: string) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 px-5 py-10 text-center">
      <KeenIcon icon={icono} className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-3" />
      <p className="text-sm text-gray-600 dark:text-gray-200">{mensaje}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="size-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center dark:bg-primary/20">
            <KeenIcon icon="book-open" className="text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">Material de Apoyo</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
              Aquí encontrarás documentos, videos, audios y enlaces de apoyo asociados a cada competencia.
            </p>
          </div>
        </div>
        <div className="relative mt-3 sm:max-w-xl">
          <KeenIcon icon="search" className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            className="input w-full pl-9 dark:bg-[#111827] dark:text-white dark:border-gray-600"
            placeholder="Buscar por título, competencia, tipo o descripción..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagina(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-200 mt-3">Cargando material de apoyo...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-coal-400 p-5 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      ) : items.length === 0 ? (
        estadoVacio('document', 'No hay material de apoyo disponible para tus competencias.')
      ) : itemsFiltrados.length === 0 ? (
        estadoVacio('search-list', 'No se encontraron materiales con ese criterio.')
      ) : (
        <>
          <div className="space-y-2.5">
            {grupos.map((grupo, index) => {
              const abierta = competenciasAbiertas.has(grupo.idCompetencia);
              const acento = ACENTOS_COMPETENCIA[index % ACENTOS_COMPETENCIA.length] ?? ACENTOS_COMPETENCIA[0];
              const tituloCompetencia = grupo.codigo ? `${grupo.codigo} - ${grupo.nombre}` : grupo.nombre;
              return (
                <section
                  key={grupo.idCompetencia}
                  className={`rounded-xl border overflow-hidden ${acento.wrap}`}
                >
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 px-3.5 sm:px-4 py-2.5 text-left transition-colors ${acento.hover}`}
                    aria-expanded={abierta}
                    aria-controls={`competencia-panel-${grupo.idCompetencia}`}
                    onClick={() => toggleId(setCompetenciasAbiertas, grupo.idCompetencia)}
                  >
                    <div
                      className={`size-9 shrink-0 rounded-full flex items-center justify-center ${acento.icon}`}
                    >
                      <KeenIcon icon="abstract-26" className="text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${acento.label}`}>
                        Competencia{grupo.codigo ? ` ${grupo.codigo}` : ''}
                      </p>
                      <TextoTruncado
                        texto={tituloCompetencia}
                        lineas={2}
                        className="text-sm font-semibold text-gray-900 dark:text-white leading-snug uppercase"
                      />
                      <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5">
                        {grupo.items.length} {grupo.items.length === 1 ? 'material disponible' : 'materiales disponibles'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {abierta ? (
                        <span
                          className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${acento.badge}`}
                        >
                          Expandida
                        </span>
                      ) : null}
                      <span className="size-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-300">
                        <KeenIcon icon={abierta ? 'up' : 'down'} className="text-xs" />
                      </span>
                    </div>
                  </button>
                  <Collapse
                    in={abierta}
                    timeout={COLLAPSE_MS}
                    unmountOnExit
                    id={`competencia-panel-${grupo.idCompetencia}`}
                  >
                    <div className="px-3 sm:px-4 pb-3 space-y-2.5">
                      {grupo.items.map((mat) => {
                        const gruposRecursos = recursosPorTipo(mat);
                        const materialAbierto = materialesAbiertos.has(mat.id);
                        return (
                          <article
                            key={mat.id}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 border-l-4 border-l-primary bg-white dark:bg-coal-400 shadow-sm overflow-hidden"
                          >
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 text-left hover:bg-gray-50/80 dark:hover:bg-coal-500/30 transition-colors"
                              aria-expanded={materialAbierto}
                              aria-controls={`material-panel-${mat.id}`}
                              onClick={() => toggleId(setMaterialesAbiertos, mat.id)}
                            >
                              <div className="size-9 shrink-0 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-200 flex items-center justify-center">
                                <KeenIcon icon="notepad" className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-300">
                                  Material
                                </p>
                                <TextoTruncado
                                  texto={mat.titulo || '—'}
                                  className="text-sm font-semibold text-gray-900 dark:text-white leading-snug"
                                />
                                {mat.descripcion ? (
                                  <TextoTruncado
                                    texto={mat.descripcion}
                                    lineas={materialAbierto ? 2 : 1}
                                    className="text-xs text-gray-600 dark:text-gray-300 mt-0.5"
                                  />
                                ) : null}
                                <ChipsResumen item={mat} />
                              </div>
                              <span className="size-8 shrink-0 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-300">
                                <KeenIcon icon={materialAbierto ? 'up' : 'down'} className="text-xs" />
                              </span>
                            </button>
                            <Collapse
                              in={materialAbierto}
                              timeout={COLLAPSE_MS}
                              unmountOnExit
                              id={`material-panel-${mat.id}`}
                            >
                              <div className="px-3 sm:px-4 pb-3 space-y-2">
                                {gruposRecursos.documentos.length ? (
                                  <BloqueRecursos
                                    titulo="Documentos"
                                    cantidad={gruposRecursos.documentos.length}
                                    variante="documento"
                                  >
                                    {gruposRecursos.documentos.map((rec, i) => (
                                      <FilaRecurso
                                        key={rec.id ?? `doc-${mat.id}-${i}`}
                                        material={mat}
                                        recurso={rec}
                                        variante="documento"
                                      />
                                    ))}
                                  </BloqueRecursos>
                                ) : null}
                                {gruposRecursos.multimedia.length ? (
                                  <BloqueRecursos
                                    titulo="Multimedia"
                                    cantidad={gruposRecursos.multimedia.length}
                                    variante="multimedia"
                                  >
                                    {gruposRecursos.multimedia.map((rec, i) => (
                                      <FilaRecurso
                                        key={rec.id ?? `media-${mat.id}-${i}`}
                                        material={mat}
                                        recurso={rec}
                                        variante="multimedia"
                                      />
                                    ))}
                                  </BloqueRecursos>
                                ) : null}
                                {gruposRecursos.enlaces.length ? (
                                  <BloqueRecursos
                                    titulo="Enlaces"
                                    cantidad={gruposRecursos.enlaces.length}
                                    variante="enlace"
                                  >
                                    {gruposRecursos.enlaces.map((rec, i) => (
                                      <FilaRecurso
                                        key={rec.id ?? `link-${mat.id}-${i}`}
                                        material={mat}
                                        recurso={rec}
                                        variante="enlace"
                                      />
                                    ))}
                                  </BloqueRecursos>
                                ) : null}
                                {!gruposRecursos.todos.length ? (
                                  <p className="px-1 py-2 text-xs text-gray-400 dark:text-gray-300">
                                    Recurso no disponible
                                  </p>
                                ) : null}
                              </div>
                            </Collapse>
                          </article>
                        );
                      })}
                    </div>
                  </Collapse>
                </section>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-1 py-1 text-xs text-gray-600 dark:text-gray-200">
            <span>
              {desde}-{hasta} de {itemsFiltrados.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-light"
                disabled={paginaSafe <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
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
        </>
      )}

      <MaterialVideoPlayerModal
        open={Boolean(reproduciendo)}
        titulo={reproduciendo?.recurso ? nombreRecurso(reproduciendo.recurso) : reproduciendo?.material.titulo}
        urlVideo={reproduciendo?.recurso.urlExterna || reproduciendo?.recurso.url}
        urlVideoUrl={reproduciendo?.recurso.url}
        recurso={reproduciendo?.recurso}
        onClose={() => setReproduciendo(null)}
      />

      <Toast isOpen={toastOpen} message={toastMessage} type="error" onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default MaterialCompetenciaAprendizView;
