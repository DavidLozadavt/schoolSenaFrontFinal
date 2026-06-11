import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import Spinner from '@/components/loaders/Spinner';
import {
  buildValidacionPayload,
  initialWizardState,
  ValidacionSolicitudWizardState,
  FacturaSolicitudMock
} from './validacionSolicitudTypes';
import {
  EstudianteSolicitudInscripcion,
  SolicitudInscripcion,
  RespuestasFormulario
} from './solicitudInscripcionTypes';
import { fetchSolicitudInscripcionDetalle, mapFacturaApiToMock, aprobarValidacionSolicitudInscripcion, notificarRecepcionSolicitudInscripcion } from './validacionInscripcionApi';
import Paso1RecibirInscripcion from './steps/Paso1RecibirInscripcion';
import Paso2RevisionPago from './steps/Paso2RevisionPago';
import Paso4PagoMatricula from './steps/Paso4PagoMatricula';
import Paso5ValidacionFinal from './steps/Paso5ValidacionFinal';

const STEPS = [
  { number: 1, title: 'Información del aspirante', icon: 'ki-profile-user' },
  { number: 2, title: 'Revisión de pago', icon: 'ki-bill' },
  { number: 3, title: 'Pago de matrícula', icon: 'ki-wallet' },
  { number: 4, title: 'Resumen', icon: 'ki-check-circle' }
];

