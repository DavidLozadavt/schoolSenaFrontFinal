import {
  DatosFormularioInscripcion,
  EstudianteSolicitudInscripcion,
  SolicitudInscripcion
} from '../solicitudInscripcionTypes';
import DatosFormularioInscripcionPanel from '../components/DatosFormularioInscripcionPanel';

interface Props {
  solicitud: SolicitudInscripcion;
  estudiante: EstudianteSolicitudInscripcion | null;
  datosFormulario: DatosFormularioInscripcion | null;
  revisada: boolean;
  onRevisadaChange: (value: boolean) => void;
}

const Paso3InformacionSolicitante = ({
  solicitud,
  estudiante,
  datosFormulario,
  revisada,
  onRevisadaChange
}: Props) => (
  <div className="space-y-4">
    <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
      Información del solicitante
    </h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">
      Verifique tutor/acudiente, documentos del formulario y datos académicos asociados a la factura.
    </p>

    {datosFormulario ? (
      <DatosFormularioInscripcionPanel
        datos={datosFormulario}
        mostrarEstudiante={false}
        mostrarTutor
        mostrarDocumentos
      />
    ) : (
      <div className="p-4 text-sm border border-amber-200 rounded-xl bg-amber-50 text-amber-900">
        No se encontró respuesta del formulario público para este documento. Se muestran los datos
        registrados en la factura o matrícula.
      </div>
    )}

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Estudiante (sistema)</span>
        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
          {estudiante?.nombreCompleto ?? solicitud.nombreEstudiante}
        </p>
        <p className="text-xs text-gray-500">
          {estudiante?.tipoDocumento ?? 'CC'} {estudiante?.documento ?? solicitud.documento}
        </p>
      </div>
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
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10 sm:col-span-2">
        <span className="text-[10px] font-bold uppercase text-gray-500">Proceso / programa</span>
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
        Confirmo que la información del solicitante (formulario, tutor y documentos) fue revisada.
      </span>
    </label>
  </div>
);

export default Paso3InformacionSolicitante;
