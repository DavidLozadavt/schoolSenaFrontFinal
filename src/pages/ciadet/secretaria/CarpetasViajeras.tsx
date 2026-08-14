import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { CarpetaViajeraItem, ArchivoCarpeta } from '../types/carpetasViajeras';
import { handleOpenArchivo } from '../hooks/openDocument';

const CarpetasViajeras: React.FC = () => {
  const [carpetas, setCarpetas] = useState<CarpetaViajeraItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [nivelFilter, setNivelFilter] = useState<string>('TODOS');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [pagoFilter, setPagoFilter] = useState<string>('TODOS');

  // Modal / Detail state
  const [selectedCarpeta, setSelectedCarpeta] = useState<CarpetaViajeraItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Fetch carpetas viajeras todas (vista secretaria)
  const fetchCarpetas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<CarpetaViajeraItem[]>('carpetas-viajeras');
      setCarpetas(response.data || []);
    } catch (error: any) {
      console.error('Error al cargar carpetas viajeras para secretaria:', error);
      enqueueSnackbar('No se pudieron obtener las carpetas viajeras', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarpetas();
  }, [fetchCarpetas]);

  // Toggle Aprobación de Carpeta
  const handleToggleAprobarCarpeta = async (carpetaId: number, currentAprobada: boolean) => {
    setUpdatingId(carpetaId);
    try {
      const newAprobada = !currentAprobada;
      const response = await axios.put<CarpetaViajeraItem>(`carpetas-viajeras/${carpetaId}`, {
        aprobada: newAprobada
      });

      enqueueSnackbar(
        newAprobada ? 'Carpeta marcada como Aprobada' : 'Carpeta marcada como Pendiente',
        { variant: newAprobada ? 'success' : 'warning' }
      );

      // Actualizar estado local
      setCarpetas((prev) =>
        prev.map((c) => (c.id === carpetaId ? { ...c, aprobada: newAprobada } : c))
      );

      if (selectedCarpeta?.id === carpetaId) {
        setSelectedCarpeta((prev) => (prev ? { ...prev, aprobada: newAprobada } : null));
      }
    } catch (error: any) {
      enqueueSnackbar('Error al cambiar estado de aprobación', { variant: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Update Estado Pago
  const handleUpdatePago = async (
    carpetaId: number,
    pago: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO'
  ) => {
    setUpdatingId(carpetaId);
    try {
      await axios.put(`carpetas-viajeras/${carpetaId}`, { pago });
      enqueueSnackbar(`Estado de pago actualizado a ${pago}`, { variant: 'info' });

      setCarpetas((prev) => prev.map((c) => (c.id === carpetaId ? { ...c, pago } : c)));
      if (selectedCarpeta?.id === carpetaId) {
        setSelectedCarpeta((prev) => (prev ? { ...prev, pago } : null));
      }
    } catch (error: any) {
      enqueueSnackbar('Error al actualizar estado de pago', { variant: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Aprobación de Archivo Individual
  const handleToggleAprobarArchivo = async (
    carpetaId: number,
    archivoId: number,
    currentAprobada: boolean
  ) => {
    try {
      const newAprobada = !currentAprobada;
      await axios.put(`carpetas-viajeras/${carpetaId}/archivos/${archivoId}`, {
        aprobada: newAprobada
      });

      // Update local states
      const updateArchivosFn = (archivosList?: ArchivoCarpeta[]) =>
        (archivosList || []).map((a) => (a.id === archivoId ? { ...a, aprobada: newAprobada } : a));

      let folderNowApproved = false;

      setCarpetas((prev) =>
        prev.map((c) => {
          if (c.id !== carpetaId) return c;
          const updatedArchivos = updateArchivosFn(c.archivos);
          const allApproved =
            updatedArchivos.length > 0 && updatedArchivos.every((a) => a.aprobada);
          if (allApproved && !c.aprobada) {
            folderNowApproved = true;
          }
          return {
            ...c,
            archivos: updatedArchivos,
            aprobada: allApproved
          };
        })
      );

      if (selectedCarpeta?.id === carpetaId) {
        setSelectedCarpeta((prev) => {
          if (!prev) return null;
          const updatedArchivos = updateArchivosFn(prev.archivos);
          const allApproved =
            updatedArchivos.length > 0 && updatedArchivos.every((a) => a.aprobada);
          return {
            ...prev,
            archivos: updatedArchivos,
            aprobada: allApproved
          };
        });
      }

      if (newAprobada && folderNowApproved) {
        enqueueSnackbar(
          '¡Todos los archivos han sido aprobados! La carpeta fue aprobada automáticamente.',
          { variant: 'success' }
        );
      } else {
        enqueueSnackbar(newAprobada ? 'Archivo aprobado' : 'Archivo marcado como pendiente', {
          variant: newAprobada ? 'success' : 'warning'
        });
      }
    } catch (error: any) {
      enqueueSnackbar('Error al actualizar el estado del archivo', { variant: 'error' });
    }
  };

  // Filtered list
  const filteredCarpetas = useMemo(() => {
    return carpetas.filter((item) => {
      // Search term
      const searchLower = search.toLowerCase().trim();
      const instructorName =
        `${item.persona?.nombre1 || ''} ${item.persona?.apellido1 || ''}`.toLowerCase();
      const identificacion = item.persona?.identificacion || '';
      const modulo = item.modulo.toLowerCase();
      const codigo = (item.codigo_transferencia || '').toLowerCase();

      const matchesSearch =
        !searchLower ||
        instructorName.includes(searchLower) ||
        identificacion.includes(searchLower) ||
        modulo.includes(searchLower) ||
        codigo.includes(searchLower);

      // Nivel filter
      const matchesNivel = nivelFilter === 'TODOS' || item.nivel_academico === nivelFilter;

      // Estado filter
      const matchesEstado =
        estadoFilter === 'TODOS' ||
        (estadoFilter === 'APROBADA' && item.aprobada) ||
        (estadoFilter === 'PENDIENTE' && !item.aprobada);

      // Pago filter
      const matchesPago = pagoFilter === 'TODOS' || item.pago === pagoFilter;

      return matchesSearch && matchesNivel && matchesEstado && matchesPago;
    });
  }, [carpetas, search, nivelFilter, estadoFilter, pagoFilter]);

  // KPI stats
  const totalCount = carpetas.length;
  const pendientesCount = carpetas.filter((c) => !c.aprobada).length;
  const aprobadasCount = carpetas.filter((c) => c.aprobada).length;
  const pagosEntregados = carpetas.filter((c) => c.pago === 'ENTREGADO').length;

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-coal-500 p-6 rounded-2xl border border-gray-200 dark:border-coal-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <i className="ki-outline ki-shield-tick text-2xl" />
            </span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gestión y Aprobación de Carpetas Viajeras
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Panel de control de Secretaría CIADET. Revise, apruebe los documentos y gestione los
            estados de pago.
          </p>
        </div>
        <button
          onClick={fetchCarpetas}
          className="flex items-center gap-2 bg-gray-100 dark:bg-coal-400 hover:bg-gray-200 dark:hover:bg-coal-300 text-gray-700 dark:text-gray-200 font-medium px-4 py-2.5 rounded-xl transition-all self-start md:self-auto text-xs"
        >
          <i className="ki-outline ki-arrows-loop text-sm" />
          Actualizar Lista
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <i className="ki-outline ki-folder text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Solicitudes</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <i className="ki-outline ki-time text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pendientes Aprobar</p>
            <p className="text-xl font-bold text-amber-600">{pendientesCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <i className="ki-outline ki-check-circle text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Aprobadas</p>
            <p className="text-xl font-bold text-emerald-600">{aprobadasCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-600 flex items-center justify-center">
            <i className="ki-outline ki-wallet text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pagos Entregados</p>
            <p className="text-xl font-bold text-green-600">{pagosEntregados}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-coal-500 p-4 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <i className="ki-outline ki-magnifier absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Buscar por instructor, módulo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Nivel filter */}
        <div>
          <select
            value={nivelFilter}
            onChange={(e) => setNivelFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Niveles</option>
            <option value="TECNICO">TÉCNICO</option>
            <option value="TECNOLOGO">TECNÓLOGO</option>
            <option value="BACHILLERATO">BACHILLERATO</option>
          </select>
        </div>

        {/* Estado filter */}
        <div>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados Aprobación</option>
            <option value="PENDIENTE">PENDIENTES DE APROBACIÓN</option>
            <option value="APROBADA">APROBADAS</option>
          </select>
        </div>

        {/* Pago filter */}
        <div>
          <select
            value={pagoFilter}
            onChange={(e) => setPagoFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados Pago</option>
            <option value="PENDIENTE">PAGO PENDIENTE</option>
            <option value="ENTREGADO">PAGO ENTREGADO</option>
            <option value="CANCELADO">PAGO CANCELADO</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            Solicitudes de Carpetas Viajeras ({filteredCarpetas.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando solicitudes...
          </div>
        ) : filteredCarpetas.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <i className="ki-outline ki-filter-search text-4xl text-gray-300 dark:text-gray-600" />
            <p className="text-sm">
              No se encontraron carpetas viajeras que coincidan con los filtros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-coal-400/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-gray-100 dark:border-coal-300">
                <tr>
                  <th className="px-6 py-3.5">Instructor</th>
                  <th className="px-6 py-3.5">Módulo / Programa</th>
                  <th className="px-6 py-3.5">Nivel</th>
                  <th className="px-6 py-3.5">Horas</th>
                  <th className="px-6 py-3.5">Archivos Adjuntos</th>
                  <th className="px-6 py-3.5">Aprobación Secretaría</th>
                  <th className="px-6 py-3.5">Estado Pago</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-coal-300 text-gray-700 dark:text-gray-300">
                {filteredCarpetas.map((item) => {
                  const numArchivos = item.archivos?.length || 0;
                  const aprobadosArchivos = item.archivos?.filter((a) => a.aprobada).length || 0;
                  const instructorFullName = item.persona
                    ? `${item.persona.nombre1 || ''} ${item.persona.apellido1 || ''}`.trim()
                    : 'Instructor ID: ' + item.persona_id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-coal-400/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                            {item.persona?.nombre1?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {instructorFullName}
                            </p>
                            <p className="text-xs text-gray-400">
                              CC: {item.persona?.identificacion || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800 dark:text-white">{item.modulo}</p>
                        {item.codigo_transferencia && (
                          <p className="text-[11px] font-mono text-gray-400">
                            Ref: {item.codigo_transferencia}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {item.nivel_academico}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium">{item.total_horas} hrs</td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedCarpeta(item);
                            setShowDetailModal(true);
                          }}
                          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                          <i className="ki-outline ki-file text-sm" />
                          {numArchivos} archivo(s) ({aprobadosArchivos} aprobados)
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleToggleAprobarCarpeta(item.id, item.aprobada)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                            item.aprobada
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {updatingId === item.id ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : item.aprobada ? (
                            <>
                              <i className="ki-outline ki-check-circle text-xs" /> Aprobada
                            </>
                          ) : (
                            <>
                              <i className="ki-outline ki-cross-circle text-xs" /> Marcar Aprobada
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={item.pago}
                          onChange={(e) =>
                            handleUpdatePago(
                              item.id,
                              e.target.value as 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO'
                            )
                          }
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 font-semibold text-gray-700 dark:text-gray-200 focus:outline-none"
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="ENTREGADO">ENTREGADO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCarpeta(item);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1 ml-auto"
                        >
                          <i className="ki-outline ki-eye text-xs" /> Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Inspección y Aprobación Detallada */}
      {showDetailModal && selectedCarpeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-coal-300 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between bg-gray-50/50 dark:bg-coal-400/20">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <i className="ki-outline ki-folder text-blue-600 text-xl" />
                  Carpeta Viajera: {selectedCarpeta.modulo}
                </h3>
                <p className="text-xs text-gray-500">
                  Instructor:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {selectedCarpeta.persona
                      ? `${selectedCarpeta.persona.nombre1 || ''} ${selectedCarpeta.persona.apellido1 || ''}`
                      : 'ID ' + selectedCarpeta.persona_id}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-400/30 border border-gray-200 dark:border-coal-300">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase">Nivel Académico</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedCarpeta.nivel_academico}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase">Total Horas</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedCarpeta.total_horas} hrs
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase">
                    Valor Registrado
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ${selectedCarpeta.total || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase">
                    Cod. Transferencia
                  </p>
                  <p className="text-sm font-mono font-semibold text-gray-800 dark:text-white">
                    {selectedCarpeta.codigo_transferencia || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Control de Aprobación General & Estado de Pago */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-white">
                    Estado General de la Carpeta
                  </p>
                  <p className="text-xs text-gray-500">
                    Actualmente:{' '}
                    {selectedCarpeta.aprobada ? (
                      <span className="font-semibold text-emerald-600">
                        APROBADA POR SECRETARÍA
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600">PENDIENTE DE APROBACIÓN</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleToggleAprobarCarpeta(selectedCarpeta.id, selectedCarpeta.aprobada)
                    }
                    className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                      selectedCarpeta.aprobada
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    {selectedCarpeta.aprobada ? (
                      <>
                        <i className="ki-outline ki-cross-circle text-sm" /> Revertir a Pendiente
                      </>
                    ) : (
                      <>
                        <i className="ki-outline ki-check-circle text-sm" /> Aprobar Carpeta
                        Completa
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Archivos y Documentos Adjuntos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Documentos y Archivos Adjuntados ({selectedCarpeta.archivos?.length || 0})
                </h4>

                {!selectedCarpeta.archivos || selectedCarpeta.archivos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border border-gray-100 dark:border-coal-300 rounded-xl">
                    <i className="ki-outline ki-file-slash text-3xl text-gray-300 dark:text-gray-600 mb-1" />
                    <p className="text-xs">El instructor aún no ha adjuntado ningún documento.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedCarpeta.archivos.map((archivo) => (
                      <div
                        key={archivo.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-300 shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                            <i className="ki-outline ki-document text-lg" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                              {archivo.nombreArchivo ||
                                archivo.urlArchivo?.split('/').pop() ||
                                `Documento #${archivo.id}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {archivo.aprobada ? (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <i className="ki-outline ki-check text-[10px]" /> Documento
                                  Aprobado
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <i className="ki-outline ki-time text-[10px]" /> Sin aprobar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {archivo.rutaArchivoUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenArchivo(archivo, selectedCarpeta.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <i className="ki-outline ki-eye text-xs" /> Ver / Descargar
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleToggleAprobarArchivo(
                                selectedCarpeta.id,
                                archivo.id,
                                archivo.aprobada
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                              archivo.aprobada
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
                            }`}
                          >
                            {archivo.aprobada ? (
                              <>
                                <i className="ki-outline ki-cross text-xs" /> Desmarcar
                              </>
                            ) : (
                              <>
                                <i className="ki-outline ki-check text-xs" /> Aprobar Archivo
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-coal-300 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-coal-400 hover:bg-gray-200 dark:hover:bg-coal-300 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarpetasViajeras;