const ValidacionSolicitudInscripcionPage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const { idSolicitud } = useParams<{ idSolicitud: string }>();
  const idFactura = Number(idSolicitud);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solicitud, setSolicitud] = useState<SolicitudInscripcion | null>(null);
  const [estudiante, setEstudiante] = useState<EstudianteSolicitudInscripcion | null>(null);
  const [respuestasFormulario, setRespuestasFormulario] = useState<RespuestasFormulario | null>(null);
  const [factura, setFactura] = useState<FacturaSolicitudMock | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [wizard, setWizard] = useState<ValidacionSolicitudWizardState>(initialWizardState);
  const [documentosPago, setDocumentosPago] = useState<any[]>([]);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (!idFactura || Number.isNaN(idFactura)) {
      setLoading(false);
      setSolicitud(null);
      return;
    }

    let cancelado = false;
    (async () => {
      setLoading(true);
      setError('');
      setWizard(initialWizardState);
      setCurrentStep(0);
      try {
        const detalle = await fetchSolicitudInscripcionDetalle(idFactura);
        if (cancelado) return;
        setSolicitud(detalle.solicitud);
        setEstudiante(detalle.estudiante);
        setFactura(mapFacturaApiToMock(detalle.factura, detalle.solicitud.idSolicitud));
        setRespuestasFormulario(detalle.respuestasFormulario);
        setDocumentosPago(detalle.documentosPago ?? []);
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setError('No se pudo cargar la solicitud. Verifique que la factura exista.');
          setSolicitud(null);
          setEstudiante(null);
          setFactura(null);
          setRespuestasFormulario(null);
          setDocumentosPago([]);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [idFactura]);

  const omitirPasoPago = useMemo(() => {
    if (!solicitud?.requierePago) return true;
    if (!factura || !factura.requierePago) return true;
    if (factura.estadoFactura === 'PAGADA') return true;
    if (factura.estadoFactura === 'ANULADA') return true;
    if (factura.estadoFactura === 'EN_PROCESO') return true;
    return false;
  }, [solicitud, factura]);

  const requiereRegistroPago = useMemo(
    () =>
      Boolean(
        solicitud?.requierePago &&
          factura?.requierePago &&
          factura.estadoFactura === 'PENDIENTE' &&
          factura.saldoPendiente > 0
      ),
    [solicitud, factura]
  );

  const puedeAvanzar = (): boolean => {
    switch (currentStep) {
      case 0:
        return wizard.recibida;
      case 1:
        return true;
      case 2:
        if (!requiereRegistroPago) return true;
        return wizard.pagoRegistrado;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const aplicarRevisionPagoAlSalirPaso2 = () => {
    const requiere = Boolean(solicitud?.requierePago && factura?.requierePago && factura);
    setWizard((w) => ({
      ...w,
      pagoRevisado: true,
      pagoRequerido: requiere
    }));
  };

  const getNextStepIndex = (from: number): number => {
    if (from === 1) {
      aplicarRevisionPagoAlSalirPaso2();
      return 2;
    }
    if (from === 2 && omitirPasoPago) return 3;
    return Math.min(from + 1, STEPS.length - 1);
  };

  const getPrevStepIndex = (from: number): number => {
    if (from === 3 && omitirPasoPago) return 1;
    return Math.max(from - 1, 0);
  };

  const goNext = async () => {
    if (!puedeAvanzar()) return;
    const nextIdx = getNextStepIndex(currentStep);
    // Paso 1 → enviar correo de recepción al aspirante (fire-and-forget, no bloquea)
    if (currentStep === 0 && idFactura && !Number.isNaN(idFactura)) {
      notificarRecepcionSolicitudInscripcion(idFactura).catch((err) =>
        console.warn('No se pudo enviar correo de recepción:', err)
      );
    }
    setCurrentStep(nextIdx);
  };

  const goPrev = () => {
    setCurrentStep(getPrevStepIndex(currentStep));
  };

  const handleFinalizar = async () => {
    if (!idFactura || Number.isNaN(idFactura)) return;

    // Bloquear si existe saldo pendiente o la factura no está pagada/aprobada
    const saldo = factura?.saldoPendiente ?? solicitud?.saldoPendiente ?? 0;
    const estadoFactRaw = (factura?.estadoFactura ?? solicitud?.estadoFactura ?? 'PENDIENTE').toUpperCase();
    if (saldo > 0 || (estadoFactRaw !== 'PAGADA' && estadoFactRaw !== 'PAGADO')) {
      setError('Debe aprobarse el pago antes de finalizar la inscripción.');
      return;
    }

    setFinalizando(true);
    setError('');
    try {
      if (solicitud?.estado !== 'APROBADA' && !solicitud?.validacionCompletada) {
        await aprobarValidacionSolicitudInscripcion(idFactura, wizard.observacionesFinales || undefined);
      }
      navigate('/gestion-academica/inscripciones/solicitudes?tab=aprobadas');
    } catch (err) {
      console.error(err);
      setError('No se pudo registrar la aprobación. Verifique que la factura esté pagada e intente de nuevo.');
    } finally {
      setFinalizando(false);
    }
  };

  const yaAprobada = solicitud?.estado === 'APROBADA' || solicitud?.validacionCompletada;

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center py-20">
          <Spinner />
          <p className="mt-3 text-sm text-gray-500">Cargando solicitud y factura…</p>
        </div>
      </Container>
    );
  }

  if (error || !solicitud) {
    return (
      <Container>
        <p className="py-10 text-sm text-center text-gray-500">
          {error || 'Solicitud no encontrada.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/gestion-academica/inscripciones/solicitudes')}
          className="mx-auto block px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary"
        >
          Volver al listado
        </button>
      </Container>
    );
  }

  const payloadPreview = buildValidacionPayload(solicitud, factura, wizard, estudiante);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Validar solicitud" />
              <ToolbarDescription>
                {solicitud.numeroSolicitud} — {solicitud.nombreEstudiante}
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                type="button"
                onClick={() => navigate('/gestion-academica/inscripciones/solicitudes')}
                className="btn btn-sm btn-light"
              >
                Volver al listado
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="max-w-5xl mx-auto py-4 space-y-6">
          {yaAprobada && (
            <div className="p-4 text-sm border border-emerald-200 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200">
              Esta solicitud ya fue validada y aprobada. Puede revisar el resumen o volver al listado
              de aprobadas.
            </div>
          )}

          {error && (
            <div className="p-4 text-sm border border-red-200 rounded-xl bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => {
              const omitido = index === 2 && omitirPasoPago;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase rounded-lg border transition-colors ${
                    currentStep === index
                      ? 'border-primary bg-primary text-white'
                      : omitido
                        ? 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-coal-400/50'
                        : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <i className={`ki-outline ${step.icon}`} />
                  {step.title}
                  {omitido && (
                    <span className="text-[9px] font-bold normal-case opacity-80">(omitido)</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6 border border-gray-200 rounded-2xl bg-white dark:bg-coal-500 dark:border-white/10 min-h-[320px]">
            {currentStep === 0 && (
              <Paso1RecibirInscripcion
                solicitud={solicitud}
                estudiante={estudiante}
                respuestasFormulario={respuestasFormulario}
                recibida={wizard.recibida}
                onRecibidaChange={(v) => setWizard((w) => ({ ...w, recibida: v }))}
              />
            )}
            {currentStep === 1 && <Paso2RevisionPago solicitud={solicitud} factura={factura} documentosPago={documentosPago} onAprobado={() => { setCurrentStep(2); }} onRechazado={() => { setCurrentStep(2); }} />}
            {currentStep === 2 && (
              <Paso4PagoMatricula
                factura={factura}
                requiereRegistroPago={requiereRegistroPago}
                pagoRegistrado={wizard.pagoRegistrado}
                medioSeleccionado={wizard.medioPagoSeleccionado}
                tipoSeleccionado={wizard.tipoPagoSeleccionado}
                onMedioChange={(m) => setWizard((w) => ({ ...w, medioPagoSeleccionado: m }))}
                onTipoChange={(t) => setWizard((w) => ({ ...w, tipoPagoSeleccionado: t }))}
                onPagoRegistradoChange={(v) => setWizard((w) => ({ ...w, pagoRegistrado: v }))}
                onFacturaActualizada={setFactura}
              />
            )}
            {currentStep === 3 && (
              <Paso5ValidacionFinal
                payload={payloadPreview}
                observaciones={wizard.observacionesFinales}
                onObservacionesChange={(v) =>
                  setWizard((w) => ({ ...w, observacionesFinales: v }))
                }
              />
            )}
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-xs font-bold uppercase border border-gray-300 rounded-lg disabled:opacity-50 dark:border-white/20"
            >
              Anterior
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!puedeAvanzar()}
                className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalizar}
                disabled={finalizando}
                className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {finalizando
                  ? 'Guardando…'
                  : yaAprobada
                    ? 'Volver al listado'
                    : 'Aprobar y volver al listado'}
              </button>
            )}
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export default ValidacionSolicitudInscripcionPage;
