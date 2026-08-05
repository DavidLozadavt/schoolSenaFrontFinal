import { Fragment, useEffect, useState, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid, KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';
import { 
  seguimientoAspirantesService, 
  Aspirante, 
  GetAspirantesParams 
} from '@/services/seguimientoAspirantesService';
import clsx from 'clsx';
import { ModalImportarAspirantes } from './ModalImportarAspirantes';
import { ModalEnviarWhatsApp } from './ModalEnviarWhatsApp';
import { ModalExportarAspirantes } from './ModalExportarAspirantes';
import { ModalPlantillas } from './ModalPlantillas';
import { ModalComprarPlan } from './ModalComprarPlan';
import { SaldoMensajesIndicador } from './SaldoMensajesIndicador';
import { planesMensajesService, SaldoMensajes } from '@/services/planesMensajesService';

interface SeguimientoAspirantesContentProps {
  reloadTrigger: boolean;
  onReload: () => void;
}

const SeguimientoAspirantesContent = ({ reloadTrigger, onReload }: SeguimientoAspirantesContentProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  // Data states
  const [aspirantes, setAspirantes] = useState<Aspirante[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Autocomplete filters data
  const [programas, setProgramas] = useState<string[]>([]);
  const [centros, setCentros] = useState<string[]>([]);
  const [fichas, setFichas] = useState<string[]>([]);

  // Filter states
  const [programaFilter, setProgramaFilter] = useState('');
  const [centroFilter, setCentroFilter] = useState('');
  const [fichaFilter, setFichaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');
  const [nombreFilter, setNombreFilter] = useState('');
  const [celularFilter, setCelularFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  // Importer modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [plantillasModalOpen, setPlantillasModalOpen] = useState(false);

  // Planes de mensajes (aditivo): saldo del usuario y modal de compra.
  const [saldo, setSaldo] = useState<SaldoMensajes | null>(null);
  const [saldoLoading, setSaldoLoading] = useState(true);
  const [comprarPlanOpen, setComprarPlanOpen] = useState(false);
  const [requeridosCompra, setRequeridosCompra] = useState(0);

  const fetchSaldo = useCallback(async () => {
    setSaldoLoading(true);
    try {
      setSaldo(await planesMensajesService.getMiSaldo());
    } catch (err) {
      console.error('Error al consultar el saldo de mensajes:', err);
    } finally {
      setSaldoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo]);

  /**
   * El modal de envío se abre siempre. La validación del saldo ocurre dentro del
   * modal, en el momento de CONFIRMAR el envío (ver ModalEnviarWhatsApp).
   */
  const handleAbrirEnvioWhatsApp = () => {
    setWhatsappModalOpen(true);
  };

  /** Llamado por el modal de envío cuando el backend responde 402 (saldo insuficiente). */
  const handleSaldoInsuficiente = (requeridos: number) => {
    setWhatsappModalOpen(false);
    setRequeridosCompra(requeridos);
    setComprarPlanOpen(true);
    fetchSaldo();
  };

  // Load filter unique option arrays
  const fetchFilterOptions = async () => {
    try {
      const [progData, centData, fichData] = await Promise.all([
        seguimientoAspirantesService.getProgramas(),
        seguimientoAspirantesService.getCentros(),
        seguimientoAspirantesService.getFichas(),
      ]);
      setProgramas(progData);
      setCentros(centData);
      setFichas(fichData);
    } catch (err) {
      console.error('Error al cargar opciones de filtro:', err);
    }
  };

  // Fetch applicants list
  const fetchAspirantes = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      
      const params: GetAspirantesParams = {
        page,
        per_page: perPage,
        programa: programaFilter || undefined,
        centro_formacion: centroFilter || undefined,
        ficha: fichaFilter || undefined,
        estado: estadoFilter || undefined,
        fecha_desde: fechaDesdeFilter || undefined,
        fecha_hasta: fechaHastaFilter || undefined,
        nombre: nombreFilter || undefined,
        celular: celularFilter || undefined
      };

      try {
        const response = await seguimientoAspirantesService.getAspirantes(params);
        setAspirantes(response.data);
        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setTotal(response.total);
        // Reset selections on page change
        setSelectedIds([]);
      } catch (err: any) {
        setError('Ocurrió un error al cargar la información de los aspirantes.');
        enqueueSnackbar('Error al cargar aspirantes', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [
      perPage,
      programaFilter,
      centroFilter,
      fichaFilter,
      estadoFilter,
      fechaDesdeFilter,
      fechaHastaFilter,
      nombreFilter,
      celularFilter,
      enqueueSnackbar
    ]
  );

  // Initial loads and reloads
  useEffect(() => {
    fetchFilterOptions();
    fetchAspirantes(currentPage);
  }, [reloadTrigger, perPage]);

  // Handle Search button
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAspirantes(1);
    fetchFilterOptions(); // Refresh filter options from current data
  };

  // Handle Reset filters button
  const handleClearFilters = () => {
    setProgramaFilter('');
    setCentroFilter('');
    setFichaFilter('');
    setEstadoFilter('');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
    setNombreFilter('');
    setCelularFilter('');
    setCurrentPage(1);
    
    // Quick delay to allow state updates before fetching
    setTimeout(() => {
      setLoading(true);
      const params: GetAspirantesParams = {
        page: 1,
        per_page: perPage
      };
      seguimientoAspirantesService.getAspirantes(params).then((response) => {
        setAspirantes(response.data);
        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setTotal(response.total);
        setSelectedIds([]);
        setLoading(false);
      }).catch(() => {
        setError('Error al recargar aspirantes');
        setLoading(false);
      });
    }, 100);
  };

  // Handle Page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchAspirantes(page);
    }
  };

  // Checkbox selection helpers
  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    if (checked) {
      const pageIds = aspirantes.map((asp) => asp.id);
      setSelectedIds(pageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = aspirantes.length > 0 && aspirantes.every((asp) => selectedIds.includes(asp.id));
  const isSomeSelected = aspirantes.some((asp) => selectedIds.includes(asp.id)) && !isAllSelected;

  // Deletion logic
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    confirmAction(
      `¿Está seguro de que desea eliminar los ${selectedIds.length} registros seleccionados? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await seguimientoAspirantesService.eliminarAspirantes(selectedIds);
          enqueueSnackbar('Registros eliminados correctamente.', { variant: 'success' });
          setSelectedIds([]);
          // Refresh list and filter options
          fetchAspirantes(currentPage);
          fetchFilterOptions();
        } catch (error) {
          enqueueSnackbar('Ocurrió un error al eliminar los registros seleccionados.', { variant: 'error' });
        }
      }
    );
  };

  const handleDeleteAll = () => {
    confirmAction(
      '¿Está seguro de que desea eliminar TODA la información de aspirantes importada? Esta acción borrará la tabla completa y no se puede deshacer.',
      async () => {
        try {
          await seguimientoAspirantesService.eliminarTodos();
          enqueueSnackbar('Toda la información ha sido eliminada con éxito.', { variant: 'success' });
          setSelectedIds([]);
          setCurrentPage(1);
          fetchAspirantes(1);
          fetchFilterOptions();
        } catch (error) {
          enqueueSnackbar('Ocurrió un error al eliminar toda la información.', { variant: 'error' });
        }
      }
    );
  };

  // Define react-table columns
  const columns = useMemo<ColumnDef<Aspirante>[]>(
    () => [
      {
        id: 'selection',
        header: () => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={isAllSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = isSomeSelected;
              }
            }}
            onChange={(e) => handleSelectAllOnPage(e.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => handleSelectRow(row.original.id)}
          />
        ),
        meta: { className: 'w-[50px]' }
      },
      {
        id: 'nombreCompleto',
        header: () => 'Nombre completo',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-gray-900">
            {`${row.original.nombre ?? ''} ${row.original.apellido ?? ''}`.trim() || 'N/A'}
          </span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-900 font-semibold' }
      },
      {
        accessorKey: 'celular',
        header: () => 'Celular',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]' }
      },
      {
        accessorKey: 'correo',
        header: () => 'Correo',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-600">{(info.getValue() as string) || '—'}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorKey: 'programa',
        header: () => 'Programa',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorKey: 'centro_formacion',
        header: () => 'Centro',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorKey: 'ficha',
        header: () => 'Ficha',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700 font-mono">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[100px]' }
      },
      {
        accessorKey: 'fecha_registro_excel',
        header: () => 'Fecha',
        enableSorting: true,
        cell: (info) => <span className="text-sm text-gray-700">{(info.getValue() as string) || '—'}</span>,
        meta: { className: 'min-w-[110px]' }
      },
      {
        accessorKey: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const val = (info.getValue() as string) || '';
          const label =
            val === 'SI' ? 'Continúa (Sí)' :
            val === 'NO' ? 'Cancela (No)' :
            val;
          return (
            <span className={clsx('badge badge-sm badge-outline', {
              'badge-secondary text-gray-600': val === 'Pendiente',
              'badge-primary': val === 'Enviado',
              'badge-info': val === 'Respondido',
              'badge-success': val === 'SI',
              'badge-danger': val === 'NO',
              'badge-warning': val === 'Error'
            })}>
              {label}
            </span>
          );
        },
        meta: { className: 'w-[130px]' }
      },
      {
        id: 'respuesta',
        header: () => 'Respuesta del aspirante',
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.respuesta) {
            return <span className="text-sm text-gray-400">Sin respuesta</span>;
          }
          return (
            <div className="flex flex-col">
              <span className="text-sm text-gray-800">{r.respuesta}</span>
              {r.fechaRespuesta && (
                <span className="text-2xs text-gray-400">{r.fechaRespuesta}</span>
              )}
            </div>
          );
        },
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorKey: 'estadoEnvio',
        header: () => 'Entrega',
        enableSorting: true,
        cell: ({ row }) => {
          const val = row.original.estadoEnvio;
          if (!val) return <span className="text-sm text-gray-400">—</span>;
          const badge = clsx('badge badge-sm badge-outline', {
            'badge-secondary text-gray-600': val === 'sent',
            'badge-info': val === 'delivered',
            'badge-success': val === 'read',
            'badge-danger': val === 'failed'
          });
          return (
            <div className="flex flex-col">
              <span className={badge}>{val}</span>
              {val === 'failed' && row.original.errorEnvio && (
                <span className="text-2xs text-danger mt-0.5">{row.original.errorEnvio}</span>
              )}
            </div>
          );
        },
        meta: { className: 'min-w-[120px]' }
      },
      {
        accessorKey: 'ultimo_envio',
        header: () => 'Último envío',
        enableSorting: true,
        cell: (info) => <span className="text-xs text-gray-500">{(info.getValue() as string) || '—'}</span>,
        meta: { className: 'min-w-[130px]' }
      },
      {
        accessorKey: 'cantidad_envios',
        header: () => 'Envíos',
        enableSorting: true,
        cell: (info) => <span className="text-sm font-semibold text-gray-700 text-center block w-full">{info.getValue() as number}</span>,
        meta: { className: 'w-[80px]' }
      }
    ],
    [selectedIds, aspirantes, isAllSelected, isSomeSelected]
  );

  return (
    <Fragment>
      {/* Indicadores de saldo de mensajes (encima del botón "Enviar WhatsApp") */}
      <SaldoMensajesIndicador
        saldo={saldo}
        loading={saldoLoading}
        seleccionados={selectedIds.length}
        onComprarPlan={() => {
          setRequeridosCompra(0);
          setComprarPlanOpen(true);
        }}
      />

      {/* Botones de acción superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setImportModalOpen(true)} 
            className="btn btn-sm btn-primary flex items-center gap-1.5"
          >
            <KeenIcon icon="file-sheet" />
            Importar Excel
          </button>

          <button 
            onClick={handleAbrirEnvioWhatsApp}
            disabled={selectedIds.length === 0}
            className="btn btn-sm btn-success flex items-center gap-1.5 disabled:opacity-50"
          >
            <KeenIcon icon="whatsapp" />
            Enviar WhatsApp ({selectedIds.length})
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="btn btn-sm btn-light flex items-center gap-1.5"
          >
            <KeenIcon icon="exit-down" />
            Exportar
          </button>

          <button
            onClick={() => setPlantillasModalOpen(true)}
            className="btn btn-sm btn-light flex items-center gap-1.5"
          >
            <KeenIcon icon="messages" />
            Plantillas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="btn btn-sm btn-light btn-outline btn-danger flex items-center gap-1.5 disabled:opacity-50"
          >
            <KeenIcon icon="trash" />
            Eliminar Seleccionados ({selectedIds.length})
          </button>

          <button
            onClick={handleDeleteAll}
            disabled={total === 0}
            className="btn btn-sm btn-danger flex items-center gap-1.5"
          >
            <KeenIcon icon="trash-square" />
            Eliminar Todos
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="card mb-7.5">
        <div className="card-header py-4">
          <h3 className="card-title flex items-center gap-2">
            <KeenIcon icon="setting-3" className="text-gray-500 text-lg" />
            Filtros de Búsqueda
          </h3>
        </div>
        <div className="card-body py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Nombre o Apellido</label>
            <input
              type="text"
              className="input input-sm"
              placeholder="Buscar por nombre..."
              value={nombreFilter}
              onChange={(e) => setNombreFilter(e.target.value)}
            />
          </div>

          {/* Celular */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Celular</label>
            <input
              type="text"
              className="input input-sm"
              placeholder="Buscar por celular..."
              value={celularFilter}
              onChange={(e) => setCelularFilter(e.target.value)}
            />
          </div>

          {/* Programa */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Programa</label>
            <select
              className="select select-sm w-full"
              value={programaFilter}
              onChange={(e) => setProgramaFilter(e.target.value)}
            >
              <option value="">Todos los programas</option>
              {programas.map((prog, idx) => (
                <option key={idx} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          {/* Centro */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Centro de Formación</label>
            <select
              className="select select-sm w-full"
              value={centroFilter}
              onChange={(e) => setCentroFilter(e.target.value)}
            >
              <option value="">Todos los centros</option>
              {centros.map((cent, idx) => (
                <option key={idx} value={cent}>{cent}</option>
              ))}
            </select>
          </div>

          {/* Ficha */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Ficha</label>
            <select
              className="select select-sm w-full"
              value={fichaFilter}
              onChange={(e) => setFichaFilter(e.target.value)}
            >
              <option value="">Todas las fichas</option>
              {fichas.map((fich, idx) => (
                <option key={idx} value={fich}>{fich}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Estado</label>
            <select
              className="select select-sm w-full"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Enviado">Enviado</option>
              <option value="Respondido">Respondió (otro)</option>
              <option value="SI">Continúa (Sí)</option>
              <option value="NO">Cancela (No)</option>
              <option value="Error">Error</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Fecha Desde</label>
            <input
              type="date"
              className="input input-sm"
              value={fechaDesdeFilter}
              onChange={(e) => setFechaDesdeFilter(e.target.value)}
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 font-semibold">Fecha Hasta</label>
            <input
              type="date"
              className="input input-sm"
              value={fechaHastaFilter}
              onChange={(e) => setFechaHastaFilter(e.target.value)}
            />
          </div>

          {/* Botones de filtros */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end gap-2.5 mt-2">
            <button 
              onClick={handleClearFilters} 
              className="btn btn-sm btn-light btn-outline flex items-center gap-1"
            >
              <KeenIcon icon="arrows-circle" />
              Limpiar filtros
            </button>
            <button 
              onClick={handleSearch} 
              className="btn btn-sm btn-primary flex items-center gap-1"
            >
              <KeenIcon icon="magnifier" />
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Resultados */}
      <div className="card card-grid min-w-full">
        <div className="card-header py-4 flex-wrap gap-2">
          <h3 className="card-title">Aspirantes Importados</h3>
          <span className="text-sm text-gray-500 font-medium">
            Mostrando {aspirantes.length} de {total} aspirantes
          </span>
        </div>
        <div className="card-body">
          {error ? (
            <div className="p-6 text-center text-red-500 font-medium">{error}</div>
          ) : (
            <DataGrid
              columns={columns}
              data={aspirantes}
              nativePagination={false}
              rowSelect={false}
              messages={{
                empty: loading ? 'Cargando registros...' : 'No se encontraron aspirantes que coincidan con los filtros.',
                loading: 'Cargando datos...'
              }}
              pagination={{ page: 0, size: perPage }}
            />
          )}
        </div>
      </div>

      {/* Footer de Paginación */}
      {total > 0 && !error && (
        <div className="card-footer mt-4 justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
          <div className="flex items-center gap-2">
            Mostrando
            <select
              className="select select-sm w-18"
              value={perPage}
              onChange={(e) => {
                setPerPage(+e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="15">15</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
            por página
          </div>

          <div className="flex items-center gap-4 order-1 md:order-2">
            <span>
              {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} de {total}
            </span>
            <div className="pagination flex gap-1.5">
              <button
                className="btn btn-sm btn-icon"
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <KeenIcon icon="black-left" />
              </button>

              {(() => {
                const pages = [];
                const delta = 2;

                // Page 1
                pages.push(
                  <button
                    key={1}
                    className={clsx('btn btn-sm', {
                      'btn-primary': currentPage === 1,
                      'btn-light': currentPage !== 1
                    })}
                    disabled={loading}
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                );

                if (currentPage > delta + 2) {
                  pages.push(
                    <span key="dots-start" className="flex items-center px-1 text-gray-400">
                      ...
                    </span>
                  );
                }

                const startPage = Math.max(2, currentPage - delta);
                const endPage = Math.min(totalPages - 1, currentPage + delta);

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={clsx('btn btn-sm', {
                        'btn-primary': currentPage === i,
                        'btn-light': currentPage !== i
                      })}
                      disabled={loading}
                      onClick={() => handlePageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }

                if (currentPage < totalPages - delta - 1) {
                  pages.push(
                    <span key="dots-end" className="flex items-center px-1 text-gray-400">
                      ...
                    </span>
                  );
                }

                if (totalPages > 1) {
                  pages.push(
                    <button
                      key={totalPages}
                      className={clsx('btn btn-sm', {
                        'btn-primary': currentPage === totalPages,
                        'btn-light': currentPage !== totalPages
                      })}
                      disabled={loading}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              <button
                className="btn btn-sm btn-icon"
                disabled={currentPage === totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación */}
      <ModalImportarAspirantes
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          onReload(); // Trigger reload in parent page
          fetchFilterOptions(); // Refresh autocomplete filters
        }}
      />

      {/* Modal de Envío de WhatsApp */}
      <ModalEnviarWhatsApp
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={() => {
          fetchAspirantes(currentPage);
          setSelectedIds([]);
          fetchSaldo();
        }}
        onSaldoInsuficiente={handleSaldoInsuficiente}
      />

      {/* Modal de Exportación */}
      <ModalExportarAspirantes
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        programas={programas}
        centros={centros}
        fichas={fichas}
      />

      {/* Modal de Plantillas */}
      <ModalPlantillas
        open={plantillasModalOpen}
        onClose={() => setPlantillasModalOpen(false)}
      />

      {/* Modal de compra de plan de mensajes */}
      <ModalComprarPlan
        open={comprarPlanOpen}
        onClose={() => setComprarPlanOpen(false)}
        mensajesRequeridos={requeridosCompra}
        mensajesDisponibles={saldo?.mensajesDisponibles ?? 0}
        onSolicitudEnviada={fetchSaldo}
      />
    </Fragment>
  );
};

export { SeguimientoAspirantesContent };
