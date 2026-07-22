import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { KeenIcon } from '@/components';
import {
  aspiranteInscripcionService,
  InscripcionAspiranteResponse,
} from './aspiranteInscripcionService';

const FormularioAspirantePublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<InscripcionAspiranteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    aspiranteInscripcionService
      .getFormulario(token)
      .then((res) => {
        setData(res);
        const prev: Record<number, string> = {};
        (res.respuestaPrevia || []).forEach((r) => {
          prev[r.idPregunta] = r.valor;
        });
        setValores(prev);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleTextoChange = (idPregunta: number, valor: string) => {
    setValores((prev) => ({ ...prev, [idPregunta]: valor }));
  };

  const handleArchivo = async (idPregunta: number, file: File | null) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [idPregunta]: true }));
    try {
      const res = await aspiranteInscripcionService.uploadAdjunto(file);
      setValores((prev) => ({ ...prev, [idPregunta]: res.url }));
      enqueueSnackbar('Archivo cargado.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al subir el archivo.', { variant: 'error' });
    } finally {
      setUploading((prev) => ({ ...prev, [idPregunta]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!token || !data) return;

    const faltantes = data.formulario.preguntas.filter(
      (p) => p.esObligatoria && !valores[p.id]?.trim()
    );
    if (faltantes.length > 0) {
      enqueueSnackbar(`Faltan campos obligatorios: ${faltantes.map((f) => f.titulo).join(', ')}`, { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const respuestas = Object.entries(valores).map(([idPregunta, valor]) => ({
        idPregunta: Number(idPregunta),
        valor,
      }));
      const res = await aspiranteInscripcionService.responder(token, respuestas);
      setEnviado(res.estadoDocumental);
      enqueueSnackbar('Formulario enviado correctamente.', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al enviar el formulario.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando...</div>;
  }

  if (notFound || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <KeenIcon icon="shield-cross" className="text-danger text-4xl mb-3" />
          <p className="text-gray-600">Enlace inválido o expirado.</p>
        </div>
      </div>
    );
  }

  const { aspirante, formulario } = data;

  if (enviado) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card max-w-[500px] p-8 text-center">
          <KeenIcon icon="check-circle" className="text-success text-4xl mb-3" />
          <h3 className="text-lg font-semibold mb-2">¡Formulario enviado!</h3>
          <p className="text-gray-600">
            {enviado === 'pendiente_revision'
              ? 'Tu documentación fue recibida completa y quedó en revisión. Te notificaremos por correo el resultado.'
              : 'Tu documentación fue recibida, pero falta algún documento obligatorio. Puedes volver a ingresar a este mismo enlace para completarla.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="card max-w-[640px] w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{formulario.titulo}</h2>
        {formulario.descripcion && <p className="text-gray-500 text-sm mb-4">{formulario.descripcion}</p>}

        <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm text-gray-700">
          <p><span className="font-semibold">{aspirante.nombre} {aspirante.apellido}</span></p>
          <p>{aspirante.programa} · Ficha {aspirante.ficha} · {aspirante.centroFormacion}</p>
        </div>

        <div className="flex flex-col gap-4">
          {formulario.preguntas
            .sort((a, b) => a.orden - b.orden)
            .map((pregunta) => (
              <div key={pregunta.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-800">
                  {pregunta.titulo}{pregunta.esObligatoria ? ' *' : ''}
                </label>
                {pregunta.tipo === 'archivo' ? (
                  <>
                    <input
                      type="file"
                      className="input input-sm"
                      onChange={(e) => handleArchivo(pregunta.id, e.target.files?.[0] || null)}
                      disabled={uploading[pregunta.id]}
                    />
                    {valores[pregunta.id] && (
                      <a href={valores[pregunta.id]} target="_blank" rel="noreferrer" className="text-xs text-primary">
                        Archivo cargado — ver
                      </a>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    className="input input-sm"
                    value={valores[pregunta.id] || ''}
                    onChange={(e) => handleTextoChange(pregunta.id, e.target.value)}
                  />
                )}
              </div>
            ))}
        </div>

        <button
          className="btn btn-primary w-full mt-6"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Enviar formulario'}
        </button>
      </div>
    </div>
  );
};

export { FormularioAspirantePublicPage };
