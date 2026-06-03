import { getEstudiantePorId } from '../mockEstudiantesInscripcion';
import { SolicitudInscripcionMock } from '../mockSolicitudesInscripcion';

interface Props {
  solicitud: SolicitudInscripcionMock;
  revisada: boolean;
  onRevisadaChange: (value: boolean) => void;
}

const Paso3InformacionSolicitante = ({ solicitud, revisada, onRevisadaChange }: Props) => {
  const estudiante = getEstudiantePorId(solicitud.idEstudiante);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
        Información del solicitante
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Verifique los datos del estudiante que presentó la solicitud de inscripción.
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
            {estudiante?.celular ?? solicitud.telefono ?? '—'}
          </p>
        </div>
        {estudiante && (
          <>
            <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">Fecha nacimiento</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{estudiante.fechaNacimiento}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">Ciudad</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {estudiante.ciudad}, {estudiante.departamento}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase text-gray-500">Dirección</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{estudiante.direccion}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">EPS</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{estudiante.eps ?? '—'}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-500">Contacto emergencia</span>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {estudiante.contactoEmergencia ?? '—'}
              </p>
              {estudiante.telefonoEmergencia && (
                <p className="text-xs text-gray-500">{estudiante.telefonoEmergencia}</p>
              )}
            </div>
          </>
        )}
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Matrícula</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {estudiante?.codigoMatricula ?? solicitud.idMatricula ?? 'Por asignar'}
          </p>
          {estudiante && (
            <p className="text-xs text-gray-500">Estado: {estudiante.estadoMatricula}</p>
          )}
        </div>
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Programa</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{solicitud.nombrePrograma}</p>
          <p className="text-xs text-gray-500">{solicitud.codigoPrograma}</p>
        </div>
      </div>

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
};

export default Paso3InformacionSolicitante;
