import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface ActividadProyecto {
  id: number;
  descripcionActividad: string;
  idFaseProyecto: number;
}

interface FaseProyecto {
  id: number;
  descripcionFase: string;
  proyectoFormativo?: { id: number; nombreProyecto: string; version: string };
  proyecto_formativo?: { id: number; nombreProyecto: string; version: string };
}

interface Materia {
  id: number;
  nombreMateria: string;
  descripcion: string | null;
  codigo: string | null;
}

interface FaseRap {
  id: number;
  idFaseProyecto: number;
  idMateria: number;
  materia: Materia;
  actividad_proyecto?: ActividadProyecto;
}

const CompetenciasProyectoEntry: React.FC = () => {
  const { idPrograma, idFase } = useParams<{ idPrograma: string; idFase: string }>();
  const navigate = useNavigate();

  const [actividades, setActividades] = useState<ActividadProyecto[]>([]);
  const [selectedActividad, setSelectedActividad] = useState<ActividadProyecto | null>(null);
  const [searchActividad, setSearchActividad] = useState('');

  const [actividadInputFocused, setActividadInputFocused] = useState(false);

  const [showAllActividades, setShowAllActividades] = useState(false);

  const [fase, setFase] = useState<FaseProyecto | null>(null);
  const [raps, setRaps] = useState<FaseRap[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Búsqueda y selección múltiple de materias
  const [search, setSearch] = useState('');
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<Set<number>>(new Set());

  // Confirmar eliminar
  const [deleteTarget, setDeleteTarget] = useState<FaseRap | null>(null);

  useEffect(() => {
    fetchData();
  }, [idFase, idPrograma]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFase, resRaps, resMaterias, resActividades] = await Promise.all([
        axios.get(`fases-proyecto/${idFase}`),
        axios.get('fase-proyecto-rap', { params: { idFaseProyecto: idFase } }),
        axios.get('fase-proyecto-rap/materias', { params: { idPrograma } }),
        axios.get('actividades-proyecto', { params: { idFaseProyecto: idFase } })
      ]);
      setFase(resFase.data);
      setRaps(resRaps.data);
      setMaterias(resMaterias.data);
      setActividades(resActividades.data);
    } catch {
      enqueueSnackbar('Error al cargar los datos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // IDs ya asignados
  const asignadasIds = new Set(
    raps.filter((r) => r.actividad_proyecto?.id === selectedActividad?.id).map((r) => r.idMateria)
  );

  // Filtro de actividades
  const actividadesFiltradas = (() => {
    if (!actividadInputFocused) return [];
    if (searchActividad.trim().length >= 2) {
      return actividades.filter((a) =>
        a.descripcionActividad.toLowerCase().includes(searchActividad.toLowerCase())
      );
    }
    return showAllActividades ? actividades : actividades.slice(0, 8);
  })();

  // Filtro de materias disponibles (excluye ya asignadas)
  const materiasFiltradas =
    search.trim().length >= 2
      ? materias
          .filter(
            (m) =>
              !asignadasIds.has(m.id) &&
              (m.nombreMateria.toLowerCase().includes(search.toLowerCase()) ||
                m.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
                m.codigo?.toLowerCase().includes(search.toLowerCase()))
          )
          .slice(0, 12)
      : [];

  const toggleMateria = (id: number) => {
    setSelectedMateriaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedMateriasList = materias.filter((m) => selectedMateriaIds.has(m.id));

  const handleAsignar = async () => {
    if (!selectedActividad || selectedMateriaIds.size === 0) return;
    setSaving(true);
    try {
      const res = await axios.post('fase-proyecto-rap', {
        idFaseProyecto: Number(idFase),
        idMaterias: Array.from(selectedMateriaIds),
        idActividadProyecto: selectedActividad.id
      });

      const { creados, duplicados } = res.data as {
        creados: FaseRap[];
        duplicados: number[];
      };

      if (creados.length > 0) {
        setRaps((prev) => [...prev, ...creados]);
        enqueueSnackbar(
          `${creados.length} competencia${creados.length !== 1 ? 's' : ''} asignada${creados.length !== 1 ? 's' : ''} correctamente.`,
          { variant: 'success' }
        );
      }
      if (duplicados.length > 0) {
        enqueueSnackbar(
          `${duplicados.length} materia${duplicados.length !== 1 ? 's' : ''} ya estaba${duplicados.length !== 1 ? 'n' : ''} asignada${duplicados.length !== 1 ? 's' : ''} y se omitió${duplicados.length !== 1 ? 'eron' : ''}.`,
          { variant: 'warning' }
        );
      }

      setSelectedMateriaIds(new Set());
      setSelectedActividad(null);
      setSearch('');
      setSearchActividad('');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al asignar.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDesasignar = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await axios.delete(`fase-proyecto-rap/${deleteTarget.id}`);
      setRaps((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      enqueueSnackbar('Competencia desasignada correctamente.', { variant: 'success' });
      setDeleteTarget(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al desasignar.', {
        variant: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mb-5"
      >
        <i className="ki-outline ki-left text-xs" />
        Volver a proyectos
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Competencias</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestión de competencias de la fase
        </p>
      </div>

      {/* Banner fase/proyecto */}
      {fase && (
        <div className="mb-6 px-5 py-4 bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <i className="ki-outline ki-book text-blue-600 dark:text-blue-400 text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Fase</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {fase.descripcionFase}
            </p>
            {(() => {
              const proyecto = fase.proyectoFormativo ?? fase.proyecto_formativo;
              return proyecto ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                  <i className="ki-outline ki-document text-xs" />
                  Proyecto:
                  <span className="font-medium text-gray-600 dark:text-gray-300 ml-1">
                    {proyecto.nombreProyecto} — v{proyecto.version}
                  </span>
                </p>
              ) : null;
            })()}
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-coal-400 px-2.5 py-1 rounded-full shrink-0">
            {raps.length} competencia{raps.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm p-5 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── PASO 1: Seleccionar actividad ── */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                Seleccionar actividad
              </p>

              {/* Actividad seleccionada */}
              {selectedActividad ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg">
                  <i className="ki-outline ki-abstract-26 text-purple-500 text-sm" />
                  <p className="flex-1 text-xs font-semibold text-purple-700 dark:text-purple-400 truncate">
                    {selectedActividad.descripcionActividad}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedActividad(null);
                      setSearchActividad('');
                    }}
                    className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors shrink-0"
                  >
                    <i className="ki-outline ki-cross text-xs" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={searchActividad}
                      onChange={(e) => {
                        setSearchActividad(e.target.value);
                        setShowAllActividades(false);
                      }}
                      onFocus={() => setActividadInputFocused(true)}
                      onBlur={() => setTimeout(() => setActividadInputFocused(false), 300)}
                      placeholder="Buscar actividad o click para ver todas..."
                      className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {searchActividad.trim().length > 0 && searchActividad.trim().length < 2 && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <i className="ki-outline ki-information-2 text-xs" />
                      Escribe al menos 2 caracteres para buscar.
                    </p>
                  )}

                  {/* Lista de actividades: siempre visible si hay items */}
                  {actividades.length > 0 && (
                    <div className="mt-1.5 border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden bg-white dark:bg-coal-400 shadow-sm">
                      {actividadesFiltradas.map((actividad, idx) => (
                        <button
                          key={actividad.id}
                          onClick={() => {
                            setSelectedActividad(actividad);
                            setSearchActividad('');
                            setShowAllActividades(false);
                            setActividadInputFocused(false);
                          }}
                          className={[
                            'w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors',
                            idx !== actividadesFiltradas.length - 1
                              ? 'border-b border-gray-100 dark:border-coal-300'
                              : ''
                          ].join(' ')}
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {actividad.descripcionActividad}
                          </p>
                        </button>
                      ))}

                      {/* "Ver más" / "Ver menos" cuando no hay búsqueda activa */}
                      {searchActividad.trim().length < 2 && actividades.length > 8 && (
                        <button
                          onClick={() => setShowAllActividades((v) => !v)}
                          className="w-full px-4 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border-t border-gray-100 dark:border-coal-300 transition-colors"
                        >
                          {showAllActividades
                            ? 'Ver menos'
                            : `Ver ${actividades.length - 8} actividad${actividades.length - 8 !== 1 ? 'es' : ''} más`}
                        </button>
                      )}
                    </div>
                  )}

                  {actividades.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <i className="ki-outline ki-information-2 text-xs" />
                      No hay actividades registradas en esta fase.
                    </p>
                  )}

                  {searchActividad.trim().length >= 2 && actividadesFiltradas.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <i className="ki-outline ki-information-2 text-xs" />
                      No se encontraron actividades con ese término.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── PASO 2: Seleccionar materias (solo si hay actividad) ── */}
            {selectedActividad && (
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  Seleccionar materias
                  {selectedMateriaIds.size > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {selectedMateriaIds.size} seleccionada
                      {selectedMateriaIds.size !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>

                {/* Chips de materias seleccionadas */}
                {selectedMateriaIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMateriasList.map((m) => (
                      <span
                        key={m.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-400"
                      >
                        {m.codigo ? `[${m.codigo}] ` : ''}
                        {m.nombreMateria}
                        <button
                          onClick={() => toggleMateria(m.id)}
                          className="ml-0.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                        >
                          <i className="ki-outline ki-cross text-[10px]" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectedMateriaIds(new Set())}
                      className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

                {/* Buscador de materias */}
                <div className="relative">
                  <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar materias disponibles..."
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {search.trim().length > 0 && search.trim().length < 2 && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <i className="ki-outline ki-information-2 text-xs" />
                    Escribe al menos 2 caracteres para buscar.
                  </p>
                )}

                {/* Lista con checkboxes */}
                {materiasFiltradas.length > 0 && (
                  <div className="mt-1.5 border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden bg-white dark:bg-coal-400 shadow-sm divide-y divide-gray-100 dark:divide-coal-300">
                    {materiasFiltradas.map((materia) => {
                      const checked = selectedMateriaIds.has(materia.id);
                      return (
                        <label
                          key={materia.id}
                          className={[
                            'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none',
                            checked
                              ? 'bg-blue-50 dark:bg-blue-500/10'
                              : 'hover:bg-gray-50 dark:hover:bg-coal-300'
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMateria(materia.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                              {materia.nombreMateria}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {materia.codigo && (
                                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                  {materia.codigo}
                                </span>
                              )}
                              {materia.descripcion && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  {materia.descripcion}
                                </span>
                              )}
                            </div>
                          </div>
                          {checked && (
                            <i className="ki-outline ki-check-circle text-blue-500 dark:text-blue-400 text-sm shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {search.trim().length >= 2 && materiasFiltradas.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <i className="ki-outline ki-information-2 text-xs" />
                    No se encontraron materias disponibles.
                  </p>
                )}

                {/* Botón confirmar asignación */}
                {selectedMateriaIds.size > 0 && (
                  <button
                    onClick={handleAsignar}
                    disabled={saving}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="ki-outline ki-check-circle text-sm" />
                    )}
                    {saving
                      ? 'Asignando...'
                      : `Asignar ${selectedMateriaIds.size} materia${selectedMateriaIds.size !== 1 ? 's' : ''}`}
                  </button>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-coal-300" />

            {/* Listado de competencias asignadas */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <i className="ki-outline ki-book text-sm text-blue-500" />
                Competencias asignadas
                <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  {raps.length}
                </span>
              </p>

              {raps.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  <i className="ki-outline ki-book text-3xl mb-2 block" />
                  No hay competencias asignadas a esta fase.
                </div>
              ) : (
                <div className="space-y-2">
                  {raps.map((rap, index) => (
                    <div
                      key={rap.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-100 dark:border-coal-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            Actividad asociada
                          </p>
                          {rap.actividad_proyecto && (
                            <span className="flex items-center gap-1 text-xs text-purple-500 dark:text-purple-400 font-medium">
                              <i className="ki-outline ki-abstract-26 text-[10px]" />
                              {rap.actividad_proyecto.descripcionActividad}
                            </span>
                          )}
                          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            Competencia
                          </p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate whitespace-pre-wrap">
                            {rap.materia.nombreMateria}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(rap)}
                        className="ml-3 shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                      >
                        <i className="ki-outline ki-trash text-xs" /> Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal confirmar desasignar */}
      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar desasignación</ModalTitle>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ¿Quitar esta competencia?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {deleteTarget.materia.nombreMateria}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Se eliminará la asignación de esta competencia a la fase.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDesasignar}
                  disabled={!!deletingId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingId ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingId ? 'Quitando...' : 'Sí, quitar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default CompetenciasProyectoEntry;
