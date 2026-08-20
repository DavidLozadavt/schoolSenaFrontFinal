import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import {
  solicitudesInscripcionService,
  SolicitudDetalle,
} from '@/services/solicitudesInscripcionService';

interface ModalDetalleSolicitudProps {
  open: boolean;
  aspiranteId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ACCION_LABELS: Record<string, string> = {
  formulario_enviado: 'Formulario enviado',
  reenviado: 'Formulario reenviado',
  documentacion_completa: 'Documentación completa',
  documentacion_incompleta: 'Documentación incompleta',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const ModalDetalleSolicitud = ({ open, aspiranteId, onClose, onSuccess }: ModalDetalleSolicitudProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [detalle, setDetalle] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [showMotivoInput, setShowMotivoInput] = useState(false);

  useEffect(() => {
    if (open && aspiranteId) {
      setLoading(true);
      setShowMotivoInput(false);
      setMotivo('');
      solicitudesInscripcionService
        .getDetalle(aspiranteId)
        .then(setDetalle)
        .catch(() => enqueueSnackbar('Error al cargar el detalle de la solicitud.', { variant: 'error' }))
        .finally(() => setLoading(false));
    }
  }, [open, aspiranteId]);

  const handleAprobar = async () => {
    if (!aspiranteId) return;
    setProcessing(true);
    try {
      await solicitudesInscripcionService.aprobar(aspiranteId);
      enqueueSnackbar('Solicitud aprobada. Correo enviado al aspirante.', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al aprobar la solicitud.', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRechazar = async () => {
    if (!aspiranteId) return;
    if (motivo.trim().length < 5) {
      enqueueSnackbar('El motivo del rechazo es obligatorio (mínimo 5 caracteres).', { variant: 'warning' });
      return;
    }
    setProcessing(true);
    try {
      await solicitudesInscripcionService.rechazar(aspiranteId, motivo.trim());
      enqueueSnackbar('Solicitud rechazada. Correo enviado al aspirante con el enlace de corrección.', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al rechazar la solicitud.', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const aspirante = detalle?.aspirante;
  const preguntas = detalle?.respuesta?.formulario?.preguntas ?? [];
  const valores = detalle?.respuesta?.respuestas ?? [];
  const yaRevisado = aspirante?.estadoDocumental === 'aprobado' || aspirante?.estadoDocumental === 'rechazado';

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[720px] top-[5%] p-4 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="document" className="text-primary text-2xl" />
            Solicitud de inscripción
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose} disabled={processing}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="overflow-y-auto grow">
          {loading || !detalle ? (
            <div className="flex items-center justify-center py-10 text-gray-500">Cargando...</div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nombre:</span> <span className="font-semibold">{aspirante?.nombre} {aspirante?.apellido}</span></div>
                <div><span className="text-gray-500">Celular:</span> {aspirante?.celular}</div>
                <div><span className="text-gray-500">Correo:</span> {aspirante?.correo || '—'}</div>
                <div><span className="text-gray-500">Programa:</span> {aspirante?.programa}</div>
                <div><span className="text-gray-500">Ficha:</span> {aspirante?.ficha}</div>
                <div><span className="text-gray-500">Centro:</span> {aspirante?.centro_formacion}</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Documentos e información diligenciada</h4>
                {!detalle.respuesta ? (
                  <p className="text-sm text-gray-400">El aspirante aún no ha enviado el formulario.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {preguntas.map((p) => {
                      const val = valores.find((v) => v.idPregunta === p.id)?.valor;
                      const esArchivo = p.tipo === 'archivo';
                      return (
                        <div key={p.id} className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-sm text-gray-600">{p.titulo}{p.esObligatoria ? ' *' : ''}</span>
                          {esArchivo && val ? (
                            <a href={val} target="_blank" rel="noreferrer" className="btn btn-xs btn-light">
                              <KeenIcon icon="file-down" /> Ver / Descargar
                            </a>
                          ) : (
                            <span className="text-sm text-gray-800">{val || '—'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Historial</h4>
                <div className="flex flex-col gap-2">
                  {detalle.historial.length === 0 && (
                    <p className="text-sm text-gray-400">Sin eventos registrados.</p>
                  )}
                  {detalle.historial.map((h) => (
                    <div key={h.id} className="flex flex-col text-sm border-l-2 border-gray-200 pl-3">
                      <span className="font-medium text-gray-800">
                        {ACCION_LABELS[h.accion] || h.accion}
                        {h.usuarioRevisor ? ` — ${h.usuarioRevisor.email}` : ''}
                      </span>
                      {h.motivo && <span className="text-gray-500">Motivo: {h.motivo}</span>}
                      <span className="text-2xs text-gray-400">{h.fecha}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!yaRevisado && (
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                  {showMotivoInput && (
                    <textarea
                      className="textarea textarea-sm"
                      placeholder="Motivo del rechazo (obligatorio)"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                    />
                  )}
                  <div className="flex justify-end gap-2">
                    {!showMotivoInput ? (
                      <button
                        className="btn btn-sm btn-danger btn-light"
                        onClick={() => setShowMotivoInput(true)}
                        disabled={processing}
                      >
                        Rechazar
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={handleRechazar}
                        disabled={processing}
                      >
                        Confirmar rechazo
                      </button>
                    )}
                    <button
                      className={clsx('btn btn-sm btn-success', processing && 'opacity-70')}
                      onClick={handleAprobar}
                      disabled={processing}
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalDetalleSolicitud };
