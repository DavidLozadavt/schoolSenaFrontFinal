import { useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import {
  BotonPlantilla,
  CategoriaMeta,
  plantillasMetaService,
  TipoBoton
} from '@/services/plantillasMetaService';

interface FormularioPlantillaMetaProps {
  onCancelar: () => void;
  onCreada: () => void;
}

const CATEGORIAS: { valor: CategoriaMeta; etiqueta: string; ayuda: string }[] = [
  { valor: 'UTILITY', etiqueta: 'Utility', ayuda: 'Notificaciones transaccionales y de servicio.' },
  { valor: 'MARKETING', etiqueta: 'Marketing', ayuda: 'Promociones, ofertas e invitaciones.' },
  {
    valor: 'AUTHENTICATION',
    etiqueta: 'Authentication',
    ayuda: 'Códigos de verificación de un solo uso.'
  }
];

const IDIOMAS = [
  { valor: 'es', etiqueta: 'Español (es)' },
  { valor: 'es_ES', etiqueta: 'Español - España (es_ES)' },
  { valor: 'es_MX', etiqueta: 'Español - México (es_MX)' },
  { valor: 'en', etiqueta: 'Inglés (en)' },
  { valor: 'en_US', etiqueta: 'Inglés - EE. UU. (en_US)' }
];

const TIPOS_BOTON: { valor: TipoBoton; etiqueta: string }[] = [
  { valor: 'QUICK_REPLY', etiqueta: 'Respuesta rápida' },
  { valor: 'URL', etiqueta: 'Enlace (URL)' },
  { valor: 'PHONE_NUMBER', etiqueta: 'Teléfono' }
];

/** Detecta las variables {{1}}, {{2}}... presentes en el cuerpo. */
const detectarVariables = (contenido: string): number[] => {
  const encontradas = new Set<number>();
  const regex = /\{\{(\d+)\}\}/g;
  let match = regex.exec(contenido);
  while (match) {
    encontradas.add(Number(match[1]));
    match = regex.exec(contenido);
  }
  return Array.from(encontradas).sort((a, b) => a - b);
};

/**
 * Formulario de creación de plantillas. Al enviar, el backend consume la API
 * oficial de Meta usando las credenciales del módulo Configuración WhatsApp
 * (nunca se piden Access Token, Phone Number ID ni WABA otra vez).
 */
const FormularioPlantillaMeta = ({ onCancelar, onCreada }: FormularioPlantillaMetaProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaMeta>('UTILITY');
  const [idioma, setIdioma] = useState('es');
  const [encabezado, setEncabezado] = useState('');
  const [contenido, setContenido] = useState('');
  const [pie, setPie] = useState('');
  const [ejemplos, setEjemplos] = useState<Record<number, string>>({});
  const [botones, setBotones] = useState<BotonPlantilla[]>([]);
  const [guardando, setGuardando] = useState(false);

  const variables = useMemo(() => detectarVariables(contenido), [contenido]);

  const vistaPrevia = useMemo(() => {
    let texto = contenido;
    variables.forEach((numero) => {
      texto = texto.split(`{{${numero}}}`).join(ejemplos[numero] || `«variable ${numero}»`);
    });
    return texto;
  }, [contenido, variables, ejemplos]);

  const agregarBoton = () =>
    setBotones((prev) => [...prev, { tipo: 'QUICK_REPLY', texto: '', valor: '' }]);

  const actualizarBoton = (indice: number, cambios: Partial<BotonPlantilla>) =>
    setBotones((prev) => prev.map((b, i) => (i === indice ? { ...b, ...cambios } : b)));

  const quitarBoton = (indice: number) =>
    setBotones((prev) => prev.filter((_, i) => i !== indice));

  const handleGuardar = async () => {
    if (!/^[a-z0-9_]+$/.test(nombre)) {
      enqueueSnackbar('El nombre solo admite minúsculas, números y guion bajo.', {
        variant: 'warning'
      });
      return;
    }
    if (contenido.trim() === '') {
      enqueueSnackbar('El contenido es obligatorio.', { variant: 'warning' });
      return;
    }
    if (variables.some((numero) => !ejemplos[numero])) {
      enqueueSnackbar('Meta exige un valor de ejemplo por cada variable.', { variant: 'warning' });
      return;
    }
    if (botones.some((b) => b.texto.trim() === '')) {
      enqueueSnackbar('Cada botón necesita un texto.', { variant: 'warning' });
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await plantillasMetaService.crear({
        nombre,
        categoria,
        idioma,
        contenido,
        encabezado: encabezado || null,
        pie: pie || null,
        variablesEjemplo: variables.map((numero) => ejemplos[numero]),
        botones
      });
      enqueueSnackbar(respuesta.message || 'Plantilla enviada a Meta.', { variant: 'success' });
      onCreada();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al crear la plantilla en Meta.', {
        variant: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Nueva plantilla en Meta</h4>
        <button className="btn btn-xs btn-light" onClick={onCancelar} disabled={guardando}>
          <KeenIcon icon="arrow-left" />
          Volver al listado
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="form-label font-medium">Nombre</label>
          <input
            type="text"
            className="input input-sm"
            placeholder="recordatorio_matricula"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          />
          <span className="text-2xs text-gray-500">Minúsculas, números y guion bajo.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="form-label font-medium">Idioma</label>
          <select
            className="select select-sm"
            value={idioma}
            onChange={(e) => setIdioma(e.target.value)}
          >
            {IDIOMAS.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label font-medium">Categoría</label>
        <div className="grid sm:grid-cols-3 gap-2">
          {CATEGORIAS.map((item) => (
            <button
              key={item.valor}
              type="button"
              onClick={() => setCategoria(item.valor)}
              className={`rounded-md border p-2 text-left text-xs transition ${
                categoria === item.valor
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block text-sm font-semibold text-gray-900">{item.etiqueta}</span>
              <span className="text-gray-500">{item.ayuda}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="form-label font-medium">Encabezado (opcional)</label>
          <input
            type="text"
            className="input input-sm"
            maxLength={60}
            value={encabezado}
            onChange={(e) => setEncabezado(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="form-label font-medium">Pie de página (opcional)</label>
          <input
            type="text"
            className="input input-sm"
            maxLength={60}
            value={pie}
            onChange={(e) => setPie(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label font-medium">Contenido</label>
        <textarea
          className="textarea textarea-sm"
          rows={4}
          maxLength={1024}
          placeholder="Hola {{1}}, tu inscripción al programa {{2}} fue registrada."
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
        <span className="text-2xs text-gray-500">
          Use {'{{1}}'}, {'{{2}}'}... para las variables. {contenido.length}/1024
        </span>
      </div>

      {variables.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="form-label font-medium">Variables (ejemplos exigidos por Meta)</label>
          {variables.map((numero) => (
            <div key={numero} className="flex items-center gap-2">
              <span className="badge badge-sm badge-light w-16 justify-center">{`{{${numero}}}`}</span>
              <input
                type="text"
                className="input input-sm grow"
                placeholder={`Ejemplo para la variable ${numero}`}
                value={ejemplos[numero] ?? ''}
                onChange={(e) => setEjemplos((prev) => ({ ...prev, [numero]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="form-label font-medium">Botones (opcional)</label>
          <button className="btn btn-xs btn-light" onClick={agregarBoton} type="button">
            <KeenIcon icon="plus" />
            Agregar botón
          </button>
        </div>
        {botones.map((boton, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <select
              className="select select-sm w-40"
              value={boton.tipo}
              onChange={(e) => actualizarBoton(indice, { tipo: e.target.value as TipoBoton })}
            >
              {TIPOS_BOTON.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.etiqueta}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="input input-sm grow"
              placeholder="Texto del botón"
              maxLength={25}
              value={boton.texto}
              onChange={(e) => actualizarBoton(indice, { texto: e.target.value })}
            />
            {boton.tipo !== 'QUICK_REPLY' && (
              <input
                type="text"
                className="input input-sm grow"
                placeholder={boton.tipo === 'URL' ? 'https://...' : '+573001234567'}
                value={boton.valor ?? ''}
                onChange={(e) => actualizarBoton(indice, { valor: e.target.value })}
              />
            )}
            <button
              type="button"
              className="btn btn-xs btn-icon btn-light btn-danger"
              onClick={() => quitarBoton(indice)}
            >
              <KeenIcon icon="trash" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label font-medium">Vista previa</label>
        <div className="rounded-lg bg-[#e5ddd5] p-3">
          <div className="max-w-[85%] rounded-lg bg-white p-3 shadow-sm">
            {encabezado && (
              <p className="text-sm font-bold text-gray-900 mb-1">{encabezado}</p>
            )}
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {vistaPrevia || 'Escriba el contenido para ver la vista previa...'}
            </p>
            {pie && <p className="text-2xs text-gray-500 mt-1">{pie}</p>}
            {botones.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
                {botones.map((boton, indice) => (
                  <span key={indice} className="text-center text-xs font-medium text-[#00a5f4]">
                    {boton.texto || 'Botón'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
        <button className="btn btn-sm btn-secondary" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button
          className="btn btn-sm btn-primary flex items-center gap-1.5"
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Enviando a Meta...
            </>
          ) : (
            <>
              <KeenIcon icon="check" />
              Crear plantilla
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export { FormularioPlantillaMeta };
