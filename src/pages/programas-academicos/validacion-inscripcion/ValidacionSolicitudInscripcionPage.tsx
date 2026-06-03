import { Fragment, useMemo, useState } from 'react';
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
import { getFacturaPorSolicitud } from './mockFacturaSolicitud';
import { getSolicitudPorId } from './mockSolicitudesInscripcion';
import {
  buildValidacionPayload,
  initialWizardState,
  ValidacionSolicitudWizardState
} from './validacionSolicitudTypes';
import Paso1RecibirInscripcion from './steps/Paso1RecibirInscripcion';
import Paso2RevisionPago from './steps/Paso2RevisionPago';
import Paso3InformacionSolicitante from './steps/Paso3InformacionSolicitante';
import Paso4PagoMatricula from './steps/Paso4PagoMatricula';
import Paso5ValidacionFinal from './steps/Paso5ValidacionFinal';

const STEPS = [
  { number: 1, title: 'Recibir inscripción', icon: 'ki-document' },
  { number: 2, title: 'Revisión de pago', icon: 'ki-bill' },
  { number: 3, title: 'Información solicitante', icon: 'ki-profile-user' },
  { number: 4, title: 'Pago de matrícula', icon: 'ki-wallet' },
  { number: 5, title: 'Validación final', icon: 'ki-check-circle' }
];

const ValidacionSolicitudInscripcionPage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const { idSolicitud } = useParams<{ idSolicitud: string }>();
  const solicitudId = Number(idSolicitud);

  const solicitud = useMemo(() => getSolicitudPorId(solicitudId), [solicitudId]);
  const factura = useMemo(
    () => (solicitud ? getFacturaPorSolicitud(solicitud.idSolicitud) : null),
    [solicitud]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [wizard, setWizard] = useState<ValidacionSolicitudWizardState>(initialWizardState);

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
        return wizard.informacionRevisada;
      case 3:
        if (!requiereRegistroPago) return true;
        return wizard.pagoRegistrado;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const aplicarRevisionPagoAlSalirPaso2 = () => {
    const requiere =
      Boolean(solicitud?.requierePago && factura?.requierePago && factura);
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
    if (from === 2 && omitirPasoPago) return 4;
    return Math.min(from + 1, STEPS.length - 1);
  };

  const getPrevStepIndex = (from: number): number => {
    if (from === 4 && omitirPasoPago) return 2;
    return Math.max(from - 1, 0);
  };

  const goNext = () => {
    if (!puedeAvanzar()) return;
    setCurrentStep(getNextStepIndex(currentStep));
  };

  const goPrev = () => {
    setCurrentStep(getPrevStepIndex(currentStep));
  };

  const handleFinalizar = () => {
    if (!solicitud) return;
    const payload = buildValidacionPayload(solicitud, factura, wizard);
    console.log('Payload validación solicitud inscripción:', payload);
    alert(
      'Maqueta: validación registrada en consola. Sin guardar en servidor hasta conectar backend.'
    );
    navigate('/gestion-academica/inscripciones/solicitudes');
  };

  if (!solicitud) {
    return (
      <Container>
        <p className="py-10 text-sm text-center text-gray-500">Solicitud no encontrada.</p>
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

  const payloadPreview = buildValidacionPayload(solicitud, factura, wizard);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
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
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => {
              const omitido = index === 3 && omitirPasoPago;
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
                recibida={wizard.recibida}
                onRecibidaChange={(v) => setWizard((w) => ({ ...w, recibida: v }))}
              />
            )}
            {currentStep === 1 && <Paso2RevisionPago solicitud={solicitud} factura={factura} />}
            {currentStep === 2 && (
              <Paso3InformacionSolicitante
                solicitud={solicitud}
                revisada={wizard.informacionRevisada}
                onRevisadaChange={(v) => setWizard((w) => ({ ...w, informacionRevisada: v }))}
              />
            )}
            {currentStep === 3 && (
              <Paso4PagoMatricula
                factura={factura}
                requiereRegistroPago={requiereRegistroPago}
                pagoRegistrado={wizard.pagoRegistrado}
                medioSeleccionado={wizard.medioPagoSeleccionado}
                tipoSeleccionado={wizard.tipoPagoSeleccionado}
                onMedioChange={(m) => setWizard((w) => ({ ...w, medioPagoSeleccionado: m }))}
                onTipoChange={(t) => setWizard((w) => ({ ...w, tipoPagoSeleccionado: t }))}
                onPagoRegistradoChange={(v) => setWizard((w) => ({ ...w, pagoRegistrado: v }))}
              />
            )}
            {currentStep === 4 && (
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
                className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700"
              >
                Finalizar validación (maqueta)
              </button>
            )}
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export default ValidacionSolicitudInscripcionPage;
