import React, { ReactNode } from 'react';
import { IconChevronRight } from './LyraIcons';

export interface Suggestion {
    id: string;
    icon: ReactNode;
    title: string;
    hint: string;
    /** Lo que se envía al asistente tal cual, por el flujo normal de mensajes. */
    prompt: string;
}

interface HeroProps {
    botName: string;
    memojiUrl: string;
    title: string;
    description: string;
}

/** Cabecera de la pantalla inicial: quién es el asistente y para qué sirve. */
export const LyraHero = ({ botName, memojiUrl, title, description }: HeroProps) => (
    <div className="lx-hero lx-rise" style={{ ['--i' as string]: 0 }}>
        <div className="lx-hero-orb">
            <img src={memojiUrl} alt={botName} />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
    </div>
);

interface SuggestionsProps {
    suggestions: Suggestion[];
    disabled?: boolean;
    onPick: (prompt: string) => void;
}

/** Preguntas de arranque en lista agrupada. Cada una se envía como si el usuario la hubiera escrito. */
export const LyraSuggestions = ({ suggestions, disabled, onPick }: SuggestionsProps) => (
    <section aria-label="Preguntas sugeridas">
        <p className="lx-sugg-label lx-rise" style={{ ['--i' as string]: 3 }}>
            Puedes preguntarme
        </p>
        <ul className="lx-list lx-rise" style={{ ['--i' as string]: 4 }}>
            {suggestions.map((s) => (
                <li key={s.id}>
                    <button type="button" className="lx-row" disabled={disabled} onClick={() => onPick(s.prompt)}>
                        <span className="lx-row-ico">{s.icon}</span>
                        <span className="lx-row-txt">
                            <b>{s.title}</b>
                            <span>{s.hint}</span>
                        </span>
                        <IconChevronRight className="lx-row-go" />
                    </button>
                </li>
            ))}
        </ul>
    </section>
);
