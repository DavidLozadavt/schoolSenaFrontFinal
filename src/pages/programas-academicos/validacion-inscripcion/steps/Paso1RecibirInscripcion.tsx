import { useState } from 'react';
import { KeenIcon } from '@/components';
import {
  EstudianteSolicitudInscripcion,
  SolicitudInscripcion,
  RespuestasFormulario
} from '../solicitudInscripcionTypes';

interface Props {
  solicitud: SolicitudInscripcion;
  estudiante: EstudianteSolicitudInscripcion | null;
  respuestasFormulario: RespuestasFormulario | null;
  recibida: boolean;
  onRecibidaChange: (value: boolean) => void;
}

/**
 * Paso 1 – Información del aspirante.
 *
 * Reutiliza exactamente la misma lógica de extracción y renderizado
 * que la pantalla "Ver Respuesta" (SolicitudesInscripcionContent.tsx)
 * para garantizar que ambas vistas muestren siempre la misma información.
 */
const Paso1RecibirInscripcion = ({
  solicitud,
  estudiante,
  respuestasFormulario,
  recibida,
  onRecibidaChange
}: Props) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /* ── Helpers de extracción (idénticos a SolicitudesInscripcionContent) ── */

  const respuestas = respuestasFormulario?.respuestas ?? [];

  const findResp = (
    keywords: string[],
    extraCondition?: (t: string) => boolean,
    exclude = ['tutor', 'acudiente']
  ): string => {
    const found = respuestas.find((r) => {
      const t = (r.pregunta || '').toLowerCase();
      const hasKw = keywords.some((k) => t.includes(k));
      const excl = exclude.some((e) => t.includes(e));
      const extra = extraCondition ? extraCondition(t) : true;
      return hasKw && !excl && extra;
    });
    return found?.respuesta ? String(found.respuesta) : '';
  };

  const nombreCompleto =
    findResp(['nombre', 'nombres', 'completo']) ||
    estudiante?.nombreCompleto ||
    solicitud.nombreEstudiante;

  const tipoDocumento =
    findResp(['tipo'], (t) => t.includes('documento')) ||
    estudiante?.tipoDocumento ||
    'CC';

  const documento =
    findResp([
      'documento',
      'identificacion',
      'identificación',
      'número',
      'numero',
      'cc',
      'identidad'
    ]) ||
    estudiante?.documento ||
    solicitud.documento;

  const correo =
    findResp(['correo', 'email', 'e-mail']) ||
    estudiante?.email ||
    solicitud.email ||
    '';

  const telefono =
    findResp(['teléfono', 'telefono', 'celular', 'móvil', 'movil', 'tel']) ||
    estudiante?.celular ||
    estudiante?.telefono ||
    solicitud.telefono ||
    '';

  /* ── Detección de archivos (idéntica a SolicitudesInscripcionContent) ── */

  const esArchivo = (valor: string): boolean =>
    !!(
      valor &&
      (valor.startsWith('http://') ||
        valor.startsWith('https://') ||
        valor.startsWith('/storage') ||
        valor.includes('/storage/') ||
        valor.includes('formulario_adjuntos'))
    );

  const resolverUrl = (url: string): string =>
    url.startsWith('/') ? `${window.location.origin}${url}` : url;

  const esImagen = (url: string): boolean =>
    /\.(jpeg|jpg|gif|png|webp)/i.test(url);

  /** Parsea URLs en un valor de respuesta (JSON array, CSV o URL única). */
  const parseFileUrls = (valor: string): string[] => {
    if (!valor) return [];
    try {
      if (valor.startsWith('[') && valor.endsWith(']')) {
        const parsed = JSON.parse(valor);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (u: unknown) => typeof u === 'string' && esArchivo(u as string)
          );
        }
      }
    } catch {
      /* ignore */
    }
    if (esArchivo(valor)) {
      return valor
        .split(',')
        .map((s) => s.trim())
        .filter((s) => esArchivo(s));
    }
    return [];
  };

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* ── Título ── */}
      <div>
        <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
          Información del aspirante
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Revise la información enviada por el aspirante en el formulario de inscripción.
        </p>
      </div>

      {/* ── Solicitud + Programa ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Solicitud</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {solicitud.numeroSolicitud}
          </p>
          <p className="text-xs text-gray-500">{solicitud.fechaSolicitud}</p>
          {solicitud.numeroFactura && (
            <p className="text-xs text-primary">Factura {solicitud.numeroFactura}</p>
          )}
        </div>
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase text-gray-500">Programa</span>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
            {solicitud.nombrePrograma}
          </p>
          <p className="text-xs text-gray-500">{solicitud.codigoPrograma}</p>
        </div>
      </div>

      {/* ── Datos del Aspirante (extraídos del formulario — misma lógica que "Ver Respuesta") ── */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-coal-500/50 dark:border-white/10 space-y-2">
        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <KeenIcon icon="profile-user" className="text-primary text-sm" />
          Datos del Aspirante
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">
              Nombre Completo
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{nombreCompleto}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">
              Documento de Identidad
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {tipoDocumento} - {documento}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">
              Correo Electrónico
            </span>
            <span className="font-semibold text-gray-900 dark:text-white break-all">
              {correo || '—'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">
              Teléfono / Celular
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{telefono || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Respuestas completas del formulario (idénticas a "Ver Respuesta") ── */}
      {respuestasFormulario ? (
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase flex items-center gap-2">
            <KeenIcon icon="document-text" className="text-sm" />
            Formulario: {respuestasFormulario.formulario}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {respuestas.map((r, i) => {
              const respuestaStr =
                typeof r.respuesta === 'string'
                  ? r.respuesta
                  : r.respuesta
                    ? String(r.respuesta)
                    : '';
              const fileUrls = parseFileUrls(respuestaStr);

              return (
                <div
                  key={i}
                  className={`p-3 border border-gray-200 rounded-lg bg-white dark:bg-coal-500 dark:border-white/10 ${
                    fileUrls.length > 0 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">
                    {r.pregunta}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white break-words">
                    {fileUrls.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-1">
                        {fileUrls.map((url, uidx) => {
                          const resolved = resolverUrl(url);
                          const img = esImagen(url);
                          return (
                            <div
                              key={uidx}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-coal-600 border border-gray-100 dark:border-white/5 max-w-lg"
                            >
                              <div
                                className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200/20 bg-gray-100 dark:bg-coal-400 flex items-center justify-center ${
                                  img
                                    ? 'cursor-pointer hover:opacity-80 transition-opacity'
                                    : ''
                                }`}
                                onClick={() => img && setLightboxUrl(resolved)}
                              >
                                {img ? (
                                  <img
                                    src={resolved}
                                    alt="Adjunto"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <KeenIcon icon="document" className="text-lg text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold uppercase text-gray-400">
                                  Archivo {uidx + 1}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[250px]">
                                  {url.split('/').pop()}
                                </span>
                                <a
                                  href={resolved}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] text-primary font-bold hover:underline mt-0.5"
                                >
                                  <KeenIcon icon="eye" className="text-xs" />
                                  Ver / Descargar
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      respuestaStr || '—'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-coal-600 dark:border-white/5 text-center">
          <p className="text-sm text-gray-500">
            No se encontraron respuestas registradas en el formulario para esta solicitud.
          </p>
        </div>
      )}

      {/* ── Checkbox de confirmación ── */}
      <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer bg-white dark:bg-coal-500 dark:border-white/10">
        <input
          type="checkbox"
          checked={recibida}
          onChange={(e) => onRecibidaChange(e.target.checked)}
          className="mt-1 checkbox checkbox-sm"
        />
        <span className="text-sm text-gray-800 dark:text-gray-200">
          Confirmo que la información del aspirante fue revisada y la solicitud puede continuar el
          proceso de validación.
        </span>
      </label>

      {/* ── Lightbox para previsualización de imágenes ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] relative p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxUrl}
              alt="Ampliada"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Paso1RecibirInscripcion;
