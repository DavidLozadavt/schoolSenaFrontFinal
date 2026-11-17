import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useLyra, usePusher, useMenus } from '@/providers';
import { buildNavCatalog } from '@/utils/menuPermissions';
import { useLyraVoice } from '@/hooks/useLyraVoice';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import {
    lyraMapFlyTo,
    lyraMapHighlight,
    lyraMapShow,
    lyraMapFitAll,
    lyraMapZoomIn,
    lyraMapZoomOut,
    lyraMapLocate,
    lyraShowCityInput,
    lyraSetCity,
} from '@/utils/lyraMapBridge';
import { reverseGeocode } from '@/services/geocodingService';
import { fixImageUrl } from '@/utils/Assets';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './lyra.css';
import {
    IconArrowDown,
    IconArrowRight,
    IconCalendar,
    IconCheck,
    IconChecklist,
    IconChevronDown,
    IconClose,
    IconCompass,
    IconGradCap,
    IconInfo,
    IconRefresh,
    IconSparkles,
    IconVolume,
    IconVolumeOff,
    IconWifiOff,
} from './LyraIcons';
import { Invite, LyraInviteBubble, useLyraInvites } from './LyraInvites';
import { LyraHero, LyraSuggestions, Suggestion } from './LyraWelcome';
import { LyraComposer } from './LyraComposer';
import { LyraFormDraft } from './LyraFormDraft';

/* ── Contenido propio de SchoolSena ───────────────────────────────────────
   Sólo se ofrece lo que Lyra resuelve de verdad: clases de hoy, actividades
   pendientes, navegación a las secciones del menú del usuario y "qué puedes
   hacer". Los datos salen del backend de SchoolSena con la sesión del usuario. */

const buildSuggestions = (nav: { title: string; path: string }[]): Suggestion[] => {
    const list: Suggestion[] = [
        { id: 'today', icon: <IconCalendar />, title: 'Clases de hoy', hint: 'Lo que tienes en tu agenda', prompt: '¿Qué clases tengo hoy?' },
        { id: 'pending', icon: <IconChecklist />, title: 'Actividades pendientes', hint: 'Lo que aún tienes por hacer', prompt: '¿Qué actividades tengo pendientes?' },
    ];
    // Una sección real del menú de este usuario (la primera de primer nivel).
    const section = nav.find((n) => !n.title.includes('›')) ?? nav[0];
    if (section) {
        list.push({ id: 'go', icon: <IconCompass />, title: `Abrir ${section.title}`, hint: 'Te llevo directo', prompt: `Llévame a ${section.title}` });
    }
    list.push({ id: 'help', icon: <IconSparkles />, title: '¿Qué puedes hacer?', hint: 'Conoce lo que sé hacer', prompt: '¿Qué puedes hacer?' });
    return list;
};

const buildInvites = (bot: string): Invite[] => [
    { id: 'quiet', variant: 'quiet', text: '¿Tienes dudas sobre tus clases?' },
    { id: 'card', variant: 'card', eyebrow: `${bot} · SchoolSena`, text: 'Consulta tu horario y tus actividades', cta: 'Preguntar' },
    {
        id: 'chips',
        variant: 'chips',
        text: '¿Qué quieres revisar hoy?',
        chips: [
            { label: 'Clases de hoy', prompt: '¿Qué clases tengo hoy?' },
            { label: 'Pendientes', prompt: '¿Qué actividades tengo pendientes?' },
        ],
    },
    { id: 'tinted', variant: 'tinted', text: 'Te llevo a la sección que necesites de tu menú', icon: <IconCompass size={18} /> },
    { id: 'typing', variant: 'typing', text: 'Estoy aquí para acompañarte' },
];

