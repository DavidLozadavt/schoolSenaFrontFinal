import type { FormDraft } from '@/providers/LyraProvider';

/**
 * Vista compacta del formulario que Nexo arma en la conversación. Sólo complementa:
 * todo se controla escribiendo, y el texto de la respuesta ya describe la estructura.
 * El estado se escribe con palabras (no sólo con color): "Sin guardar", "Cambios sin
 * guardar", "Guardado · borrador", "Publicado".
 */
export const LyraFormDraft = ({ draft, onOpen }: { draft: FormDraft; onOpen?: (ruta: string) => void }) => {
  const estado = draft.nuevo
    ? 'Sin guardar'
    : !draft.guardado
      ? 'Cambios sin guardar'
      : draft.estado === 'publicado' ? 'Publicado' : `Guardado · ${draft.estado}`;
  const tono = draft.nuevo || !draft.guardado ? 'pending' : draft.estado === 'publicado' ? 'live' : 'saved';
  const n = draft.preguntas.length;

  return (
    <section className="lx-form" aria-label={`Formulario ${draft.titulo || 'sin título'}`} data-testid="lyra-form-draft">
      <header className="lx-form-head">
        <strong className="lx-form-title">{draft.titulo || 'Formulario sin título'}</strong>
        <span className="lx-form-state" data-state={tono}>{estado}</span>
      </header>
      {n === 0 ? (
        <p className="lx-form-empty">Todavía no tiene preguntas.</p>
      ) : (
        // role="list": Safari quita la semántica de lista a un <ol> con list-style: none.
        <ol className="lx-form-list" role="list">
          {draft.preguntas.map(p => (
            <li key={p.n} className="lx-form-q" data-focus={p.foco || undefined}>
              <span className="lx-form-n" aria-hidden="true">{p.n}</span>
              <span className="lx-form-body">
                <span className="lx-form-qt">{p.titulo}</span>
                <span className="lx-form-meta">
                  {p.tipo}
                  {p.opciones.length > 0 && ` · ${p.opciones.join(', ')}`}
                </span>
              </span>
              {p.obligatoria && <span className="lx-form-req">Obligatoria</span>}
            </li>
          ))}
        </ol>
      )}
      {draft.ruta && draft.guardado && onOpen && (
        <button type="button" className="lx-form-open" onClick={() => onOpen(draft.ruta!)}>
          Abrir en el constructor
        </button>
      )}
    </section>
  );
};
