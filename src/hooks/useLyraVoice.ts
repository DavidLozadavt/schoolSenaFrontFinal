import { useState, useRef, useCallback, useEffect } from 'react';

interface UseLyraVoiceOptions {
  apiUrl: string;
  projectId: string;
  onTranscript: (text: string) => void;
  onSentence?: (sentence: string, index: number, isLast: boolean) => void;
  autoSpeak?: boolean;
  personality?: string;
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
    recognition.continuous = false;
    recognition.interimResults = false;
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
      'escuela': 'SchoolSena',
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

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        const corrected = postProcessTranscript(transcript);
        onTranscript(corrected);
      } else {
        setError('No se detectó ningún texto. Intenta de nuevo.');
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Habilítalo en tu navegador.');
      } else if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta hablar más cerca del micrófono.');
      } else if (event.error !== 'aborted') {
        setError(`Error de reconocimiento: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
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
    stopSpeaking,
    toggleVoice,
    currentSentenceIdx,
    totalSentences,
    error,
  };
}
