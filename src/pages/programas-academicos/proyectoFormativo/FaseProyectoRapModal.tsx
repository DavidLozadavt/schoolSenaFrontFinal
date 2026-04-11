import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

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
}

interface Props {
  idFaseProyecto: number;
  descripcionFase: string;
  idPrograma:number | undefined;
  onClose: () => void;
}

const FaseProyectoRapModal: React.FC<Props> = ({ idFaseProyecto, descripcionFase, onClose, idPrograma }) => {
  const [raps, setRaps] = useState<FaseRap[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Buscador
  const [search, setSearch] = useState('');
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  // Confirmar eliminar
  const [deleteTarget, setDeleteTarget] = useState<FaseRap | null>(null);

  useEffect(() => {
    fetchData();
  }, [idFaseProyecto]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRaps, resMaterias] = await Promise.all([
        axios.get('fase-proyecto-rap', { params: { idFaseProyecto } }),
        axios.get('fase-proyecto-rap/materias',{params:{idPrograma}})
      ]);
      setRaps(resRaps.data);
      setMaterias(resMaterias.data);
    } catch {
      enqueueSnackbar('Error al cargar los datos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtra materias por búsqueda y excluye las ya asignadas
  const asignadasIds = new Set(raps.map((r) => r.idMateria));

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
          .slice(0, 8)
      : [];

  const handleAsignar = async () => {
    if (!selectedMateria) return;
    setSaving(true);
    try {
      const res = await axios.post('fase-proyecto-rap', {
        idFaseProyecto,
        idMateria: selectedMateria.id
      });
      setRaps((prev) => [...prev, res.data]);
      setSelectedMateria(null);
      setSearch('');
      enqueueSnackbar('Materia asignada correctamente.', { variant: 'success' });
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
      enqueueSnackbar('Materia desasignada correctamente.', { variant: 'success' });
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
    <>
      {/* ── Modal principal RAPs ── */}
      <Modal open onClose={onClose} className="mx-4 sm:mx-auto max-w-2xl w-full">
        <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
          <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
            <div>
              <ModalTitle>Materias / RAPs de la fase</ModalTitle>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{descripcionFase}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <i className="ki-outline ki-cross text-lg" />
            </button>
          </ModalHeader>

          <ModalBody className="p-5 space-y-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Buscador para asignar ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <i className="ki-outline ki-plus-circle text-sm text-blue-500" />
                    Asignar nueva materia
                  </p>

                  {/* Materia seleccionada */}
                  {selectedMateria && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                      <i className="ki-outline ki-book text-blue-500 text-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">
                          {selectedMateria.nombreMateria}
                        </p>
                        {selectedMateria.codigo && (
                          <p className="text-xs text-blue-500 dark:text-blue-300">
                            {selectedMateria.codigo}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMateria(null);
                          setSearch('');
                        }}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors ml-1 shrink-0"
                      >
                        <i className="ki-outline ki-cross text-xs" />
                      </button>
                    </div>
                  )}

                  {/* Input buscador */}
                  <div className="relative">
                    <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setSelectedMateria(null);
                      }}
                      placeholder="Buscar por nombre, código o descripción..."
                      className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {search.trim().length > 0 && search.trim().length < 2 && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <i className="ki-outline ki-information-2 text-xs" />
                      Escribe al menos 2 caracteres para buscar.
                    </p>
                  )}

                  {/* Dropdown resultados */}
                  {materiasFiltradas.length > 0 && (
                    <div className="mt-1.5 border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden bg-white dark:bg-coal-400 shadow-sm">
                      {materiasFiltradas.map((materia, idx) => (
                        <button
                          key={materia.id}
                          onClick={() => {
                            setSelectedMateria(materia);
                            setSearch('');
                          }}
                          className={[
                            'w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors',
                            idx !== materiasFiltradas.length - 1
                              ? 'border-b border-gray-100 dark:border-coal-300'
                              : ''
                          ].join(' ')}
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {materia.nombreMateria}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
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
                        </button>
                      ))}
                    </div>
                  )}

                  {search.trim().length >= 2 && materiasFiltradas.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <i className="ki-outline ki-information-2 text-xs" />
                      No se encontraron materias disponibles.
                    </p>
                  )}

                  {/* Botón asignar */}
                  {selectedMateria && (
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
                      {saving ? 'Asignando...' : 'Confirmar asignación'}
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-coal-300" />

                {/* ── Listado de RAPs asignados ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                    <i className="ki-outline ki-book text-sm text-purple-500" />
                    Materias asignadas
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                      {raps.length}
                    </span>
                  </p>

                  {raps.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                      <i className="ki-outline ki-book text-3xl mb-2 block" />
                      No hay materias asignadas a esta fase.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {raps.map((rap, index) => (
                        <div
                          key={rap.id}
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-100 dark:border-coal-300"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                {rap.materia.nombreMateria}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {rap.materia.codigo && (
                                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                    {rap.materia.codigo}
                                  </span>
                                )}
                                {rap.materia.descripcion && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                    {rap.materia.descripcion}
                                  </span>
                                )}
                              </div>
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
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Modal confirmar desasignar ── */}
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
                    ¿Quitar esta materia?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {deleteTarget.materia.nombreMateria}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Se eliminará la asignación de esta materia a la fase.
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
    </>
  );
};

export default FaseProyectoRapModal;
