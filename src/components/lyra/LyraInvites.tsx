import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { IconArrowRight, IconClose } from './LyraIcons';

/**
 * Invitaciones junto al lanzador.
 *
 * Reglas para no estorbar:
 *  - nunca con el chat abierto, nunca si el usuario ya lo abrió en esta sesión;
 *  - la primera tarda ~14 s, después hay una pausa larga entre una y otra y un
 *    máximo de tres por sesión (una sola a la vez);
 *  - se pausan con la pestaña oculta o mientras el usuario escribe en otro campo;
 *  - la × las silencia durante una semana (localStorage).
 */

export type InviteVariant = 'quiet' | 'card' | 'chips' | 'tinted' | 'typing';

export interface InviteChip {
    label: string;
    prompt: string;
}

export interface Invite {
    id: string;
    variant: InviteVariant;
    text: string;
    eyebrow?: string;
    cta?: string;
    chips?: InviteChip[];
    icon?: ReactNode;
}

const MUTE_KEY = 'lyra_invites_muted_until';
const COUNT_KEY = 'lyra_invites_shown';
const INDEX_KEY = 'lyra_invites_next';
const ENGAGED_KEY = 'lyra_invites_engaged';

const FIRST_DELAY_MS = 14_000;
const VISIBLE_MS = 9_000;
const GAP_MS = 55_000;
const RETRY_MS = 8_000;
const MAX_PER_SESSION = 3;
const MUTE_DAYS = 7;

const read = (store: Storage, key: string) => {
    try {
        return store.getItem(key);
    } catch {
        return null;
    }
};
const write = (store: Storage, key: string, value: string) => {
    try {
        store.setItem(key, value);
    } catch {
        /* almacenamiento bloqueado: se sigue sin recordar */
    }
};

const isMuted = () => Number(read(localStorage, MUTE_KEY) || 0) > Date.now();
const isEngaged = () => read(sessionStorage, ENGAGED_KEY) === '1';
const shownCount = () => Number(read(sessionStorage, COUNT_KEY) || 0);

const userIsTyping = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

export function useLyraInvites(enabled: boolean, invites: Invite[]) {
    const [current, setCurrent] = useState<Invite | null>(null);
    const showTimer = useRef<number | undefined>(undefined);
    const hideTimer = useRef<number | undefined>(undefined);
    const invitesRef = useRef(invites);
    invitesRef.current = invites;
    const total = invites.length;

    const clearTimers = () => {
        window.clearTimeout(showTimer.current);
        window.clearTimeout(hideTimer.current);
    };

    const schedule = useCallback((delay: number, run: () => void) => {
        window.clearTimeout(showTimer.current);
        showTimer.current = window.setTimeout(run, delay);
    }, []);

    useEffect(() => {
        if (!enabled || total === 0 || isMuted() || isEngaged()) {
            setCurrent(null);
            return;
        }

        let cancelled = false;

        const tryShow = () => {
            if (cancelled || shownCount() >= MAX_PER_SESSION) return;
            if (document.hidden || userIsTyping()) {
                schedule(RETRY_MS, tryShow);
                return;
            }
            const list = invitesRef.current;
            const idx = Number(read(sessionStorage, INDEX_KEY) || 0) % list.length;
            write(sessionStorage, INDEX_KEY, String(idx + 1));
            write(sessionStorage, COUNT_KEY, String(shownCount() + 1));
            setCurrent(list[idx]);

            hideTimer.current = window.setTimeout(() => {
                setCurrent(null);
                if (shownCount() < MAX_PER_SESSION) schedule(GAP_MS, tryShow);
            }, VISIBLE_MS);
        };

        schedule(FIRST_DELAY_MS, tryShow);

        return () => {
            cancelled = true;
            clearTimers();
            setCurrent(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, total]);

    /** El usuario está leyendo la invitación: no se retira bajo su cursor. */
    const hold = useCallback(() => window.clearTimeout(hideTimer.current), []);
    const release = useCallback(() => {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setCurrent(null), 3_500);
    }, []);

    const mute = useCallback(() => {
        write(localStorage, MUTE_KEY, String(Date.now() + MUTE_DAYS * 86_400_000));
        clearTimers();
        setCurrent(null);
    }, []);

    const engage = useCallback(() => {
        write(sessionStorage, ENGAGED_KEY, '1');
        clearTimers();
        setCurrent(null);
    }, []);

    return { current, hold, release, mute, engage };
}

interface BubbleProps {
    invite: Invite;
    botName: string;
    memojiUrl: string;
    onOpen: () => void;
    onChip: (prompt: string) => void;
    onMute: () => void;
    onHold: () => void;
    onRelease: () => void;
}

export const LyraInviteBubble = ({ invite, botName, memojiUrl, onOpen, onChip, onMute, onHold, onRelease }: BubbleProps) => {
    const reduce = useReducedMotion();
    const [typed, setTyped] = useState(invite.variant !== 'typing');

    useEffect(() => {
        if (invite.variant !== 'typing') return;
        setTyped(false);
        const t = window.setTimeout(() => setTyped(true), reduce ? 0 : 1100);
        return () => window.clearTimeout(t);
    }, [invite.id, invite.variant, reduce]);

    return (
        <motion.div
            className="lx-invite"
            data-variant={invite.variant}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
            onPointerEnter={onHold}
            onPointerLeave={onRelease}
            onFocus={onHold}
            onBlur={onRelease}
        >
            <div className="lx-invite-card">
                <button type="button" className="lx-invite-open" onClick={onOpen} aria-label={`${invite.text} Abrir el chat con ${botName}`} />
                <div className="lx-invite-body">
                    {invite.variant === 'quiet' && (
                        <>
                            <span className="lx-mini">
                                <img src={memojiUrl} alt="" />
                            </span>
                            <span>{invite.text}</span>
                        </>
                    )}

                    {invite.variant === 'card' && (
                        <>
                            {invite.eyebrow && <span className="lx-eyebrow">{invite.eyebrow}</span>}
                            <span className="lx-invite-title">{invite.text}</span>
                            {invite.cta && (
                                <span className="lx-invite-cta">
                                    {invite.cta} <IconArrowRight />
                                </span>
                            )}
                        </>
                    )}

                    {invite.variant === 'chips' && (
                        <>
                            <span className="lx-invite-title">{invite.text}</span>
                            <div className="lx-chips">
                                {invite.chips?.map((c) => (
                                    <button key={c.label} type="button" className="lx-chip" onClick={() => onChip(c.prompt)}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {invite.variant === 'tinted' && (
                        <>
                            <span className="lx-badge">{invite.icon}</span>
                            <span>{invite.text}</span>
                        </>
                    )}

                    {invite.variant === 'typing' &&
                        (typed ? (
                            <span className="lx-typing-text">{invite.text}</span>
                        ) : (
                            <span className="lx-dots" aria-hidden="true">
                                <i />
                                <i />
                                <i />
                            </span>
                        ))}
                </div>
            </div>
            <button type="button" className="lx-invite-x" onClick={onMute} aria-label="Ocultar las invitaciones del asistente durante una semana">
                <IconClose size={12} />
            </button>
        </motion.div>
    );
};
