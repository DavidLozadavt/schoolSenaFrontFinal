import React, { useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { gestionActividadesService } from './gestionActividadesService';
import type { ActividadCatalogo, ActividadContextoAsignacion, FichaCatalogo } from './gestionActividades.types';

const etiquetaMateria = (item?: { codigo?: string | null; nombreMateria?: string | null } | null) => {
  if (!item) return '—';
  if (item.codigo && item.nombreMateria) return `${item.codigo} · ${item.nombreMateria}`;
  return item.nombreMateria || item.codigo || '—';
};

type Props = {
  open: boolean;
  actividad: ActividadCatalogo | null;
  onClose: () => void;
  onElegirFicha: (ficha: FichaCatalogo) => void;
};

const ModalAsignarActividadFichas: React.FC<Props> = ({ open, actividad, onClose, onElegirFicha }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fichas, setFichas] = useState<FichaCatalogo[]>([]);
  const [contexto, setContexto] = useState<ActividadContextoAsignacion | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroJornada, setFiltroJornada] = useState('');
  const [resumen, setResumen] = useState<{ totalInstructor: number; totalCompatibles: number } | null>(null);

  useEffect(() => {
    if (!open || !actividad) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setSeleccion(null);
    setBusqueda('');
    setFiltroJornada('');
    (async () => {
      try {
        const res = await gestionActividadesService.fichasCompatibles(actividad.id);
        if (!mounted) return;
        setFichas(res.fichas ?? res.data ?? []);
        setContexto(res.actividad ?? null);
        setResumen({
          totalInstructor: Number(res.meta?.totalInstructor ?? 0),
          totalCompatibles: Number(res.meta?.totalCompatibles ?? (res.fichas ?? res.data ?? []).length),
        });
      } catch (err) {
        if (!mounted) return;
        setFichas([]);
        setError(gestionActividadesService.errorMessage(err, 'No se pudieron cargar las fichas compatibles.'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, actividad?.id]);

  const jornadas = useMemo(() => {
    const set = new Set<string>();
    fichas.forEach((f) => {
      const j = (f.jornada || '').trim();
      if (j) set.add(j);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [fichas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return fichas.filter((f) => {
      if (filtroJornada && (f.jornada || '') !== filtroJornada) return false;
      if (!q) return true;
      const blob = [f.codigo, f.programa, f.jornada, f.estado, f.estadoPublicacion, String(f.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [fichas, busqueda, filtroJornada]);

  const fichaElegida = fichas.find((f) => f.id === seleccion) ?? null;

  const continuar = () => {
    if (!fichaElegida) {
      setError('Selecciona una ficha para continuar.');
      return;
    }
    onElegirFicha(fichaElegida);
  };

  if (!open || !actividad) return null;

  const competenciaTxt = etiquetaMateria(contexto?.competencia ?? actividad.competencia);
  const rapTxt = etiquetaMateria(contexto?.rap ?? actividad.rap);
  const totalPublicadas = fichas.filter((f) => f.asignada).length;

  return (
    <Modal open onClose={onClose}>
      <ModalContent className="max-w-5xl w-[min(96vw,72rem)]">
        <ModalHeader>
          <ModalTitle>Asignar actividad a ficha</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-500 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/80">Actividad</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                {contexto?.tituloActividad || actividad.tituloActividad}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/80">Competencia</p>
              <p className="text-sm text-gray-800 dark:text-white leading-snug">{competenciaTxt}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/80">RAP</p>
              <p className="text-sm text-gray-800 dark:text-white leading-snug">{rapTxt}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-white">
            Elige la ficha donde vas a publicar esta actividad. A continuación configurarás fechas, grupos y
            estudiantes con el flujo académico existente. La actividad no se duplica.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                Buscar ficha
              </label>
              <div className="relative">
                <KeenIcon icon="search" className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-white/70" />
                <input
                  type="text"
                  className="input w-full pl-10 dark:bg-[#111827] dark:text-white dark:border-gray-600"
                  placeholder="Buscar ficha, programa o jornada..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            {jornadas.length > 1 ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                  Jornada
                </label>
                <select
                  className="input w-full dark:bg-[#111827] dark:text-white dark:border-gray-600"
                  value={filtroJornada}
                  onChange={(e) => setFiltroJornada(e.target.value)}
                >
                  <option value="">Todas</option>
                  {jornadas.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-xs mt-2 text-gray-600 dark:text-white">Cargando fichas del instructor...</p>
            </div>
          ) : fichas.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-white py-6">
              {resumen && resumen.totalInstructor > 0
                ? `Tienes ${resumen.totalInstructor} ficha(s) en Mis clases, pero ninguna es compatible con este RAP.`
                : 'No se encontraron fichas activas para este instructor.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[22rem]">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-coal-400">
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-[10px] uppercase tracking-wider text-gray-600 dark:text-white">
                      <th className="py-2.5 px-3 w-10"> </th>
                      <th className="py-2.5 px-2">Ficha</th>
                      <th className="py-2.5 px-2">Programa/Formación</th>
                      <th className="py-2.5 px-2">Jornada</th>
                      <th className="py-2.5 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-600 dark:text-white">
                          No hay fichas para esa búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filtradas.map((ficha) => (
                        <tr
                          key={ficha.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer"
                          onClick={() => setSeleccion(ficha.id)}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="radio"
                              name="ficha-asignar-actividad"
                              className="radio radio-sm"
                              checked={seleccion === ficha.id}
                              onChange={() => setSeleccion(ficha.id)}
                            />
                          </td>
                          <td className="py-2 px-2 font-medium text-gray-900 dark:text-white tabular-nums">
                            {ficha.codigo || `Ficha ${ficha.id}`}
                          </td>
                          <td className="py-2 px-2 text-gray-800 dark:text-white">{ficha.programa || '—'}</td>
                          <td className="py-2 px-2 text-gray-800 dark:text-white">{ficha.jornada || '—'}</td>
                          <td className="py-2 px-2">
                            {ficha.asignada ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                                Publicada
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600 dark:text-white">{ficha.estado || 'Disponible'}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 dark:text-white">
                {resumen ? `${resumen.totalInstructor} ficha(s) del instructor · ` : ''}
                {fichas.length} compatible{fichas.length === 1 ? '' : 's'} con el RAP
                {' · '}
                {totalPublicadas} ya publicada{totalPublicadas === 1 ? '' : 's'}
              </p>
            </>
          )}

          {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" disabled={!fichaElegida} onClick={continuar}>
              {fichaElegida
                ? `Continuar con ficha ${fichaElegida.codigo || fichaElegida.id}`
                : 'Selecciona una ficha'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalAsignarActividadFichas;
