import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
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
import DatosFormularioInscripcionPanel from './components/DatosFormularioInscripcionPanel';
import { SolicitudRecibidaDetalle } from './solicitudInscripcionTypes';
import {
  confirmarInformacionSolicitudRecibida,
  fetchSolicitudRecibidaDetalle
} from './validacionInscripcionApi';

const ValidacionSolicitudRecibidaPage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const { idFormularioRespuesta } = useParams<{ idFormularioRespuesta: string }>();
  const id = Number(idFormularioRespuesta);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState<SolicitudRecibidaDetalle | null>(null);
  const [procesos, setProcesos] = useState<Array<{ id: number; nombreProceso: string }>>([]);
  const [idProceso, setIdProceso] = useState<number | null>(null);
  const [correo, setCorreo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }

    let cancelado = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [det, procRes] = await Promise.all([
          fetchSolicitudRecibidaDetalle(id),
          axios.get('procesos')
        ]);
        if (cancelado) return;
        setDetalle(det);
        setCorreo(det.datosFormulario.estudiante.email ?? '');
        setIdProceso(det.idProceso ?? null);
        setProcesos(Array.isArray(procRes.data) ? procRes.data : []);
      } catch {
        if (!cancelado) {
          setError('No se pudo cargar la solicitud recibida.');
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [id]);

  const yaConfirmada = Boolean(detalle?.informacionConfirmada);

  const handleConfirmar = async () => {
    if (!correo.trim()) {
      setError('Indique el correo electrónico del estudiante.');
      return;
    }
    if (!idProceso) {
      setError('Seleccione el proceso académico para generar la factura.');
      return;
    }

    setEnviando(true);
    setError('');
    setMensaje('');
    try {
      const res = await confirmarInformacionSolicitudRecibida(id, {
        correo: correo.trim(),
        idProceso,
        fechaLimitePago: fechaLimite || undefined,
        observaciones: observaciones.trim() || undefined
      });
      setMensaje(res.message);
      if (res.idFactura) {
        navigate(`/gestion-academica/inscripciones/solicitudes/${res.idFactura}/validar`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo confirmar la información.';
      setError(msg);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Container width={currentLayout?.name === 'secondary-layout' ? 'fluid' : 'fixed'}>
        <div className="flex flex-col items-center py-20">
          <Spinner />
        </div>
      </Container>
    );
  }

  if (error && !detalle) {
    return (
      <Container width={currentLayout?.name === 'secondary-layout' ? 'fluid' : 'fixed'}>
        <p className="py-10 text-center text-red-700">{error}</p>
        <div className="text-center">
          <Link to="/gestion-academica/inscripciones/solicitudes?tab=recibidas" className="btn btn-sm btn-light">
            Volver
          </Link>
        </div>
      </Container>
    );
  }

  if (!detalle) return null;

  return (
    <Container width={currentLayout?.name === 'secondary-layout' ? 'fluid' : 'fixed'}>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Validar solicitud recibida" />
          <ToolbarDescription>
            {detalle.numeroSolicitud} · {detalle.datosFormulario.estudiante.nombreCompleto}
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Link
            to="/gestion-academica/inscripciones/solicitudes?tab=recibidas"
            className="btn btn-sm btn-light"
          >
            Volver al listado
          </Link>
        </ToolbarActions>
      </Toolbar>

      <div className="card">
        <div className="card-body space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase text-primary">Paso 1</span>
            <h2 className="text-lg font-black uppercase text-gray-900 dark:text-white">
              Confirmar información y enviar correo
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Revise los datos del formulario público. Al confirmar se generará la factura académica,
              el seguimiento con token y se enviará el correo al aspirante.
            </p>
          </div>

          <DatosFormularioInscripcionPanel datos={detalle.datosFormulario} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">Programa solicitado</span>
              <p className="mt-1 text-sm font-bold">
                {detalle.nombrePrograma ??
                  detalle.datosFormulario.estudiante.programaInteres ??
                  '—'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">Estado</span>
              <p className="mt-1 text-sm font-bold">{detalle.estadoEtiqueta ?? detalle.estado}</p>
            </div>
          </div>

          {!yaConfirmada && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-gray-500">Proceso académico *</span>
                <Select
                  options={procesos.map((p) => ({ value: p.id, label: p.nombreProceso }))}
                  value={
                    idProceso
                      ? {
                          value: idProceso,
                          label: procesos.find((p) => p.id === idProceso)?.nombreProceso ?? ''
                        }
                      : null
                  }
                  onChange={(opt) => setIdProceso(opt?.value ?? null)}
                  placeholder="Seleccione proceso para facturación…"
                  className="mt-1"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-gray-500">Correo del estudiante *</span>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="input input-sm mt-1 w-full"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-gray-500">Fecha límite de pago</span>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="input input-sm mt-1 w-full"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-gray-500">Observaciones (opcional)</span>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  className="textarea textarea-sm mt-1 w-full"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          {mensaje && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {mensaje}
            </div>
          )}

          {!yaConfirmada && (
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={enviando}
              className="btn btn-primary"
            >
              {enviando ? 'Procesando…' : 'Confirmar información y enviar correo'}
            </button>
          )}

          {yaConfirmada && (
            <p className="text-sm text-emerald-700">
              Esta solicitud ya fue confirmada. Continúe la validación desde solicitudes con factura.
            </p>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ValidacionSolicitudRecibidaPage;
