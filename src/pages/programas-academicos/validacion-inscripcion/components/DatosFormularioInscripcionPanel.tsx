import {
  DatosFormularioInscripcion,
  DatosFormularioInscripcionDocumento
} from '../solicitudInscripcionTypes';

interface Props {
  datos: DatosFormularioInscripcion;
  mostrarEstudiante?: boolean;
  mostrarTutor?: boolean;
  mostrarDocumentos?: boolean;
}

const Campo = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
    <span className="text-[10px] font-bold uppercase text-gray-500">{label}</span>
    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{value || '—'}</p>
  </div>
);

const DatosFormularioInscripcionPanel = ({
  datos,
  mostrarEstudiante = true,
  mostrarTutor = true,
  mostrarDocumentos = true
}: Props) => {
  const { estudiante, tutor, documentos } = datos;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase text-primary">Datos del formulario público</span>
        {datos.fechaEnvio && (
          <span className="text-[10px] text-gray-500">
            Enviado: {new Date(datos.fechaEnvio).toLocaleString('es-CO')}
          </span>
        )}
      </div>

      {mostrarEstudiante && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo label="Nombre completo" value={estudiante.nombreCompleto} />
          <Campo
            label="Documento"
            value={
              estudiante.tipoDocumento || estudiante.documento
                ? `${estudiante.tipoDocumento ?? ''} ${estudiante.documento ?? ''}`.trim()
                : null
            }
          />
          <Campo label="Correo" value={estudiante.email} />
          <Campo label="Teléfono" value={estudiante.telefono} />
          <Campo label="Fecha nacimiento" value={estudiante.fechaNacimiento} />
        </div>
      )}

      {mostrarTutor && (
        <div className="p-4 border border-sky-200 rounded-xl bg-sky-50/60 dark:bg-sky-500/5 dark:border-sky-500/20">
          <h4 className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300">
            Tutor / acudiente
          </h4>
          <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-2">
            <Campo label="Nombre" value={tutor.nombreCompleto} />
            <Campo label="Parentesco" value={tutor.parentesco} />
            <Campo label="Documento" value={tutor.documento} />
            <Campo label="Teléfono" value={tutor.telefono} />
            <Campo label="Correo" value={tutor.email} />
          </div>
        </div>
      )}

      {mostrarDocumentos && documentos.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-xl dark:border-white/10">
          <h4 className="text-[10px] font-black uppercase text-gray-700 dark:text-gray-300">
            Documentos adjuntos
          </h4>
          <ul className="mt-2 space-y-2">
            {documentos.map((doc: DatosFormularioInscripcionDocumento, index) => (
              <li key={`${doc.titulo}-${index}`}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase text-primary hover:underline"
                >
                  {doc.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DatosFormularioInscripcionPanel;
