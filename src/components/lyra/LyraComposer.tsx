import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { IconMic, IconSend, IconSpinner, IconStop } from './LyraIcons';

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder: string;
    /** El campo no admite texto (sin conexión o escuchando). */
    inputDisabled: boolean;
    /** El botón de enviar no puede usarse ahora mismo. */
    sendDisabled: boolean;
    loading: boolean;
    voice?: {
        listening: boolean;
        disabled: boolean;
        onToggle: () => void;
    };
}

/**
 * Campo de escritura. Enter envía y Shift+Enter hace salto de línea (el mismo
 * comportamiento de antes: el input de una línea sólo enviaba con Enter). La
 * altura crece con el contenido hasta 128 px.
 */
export const LyraComposer = forwardRef<HTMLTextAreaElement, Props>(
    ({ value, onChange, onSend, placeholder, inputDisabled, sendDisabled, loading, voice }, ref) => {
        const inner = useRef<HTMLTextAreaElement | null>(null);

        const setRefs = (node: HTMLTextAreaElement | null) => {
            inner.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        };

        useLayoutEffect(() => {
            const el = inner.current;
            if (!el) return;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
        }, [value]);

        return (
            <div className="lx-composer">
                <div className="lx-field" data-disabled={inputDisabled}>
                    <label className="lx-sr" htmlFor="lx-input">
                        Mensaje para el asistente
                    </label>
                    <textarea
                        id="lx-input"
                        ref={setRefs}
                        rows={1}
                        className="lx-input"
                        placeholder={placeholder}
                        value={value}
                        disabled={inputDisabled}
                        enterKeyHint="send"
                        autoComplete="off"
                        data-no-uppercase=""
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                if (!sendDisabled) onSend();
                            }
                        }}
                    />
                    {voice && (
                        <button
                            type="button"
                            className="lx-iconbtn lx-mic"
                            data-on={voice.listening}
                            onClick={voice.onToggle}
                            disabled={voice.disabled}
                            aria-pressed={voice.listening}
                            aria-label={voice.listening ? 'Dejar de escuchar' : 'Dictar un mensaje por voz'}
                        >
                            {voice.listening ? <IconStop /> : <IconMic />}
                        </button>
                    )}
                    <button
                        type="button"
                        className="lx-send"
                        data-loading={loading}
                        onClick={onSend}
                        disabled={sendDisabled}
                        aria-label={loading ? 'Enviando mensaje' : 'Enviar mensaje'}
                    >
                        {loading ? <IconSpinner className="lx-spin" /> : <IconSend />}
                    </button>
                </div>
                <p className="lx-hint">
                    <kbd>Enter</kbd> para enviar · <kbd>Shift</kbd> + <kbd>Enter</kbd> para salto de línea
                </p>
            </div>
        );
    }
);
LyraComposer.displayName = 'LyraComposer';
