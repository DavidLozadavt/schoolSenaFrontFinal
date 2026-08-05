import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { seguimientoAspirantesService, WhatsappPlantilla } from '@/services/seguimientoAspirantesService';
import { plantillasMetaService, PlantillaMeta } from '@/services/plantillasMetaService';
import { planesMensajesService, SaldoMensajes } from '@/services/planesMensajesService';

interface ModalEnviarWhatsAppProps {
  open: boolean;
  onClose: () => void;
  selectedIds: number[];
  onSuccess: () => void;
  /**
   * Aditivo (planes de mensajes): el backend responde 402 cuando el usuario no
   * tiene saldo para TODOS los destinatarios. No se envía ni se descuenta nada.
   */
  onSaldoInsuficiente?: (mensajesRequeridos: number) => void;
}

// Plantilla OFICIAL única aprobada en Meta (debe coincidir con el backend).
const PLANTILLA_OFICIAL = 'seguimiento_interes_programa_sena_v2';

const ModalEnviarWhatsApp = ({
  open,
  onClose,
  selectedIds,
  onSuccess,
  onSaldoInsuficiente
}: ModalEnviarWhatsAppProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [plantillaBd, setPlantillaBd] = useState<WhatsappPlantilla | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);

  // Busca en BD la plantilla oficial (para mostrar su texto registrado).
  const fetchPlantillas = async () => {
    setLoadingPlantillas(true);
    try {
      const data = await seguimientoAspirantesService.getPlantillas();
      const oficial = data.find(
        (p) => p.nombre.trim().toLowerCase() === PLANTILLA_OFICIAL.toLowerCase()
      );
      setPlantillaBd(oficial ?? null);
    } catch (err) {
      console.error('Error al cargar la plantilla oficial:', err);
      enqueueSnackbar('No se pudo cargar la plantilla oficial de la base de datos.', { variant: 'error' });
    } finally {
      setLoadingPlantillas(false);
    }
  };

  // Aditivo: plantillas de Meta en estado APPROVED. Solo estas pueden usarse.
  const [aprobadasMeta, setAprobadasMeta] = useState<PlantillaMeta[]>([]);

  const fetchAprobadasMeta = async () => {
    try {
      setAprobadasMeta(await plantillasMetaService.listar({ soloAprobadas: true }));
    } catch (err) {
      // El listado de Meta es informativo: si falla, el envío sigue igual que antes.
      console.error('No se pudieron cargar las plantillas aprobadas de Meta:', err);
    }
  };

  // Aditivo: saldo del usuario. Se consulta al abrir el modal y se valida en el
  // momento de CONFIRMAR el envío (no antes de abrir el modal).
  const [saldo, setSaldo] = useState<SaldoMensajes | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  const fetchSaldo = async () => {
    setLoadingSaldo(true);
    try {
      setSaldo(await planesMensajesService.getMiSaldo());
    } catch (err) {
      console.error('No se pudo consultar el saldo de mensajes:', err);
    } finally {
      setLoadingSaldo(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPlantillas();
      fetchAprobadasMeta();
      fetchSaldo();
    }
  }, [open]);

  // Resumen mostrado antes de confirmar el envío.
  const mensajesSeleccionados = selectedIds.length;
  const disponibles = saldo?.mensajesDisponibles ?? 0;
  const restante = disponibles - mensajesSeleccionados;
  const saldoInsuficiente = !!saldo && mensajesSeleccionados > disponibles;

  const oficialAprobadaEnMeta = aprobadasMeta.some(
    (p) => p.nombre.trim().toLowerCase() === PLANTILLA_OFICIAL.toLowerCase()
  );

  const isRegistered = !!plantillaBd;

  const handleSend = async () => {
    if (!isRegistered) {
      enqueueSnackbar('La plantilla oficial no está registrada en el sistema.', { variant: 'warning' });
      return;
    }

    // Validación de saldo EN EL MOMENTO DE CONFIRMAR: si no alcanza, no se
    // ejecuta ningún envío, no se consume saldo y se abre el modal de compra.
    if (saldoInsuficiente) {
      onSaldoInsuficiente?.(mensajesSeleccionados);
      return;
    }

    setLoading(true);
    try {
      const response = await seguimientoAspirantesService.enviarWhatsApp(selectedIds);
      enqueueSnackbar(response.message || 'Campaña enviada.', { variant: 'success' });
      onSuccess();
      handleClose();
    } catch (error: any) {
      // Aditivo: 402 => saldo de mensajes insuficiente. No se envió nada.
      if (error?.response?.status === 402 || error?.response?.data?.saldoInsuficiente) {
        const requeridos = error?.response?.data?.mensajesRequeridos ?? selectedIds.length;
        onSaldoInsuficiente?.(requeridos);
        setLoading(false);
        return;
      }

      const apiError = error?.response?.data?.error || error?.message || 'Error desconocido';
      enqueueSnackbar(`Error al enviar mensajes: ${apiError}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="whatsapp" className="text-success text-2xl" />
            Enviar Campaña de WhatsApp
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={handleClose} disabled={loading}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5 overflow-y-auto">
          <div className="flex flex-col gap-3 px-4">
            <div className="bg-gray-100 border border-gray-200 rounded p-3 text-sm text-gray-700">
              <span className="font-semibold block mb-1">Resumen del Envío:</span>
              Se enviará la plantilla oficial a los{' '}
              <strong className="text-gray-900">{selectedIds.length}</strong> aspirantes seleccionados
              con las variables: <em>nombre, programa, ficha y centro</em>.
            </div>

            {/* Resumen de saldo antes de confirmar el envío (aditivo) */}
            {loadingSaldo && !saldo ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="spinner-border spinner-border-sm" />
                Consultando saldo de mensajes...
              </div>
            ) : saldo ? (
              <div
                className={`rounded border p-3 text-sm ${
                  saldoInsuficiente
                    ? 'border-danger/30 bg-danger/5'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <span className="font-semibold block mb-1 text-gray-900">Resumen de saldo</span>
                <div className="flex justify-between">
                  <span>Mensajes seleccionados</span>
                  <strong className="text-gray-900">{mensajesSeleccionados}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Saldo disponible</span>
                  <strong className="text-gray-900">{disponibles}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Saldo restante después del envío</span>
                  <strong className={saldoInsuficiente ? 'text-danger' : 'text-gray-900'}>
                    {restante}
                  </strong>
                </div>

                {saldoInsuficiente && (
                  <div className="mt-2 border-t border-danger/20 pt-2">
                    <p className="font-semibold text-danger">
                      No dispones de suficientes mensajes para realizar este envío.
                    </p>
                    <p className="text-danger">
                      No se enviará ningún mensaje hasta adquirir un plan.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary mt-2 flex items-center gap-1.5"
                      onClick={() => onSaldoInsuficiente?.(mensajesSeleccionados)}
                    >
                      <KeenIcon icon="dollar" />
                      Comprar Plan
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Plantilla oficial (no editable) */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs text-gray-700 font-bold uppercase">Plantilla Oficial</label>
              <input type="text" className="input w-full bg-gray-50" value={PLANTILLA_OFICIAL} readOnly disabled />
              {/* Estado real en Meta (informativo, no altera el envío) */}
              {aprobadasMeta.length > 0 && (
                <span className="text-2xs">
                  {oficialAprobadaEnMeta ? (
                    <span className="badge badge-sm badge-success">APPROVED en Meta</span>
                  ) : (
                    <span className="badge badge-sm badge-warning">
                      Sin estado APPROVED registrado en el administrador de plantillas
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Texto registrado (solo lectura) */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs text-gray-700 font-bold uppercase">Mensaje de WhatsApp (Solo lectura)</label>
              <textarea
                className={`textarea w-full h-[90px] ${isRegistered ? 'bg-gray-50 text-gray-700' : 'border-danger text-danger bg-red-50'}`}
                value={
                  loadingPlantillas
                    ? 'Cargando plantilla...'
                    : isRegistered
                      ? plantillaBd!.mensaje
                      : '⚠️ La plantilla oficial no está registrada en la base de datos.'
                }
                readOnly
                disabled={loading}
              />
              <span className="text-2xs">
                {isRegistered ? (
                  <span className="text-success font-medium">✔️ Plantilla oficial verificada. Lista para enviar.</span>
                ) : (
                  <span className="text-danger font-medium">❌ Registre la plantilla “{PLANTILLA_OFICIAL}” para poder enviar.</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4 border-t border-gray-200 pt-4">
            <button className="btn btn-sm btn-secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-success flex items-center gap-1.5"
              onClick={handleSend}
              disabled={loading || selectedIds.length === 0 || !isRegistered}
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <KeenIcon icon="send" />
                  Enviar Mensaje
                </>
              )}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalEnviarWhatsApp };
