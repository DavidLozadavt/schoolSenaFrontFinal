import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import { useLyra, usePusher } from '@/providers';
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
import { motion, AnimatePresence } from 'framer-motion';

/* ── SVG Icons ────────────────────────────────────────────────────────── */
const IconMic = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
    </svg>
);

const IconMicOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M19 10v2a7 7 0 0 1-.77 3.21L16.7 13.7A5 5 0 0 0 17 12v-2h-2V7.83L19 10zM15 4v5.17l-3-3V4a2 2 0 1 1 3 0z"/>
        <path d="m3.27 3 18 18-1.27 1.27-2.48-2.48A9 9 0 0 1 3 12v-2h2v2a7 7 0 0 0 9.51 6.51L16.11 20A9 9 0 0 1 13 22.94V23h-2v-2.06A9 9 0 0 1 3 12v-2H1.27z"/>
        <path d="M9.24 9.24 9 9V4a3 3 0 0 1 5.76-1.24L9.24 9.24z"/>
    </svg>
);

const IconSend = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const IconVolumeOn = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
);

const IconVolumeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
);

/* ── Sub-component: BusinessCard ────────────────────────────────────────── */
const BusinessCard = ({ business, onVisit, onExploreMap }: { business: any, onVisit: (id: number, type?: string) => void, onExploreMap: (business: any) => void }) => {
    const buttonLabel = business.entity_type === 'ficha' ? 'Ver Ficha' : 
                        business.entity_type === 'actividad' ? 'Ver Actividad' :
                        business.entity_type === 'clase' ? 'Ver Clase' : 
                        business.entity_type === 'persona' ? 'Ver Perfil' : 'Ir a Detalle';

    return (
        <div className="mt-2 flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-coal-400 dark:bg-coal-500">
            <div className="h-24 w-full bg-gray-100 dark:bg-coal-400">
                <img 
                    src={fixImageUrl(business.logo) ?? undefined} 
                    alt={business.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => { 
                        const ph = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name || 'N')}&background=8b5cf6&color=fff`;
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = ph; 
                    }}
                />
            </div>
            <div className="p-3">
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">{business.name}</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{business.category}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                    <button
                        onClick={() => onVisit(business.id, business.entity_type)}
                        className="rounded-lg bg-primary py-2 text-[10px] font-bold text-white transition-all hover:bg-primary-active active:scale-95 flex items-center justify-center gap-1 w-full shadow-lg shadow-primary/20"
                    >
                        {buttonLabel}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Sub-component: Particle ────────────────────────────────────────── */
const Particle = ({ i, count }: { i: number, count: number }) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 50 + Math.random() * 120; // Increased distance
    const size = 2 + Math.random() * 6; // More size variety
    const duration = 0.6 + Math.random() * 0.8;
    
    return (
        <motion.span
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ 
                x: Math.cos(angle) * distance, 
                y: Math.sin(angle) * distance,
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 720 // More rotation
            }}
            transition={{ 
                duration: duration, 
                ease: [0.16, 1, 0.3, 1],
                delay: Math.random() * 0.05
            }}
            className={clsx(
                "absolute rounded-full shadow-lg z-0",
                i % 3 === 0 ? "bg-violet-400 shadow-violet-500/50" : 
                i % 3 === 1 ? "bg-indigo-400 shadow-indigo-500/50" : "bg-white shadow-white/50"
            )}
            style={{ 
                width: size, 
                height: size,
                top: '50%',
                left: '50%',
                marginTop: -size/2,
                marginLeft: -size/2
            }}
        />
    );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const LyraAssistant = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { persona, roles } = useAuthContext();
    const { messages, setMessages, isOpen, setIsOpen, conversationId, setHighlightedBusinessId, setFiltersApplied, isPoweredOn, setIsPoweredOn, checkHealth } = useLyra();
    const { pusher } = usePusher();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasSelectedPersonality, setHasSelectedPersonality] = useState(!!sessionStorage.getItem('lyra_personality'));
    const [activePersonality, setActivePersonality] = useState(sessionStorage.getItem('lyra_personality') || 'lyra');
    const botName = activePersonality.toLowerCase() === 'lyra' ? 'Lyra' : 'Nexo';
    const [botGreeting, setBotGreeting] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_URL = import.meta.env.VITE_LYRA_API_URL || 'http://127.0.0.1:8099';
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
        onTranscript: (text) => { setInput(text); handleSendText(text); },
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

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages]);

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
                        setMessages([{ role: 'assistant', content: reply }]);
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

    const handleVisit = (id: number, type?: string) => {
        setIsOpen(false);
        
        // SchoolSena routing logic
        if (type === 'ficha') {
            navigate('/gestion-academica/configuracion/programas/1/fichas');
        } else if (type === 'actividad') {
            navigate('/ambiente-virtual/actividades');
        } else if (type === 'clase') {
            navigate('/ambiente-virtual/mis-clases');
        } else if (type === 'persona') {
            navigate('/gestion-usuarios/usuarios');
        } else {
            navigate('/');
        }
    };

    const handleExploreOnMap = (business: any) => {
        // Disabled for SchoolSena
        console.log('Explore on map disabled', business);
    };

    const handleSendText = async (text: string) => {
        const userMessage = text.trim();
        if (!userMessage || isLoading || !isPoweredOn) return;

        // Detener voz inmediatamente al enviar nuevo mensaje
        stopSpeaking();

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

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
                active_company_id: activeCompanyId
            });

            if (response.data?.reply) {
                const { reply, voice_action, voice_action_payload, properties, map_center, filters_applied, suggested_next_city, searched_category } = response.data;
                
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
                }]);

                
                const hasBusinesses = /\[TAG:[^\]]+\]/.test(reply);
                if (voiceEnabled) {
                    // Si vamos a leer negocios, reseteamos el override manual para que la cámara siga la voz
                    if (hasBusinesses) lyraMapFitAll(); 
                    speak(reply, hasBusinesses);
                }

                // Helper para asegurar que estamos en el home antes de disparar eventos de mapa
                const ensureHome = (callback: () => void) => {
                    if (location.pathname !== '/') {
                        console.log('[LyraAssistant] No estamos en home. Redirigiendo antes de acción de mapa.');
                        navigate('/');
                        // Esperamos a que el componente HomeEcommerce monte sus listeners
                        setTimeout(callback, 1000);
                    } else {
                        callback();
                    }
                };

                // ── ACCIONES DE MAPA (EventBus) ────────────────────────────
                // 1. Centrar mapa en coordenadas específicas (viene de map_center)
                if (map_center?.lat && map_center?.lng) {
                    ensureHome(() => {
                        lyraMapShow();
                        setTimeout(() => {
                            lyraMapFlyTo(map_center.lat, map_center.lng, map_center.zoom || 16);
                        }, 500);
                    });
                }

                // 2. Acciones explícitas de voz sobre el mapa
                if (voice_action === 'gps_granted') {
                    // GPS accepted: city is already set via active_city; fire set_city event
                    const confirmedCity = voice_action_payload?.city || activeCity;
                    if (confirmedCity) {
                        sessionStorage.setItem('home_locationTerm', confirmedCity);
                        lyraSetCity(confirmedCity);
                    }
                } else if (voice_action === 'show_city_input') {
                    // GPS denied or no signal: show city manual input
                    lyraShowCityInput(voice_action_payload?.reason);
                } else if (voice_action === 'set_city') {
                    // User set city manually via chat
                    const city = voice_action_payload?.city;
                    if (city) {
                        sessionStorage.setItem('home_locationTerm', city);
                        lyraSetCity(city);
                    }
                } else if (voice_action === 'show_map') {
                    console.log('[LyraAssistant] Acción: show_map');
                    ensureHome(() => lyraMapShow());
                } else if (voice_action === 'locate_me') {
                    console.log('[LyraAssistant] Acción: locate_me');
                    ensureHome(() => {
                        lyraMapShow();
                        setTimeout(() => lyraMapLocate(), 500);
                    });
                } else if (voice_action === 'fly_to_business' && voice_action_payload?.business_id) {
                    ensureHome(() => {
                        lyraMapShow();
                        setHighlightedBusinessId(Number(voice_action_payload.business_id));
                        setTimeout(() => {
                            lyraMapHighlight(Number(voice_action_payload.business_id));
                            if (voice_action_payload?.lat && voice_action_payload?.lng) {
                                lyraMapFlyTo(
                                    Number(voice_action_payload.lat),
                                    Number(voice_action_payload.lng),
                                    17
                                );
                            }
                        }, 500);
                    });
                } else if (voice_action === 'fly_to' && voice_action_payload?.lat) {
                    ensureHome(() => {
                        lyraMapShow();
                        setTimeout(() => {
                            lyraMapFlyTo(
                                Number(voice_action_payload.lat),
                                Number(voice_action_payload.lng),
                                voice_action_payload?.zoom || 15
                            );
                        }, 500);
                    });
                } else if (voice_action === 'fit_all_businesses') {
                    ensureHome(() => {
                        lyraMapShow();
                        lyraMapFitAll();
                    });
                } else if (voice_action === 'zoom_in') {
                    lyraMapZoomIn();
                } else if (voice_action === 'zoom_out') {
                    lyraMapZoomOut();
                } else if (voice_action === 'open_url' && voice_action_payload?.url) {
                    // Abrir URL externa en nueva pestaña
                    setTimeout(() => {
                        window.open(voice_action_payload.url, '_blank');
                    }, 1500);
                } else if (voice_action === 'navigate' && voice_action_payload?.url) {
                    // Redirección a página
                    const targetUrl = voice_action_payload.url;
                    const shouldShowMap = voice_action_payload.show_map;

                    setTimeout(() => {
                        // setIsOpen(false); // Eliminado para mantener la conversación continua
                        navigate(targetUrl);
                        
                        // Si se solicitó el mapa o mostrar todos, activamos tras un delay
                        if (shouldShowMap || voice_action_payload.fit_all) {
                            setTimeout(() => {
                                console.log('[LyraAssistant] Activando mapa pos-navegación');
                                lyraMapShow();
                                if (voice_action_payload.fit_all) {
                                    setTimeout(() => lyraMapFitAll(), 500);
                                }
                            }, 1000);
                        }
                    }, 2000);
                }

                // 3. Si hay negocios encontrados, mostrar mapa y manejar vista
                if (businesses.length > 0) {
                    ensureHome(() => {
                        lyraMapShow();

                        if (businesses.length === 1 && businesses[0].id) {
                            // Si es solo uno, destacar y abrir modal flotante
                            setHighlightedBusinessId(Number(businesses[0].id));
                            lyraMapHighlight(Number(businesses[0].id));
                            
                            // Si la API no proveyó map_center, lo deducimos
                            if (!map_center && businesses[0].lat && businesses[0].lng) {
                                setTimeout(() => {
                                    lyraMapFlyTo(
                                        Number(businesses[0].lat),
                                        Number(businesses[0].lng),
                                        16
                                    );
                                }, 500);
                            }
                        } else if (businesses.length > 1) {
                            // Si son varios, limpiar cualquier destacado previo y mostrar vista panorámica
                            setHighlightedBusinessId(null);
                            setTimeout(() => lyraMapFitAll(), 800);
                        }
                    });
                }
            }
        } catch (err) {
            console.warn('Lyra connection error. Marking as offline.');
            setIsPoweredOn(false);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema al conectar. ¡Intenta de nuevo!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => handleSendText(input);
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
        }).then(response => {
            const { reply } = response.data;
            if (reply) {
                setBotGreeting(reply);
                setMessages([{ role: 'assistant', content: reply }]);
            }
        }).catch(err => {
            console.warn('Lyra unreachable during personality change.');
            setIsPoweredOn(false);
        });
    };

    const memojiUrl = botName.toLowerCase() === 'lyra' 
        ? '/media/app/lyra-memoji.png' 
        : '/media/app/nexo-memoji.png';

    return (
        <>
            {/* Ultra-Premium Floating Assistant Trigger - Forced Visibility */}
            <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[99999999]" style={{ filter: 'drop-shadow(0 15px 35px rgba(124,58,237,0.4))' }}>
                <div className="relative flex items-center justify-center h-16 w-16 md:h-20 md:w-20">
                    <AnimatePresence>
                        {!isOpen && (
                            <motion.button
                                key="assistant-trigger"
                                onClick={() => setIsOpen(true)}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ 
                                    opacity: 0, 
                                    scale: 1.5,
                                    filter: 'blur(10px)',
                                    transition: { duration: 0.4 }
                                }}
                                className="absolute flex h-16 w-16 md:h-20 md:w-20 items-center justify-center hover:scale-110 active:scale-95 animate-assistant-float"
                            >
                                {/* Particle dispersion on exit */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <Particle key={i} i={i} count={40} />
                                    ))}
                                    {/* Flash effect */}
                                    <motion.div 
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 4, opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute h-20 w-20 rounded-full bg-white/40 blur-2xl"
                                    />
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 to-indigo-600/40 rounded-full blur-3xl animate-assistant-ping-soft" />
                                <img 
                                    src={memojiUrl} 
                                    alt="Bot Trigger" 
                                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=L&background=8b5cf6&color=fff';
                                    }}
                                />
                                
                                {/* Active State Indicator */}
                                <span className="absolute top-2 right-2 flex h-4 w-4 z-20">
                                    <span className={clsx(
                                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                        isPoweredOn ? "bg-green-400" : "bg-red-400"
                                    )}></span>
                                    <span className={clsx(
                                        "relative inline-flex rounded-full h-4 w-4 border-2 border-white shadow-sm",
                                        isPoweredOn ? "bg-green-500" : "bg-red-500"
                                    )}></span>
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Premium Close Button when open */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.button
                                key="close-trigger"
                                onClick={() => setIsOpen(false)}
                                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                                className="absolute flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-white/90 dark:bg-coal-500/90 backdrop-blur-md text-gray-700 dark:text-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/50 dark:border-white/10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 hover:scale-110 hover:border-red-200 dark:hover:border-red-500/30 hover:shadow-[0_10px_40px_rgba(239,68,68,0.2)] active:scale-95 z-[100]"
                                title="Cerrar asistente"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-300">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Lyra Chat Engine Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ 
                            opacity: 0, 
                            scale: 0.3, 
                            y: 100, 
                            x: 50,
                            filter: 'blur(20px)'
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0, 
                            x: 0,
                            filter: 'blur(0px)'
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.8, 
                            y: 50,
                            filter: 'blur(10px)'
                        }}
                        transition={{ 
                            type: 'spring',
                            damping: 25,
                            stiffness: 200,
                            delay: 0.1 // Slight delay to let particles explode first
                        }}
                        className="fixed bottom-24 right-4 md:bottom-28 md:right-12 z-[199999] flex flex-col overflow-hidden rounded-[2.5rem] bg-white dark:bg-coal-600 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10 h-[80vh] md:h-[650px] max-h-[85vh] md:max-h-[calc(100vh-10rem)] w-[calc(100vw-2rem)] sm:w-[400px] md:w-[420px] lg:w-[450px]"
                    >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between bg-primary p-5 text-white shadow-lg">
                    <div className="flex items-center gap-4 relative">
                        <div className={clsx(
                            "flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 shadow-inner transition-all duration-300",
                            isListening ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] bg-red-500/20 scale-105" : "border-white/20 bg-white/10"
                        )}>
                            <img src={memojiUrl} alt={botName} className={clsx("h-full w-full object-cover transition-transform duration-300", isListening && "scale-110")} />
                        </div>
                        <div className="cursor-pointer" onClick={() => setShowMenu(!showMenu)}>
                            <h3 className="text-base font-black tracking-tight flex items-center gap-1 hover:text-white/80 transition-colors">
                                {botName} Assistant <KeenIcon icon="down" className="text-xs opacity-70" />
                            </h3>
                            <p className="text-[11px] font-bold opacity-90 flex items-center gap-1.5">
                                <span className={clsx("w-2 h-2 rounded-full", !isPoweredOn ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : isSpeaking ? "bg-green-400 animate-pulse" : isListening ? "bg-red-500 animate-ping" : "bg-green-400")}></span>
                                {!isPoweredOn ? 'Desconectado • SchoolSena' : isSpeaking ? 'Hablando...' : isListening ? 'Escuchándote...' : 'En línea • SchoolSena'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {voiceSupported && (
                            <button onClick={toggleVoice} title={voiceEnabled ? `Silenciar asistente` : 'Activar voz'} className={clsx('rounded-full p-1 transition-all hover:bg-white/20', voiceEnabled ? 'opacity-100' : 'opacity-40')}>
                                {voiceEnabled ? <IconVolumeOn /> : <IconVolumeOff />}
                            </button>
                        )}
                        <button onClick={() => setIsOpen(false)} className="hover:opacity-70"><KeenIcon icon="down" className="text-lg" /></button>
                    </div>
                    {showMenu && (
                        <div className="absolute top-[80px] left-5 bg-white dark:bg-coal-100 rounded-xl shadow-2xl py-2 w-48 text-gray-800 dark:text-white z-50 border border-black/5 dark:border-white/10 animate-fade-in-up">
                            <button onClick={() => changePersonality('sena')} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-coal-200 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-coal-600 flex-shrink-0"><img src="/media/app/nexo-memoji.png" className="w-full h-full object-cover"/></div>
                                <span className={clsx(botName.toLowerCase() === 'nexo' ? 'font-bold' : '', "dark:text-white")}>Nexo (Caballero)</span>
                            </button>
                            <button onClick={() => changePersonality('lyra')} className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/40 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-violet-100 dark:bg-violet-900/30 flex-shrink-0"><img src="/media/app/lyra-memoji.png" className="w-full h-full object-cover"/></div>
                                <span className={clsx(botName.toLowerCase() === 'lyra' ? 'font-bold text-violet-700 dark:text-violet-300' : 'dark:text-white')}>Lyra (Dama)</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Test Phase Notice Banner */}
                <div className="flex-shrink-0 mx-5 mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10 flex items-start gap-3 animate-fade-in-up">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <KeenIcon icon="information-2" className="text-base" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">Asistente en Fase de Prueba</h4>
                        <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
                            Lyra se encuentra en etapa de prueba y ajuste tras su reciente integración al proyecto de SchoolSena.
                        </p>
                    </div>
                </div>

                {voiceError && (<div className="flex-shrink-0 mx-3 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">⚠️ {voiceError}</div>)}

                {/* Messages */}
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 scrollbar-hide bg-gradient-to-b from-gray-50/50 to-white/90 dark:from-[#111119] dark:to-[#151521] relative">
                    {!isPoweredOn ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:bg-coal-500/50 dark:border-white/5 animate-fade-in-up text-center mt-auto mb-auto relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-400/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="w-20 h-20 mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto border-4 border-white dark:border-coal-500 shadow-xl">
                                <KeenIcon icon="cloud-cross" className="text-4xl text-red-500" />
                            </div>
                            
                            <h4 className="font-extrabold text-xl mb-2 text-gray-800 dark:text-white">Lyra está apagada</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-300 mb-6 font-medium leading-relaxed max-w-[250px]">
                                El servicio de asistencia no está disponible en este momento. Por favor, intenta más tarde.
                            </p>
                            
                            {/* <button 
                                onClick={checkHealth}
                                className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-coal-400 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-coal-300 transition-all active:scale-95"
                            >
                                Reintentar conexión
                            </button> */}
                        </div>
                    ) : !hasSelectedPersonality ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:bg-coal-500/50 dark:border-white/5 animate-fade-in-up text-center mt-auto mb-auto relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <h4 className="font-extrabold text-xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-300">¡Hola! Soy tu Asistente AI</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-300 mb-8 font-medium leading-relaxed max-w-[250px]">Antes de comenzar, elige la personalidad con la que prefieres conversar.</p>
                            
                            <div className="flex flex-col gap-4 w-full relative z-10">
                                <button 
                                    onClick={() => changePersonality('nexo')}
                                    className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200/60 hover:border-indigo-200 bg-white/50 dark:bg-coal-400/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all active:scale-95 text-left shadow-sm hover:shadow-md"
                                >
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-coal-600 flex-shrink-0 border-2 border-transparent group-hover:border-indigo-300 transition-all">
                                        <img src="/media/app/nexo-memoji.png" className="w-full h-full object-cover scale-110" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-white text-base">Nexo</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-1">Caballero directo y estructurado. Respuestas rápidas y objetivas.</p>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => changePersonality('lyra')}
                                    className="group flex items-center gap-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40 hover:border-violet-300 bg-violet-50/40 dark:bg-violet-900/10 hover:bg-violet-100/40 dark:hover:bg-violet-900/30 transition-all active:scale-95 text-left shadow-sm hover:shadow-[0_8px_20px_rgba(139,92,246,0.15)]"
                                >
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-violet-200/50 dark:bg-violet-900/50 flex-shrink-0 border-2 border-transparent group-hover:border-violet-400 transition-all">
                                        <img src="/media/app/lyra-memoji.png" className="w-full h-full object-cover scale-110" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-violet-700 dark:text-violet-300 text-base">Lyra</h5>
                                        <p className="text-xs text-violet-600/70 dark:text-violet-300/70 leading-snug mt-1">Dama cálida y conversadora. Excelente para recomendaciones detalladas.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={idx} className={clsx('flex w-full gap-3 animate-fade-in-up', isUser ? 'justify-end' : 'justify-start')}>
                                    
                                    {/* Assistant Avatar */}
                                    {!isUser && (
                                        <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full border border-gray-200/80 bg-white dark:bg-coal-400 dark:border-white/10 shadow-sm overflow-hidden flex items-center justify-center mt-auto mb-1">
                                            <img src={memojiUrl} className="w-full h-full object-cover scale-110" alt={botName} />
                                        </div>
                                    )}

                                    <div className={clsx(
                                        'max-w-[85%] rounded-3xl px-5 py-4 text-[14.5px] leading-relaxed break-words shadow-sm',
                                        isUser 
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm shadow-[0_8px_20px_rgba(59,130,246,0.25)] border border-blue-500/50' 
                                            : 'bg-white dark:bg-[#1E1E2D]/90 dark:backdrop-blur-xl rounded-bl-sm shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-gray-100/80 dark:border-white/10'
                                    )}>
                                        <div className="w-full">
                                            <ReactMarkdown 
                                                components={{
                                                    p: ({children}: any) => <p className={clsx("mb-2.5 last:mb-0 font-medium leading-relaxed", isUser ? "text-white" : "text-gray-800 dark:!text-white")}>{children}</p>,
                                                    strong: ({children}: any) => <strong className={clsx("font-extrabold", isUser ? "text-white" : "text-indigo-600 dark:!text-indigo-300")}>{children}</strong>,
                                                    a: ({children, href}: any) => <a href={href} className={clsx("hover:underline font-bold transition-all hover:opacity-80 break-words", isUser ? "text-blue-100" : "text-indigo-600 dark:text-indigo-400")} target="_blank" rel="noreferrer">{children}</a>,
                                                    li: ({children}: any) => <li className={clsx("ml-5 my-1.5 list-disc", isUser ? "text-white marker:text-blue-200" : "text-gray-800 dark:!text-white marker:text-indigo-500")}>{children}</li>,
                                                    ul: ({children}: any) => <ul className="mb-3 space-y-1">{children}</ul>
                                                }}
                                            >
                                                {msg.content
                                                    .replace(/\[BIZ:\d+\]/g, '')
                                                    .replace(/\[TAG:\d+\]/g, '')
                                                    .replace(/\[SERVICIO:[^\]]+\]/g, '')
                                                    .replace(/\[HORA:[^\]]+\]/g, '')
                                                    .replace(/\[CONFIRMACIÓN NECESARIA\]/g, '')
                                                    .replace(/\[CONFIRMACION NECESARIA\]/g, '')
                                                    .trim()}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Business Cards inside message */}
                                        {msg.businesses && msg.businesses.length > 0 && (
                                            <div className="mt-4 grid grid-cols-1 gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                                {msg.businesses.map((b: any) => (
                                                    <BusinessCard 
                                                        key={b.id} 
                                                        business={b} 
                                                        onVisit={handleVisit} 
                                                        onExploreMap={handleExploreOnMap}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    
                    {isLoading && (
                        <div className="flex w-full gap-3 animate-fade-in-up justify-start">
                            <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full border border-gray-200/80 bg-white dark:bg-[#1E1E2D] dark:border-white/10 shadow-sm overflow-hidden flex items-center justify-center mt-auto mb-1">
                                <img src={memojiUrl} className="w-full h-full object-cover scale-110 filter grayscale opacity-80" alt={botName} />
                            </div>
                            <div className="max-w-[50%] rounded-3xl rounded-bl-sm px-5 py-4 bg-white dark:bg-[#1E1E2D]/90 dark:backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-gray-100/80 dark:border-white/10 flex items-center gap-1.5 h-[52px]">
                                <span className="block h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-[bounce_1s_infinite_100ms]"></span>
                                <span className="block h-2 w-2 rounded-full bg-violet-400 dark:bg-violet-500 animate-[bounce_1s_infinite_200ms]"></span>
                                <span className="block h-2 w-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-[bounce_1s_infinite_300ms]"></span>
                            </div>
                        </div>
                    )}
                    {isListening && (
                        <div className="self-center flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600 dark:bg-red-900/40 dark:text-red-300 shadow-sm border border-red-100 dark:border-red-900/50 animate-fade-in-up">
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-1.5 rounded-full bg-red-500 animate-[bounce_1s_infinite_100ms]" />
                                <span className="h-3 w-1.5 rounded-full bg-red-500 animate-[bounce_1s_infinite_200ms]" />
                                <span className="h-4 w-1.5 rounded-full bg-red-500 animate-[bounce_1s_infinite_300ms]" />
                                <span className="h-3 w-1.5 rounded-full bg-red-500 animate-[bounce_1s_infinite_400ms]" />
                                <span className="h-2 w-1.5 rounded-full bg-red-500 animate-[bounce_1s_infinite_500ms]" />
                            </div>
                            El agente te está escuchando...
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-2" />
                </div>

                {/* Stylish Footer Input Zone */}
                <div className="flex-shrink-0 p-4 bg-white/80 dark:bg-[#151521]/80 backdrop-blur-3xl border-t border-gray-100/80 dark:border-white/10 relative z-20">
                    <div className="relative flex items-center gap-3 rounded-full bg-white dark:bg-[#1E1E2D] pl-5 pr-2 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-gray-200/80 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                        <input
                            type="text"
                            data-no-uppercase
                            placeholder={!isPoweredOn ? 'Asistente desconectado' : isListening ? '🎙️ Escuchando tu voz...' : 'Escribe tu mensaje...'}
                            className={clsx(
                                "w-full bg-transparent text-[15px] outline-none transition-all placeholder:font-medium",
                                !isPoweredOn ? "text-gray-400 cursor-not-allowed" : isListening ? "text-red-500 dark:!text-red-400 font-bold placeholder:text-red-500 dark:placeholder-red-400" : "text-gray-800 dark:!text-white placeholder-gray-500 dark:placeholder-gray-300"
                            )}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isListening || !isPoweredOn}
                        />
                        {voiceSupported && (
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMicClick();
                                }} 
                                disabled={isLoading || !isPoweredOn} 
                                title="Enviar mensaje de voz"
                                className={clsx(
                                    'relative z-50 flex-shrink-0 cursor-pointer rounded-full p-2.5 transition-all outline-none', 
                                    isListening 
                                        ? 'text-white bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' 
                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/20 disabled:opacity-40'
                                )}
                            >
                                {isListening ? <IconMicOff /> : <IconMic />}
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSend();
                            }} 
                            title="Enviar mensaje"
                            disabled={isLoading || isListening || !input.trim() || !isPoweredOn} 
                            className="relative z-50 flex-shrink-0 cursor-pointer rounded-full p-2.5 text-white bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:bg-gray-300 dark:disabled:bg-coal-400 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-coal-400 dark:disabled:to-coal-400"
                        >
                            <IconSend />
                        </button>
                    </div>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
    </>
    );
};

export { LyraAssistant };
