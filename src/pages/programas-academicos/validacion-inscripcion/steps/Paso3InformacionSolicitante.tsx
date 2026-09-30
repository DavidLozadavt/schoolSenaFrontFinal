import {
  EstudianteSolicitudInscripcion,
  SolicitudInscripcion,
  RespuestasFormulario
} from '../solicitudInscripcionTypes';

interface Props {
  solicitud: SolicitudInscripcion;
  estudiante: EstudianteSolicitudInscripcion | null;
  respuestasFormulario: RespuestasFormulario | null;
  revisada: boolean;
  onRevisadaChange: (value: boolean) => void;
}

const Paso3InformacionSolicitante = ({
  solicitud,
  estudiante,
  respuestasFormulario,
  revisada,
  onRevisadaChange
}: Props) => (
  <div className="space-y-4">
    <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
      Información del solicitante
    </h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">
      Verifique los datos del estudiante asociados a la factura académica.
    </p>

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
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Correo</span>
        <p className="mt-1 text-sm text-gray-900 dark:text-white">
          {estudiante?.email ?? solicitud.email ?? '—'}
        </p>
      </div>
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Celular</span>
        <p className="mt-1 text-sm text-gray-900 dark:text-white">
          {estudiante?.celular ?? estudiante?.telefono ?? solicitud.telefono ?? '—'}
        </p>
      </div>
      {estudiante?.fechaNacimiento && (
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Fecha nacimiento</span>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{estudiante.fechaNacimiento}</p>
        </div>
      )}
      {estudiante?.direccion && (
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-gray-500">Dirección</span>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{estudiante.direccion}</p>
        </div>
      )}
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Matrícula</span>
        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
          {solicitud.idMatricula ?? estudiante?.idMatricula ?? 'Por asignar'}
        </p>
        {(estudiante?.estadoMatricula ?? solicitud.estadoMatricula) && (
          <p className="text-xs text-gray-500">
            Estado: {estudiante?.estadoMatricula ?? solicitud.estadoMatricula}
          </p>
        )}
      </div>
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Proceso / programa</span>
        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{solicitud.nombrePrograma}</p>
        <p className="text-xs text-gray-500">{solicitud.codigoPrograma}</p>
      </div>
    </div>

    {respuestasFormulario && (
      <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-coal-600 dark:border-white/5 space-y-4">
        <h4 className="text-xs font-black uppercase text-gray-800 dark:text-white flex items-center gap-2">
          <i className="ki-outline ki-document-text text-sm text-primary" />
          Respuestas del Formulario: {respuestasFormulario.formulario}
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {respuestasFormulario.respuestas.map((r, i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg bg-white dark:bg-coal-500 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">{r.pregunta}</span>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white break-words">
                {r.respuesta || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer bg-white dark:bg-coal-500 dark:border-white/10">
      <input
        type="checkbox"
        checked={revisada}
        onChange={(e) => onRevisadaChange(e.target.checked)}
        className="mt-1 checkbox checkbox-sm"
      />
      <span className="text-sm text-gray-800 dark:text-gray-200">
        Confirmo que la información del solicitante fue revisada y es correcta.
      </span>
    </label>
  </div>
);

export default Paso3InformacionSolicitante;
