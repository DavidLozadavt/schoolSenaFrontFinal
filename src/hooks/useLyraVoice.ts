import { useState, useRef, useCallback, useEffect } from 'react';

interface UseLyraVoiceOptions {
  apiUrl: string;
  projectId: string;
  onTranscript: (text: string) => void;
  onSentence?: (sentence: string, index: number, isLast: boolean) => void;
  autoSpeak?: boolean;
  personality?: string;
}

export interface LyraNarrationSegment {
  text: string;
  business_id?: number | null;
}

interface UseLyraVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  setVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, splitSentences?: boolean) => void;
  /**
   * Reproduce la narración que manda Lyra (segmentos ya listos para voz) y
   * avisa cuando EMPIEZA A SONAR cada uno (evento `playing` del audio), no
   * cuando se pide: pausa, cancelación y velocidad quedan del lado del audio.
   */
  /** Resuelve `false` si el audio falló: el llamador puede mostrar el mapa sin la voz. */
  speakSegments: (segments: LyraNarrationSegment[], onSegmentStart?: (segment: LyraNarrationSegment, index: number) => void) => Promise<boolean>;
  stopSpeaking: () => void;
  toggleVoice: () => void;
  currentSentenceIdx: number;
  totalSentences: number;
  error: string | null;
}

// Speech recognition handling
const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  : null;

const IS_ANDROID = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
/** Silencio que cierra el turno tras habla normal. */
const ENDPOINT_MS = 1300;
/** Silencio que cierra el turno si la frase quedó abierta ("y...", "este..."). */
const ENDPOINT_HESITATION_MS = 2600;
/** Tope de un turno hablado. */
const MAX_UTTERANCE_MS = 30000;
const TRAILING_HESITATION = /\b(y|o|que|de|del|la|el|los|las|un|una|en|con|para|pero|porque|entonces|este|esto|eh|em|mm|pues|osea|como)\s*$/i;

/**
 * useLyraVoice.ts
 * 
 * - STT (Escuchar): Web Speech API (Gratis, rápido, nativo del navegador).
 * - TTS (Hablar): Lyra Backend (Usa edge-tts gratis, con voz colombiana natural descargada desde /voice/synthesize).
 */
