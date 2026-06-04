import { useState } from 'react';
import {
  DatosFormularioInscripcion,
  EstudianteSolicitudInscripcion,
  SeguimientoInscripcionAdmin,
  SolicitudInscripcion
} from '../solicitudInscripcionTypes';
import { confirmarInformacionEnviarCorreo } from '../validacionInscripcionApi';
import DatosFormularioInscripcionPanel from '../components/DatosFormularioInscripcionPanel';

interface Props {
  idFactura: number;
  solicitud: SolicitudInscripcion;
  estudiante: EstudianteSolicitudInscripcion | null;
  datosFormulario: DatosFormularioInscripcion | null;
  seguimiento: SeguimientoInscripcionAdmin | null;
  informacionConfirmada: boolean;
  onConfirmado: (seguimiento: SeguimientoInscripcionAdmin, solicitud: SolicitudInscripcion) => void;
}

const Paso1InformacionEstudiante = ({
  idFactura,
  solicitud,
  estudiante,
  datosFormulario,
  seguimiento,
  informacionConfirmada,
  onConfirmado
}: Props) => {
  const correoInicial =
    seguimiento?.correoDestino ??
    datosFormulario?.estudiante.email ??
    estudiante?.email ??
    solicitud.email ??
    '';

  const [correo, setCorreo] = useState(correoInicial);
  const [fechaLimite, setFechaLimite] = useState(seguimiento?.fechaLimitePago ?? '');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const yaEnviado = informacionConfirmada || Boolean(seguimiento?.informacionConfirmada);

  const handleConfirmar = async () => {
    if (!correo.trim()) {
      setError('Indique el correo electrónico del estudiante.');
      return;
    }

    setEnviando(true);
    setError('');
    setExito('');

    try {
      const res = await confirmarInformacionEnviarCorreo(idFactura, {
        correo: correo.trim(),
        fechaLimitePago: fechaLimite || undefined,
        observaciones: observaciones.trim() || undefined
      });
      setExito(res.message);
      if (res.seguimiento) {
        onConfirmado(res.seguimiento, res.solicitud);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo enviar el correo. Verifique la configuración de correo e intente de nuevo.';
      setError(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
        Información del estudiante
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Revise los datos enviados por el estudiante en el formulario de inscripción y confírmelos
        para enviar el enlace de seguimiento y pago.
      </p>

      {datosFormulario ? (
        <DatosFormularioInscripcionPanel
          datos={datosFormulario}
          mostrarEstudiante
          mostrarTutor={false}
          mostrarDocumentos={false}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase text-gray-500">Nombre completo</span>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              {estudiante?.nombreCompleto ?? solicitud.nombreEstudiante}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase text-gray-500">Documento</span>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              {estudiante?.tipoDocumento ?? 'CC'} {estudiante?.documento ?? solicitud.documento}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Programa</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{solicitud.nombrePrograma}</p>
          <p className="text-xs text-gray-500">{solicitud.codigoPrograma}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Factura</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {solicitud.numeroFactura ?? solicitud.numeroSolicitud}
          </p>
          <p className="text-xs text-gray-500">{solicitud.fechaSolicitud}</p>
        </div>
      </div>

      {yaEnviado && (
        <div className="p-4 text-sm border border-emerald-200 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200">
          Correo enviado
          {seguimiento?.fechaCorreoEnviado
            ? ` el ${new Date(seguimiento.fechaCorreoEnviado).toLocaleString('es-CO')}`
            : ''}
          {seguimiento?.urlPortal && (
            <p className="mt-1 text-xs break-all opacity-90">Enlace: {seguimiento.urlPortal}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-gray-500">Correo del estudiante *</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={yaEnviado}
            className="w-full mt-1 input input-sm"
            placeholder="correo@ejemplo.com"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-gray-500">Fecha límite de pago</span>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            disabled={yaEnviado}
            className="w-full mt-1 input input-sm"
          />
        </label>
      </div>

      {!yaEnviado && (
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-gray-500">Observaciones (opcional)</span>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full mt-1 textarea textarea-sm"
            placeholder="Mensaje interno o nota para el estudiante"
          />
        </label>
      )}

      {error && (
        <div className="p-3 text-sm border border-red-200 rounded-lg bg-red-50 text-red-800">{error}</div>
      )}
      {exito && (
        <div className="p-3 text-sm border border-emerald-200 rounded-lg bg-emerald-50 text-emerald-800">
          {exito}
        </div>
      )}

      {!yaEnviado && (
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={enviando}
          className="px-4 py-2 text-xs font-bold text-white uppercase rounded-lg bg-primary disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Confirmar información y enviar correo'}
        </button>
      )}
    </div>
  );
};

export default Paso1InformacionEstudiante;