/* ── Sub-component: BusinessCard ────────────────────────────────────────── */
const BusinessCard = ({ business, onVisit }: { business: any, onVisit: (id: number, type?: string) => void }) => {
    const buttonLabel = business.entity_type === 'ficha' ? 'Ver ficha' :
                        business.entity_type === 'actividad' ? 'Ver actividad' :
                        business.entity_type === 'clase' ? 'Ver clase' :
                        business.entity_type === 'persona' ? 'Ver perfil' : 'Ir al detalle';

    return (
        <article className="lx-biz">
            <div className="lx-biz-img">
                <img
                    src={fixImageUrl(business.logo) ?? undefined}
                    alt={business.name}
                    onError={(e) => {
                        const ph = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name || 'N')}&background=056ee9&color=fff`;
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = ph;
                    }}
                />
            </div>
            <div className="lx-biz-body">
                <h4>{business.name}</h4>
                <p>{business.category}</p>
                <div className="lx-biz-actions" style={{ gridTemplateColumns: '1fr' }}>
                    <button type="button" className="lx-biz-btn" data-primary="true" onClick={() => onVisit(business.id, business.entity_type)}>
                        {buttonLabel} <IconArrowRight size={13} />
                    </button>
                </div>
            </div>
        </article>
    );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const LyraAssistant = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { persona, roles, permissions } = useAuthContext();
    const { getMenuConfig } = useMenus();
    const { messages, setMessages, isOpen, setIsOpen, conversationId, setHighlightedBusinessId, setFiltersApplied, isPoweredOn, setIsPoweredOn, checkHealth } = useLyra();
    const { pusher } = usePusher();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSelectedPersonality, setHasSelectedPersonality] = useState(!!sessionStorage.getItem('lyra_personality'));
    // "sena" era el nombre de Nexo en SchoolSena: quien lo tenía elegido sigue
    // con el mismo asistente, ahora llamado igual que en NexiService.
    const [activePersonality, setActivePersonality] = useState(() => {
        const guardada = sessionStorage.getItem('lyra_personality');
        return !guardada || guardada === 'sena' ? 'nexo' : guardada;
    });
    // Nombre real del asistente según su configuración en Lyra (personalities_schoolsena.yaml).
    const botName = activePersonality.toLowerCase() === 'lyra' ? 'Lyra' : 'Nexo';
    const [botGreeting, setBotGreeting] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const reduceMotion = useReducedMotion();
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const orbRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuBtnRef = useRef<HTMLButtonElement>(null);
    const stickRef = useRef(true);
    const wasOpenRef = useRef(isOpen);
    const [showJump, setShowJump] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    // Las respuestas rápidas de una invitación sólo se ofrecen cuando el chat
    // ya sabe con quién habla: el selector de asistente va primero.
    const invites = useMemo(
        () => buildInvites(botName).filter((i) => hasSelectedPersonality || i.variant !== 'chips'),
        [botName, hasSelectedPersonality]
    );
    const { current: invite, hold, release, mute, engage } = useLyraInvites(!isOpen && isPoweredOn, invites);

    const API_URL = import.meta.env.VITE_LYRA_API_URL || 'http://127.0.0.1:8098';

    // Secciones que este usuario ve en su menú (misma regla que el sidebar).
    // Lyra sólo puede llevarlo a una de ellas: no inventa rutas.
    const primaryMenu = getMenuConfig('primary');
    const navCatalog = useMemo(
        () => buildNavCatalog(primaryMenu, permissions ?? [], roles ?? []),
        [primaryMenu, permissions, roles]
    );
    const PROJECT_ID = import.meta.env.VITE_LYRA_PROJECT_ID || 'schoolsena';

    const didHighlightInThisResponse = useRef(false);

    const {
        isListening,
        isSpeaking,
        voiceEnabled,
        setVoiceEnabled,
        isSupported: voiceSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        toggleVoice,
        error: voiceError,
    } = useLyraVoice({
        apiUrl: API_URL,
        projectId: PROJECT_ID,
        autoSpeak: true,
        personality: activePersonality,
        onTranscript: (text) => { setInput(text); handleSendText(text, 'voice'); },
        onSentence: (sentence, index, isLast) => {
            // Sincronización real: Si la frase contiene [TAG:XX], activamos ese negocio en el mapa AHORA
            const match = sentence.match(/\[TAG:([^\]]+)\]/);
            if (match) {
                didHighlightInThisResponse.current = true;
                const businessIdStr = match[1];
                const businessId = Number(businessIdStr);
                console.log('[LyraSync] Hablando sobre negocio ID:', businessId);

                // Activar en el mapa visualmente
                lyraMapShow();
                setHighlightedBusinessId(businessId);
                lyraMapHighlight(businessId);

                // Hacer zoom hacia él (si tenemos los datos en el estado)
                // Usamos un timeout ligero para que el mapa se abra antes del flyTo
                messages.forEach(msg => {
                    const found = msg.businesses?.find((b: any) => b.id === businessId);
                    if (found) {
                        const lat = found.lat || found.latitud;
                        const lng = found.lng || found.longitud;
                        if (lat && lng) {
                            setTimeout(() => lyraMapFlyTo(Number(lat), Number(lng), 17), 100);
                        }
                    }
                });
            }

            // Si es la última frase de la respuesta y resaltamos negocios, hacemos un zoom general
            if (isLast && didHighlightInThisResponse.current) {
                // Le damos 1 segundo adicional para que siga la animación visual mientras pronuncia lo último
                setTimeout(() => {
                    lyraMapFitAll();
                    setHighlightedBusinessId(null);
                    didHighlightInThisResponse.current = false;
                }, 1000);
            }
        }
    });

    const scrollToBottom = (smooth = true) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    };

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
        stickRef.current = nearBottom;
        if (nearBottom) setShowJump(false);
    };

    // Al llegar un mensaje: si el usuario estaba al final (o lo escribió él) se
    // baja; una respuesta larga se deja desde su primera línea para poder
    // leerla; y si estaba leyendo más arriba no se le mueve: aparece el aviso.
    useEffect(() => {
        const el = scrollRef.current;
        const last = messages[messages.length - 1];
        if (!el || !last) return;
        // Pantalla de bienvenida (aún no hay turnos del usuario): se lee desde arriba.
        if (!messages.some((m) => m.role === 'user')) {
            el.scrollTo({ top: 0 });
            return;
        }
        if (last.role === 'user' || stickRef.current) {
            const node = el.querySelector<HTMLElement>('[data-lx-last="true"]');
            if (last.role === 'assistant' && node && node.offsetHeight > el.clientHeight * 0.6) {
                el.scrollTo({ top: Math.max(0, node.offsetTop - 16), behavior: reduceMotion ? 'auto' : 'smooth' });
            } else {
                scrollToBottom();
                stickRef.current = true;
            }
            setShowJump(false);
        } else if (last.role === 'assistant') {
            setShowJump(true);
        }
    }, [messages.length]);

    useEffect(() => {
        if (isLoading && stickRef.current) scrollToBottom();
    }, [isLoading]);

    useLayoutEffect(() => {
        if (!isOpen) return;
        stickRef.current = true;
        if (messages.some((m) => m.role === 'user')) scrollToBottom(false);
        else scrollRef.current?.scrollTo({ top: 0 });
    }, [isOpen]);

    // Abrir el chat cuenta como haber visto las invitaciones: no vuelven en esta sesión.
    useEffect(() => {
        if (isOpen) engage();
    }, [isOpen]);

    // Foco: al abrir con ratón/teclado va al campo; al cerrar vuelve al lanzador.
    // En móvil no se enfoca solo para no sacar el teclado sin que se pida.
    useEffect(() => {
        if (isOpen === wasOpenRef.current) return;
        wasOpenRef.current = isOpen;
        if (isOpen) {
            if (!window.matchMedia('(pointer: fine)').matches) return;
            const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 380);
            return () => window.clearTimeout(t);
        }
        orbRef.current?.focus({ preventScroll: true });
    }, [isOpen]);

    // Móvil: la hoja sigue al viewport visual (teclado virtual) y la página de
    // detrás no se desplaza mientras está abierta.
    useEffect(() => {
        if (!isOpen) return;
        const mq = window.matchMedia('(max-width: 639.98px)');
        const vv = window.visualViewport;
        // Las variables van en <html> y las hereda el panel: ponerle un ref al hijo
        // directo de AnimatePresence hace que React 18 avise en consola.
        const el = document.documentElement;
        let prevOverflow: string | null = null;

        const apply = () => {
            if (mq.matches && vv) {
                el.style.setProperty('--lx-vh', `${vv.height}px`);
                el.style.setProperty('--lx-vt', `${vv.offsetTop}px`);
            } else {
                el.style.removeProperty('--lx-vh');
                el.style.removeProperty('--lx-vt');
            }
            if (mq.matches && prevOverflow === null) {
                prevOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
            } else if (!mq.matches && prevOverflow !== null) {
                document.body.style.overflow = prevOverflow;
                prevOverflow = null;
            }
        };

        apply();
        vv?.addEventListener('resize', apply);
        vv?.addEventListener('scroll', apply);
        mq.addEventListener('change', apply);
        return () => {
            vv?.removeEventListener('resize', apply);
            vv?.removeEventListener('scroll', apply);
            mq.removeEventListener('change', apply);
            el.style.removeProperty('--lx-vh');
            el.style.removeProperty('--lx-vt');
            if (prevOverflow !== null) document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    // Menú del asistente: se cierra al pulsar fuera.
    useEffect(() => {
        if (!showMenu) return;
        const onDown = (e: PointerEvent) => {
            const t = e.target as Node;
            if (menuRef.current?.contains(t) || menuBtnRef.current?.contains(t)) return;
            setShowMenu(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [showMenu]);

    const didInitVoice = useRef(false);
    useEffect(() => {
        if (isOpen && hasSelectedPersonality && isPoweredOn && !didInitVoice.current) {
            // Obtenemos la personalidad y pre-calentamos la voz con un greeting oficial (0 tokens)
            if (messages.length === 0) {
                const match = location.pathname.match(/\/empresa\/(\d+)/);
                const activeCompanyId = match ? match[1] : undefined;

                didInitVoice.current = true; // Marcar como intentado para evitar bucles
                axios.post(`${API_URL}/chat`, {
                    message: "INITIALIZE_VOICE",
                    project_id: PROJECT_ID,
                    user_id: persona?.id || 'user_client_demo',
                    init_voice: true,
                    personality: activePersonality || undefined,
                    active_company_id: activeCompanyId
                })
                .then(response => {
                    const { reply } = response.data;
                    if (reply) {
                        setBotGreeting(reply);
                        // Un saludo que llega tarde no borra lo que el usuario ya escribió.
                        setMessages(prev => (prev.some(m => m.role === 'user') ? prev : [{ role: 'assistant', content: reply }]));
                    }
                })
                .catch(err => {
                    console.info('Lyra unreachable during init. Powering off.');
                    setIsPoweredOn(false);
                    didInitVoice.current = false; // Reset to allow retry when back online
                });
            }
        }
    }, [isOpen, hasSelectedPersonality, isPoweredOn]);

    // ── AUTO-GPS: Disabled for SchoolSena ──
    // ───────────────────────────────────────────────────────────────────────────

    // ==== PUSHER: REAL-TIME SYNC ====
    useEffect(() => {
        if (!pusher) return;

        const channel = pusher.subscribe('lyra-channel');
        channel.bind('personality_updated', function(data: any) {
            // El canal de Pusher es compartido entre proyectos: sólo vale lo de schoolsena.
            if (data?.project_id !== 'schoolsena') return;
            console.log('[Pusher] Recibimos actualización en vivo de personalidad:', data);
            if (data.bot_name) {
                // Actualizar el estado local si es necesario
            }
            if (data.bot_greeting) {
                setBotGreeting(data.bot_greeting);
                setMessages(prev => {
                    if (prev.length === 0) return [{ role: 'assistant', content: data.bot_greeting }];
                    const newMessages = [...prev];
                    if (newMessages[0].role === 'assistant') {
                        newMessages[0].content = data.bot_greeting;
                    }
                    return newMessages;
                });
            }
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe('lyra-channel');
            console.log('[LyraAssistant] Unsubscribed from lyra-channel');
        };
    }, []);
    // ================================

    // Sección del menú que corresponde a cada tipo de tarjeta. Sólo se navega
    // si el usuario tiene esa sección en su menú; antes había rutas fijas
    // (incluida una con el programa 1 escrito a mano).
    const CARD_SECTIONS: Record<string, string[]> = {
        actividad: ['/ambiente-virtual/actividades', '/ambiente-virtual/instructor/mis-actividades'],
        clase: ['/ambiente-virtual/mis-clases', '/ambiente-virtual/horario'],
        ficha: ['/ambiente-virtual/grupos', '/ambiente-virtual/mis-clases'],
        persona: ['/gestion-usuarios/usuarios'],
    };

    const handleVisit = (_id: number, type?: string) => {
        const allowed = new Set(navCatalog.map((c) => c.path));
        const target = (CARD_SECTIONS[type || ''] || []).find((path) => allowed.has(path));
        if (!target) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'No tienes en tu menú una sección para abrir este elemento.'
            }]);
            return;
        }
        navigate(target);
    };

    /**
     * Lleva al usuario a una sección y comprueba que llegó.
     *
     * Lyra responde "te llevo a X"; quien confirma es la aplicación: si una
     * guarda de permisos devuelve al usuario a otra ruta, se le dice en el chat
     * en lugar de dar por hecha la navegación.
     */
    const goToSection = (url: string, title?: string) => {
        if (!url.startsWith('/') || url.startsWith('//')) return;
        const label = title || url;
        setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
                next[next.length - 1] = { ...last, navStatus: 'pending', navTitle: label };
            }
            return next;
        });
        navigate(url);
        window.setTimeout(() => {
            const arrived = window.location.pathname.replace(/\/$/, '') === url.split(/[?#]/)[0].replace(/\/$/, '');
            setMessages(prev => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                    if (next[i].navStatus === 'pending' && next[i].navTitle === label) {
                        next[i] = { ...next[i], navStatus: arrived ? 'ok' : 'failed' };
                        break;
                    }
                }
                return next;
            });
        }, 1200);
    };

    // ── Turnos ─────────────────────────────────────────────────────────────
    // Cada petición al chat es un turno; lo que llega de un turno superado
    // (respuesta tardía, cambio de asistente) no se aplica: ni texto, ni voz,
    // ni navegación. turn_id del servidor cubre dos pestañas con el mismo hilo.
    const turnRef = useRef(0);
    const inflightRef = useRef<AbortController | null>(null);
    const serverTurnRef = useRef(0);
    const beginTurn = () => {
        inflightRef.current?.abort();
        const controller = new AbortController();
        inflightRef.current = controller;
        const turn = ++turnRef.current;
        return { turn, signal: controller.signal, live: () => turn === turnRef.current };
    };

    const handleSendText = async (text: string, inputMode?: 'voice') => {
        const userMessage = text.trim();
        if (!userMessage || isLoading || !isPoweredOn) return;

        // Detener voz inmediatamente al enviar nuevo mensaje
        stopSpeaking();

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        const { signal, live } = beginTurn();

        // Capturar ubicación actual para Lyra (Proximidad)
        let lat: number | null = null;
        let lng: number | null = null;
        try {
            const pos: any = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch(e) { /* ignore */ }

        // Capture context from UI (Active City)
        const activeCity = sessionStorage.getItem('home_locationTerm');

        const match = location.pathname.match(/\/empresa\/(\d+)/);
        const activeCompanyId = match ? match[1] : undefined;

        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message: userMessage,
                project_id: PROJECT_ID,
                conversation_id: conversationId,
                user_id: persona?.id || 'user_client_demo',
                role: roles && roles.length > 0 ? roles.join(',') : 'client',
                personality: activePersonality || undefined,
                lat,
                lng,
                active_city: activeCity || undefined,
                active_company_id: activeCompanyId,
                nav_catalog: navCatalog,
                current_path: location.pathname,
                input_mode: inputMode
            }, { signal });

            // Respuesta de un turno superado: no se aplica nada.
            if (!live()) return;
            const serverTurn = Number(response.data?.turn_id) || 0;
            if (serverTurn && serverTurn < serverTurnRef.current) return;
            if (serverTurn) serverTurnRef.current = serverTurn;

            // Lo dictado se muestra con forma (mayúscula, signos); el texto
            // literal es el que se envió y el que guarda el servidor.
            const shown = response.data?.display_message;
            if (inputMode === 'voice' && shown) {
                setMessages(prev => {
                    const idx = [...prev].reverse().findIndex(m => m.role === 'user' && m.content === userMessage);
                    if (idx < 0) return prev;
                    const at = prev.length - 1 - idx;
                    const next = [...prev];
                    next[at] = { ...next[at], content: shown };
                    return next;
                });
            }
            if (response.data?.reply) {
                const { reply, voice_action, voice_action_payload, properties, map_center, filters_applied, suggested_next_city, searched_category, form_draft } = response.data;

                // Actualizar filtros globales (para el modal del mapa)
                if (filters_applied) setFiltersApplied(filters_applied);

                // Extraer negocios: properties es array. El fast-path de nexiservice
                // lo devuelve como [{businesses: [...]}], otras rutas como [{id, name, ...}]
                let businesses: any[] = [];
                if (Array.isArray(properties) && properties.length > 0) {
                    if (properties[0]?.businesses) {
                        // Fast-path: [{businesses: [...negocios]}]
                        businesses = properties[0].businesses;
                    }
                    // Si es un array de properties normales (no negocios), lo ignoramos aquí
                }

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: reply,
                    businesses: businesses.length > 0 ? businesses : undefined,
                    // Para el panel vacío: negocios sugeridos de otra ciudad
                    suggestedBusinesses: businesses.length > 0 ? businesses : undefined,
                    suggestedCity: suggested_next_city || undefined,
                    searchedCategory: searched_category || undefined,
                    isZeroResult: businesses.length > 0 && !reply.includes('[TAG:'),
                    formDraft: form_draft || undefined,
                }]);


                const hasBusinesses = /\[TAG:[^\]]+\]/.test(reply);
                if (voiceEnabled) {
                    // Si vamos a leer negocios, reseteamos el override manual para que la cámara siga la voz
                    if (hasBusinesses) lyraMapFitAll();
                    speak(reply, hasBusinesses);
                }

                // SchoolSena no tiene mapa: sólo se atienden las acciones que
                // tienen sentido aquí.
                if (voice_action === 'open_url' && voice_action_payload?.url) {
                    const url = String(voice_action_payload.url);
                    if (/^https:\/\//.test(url)) window.open(url, '_blank', 'noopener');
                } else if (voice_action === 'navigate' && voice_action_payload?.url) {
                    goToSection(String(voice_action_payload.url), voice_action_payload.title);
                }
            }
        } catch (err: any) {
            // Cancelada porque empezó otro turno: no es un error ni una caída.
            if (axios.isCancel(err) || !live()) return;
            // Sólo un fallo de red significa que Lyra está apagada. Un 429 o un
            // 5xx son respuestas del servidor: se informan sin desconectar el chat.
            const status = err?.response?.status;
            let content = 'Lo siento, tuve un problema al conectar. ¡Intenta de nuevo!';
            if (!err?.response) {
                console.warn('Lyra connection error. Marking as offline.');
                setIsPoweredOn(false);
            } else if (status === 429) {
                content = 'Estás enviando mensajes muy seguido. Espera un momento y vuelve a intentarlo.';
            } else if (status === 422) {
                content = 'No pude procesar ese mensaje. ¿Puedes escribirlo de otra forma (más corto)?';
            } else {
                content = 'Tuve un problema técnico al responder. Intenta de nuevo en unos segundos.';
            }
            setMessages(prev => [...prev, { role: 'assistant', content, retry: userMessage }]);
        } finally {
            if (live()) setIsLoading(false);
        }
    };

    const handleSend = () => handleSendText(input);

    // Reintentar: se quita el aviso de error y el mensaje que falló, y se envía de nuevo por el flujo normal.
    const retryMessage = (text: string) => {
        setMessages(prev => {
            const next = [...prev];
            if (next[next.length - 1]?.retry === text) {
                next.pop();
                if (next[next.length - 1]?.role === 'user' && next[next.length - 1].content === text) next.pop();
            }
            return next;
        });
        handleSendText(text);
    };

    const retryConnection = async () => {
        setChecking(true);
        await checkHealth();
        setChecking(false);
    };

    // Una invitación con respuesta rápida abre el chat y envía la pregunta cuando
    // el saludo inicial ya llegó (si no, ese saludo reemplazaría la conversación).
    useEffect(() => {
        if (!pendingPrompt || !isOpen) return;
        if (messages.length > 0) {
            const prompt = pendingPrompt;
            setPendingPrompt(null);
            handleSendText(prompt);
            return;
        }
        const t = window.setTimeout(() => setPendingPrompt(null), 6000);
        return () => window.clearTimeout(t);
    }, [pendingPrompt, isOpen, messages.length]);
    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setVoiceEnabled(true);
            startListening();
        }
    };

    const changePersonality = (newPersonality: string) => {
        setHasSelectedPersonality(true);
        setActivePersonality(newPersonality);
        sessionStorage.setItem('lyra_personality', newPersonality);
        setShowMenu(false);

        if (!isPoweredOn) {
            console.info('Lyra is offline. Skipping initialization request.');
            return;
        }

        setMessages([]); // Limpiamos para obtener el nuevo saludo
        // Lo que estuviera en camino era del asistente anterior.
        const { signal, live } = beginTurn();
        setIsLoading(false);

        const match = location.pathname.match(/\/empresa\/(\d+)/);
        const activeCompanyId = match ? match[1] : undefined;

        axios.post(`${API_URL}/chat`, {
            message: "INITIALIZE_VOICE",
            project_id: PROJECT_ID,
            user_id: persona?.id || 'user_client_demo',
            init_voice: true,
            personality: newPersonality,
            active_city: sessionStorage.getItem('home_locationTerm') || undefined,
            active_company_id: activeCompanyId
        }, { signal }).then(response => {
            if (!live()) return;
            const { reply } = response.data;
            if (reply) {
                setBotGreeting(reply);
                setMessages([{ role: 'assistant', content: reply }]);
            }
        }).catch(err => {
            if (axios.isCancel(err)) return;
            console.warn('Lyra unreachable during personality change.');
            setIsPoweredOn(false);
        });
    };

    const memojiUrl = botName.toLowerCase() === 'lyra'
        ? '/media/app/lyra-memoji.png'
        : '/media/app/nexo-memoji.png';
    const suggestions = useMemo(() => buildSuggestions(navCatalog), [navCatalog]);

    const statusState = !isPoweredOn ? 'offline' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'online';
    const statusLabel = { offline: 'Sin conexión', speaking: 'Hablando…', listening: 'Escuchando…', online: 'En línea' }[statusState];
    const userStarted = messages.some((m) => m.role === 'user');
    const showWelcome = isPoweredOn && hasSelectedPersonality && !userStarted;
    const lastIdx = messages.length - 1;
    // Sólo la respuesta más reciente con formulario muestra la tarjeta; las anteriores conservan su texto.
    const lastDraftIdx = messages.reduce((acc, m, i) => (m.formDraft ? i : acc), -1);

    const cleanContent = (content: string) =>
        content
            .replace(/\[BIZ:\d+\]/g, '')
            .replace(/\[TAG:\d+\]/g, '')
            .replace(/\[SERVICIO:[^\]]+\]/g, '')
            .replace(/\[HORA:[^\]]+\]/g, '')
            .replace(/\[CONFIRMACIÓN NECESARIA\]/g, '')
            .replace(/\[CONFIRMACION NECESARIA\]/g, '')
            .trim();

    return (
        <>
            {/* Lanzador. Fijo al viewport y con el área segura del dispositivo. */}
            <div className="lx lx-launcher" data-open={isOpen}>
                <button
                    ref={orbRef}
                    type="button"
                    className="lx-orb"
                    data-open={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={`${isOpen ? 'Cerrar el chat' : `Abrir el chat con ${botName}`}${isPoweredOn ? '' : ' (sin conexión)'}`}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                >
                    <span className="lx-orb-ring" aria-hidden="true" />
                    <span className="lx-orb-face">
                        <img
                            src={memojiUrl}
                            alt=""
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=L&background=056ee9&color=fff';
                            }}
                        />
                    </span>
                    <span className="lx-orb-x" aria-hidden="true"><IconClose size={24} /></span>
                    <span className="lx-orb-status" data-online={isPoweredOn} aria-hidden="true" />
                </button>

                <AnimatePresence>
                    {invite && !isOpen && (
                        <LyraInviteBubble
                            key={invite.id}
                            invite={invite}
                            botName={botName}
                            memojiUrl={memojiUrl}
                            onOpen={() => setIsOpen(true)}
                            onChip={(prompt) => { setPendingPrompt(prompt); setIsOpen(true); }}
                            onMute={mute}
                            onHold={hold}
                            onRelease={release}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* En móvil el chat es una hoja: se atenúa el fondo para enfocar. */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="lx-scrim"
                        className="lx-scrim"
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="lx-panel"
                        role="dialog"
                        aria-label={`Chat con ${botName}, asistente de SchoolSena`}
                        className="lx lx-panel"
                        onKeyDown={(e) => {
                            if (e.key !== 'Escape') return;
                            e.stopPropagation();
                            if (showMenu) {
                                setShowMenu(false);
                                menuBtnRef.current?.focus();
                            } else {
                                setIsOpen(false);
                            }
                        }}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion
                            ? { opacity: 0, transition: { duration: 0.12 } }
                            : { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.42 }}
                    >
                        {/* Cabecera */}
                        <header className="lx-head lx-rise" style={{ ['--i' as string]: 0 }}>
                            <div className="lx-avatar" data-listening={isListening}>
                                <img src={memojiUrl} alt="" />
                            </div>
                            <div className="lx-who">
                                <button
                                    ref={menuBtnRef}
                                    type="button"
                                    className="lx-name"
                                    aria-expanded={showMenu}
                                    aria-controls="lx-menu"
                                    onClick={() => setShowMenu((v) => !v)}
                                >
                                    {botName}
                                    <IconChevronDown size={15} />
                                </button>
                                <div className="lx-status">
                                    <span className="lx-dot" data-state={statusState} aria-hidden="true" />
                                    <span>{statusLabel} · SchoolSena</span>
                                </div>
                            </div>
                            <div className="lx-actions">
                                {voiceSupported && (
                                    <button
                                        type="button"
                                        className="lx-iconbtn"
                                        data-off={!voiceEnabled}
                                        onClick={toggleVoice}
                                        aria-pressed={voiceEnabled}
                                        aria-label={voiceEnabled ? 'Silenciar la voz del asistente' : 'Activar la voz del asistente'}
                                    >
                                        {voiceEnabled ? <IconVolume /> : <IconVolumeOff />}
                                    </button>
                                )}
                                <button type="button" className="lx-iconbtn" onClick={() => setIsOpen(false)} aria-label="Cerrar el chat">
                                    <IconClose />
                                </button>
                            </div>

                            {showMenu && (
                                <div id="lx-menu" ref={menuRef} className="lx-menu" role="group" aria-label="Opciones del asistente">
                                    <button type="button" className="lx-menu-item" aria-pressed={botName === 'Nexo'} onClick={() => changePersonality('nexo')}>
                                        <span className="lx-mini"><img src="/media/app/nexo-memoji.png" alt="" /></span>
                                        Nexo
                                        {botName === 'Nexo' && <IconCheck className="lx-menu-check" />}
                                    </button>
                                    <button type="button" className="lx-menu-item" aria-pressed={botName === 'Lyra'} onClick={() => changePersonality('lyra')}>
                                        <span className="lx-mini"><img src="/media/app/lyra-memoji.png" alt="" /></span>
                                        Lyra
                                        {botName === 'Lyra' && <IconCheck className="lx-menu-check" />}
                                    </button>
                                </div>
                            )}
                        </header>

                        <div className="lx-beta">
                            <IconInfo />
                            <span><b>Fase de prueba.</b> {botName} se está ajustando en SchoolSena.</span>
                        </div>

                        {voiceError && <div className="lx-note" role="alert">{voiceError}</div>}

                        {/* Conversación */}
                        <div
                            ref={scrollRef}
                            className="lx-scroll"
                            onScroll={onScroll}
                            tabIndex={0}
                            aria-label={`Conversación con ${botName}`}
                        >
                            {!isPoweredOn ? (
                                <div className="lx-offline lx-rise" style={{ ['--i' as string]: 1 }}>
                                    <div className="lx-offline-ico"><IconWifiOff /></div>
                                    <h3>{botName} no está disponible</h3>
                                    <p>El servicio de asistencia no responde en este momento. Inténtalo de nuevo en unos instantes.</p>
                                    <button type="button" className="lx-btn" disabled={checking} onClick={retryConnection}>
                                        <IconRefresh /> {checking ? 'Comprobando…' : 'Reintentar'}
                                    </button>
                                </div>
                            ) : !hasSelectedPersonality ? (
                                <div className="lx-pick">
                                    <div className="lx-hero lx-rise" style={{ ['--i' as string]: 0 }}>
                                        <h2>¿Con quién quieres hablar?</h2>
                                        <p>Elige el asistente con el que te sientas más cómodo. Puedes cambiarlo cuando quieras.</p>
                                    </div>
                                    <button type="button" className="lx-pick-row lx-rise" style={{ ['--i' as string]: 1 }} onClick={() => changePersonality('nexo')}>
                                        <span className="lx-avatar"><img src="/media/app/nexo-memoji.png" alt="" /></span>
                                        <span>
                                            <b>Nexo</b>
                                            <span>Formal y directo. Respuestas rápidas y precisas.</span>
                                        </span>
                                    </button>
                                    <button type="button" className="lx-pick-row lx-rise" style={{ ['--i' as string]: 2 }} onClick={() => changePersonality('lyra')}>
                                        <span className="lx-avatar"><img src="/media/app/lyra-memoji.png" alt="" /></span>
                                        <span>
                                            <b>Lyra</b>
                                            <span>Cercana y conversadora. Te acompaña paso a paso.</span>
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {showWelcome && (
                                        <LyraHero
                                            botName={botName}
                                            memojiUrl={memojiUrl}
                                            title={`Hola, soy ${botName}`}
                                            description="Consulta tu horario, tus actividades y tu menú."
                                        />
                                    )}

                                    <div className="lx-log" role="log" aria-live="polite" aria-relevant="additions">
                                        {messages.map((msg, idx) => {
                                            const isUser = msg.role === 'user';
                                            const hasBiz = !!msg.businesses && msg.businesses.length > 0;
                                            const draft = !isUser ? msg.formDraft : undefined;
                                            const fullDraft = !!draft && idx === lastDraftIdx;
                                            const shown = fullDraft ? draft!.texto : msg.content;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="lx-msg"
                                                    data-role={msg.role}
                                                    data-after={messages[idx - 1]?.role === msg.role ? 'same' : undefined}
                                                    data-lx-last={idx === lastIdx}
                                                >
                                                    <div className="lx-bubble" data-biz={hasBiz}>
                                                        {shown && <div className="lx-md">
                                                            <ReactMarkdown
                                                                components={{
                                                                    a: ({ children, href }) => (
                                                                        <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
                                                                    ),
                                                                }}
                                                            >
                                                                {cleanContent(shown)}
                                                            </ReactMarkdown>
                                                        </div>}

                                                        {fullDraft && (
                                                            <LyraFormDraft draft={draft!} onOpen={ruta => goToSection(ruta, 'Formularios')} />
                                                        )}

                                                        {!isUser && msg.navStatus && (
                                                            <div
                                                                data-testid="lyra-nav-status"
                                                                data-status={msg.navStatus}
                                                                className="lx-nav"
                                                            >
                                                                {msg.navStatus === 'ok' && <IconCheck size={14} />}
                                                                {msg.navStatus === 'ok' && `Listo: estás en ${msg.navTitle}.`}
                                                                {msg.navStatus === 'failed' && `No pude abrir ${msg.navTitle}: la página no está disponible.`}
                                                                {msg.navStatus === 'pending' && `Abriendo ${msg.navTitle}…`}
                                                            </div>
                                                        )}

                                                        {!isUser && msg.retry && idx === lastIdx && (
                                                            <button type="button" className="lx-retry" disabled={isLoading} onClick={() => retryMessage(msg.retry!)}>
                                                                <IconRefresh /> Reintentar
                                                            </button>
                                                        )}

                                                        {hasBiz && (
                                                            <div className="lx-bizlist">
                                                                {msg.businesses!.map((b: any) => (
                                                                    <BusinessCard key={b.id} business={b} onVisit={handleVisit} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {isLoading && (
                                            <div className="lx-msg" data-role="assistant" data-after="same">
                                                <div className="lx-typing" role="status" aria-label={`${botName} está escribiendo`}>
                                                    <span className="lx-dots" aria-hidden="true"><i /><i /><i /></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isListening && (
                                        <div className="lx-listening" role="status">
                                            <span className="lx-wave" aria-hidden="true"><i /><i /><i /><i /></span>
                                            Te estoy escuchando…
                                        </div>
                                    )}

                                    {showWelcome && messages.length > 0 && (
                                        <LyraSuggestions suggestions={suggestions} disabled={isLoading} onPick={handleSendText} />
                                    )}
                                </>
                            )}
                        </div>

                        {showJump && (
                            <button type="button" className="lx-jump" onClick={() => { stickRef.current = true; setShowJump(false); scrollToBottom(); }}>
                                <IconArrowDown size={14} /> Mensaje nuevo
                            </button>
                        )}

                        {/* Escritura */}
                        <LyraComposer
                            ref={inputRef}
                            value={input}
                            onChange={setInput}
                            onSend={handleSend}
                            placeholder={isListening ? 'Escuchando tu voz…' : 'Escribe tu mensaje…'}
                            inputDisabled={isListening || !isPoweredOn}
                            sendDisabled={isLoading || isListening || !input.trim() || !isPoweredOn}
                            loading={isLoading}
                            voice={voiceSupported ? { listening: isListening, disabled: isLoading || !isPoweredOn, onToggle: handleMicClick } : undefined}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export { LyraAssistant };