export function useLyraVoice({
  apiUrl,
  projectId,
  onTranscript,
  onSentence,
  autoSpeak = false,
  personality,
}: UseLyraVoiceOptions): UseLyraVoiceReturn {
  // STT States
  const [isListening, setIsListening] = useState(false);
  // TTS States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(autoSpeak);
  const [error, setError] = useState<string | null>(null);
  
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [totalSentences, setTotalSentences] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSessionRef = useRef(0);

  // Soporte de grabación en navegador
  const isSupported = Boolean(SpeechRecognitionAPI);

  // Limpiar recursos al desmontar
  useEffect(() => {
    // Pre-warming: Tocar el contexto de audio apenas inicie
    const warmup = new Audio();
    warmup.volume = 0;
    audioRef.current = warmup;

    return () => {
      recognitionRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // ── 1. STT (ESCUCHAR GRATIS EN EL NAVEGADOR) ─────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('Tu navegador no soporta reconocimiento de voz nativo. Usa Chrome o Edge.');
      return;
    }
    if (isListening) return;

    setError(null);
    stopSpeaking();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-CO';
    // Antes: continuous=false + interimResults=false. Chrome cerraba el
    // reconocimiento en la PRIMERA pausa, así que "hola, mira... es que quería
    // saber mi horario" llegaba como "hola, mira". Ahora se escucha en continuo
    // y el turno lo cierra un silencio real (ver ENDPOINT_MS). En Android el modo
    // continuo repite resultados, así que allí se mantiene el modo por frase.
    recognition.continuous = !IS_ANDROID;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Correcciones fonéticas rápidas
    const phoneticMap: Record<string, string> = {
      'netflix': 'NexiService',
      'nexi service': 'NexiService',
      'nexiservis': 'NexiService',
      'nexi servis': 'NexiService',
      'laira': 'Lyra',
      'lira': 'Lyra',
      'la ira': 'Lyra',
      // "escuela" NO se reescribe: "busco una escuela" es una frase normal y
      // terminaba como "busco una SchoolSena".
      'school sena': 'SchoolSena',
      'schoolsena': 'SchoolSena',
      'sculsena': 'SchoolSena',
    };

    const postProcessTranscript = (text: string) => {
      let processed = text;
      Object.entries(phoneticMap).forEach(([key, val]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        processed = processed.replace(regex, val);
      });
      return processed;
    };

    // El texto se reconstruye desde la lista completa de resultados en cada
    // evento (no se va concatenando): así un resultado que el motor corrige no
    // queda duplicado.
    let liveText = '';
    let endpointTimer: ReturnType<typeof setTimeout> | null = null;
    let delivered = false;
    const startedAt = Date.now();

    const clearEndpoint = () => {
      if (endpointTimer) clearTimeout(endpointTimer);
      endpointTimer = null;
    };

    const deliver = () => {
      if (delivered) return;
      delivered = true;
      clearEndpoint();
      // Todo lo oído, también las últimas palabras que el motor no alcanzó a
      // marcar como finales cuando se cortó.
      const text = liveText.trim();
      if (text) onTranscript(postProcessTranscript(text));
    };

    recognition.onresult = (event: any) => {
      let fin = '';
      let live = '';
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i]?.[0]?.transcript || '';
        if (event.results[i].isFinal) fin += chunk;
        else live += chunk;
      }
      liveText = `${fin} ${live}`.replace(/\s+/g, ' ').trim();

      // Fin de turno: un silencio después de habla. Si la última palabra deja
      // la frase abierta ("y", "que", "este"...), se espera más: la persona
      // está pensando, no terminó.
      clearEndpoint();
      const waitMs = TRAILING_HESITATION.test(liveText) ? ENDPOINT_HESITATION_MS : ENDPOINT_MS;
      if (Date.now() - startedAt > MAX_UTTERANCE_MS) {
        recognition.stop();
        return;
      }
      endpointTimer = setTimeout(() => recognition.stop(), waitMs);
    };

    recognition.onerror = (event: any) => {
      clearEndpoint();
      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Habilítalo en tu navegador.');
        delivered = true;
      } else if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta hablar más cerca del micrófono.');
        delivered = true;
      } else if (event.error === 'aborted') {
        // abort() sólo se usa al desmontar: no se envía nada.
        delivered = true;
      } else {
        // network, audio-capture...: el error queda a la vista y no se envía
        // un fragmento a medias.
        setError(`Error de reconocimiento: ${event.error}`);
        delivered = true;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      clearEndpoint();
      setIsListening(false);
      // Lo dicho hasta el corte (silencio, botón o límite) es el mensaje.
      deliver();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError('No se pudo iniciar el micrófono.');
      setIsListening(false);
    }
  }, [SpeechRecognitionAPI, isListening, onTranscript]);

  const stopSpeaking = useCallback(() => {
    playSessionRef.current++;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      } catch (e) {
        console.error('Error stopping audio:', e);
      }
    }
    setIsSpeaking(false);
    setCurrentSentenceIdx(-1);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── 2. TTS (HABLAR GRATIS CON BACKEND LYRA) ──────────────────────────────
  const speak = useCallback(async (text: string, splitSentences = false) => {
    if (!voiceEnabled || !text) return;

    // Detener cualquier sesión previa de inmediato
    stopSpeaking();
    
    // Nueva sesión
    const currentSession = playSessionRef.current;

    const sentences = splitSentences 
      ? text.split(/(?<=[.!?])\s+|\n+/).filter(s => {
          const trimmed = s.trim();
          if (!trimmed) return false;
          return /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(trimmed.replace(/\[[^\]]+\]/g, ''));
        })
      : [text.trim()].filter(Boolean);

    if (sentences.length === 0) return;

    setTotalSentences(sentences.length);
    setIsSpeaking(true);

    const playSentence = async (index: number) => {
      // Verificación de seguridad de sesión al inicio de cada oración
      if (index >= sentences.length || currentSession !== playSessionRef.current) {
        if (currentSession === playSessionRef.current) {
          setIsSpeaking(false);
          setCurrentSentenceIdx(-1);
        }
        return;
      }

      setCurrentSentenceIdx(index);
      const sentence = sentences[index];
      const isLast = index === sentences.length - 1;

      if (onSentence) onSentence(sentence, index, isLast);

      try {
        let url = `${apiUrl}/voice/synthesize_stream?project_id=${encodeURIComponent(projectId)}&text=${encodeURIComponent(sentence)}`;
        if (personality) {
          url += `&personality=${encodeURIComponent(personality)}`;
        }
        
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          
          // Re-verificar sesión justo antes de dar play por si hubo un cambio micro-segundos antes
          if (currentSession !== playSessionRef.current) {
            reject(new Error('Session changed before play'));
            return;
          }

          audio.play().catch(reject);
        });

        // Pequeña pausa natural entre oraciones
        await new Promise(r => setTimeout(r, 150));
        
        // Siguiente oración
        await playSentence(index + 1);
      } catch (e) {
        // Solo loguear si es un error real y no una cancelación de sesión
        if (currentSession === playSessionRef.current) {
          console.error('Sentence TTS error:', e);
          setIsSpeaking(false);
          setCurrentSentenceIdx(-1);
        }
      }
    };

    try {
      await playSentence(0);
    } catch (e) {
      // Capturar cualquier error de la cadena de promesas
    }
  }, [voiceEnabled, apiUrl, projectId, onSentence, personality, stopSpeaking]);

  // ── 3. NARRACIÓN SEGMENTADA (voz y mapa sincronizados) ─────────────────────
  const speakSegments = useCallback(async (
    segments: LyraNarrationSegment[],
    onSegmentStart?: (segment: LyraNarrationSegment, index: number) => void,
  ) => {
    if (!voiceEnabled || !segments?.length) return true;
    stopSpeaking();
    const session = playSessionRef.current;
    const items = segments.filter(seg => seg?.text?.trim());
    if (!items.length) return true;
    setTotalSentences(items.length);
    setIsSpeaking(true);

    const urlOf = (seg: LyraNarrationSegment) => {
      let url = `${apiUrl}/voice/synthesize_stream?project_id=${encodeURIComponent(projectId)}&text=${encodeURIComponent(seg.text)}`;
      if (personality) url += `&personality=${encodeURIComponent(personality)}`;
      return url;
    };
    // El audio del segmento siguiente se pide mientras suena el actual: la
    // síntesis tarda ~1 s y, pedida al final, se oía como un silencio entre
    // negocio y negocio.
    let next: HTMLAudioElement | null = null;

    for (let i = 0; i < items.length; i++) {
      if (session !== playSessionRef.current) return true; // interrumpido: nada de esta respuesta sigue
      const seg = items[i];
      setCurrentSentenceIdx(i);
      const audio = next ?? new Audio(urlOf(seg));
      next = null;
      audioRef.current = audio;
      try {
        await new Promise<void>((resolve, reject) => {
          let announced = false;
          audio.onplaying = () => {
            // `playing` también se dispara al reanudar tras una pausa: el
            // segmento se anuncia una sola vez.
            if (announced || session !== playSessionRef.current) return;
            announced = true;
            onSegmentStart?.(seg, i);
            if (i + 1 < items.length) {
              next = new Audio(urlOf(items[i + 1]));
              next.preload = 'auto';
            }
          };
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('audio'));
          if (session !== playSessionRef.current) return reject(new Error('cancelled'));
          audio.play().catch(reject);
        });
      } catch {
        if (session === playSessionRef.current) {
          setIsSpeaking(false);
          setCurrentSentenceIdx(-1);
          return false;   // falló el audio de esta respuesta (no una cancelación)
        }
        return true;
      }
    }
    if (session === playSessionRef.current) {
      setIsSpeaking(false);
      setCurrentSentenceIdx(-1);
    }
    return true;
  }, [voiceEnabled, apiUrl, projectId, personality, stopSpeaking]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) {
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    isSupported,
    startListening,
    stopListening,
    speak,
    speakSegments,
    stopSpeaking,
    toggleVoice,
    currentSentenceIdx,
    totalSentences,
    error,
  };
}
