import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import Select from 'react-select';
import Spinner from '@/components/loaders/Spinner';
import { useSnackbar } from 'notistack';
import { getAsignacionProceso, getNombreProcesoConfiguracion } from '@/pages/configuracion-pagos/configuracionPagosShared';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated?: (facturaId?: number) => void;
}

const formatCop = (valor: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    valor
  );

const resolverValorConcepto = (row: Record<string, unknown>): number => {
  const vig = row.configuracionPagoVigenciaActual as { valor?: number } | undefined;
  return Number(vig?.valor ?? row.valor ?? 0);
};

const ModalGenerarFacturaValoresEconomicos = ({ open, onClose, onGenerated }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [procesos, setProcesos] = useState<Array<{ id: number; nombreProceso: string }>>([]);
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [idProceso, setIdProceso] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCatalogos = useCallback(async () => {
    setLoading(true);
    try {
      const [procesosRes, configsRes] = await Promise.all([
        axios.get('procesos'),
        axios.get('configuraciones_pago')
      ]);
      setProcesos(Array.isArray(procesosRes.data) ? procesosRes.data : []);
      setConfiguraciones(Array.isArray(configsRes.data) ? configsRes.data : []);
    } catch {
      enqueueSnackbar('No fue posible cargar procesos o valores económicos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (open) {
      loadCatalogos();
      setIdProceso(null);
      setSelectedIds([]);
    }
  }, [open, loadCatalogos]);

  const conceptosDelProceso = useMemo(() => {
    if (!idProceso) return [];
    return configuraciones.filter((row) => {
      const asignacion = getAsignacionProceso(row);
      const idProc = Number(asignacion?.idProceso ?? 0);
      const activo = String(row.estado ?? '').toUpperCase() === 'ACTIVO';
      return idProc === idProceso && activo;
    });
  }, [configuraciones, idProceso]);

  useEffect(() => {
    if (conceptosDelProceso.length > 0) {
      setSelectedIds(conceptosDelProceso.map((c) => Number(c.id)));
    } else {
      setSelectedIds([]);
    }
  }, [conceptosDelProceso]);

  const procesoOptions = procesos.map((p) => ({
    value: p.id,
    label: p.nombreProceso
  }));

  const totalSeleccionado = useMemo(() => {
    return conceptosDelProceso
      .filter((c) => selectedIds.includes(Number(c.id)))
      .reduce((acc, row) => acc + resolverValorConcepto(row), 0);
  }, [conceptosDelProceso, selectedIds]);

  const toggleConcepto = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerar = async () => {
    if (!idProceso) {
      enqueueSnackbar('Seleccione un proceso.', { variant: 'warning' });
      return;
    }
    if (selectedIds.length === 0) {
      enqueueSnackbar('Seleccione al menos un concepto.', { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('generar_factura_valores_economicos', {
        idProceso,
        conceptos: selectedIds.map((idConfiguracionPago) => ({ idConfiguracionPago }))
      });
      enqueueSnackbar(
        response.data?.message
          ? String(response.data.message).replace(/acad[eé]mica/gi, '').replace(/\s+/g, ' ').trim() ||
            'Factura generada correctamente.'
          : 'Factura generada correctamente.',
        { variant: 'success' }
      );
      onGenerated?.(response.data?.factura?.id);
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        'No fue posible generar la factura.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Generar factura</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label text-sm">Proceso</label>
                <Select
                  options={procesoOptions}
                  placeholder="Seleccione proceso (ej. MATRICULA)"
                  value={procesoOptions.find((o) => o.value === idProceso) ?? null}
                  onChange={(opt) => setIdProceso(opt?.value ?? null)}
                />
              </div>

              {idProceso ? (
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Conceptos del proceso
                  </p>
                  {conceptosDelProceso.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay valores económicos activos para este proceso.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 dark:border-gray-600">
                      {conceptosDelProceso.map((row) => {
                        const id = Number(row.id);
                        const checked = selectedIds.includes(id);
                        return (
                          <li key={id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm mt-1"
                              checked={checked}
                              onChange={() => toggleConcepto(id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {row.titulo}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getNombreProcesoConfiguracion(row)} · $
                                {formatCop(resolverValorConcepto(row))}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
                    Total estimado: <strong>${formatCop(totalSeleccionado)}</strong>
                  </p>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-sm btn-light" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={submitting || !idProceso || selectedIds.length === 0}
                  onClick={handleGenerar}
                >
                  {submitting ? 'Generando…' : 'Generar factura'}
                </button>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalGenerarFacturaValoresEconomicos };
