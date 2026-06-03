import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Chat,
  GridLayout,
  LiveKitRoom,
  ParticipantName,
  ParticipantTile,
  RoomAudioRenderer,
  TrackMutedIndicator,
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useEnsureTrackRef,
  useMaybeTrackRefContext,
  useRoomContext,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import axios from 'axios';
import { Track } from 'livekit-client';
import { Container } from '@/components/container';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';

interface Reunion {
  id: number;
  codigo: string;
  room_name: string;
  nombre?: string;
  created_by?: number;
  created_at: string;
  expires_at: string;
  extended: boolean;
  start_at?: string | null;
}

const esSalaDinamica = (room: string) => room.startsWith('meet-');
const generarCodigo = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) =>
    Array.from({ length: n }, () => abc[Math.floor(Math.random() * abc.length)]).join('');

  return `${seg(4)}-${seg(4)}-${seg(3)}`;
};

const formatearRestante = (ms: number) => {
  const seg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const API_BASE_URL = String(import.meta.env.VITE_APP_API_URL || '').replace(/\/api\/?$/, '');

const getAvatarFromMetadata = (metadata?: string) => {
  if (!metadata) return '';

  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed?.avatar === 'string' ? parsed.avatar : '';
  } catch {
    return '';
  }
};

const resolveAvatarUrl = (avatar?: string) => {
  if (!avatar) return '';
  if (/^https?:\/\//i.test(avatar)) return avatar;
  if (!API_BASE_URL) return avatar;

  return `${API_BASE_URL}/${avatar.replace(/^\/+/, '')}`;
};

const AudioUnlock = () => {
  const room = useRoomContext();
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handleUnlock = async () => {
    try {
      await room.startAudio();
      setAudioUnlocked(true);
    } catch {
      setAudioUnlocked(false);
    }
  };

  if (audioUnlocked) return null;

  return (
    <div className="absolute top-4 left-1/2 z-[1200] -translate-x-1/2">
      <button
        type="button"
        onClick={handleUnlock}
        className="rounded-xl border border-muted px-4 py-2 text-xs text-muted-foreground backdrop-blur"
      >
        Activar audio
      </button>
    </div>
  );
};

const SmartParticipantTile = ({
  trackRef,
  className,
  showAvatarWhenMuted = true
}: {
  trackRef?: TrackReferenceOrPlaceholder;
  className?: string;
  showAvatarWhenMuted?: boolean;
}) => {
  const maybeTrackRef = useMaybeTrackRefContext();
  const ensuredTrackRef = useEnsureTrackRef(trackRef ?? maybeTrackRef);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const isVideoMuted = useIsMuted(ensuredTrackRef);
  const displayName =
    ensuredTrackRef.participant.name || ensuredTrackRef.participant.identity || 'Usuario';

  const avatar = resolveAvatarUrl(getAvatarFromMetadata(ensuredTrackRef.participant.metadata));
  const showAvatarImage = !!avatar && !avatarFailed;

  const shouldShowAvatar =
    showAvatarWhenMuted && ensuredTrackRef.source === Track.Source.Camera && isVideoMuted;

  return (
    <ParticipantTile trackRef={ensuredTrackRef} className={className}>
      {isTrackReference(ensuredTrackRef) &&
      (ensuredTrackRef.source === Track.Source.Camera ||
        ensuredTrackRef.source === Track.Source.ScreenShare) ? (
        <VideoTrack trackRef={ensuredTrackRef} />
      ) : null}

      {shouldShowAvatar ? (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-muted/50">
          {showAvatarImage ? (
            <img
              src={avatar}
              alt={displayName}
              className="max-h-[58%] max-w-[58%] aspect-square rounded-full border border-muted object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="flex max-h-[58%] max-w-[58%] aspect-square items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground/90">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      ) : null}

      <div className="lk-participant-metadata z-[3]">
        <div className="lk-participant-metadata-item">
          <TrackMutedIndicator
            trackRef={{ participant: ensuredTrackRef.participant, source: Track.Source.Microphone }}
            show="muted"
          />
          <ParticipantName />
        </div>
      </div>
    </ParticipantTile>
  );
};

const SalaVideoLayout = () => {
  const [showChat, setShowChat] = useState(false);
  const room = useRoomContext();
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    setTimeout(() => room.localParticipant.setMicrophoneEnabled(next).catch(() => setMicOn(false)), 0);
  };
  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    setTimeout(() => room.localParticipant.setCameraEnabled(next).catch(() => setCamOn(false)), 0);
  };

  const toggleScreenShare = () => {
    const next = !room.localParticipant.isScreenShareEnabled;
    room.localParticipant.setScreenShareEnabled(next).catch(() => {});
  };

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  const screenShareTracks = tracks.filter((track) => track.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((track) => track.source === Track.Source.Camera);
  const hasScreenShare = screenShareTracks.length > 0;

  let videoContent: React.ReactNode;

  if (hasScreenShare) {
    const mainScreenTrack = screenShareTracks[0];
    const secondaryTracks = [...cameraTracks, ...screenShareTracks.slice(1)];

    videoContent = (
      <div className="min-h-0 flex-1 p-3">
        <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
          <div className="min-h-0 overflow-hidden rounded-2xl border border-muted bg-background">
            <SmartParticipantTile
              trackRef={mainScreenTrack}
              className="jitsi-main-screen-tile h-full"
              showAvatarWhenMuted={false}
            />
          </div>

          <div className="min-h-0 overflow-y-auto rounded-2xl border border-muted bg-muted p-2">
            <div className="grid grid-cols-1 gap-2">
              {secondaryTracks.length > 0 ? (
                secondaryTracks.map((track, index) => (
                  <div
                    key={`${track.participant.identity}-${track.source}-${index}`}
                    className="h-[160px] overflow-hidden rounded-xl border border-muted bg-muted/50"
                  >
                    <SmartParticipantTile trackRef={track} className="jitsi-side-tile h-full" />
                  </div>
                ))
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl border border-muted bg-muted/50 text-sm text-muted-foreground">
                  Sin cámaras activas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    videoContent = (
      <div className="min-h-0 flex-1 p-3">
        <GridLayout tracks={cameraTracks} className="h-full">
          <SmartParticipantTile className="h-full" />
        </GridLayout>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Área de video */}
        <div className="flex min-w-0 flex-1 flex-col">{videoContent}</div>

        {/* Chat lateral — siempre montado para recibir mensajes */}
          <div className={`flex w-96 flex-shrink-0 flex-col overflow-hidden border-l border-muted bg-background ${showChat ? '' : 'hidden'}`}>
            <div className="flex items-center justify-between border-b border-muted px-4 py-3">
              <span className="text-sm font-semibold">Chat</span>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="text-lg leading-none text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 [&_.lk-chat]:h-full [&_.lk-chat-messages]:[grid-row:2] [&_.lk-chat-form]:[grid-row:3] [&_.lk-chat-header]:hidden [&_.lk-chat]:[--lk-chat-header-height:0px]">
              <Chat />
            </div>
          </div>
      </div>

      {/* Barra de controles */}
      <div className="border-t border-muted bg-background/80 px-3 py-2">
        <div className="lk-control-bar !justify-center">
          <button
            type="button"
            onClick={toggleMic}
            className={`lk-button ${micOn ? 'bg-primary/20' : ''}`}
          >
            {micOn ? '🔊 Micrófono' : '🔇 Micrófono'}
          </button>
          <button
            type="button"
            onClick={toggleCam}
            className={`lk-button ${camOn ? 'bg-primary/20' : ''}`}
          >
            {camOn ? '📷 Cámara' : '🚫 Cámara'}
          </button>
          <button type="button" onClick={toggleScreenShare} className="lk-button">
            🖥️ Compartir pantalla
          </button>

          <button
            type="button"
            onClick={() => setShowChat((c) => !c)}
            className={`lk-button ${showChat ? 'bg-primary/20' : ''}`}
            title="Chat"
          >
            💬 Chat
          </button>

          <button type="button" onClick={() => room.disconnect()} className="lk-button">
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

class VideoErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('LiveKit render error (no crítico, se puede recuperar):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-muted bg-background p-12 shadow-xl" style={{ height: '80vh' }}>
          <div className="text-5xl">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground">Error al renderizar la sala</h3>
          <p className="text-sm text-foreground/70 text-center max-w-md">
            Ocurrió un error interno al conectar la videollamada. Puedes intentar reconectar.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-foreground shadow-lg transition hover:scale-[1.02]"
          >
            🔄 Reconectar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const JitsiSalasPage = ({ standalone = false }: { standalone?: boolean }) => {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  const codigoURL = params.get('codigo');

  const [salaActiva, setSalaActiva] = useState<string>(() => {
    if (roomParam && esSalaDinamica(roomParam)) return roomParam;
    return '';
  });

  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const setPopup = (win: Window | null) => {
    setPopupWindow(win);
  };

  useEffect(() => {
    if (!popupWindow) return;

    const timer = setInterval(() => {
      if (popupWindow.closed) {
        setPopup(null);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [popupWindow]);

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duracionMinutos, setDuracionMinutos] = useState(60);
  const [reunionCreada, setReunionCreada] = useState<Reunion | null>(null);
  const [reunionesActivas, setReunionesActivas] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombrePersonalizado, setNombrePersonalizado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');

  const [, setTick] = useState(0);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  const roomName = useMemo(() => salaActiva, [salaActiva]);

  const cargarReuniones = useCallback(async () => {
    try {
      const response = await axios.get('reuniones_temporales', {});
      const activas = (response.data || []).filter(
        (r: Reunion) => new Date(r.expires_at).getTime() > Date.now()
      );
      setReunionesActivas(activas);
    } catch {
      setReunionesActivas([]);
    }
  }, []);

  // Timer para actualizar el contador de tiempo restante (sin llamar API)
  useEffect(() => {
    const id = reunionCreada?.id;
    if (!id) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [reunionCreada?.id]);

  // Cargar reuniones al montar y refrescar cada 30s
  useEffect(() => {
    cargarReuniones();
    const interval = setInterval(cargarReuniones, 30000);
    return () => clearInterval(interval);
  }, [cargarReuniones]);

  const crearReunion = async () => {
    try {
      setLoading(true);
      const codigo = generarCodigo();

      const response = await axios.post('reuniones_temporales', {
        codigo,
        nombre: nombrePersonalizado || undefined,
        duracion_minutos: duracionMinutos,
        start_at: fechaInicio || undefined
      });

      const nueva: Reunion = response.data;
      setReunionCreada(nueva);
      setNombrePersonalizado('');
      setFechaInicio('');
      await cargarReuniones();
    } catch (err) {
      console.error('Error al crear reunión:', err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarReunion = async (id: number) => {
    try {
      await axios.delete(`reuniones_temporales/${id}`);

      if (reunionCreada?.id === id) {
        setReunionCreada(null);
        setSalaActiva('');
      }

      await cargarReuniones();
    } catch (err) {
      console.error('Error al eliminar reunión:', err);
    }
  };

  const extenderTiempo = async (id: number, minutosAdicionales: number) => {
    try {
      const response = await axios.post(`reuniones_temporales/${id}/extend`, {
        minutos: minutosAdicionales
      });
      if (response.status === 200) {
        await cargarReuniones();
        if (reunionCreada?.id === id) {
          setReunionCreada(response.data);
        }
      }
    } catch (err: any) {
      console.error('Error al extender tiempo:', err);
      alert(err.response?.data?.message || 'No se pudo extender el tiempo');
    }
  };

  const abrirReunion = (reunion: Reunion) => {
    // Validar start_at
    if (reunion.start_at) {
      const inicio = new Date(reunion.start_at).getTime();
      if (inicio > Date.now()) {
        setError(`Esta reunión inicia el ${new Date(reunion.start_at).toLocaleString()}. Aún no es la hora.`);
        return;
      }
    }

    // Limpiar token anterior antes de abrir una nueva sala
    setToken('');
    setServerUrl('');
    setError('');

    const popupUrl = buildStandaloneUrl(reunion.room_name, reunion.codigo);
    const width = 1100;
    const height = 750;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;

    if (!standalone) {
      const popup = window.open(
        popupUrl,
        `jitsi_room_${reunion.codigo.replace(/[^A-Z0-9]/g, '')}`,
        features
      );
      if (popup) {
        setPopup(popup);
      }
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('room', reunion.room_name);
      url.searchParams.set('codigo', reunion.codigo);
      window.history.replaceState({}, '', url.toString());
      setSalaActiva(reunion.room_name);
      setReunionCreada(reunion);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      if (!salaActiva) return;

      try {
        setLoadingToken(true);
        setError('');

        const response = await axios.post('token_livekit', {
          room: roomName,
          codigo: codigoURL || undefined
        });

        if (!cancelled) {
          setToken(response?.data?.token || '');
          setServerUrl(response?.data?.url || '');
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo conectar con LiveKit.');
          setToken('');
          setServerUrl('');
        }
      } finally {
        if (!cancelled) {
          setLoadingToken(false);
        }
      }
    };

    loadToken();

    return () => {
      cancelled = true;
    };
  }, [roomName, reloadKey, codigoURL, standalone, salaActiva]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const buildStandaloneUrl = (roomId: string, codigo?: string) => {
    const url = new URL('/videoconferencias/standalone', window.location.origin);
    url.searchParams.set('room', roomId);

    if (codigo) {
      url.searchParams.set('codigo', codigo);
    }

    return `${url.pathname}${url.search}${url.hash}`;
  };

  const toggleFullscreen = async () => {
    const el = videoContainerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // silencioso
    }
  };

  if (popupWindow && !popupWindow.closed) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-muted dark:bg-background/20">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-4xl">
            📺
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
            Videollamada activa en ventana flotante
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            La sala <span className="font-semibold text-primary">{reunionCreada?.nombre || reunionCreada?.codigo || ''}</span> se está
            ejecutando en una ventana independiente (estilo Teams) para que puedas seguir usando el
            resto de la aplicación aquí sin interrupciones.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() => popupWindow.focus()}
              className="rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-foreground shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              Traer al frente
            </button>
            <button
              type="button"
              onClick={() => {
                popupWindow.close();
                setPopup(null);
              }}
              className="rounded-2xl border border-red-500 bg-transparent px-6 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Regresar a esta pestaña
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className={standalone ? 'py-6' : ''}>
      <div className="space-y-6">
        {!standalone && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-muted bg-background p-6 text-foreground shadow-xl">
              <div >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                  Crear reunión
                </p>
                <h2 className="mt-3 text-2xl font-bold">Genera una videollamada con tiempo de vida</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/70">
                  Aquí generas la sala, defines cuánto dura y compartes el código. Cuando expire,
                  desaparece de la lista.
                </p>

                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      Nombre de la sala (opcional)
                    </label>
                    <input
                      type="text"
                      value={nombrePersonalizado}
                      onChange={(e) => setNombrePersonalizado(e.target.value)}
                      placeholder="Ej: Reunión de equipo"
                      className="input"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      Inicio programado (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      Duración (minutos)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={duracionMinutos}
                      onChange={(e) =>
                        setDuracionMinutos(Math.max(5, Number(e.target.value) || 60))
                      }
                      className="input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={crearReunion}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Creando...' : 'Generar código'}
                  </button>
                </div>

                {reunionCreada ? (
                  <div className="mt-5 rounded-2xl border border-muted bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-foreground/50">
                          Código
                        </div>
                        <div className="font-mono text-2xl font-bold tracking-wider text-primary">
                          {reunionCreada.codigo}
                        </div>
                      </div>

                      <div className="text-sm text-foreground/70">
                        {reunionCreada.start_at ? (
                          <>Inicio: {new Date(reunionCreada.start_at).toLocaleString()} &nbsp;|&nbsp;</>
                        ) : null}
                        Expira: {new Date(reunionCreada.expires_at).toLocaleString()}
                      </div>

                      <div className="text-sm text-foreground/70">
                        Restante:{' '}
                        <span className="font-mono font-semibold text-foreground">
                          {formatearRestante(
                            new Date(reunionCreada.expires_at).getTime() - Date.now()
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => abrirReunion(reunionCreada)}
                        className="rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-green-500"
                      >
                        Entrar a la reunión
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(reunionCreada.codigo);
                          } catch {
                            // ignore
                          }
                        }}
                        className="rounded-2xl border border-muted px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/10"
                      >
                        Copiar código
                      </button>
                      <button
                        type="button"
                        onClick={() => extenderTiempo(reunionCreada.id, 30)}
                        disabled={reunionCreada.extended}
                        title={
                          reunionCreada.extended ? 'Ya se extendió una vez' : 'Extender 30 minutos'
                        }
                        className="rounded-2xl border border-blue-400/40 px-5 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reunionCreada.extended ? '⏱️ Ya extendida' : 'Extender +30 min'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {reunionesActivas.length > 0 ? (
              <div className="rounded-3xl border border-muted bg-background p-6 text-foreground shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Reuniones activas</h3>
                  <span className="text-xs uppercase tracking-wider text-foreground/50">
                    {reunionesActivas.length} activas
                  </span>
                </div>

                <div className="space-y-3">
                  {reunionesActivas.map((reunion) => (
                    <div
                      key={reunion.id}
                      className="flex flex-col gap-3 rounded-2xl border border-muted bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-lg font-bold tracking-wider text-primary">
                          {reunion.codigo}
                        </div>
                        {reunion.nombre && (
                          <div className="mt-1 text-sm text-foreground/70">{reunion.nombre}</div>
                        )}
                        <div className="mt-1 text-sm text-foreground/60">
                          {reunion.start_at && new Date(reunion.start_at).getTime() > Date.now() ? (
                            <>📅 Inicia: {new Date(reunion.start_at).toLocaleString()}</>
                          ) : (
                            <>⏱️{' '}
                            {formatearRestante(new Date(reunion.expires_at).getTime() - Date.now())}{' '}
                            restantes</>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => abrirReunion(reunion)}
                          disabled={reunion.start_at ? new Date(reunion.start_at).getTime() > Date.now() : false}
                          className="btn rounded-xl btn-primary"
                        >
                          {reunion.start_at && new Date(reunion.start_at).getTime() > Date.now() ? 'Programada' : 'Entrar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => extenderTiempo(reunion.id, 30)}
                          disabled={reunion.extended}
                          title={
                            reunion.extended ? 'Ya se extendió una vez' : 'Extender 30 minutos'
                          }
                          className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reunion.extended ? '⏱️ Ext.' : '+30 min'}
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarReunion(reunion.id)}
                          className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {loadingToken ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
              <p className="text-sm text-gray-600">Conectando sala...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600 shadow-sm">
            <p className="font-semibold">Error de conexión</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : salaActiva && token && serverUrl ? (
          <div
            ref={videoContainerRef}
            className="relative overflow-hidden rounded-3xl border border-gray-200 bg-background shadow-xl"
            style={{ height: '80vh', width: '100%' }}
          >
            <VideoErrorBoundary onRetry={() => setReloadKey(k => k + 1)}>
              <LiveKitRoom
                key={`${roomName}-${reloadKey}`}
                serverUrl={serverUrl}
                token={token}
                connect={true}
                audio={false}
                video={false}
                onDisconnected={() => {
                  if (standalone) {
                    window.close();
                  } else {
                    setSalaActiva('');
                    setReunionCreada(null);
                    setToken('');
                    setServerUrl('');
                  }
                }}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%' }}
              >
                <SalaVideoLayout />
                <RoomAudioRenderer />
              </LiveKitRoom>
            </VideoErrorBoundary>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="absolute bottom-4 right-4 z-[1100] flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-background/60 text-lg text-foreground backdrop-blur-sm transition hover:bg-background/80"
            >
              {isFullscreen ? '🡼' : '⛶'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200  p-6 text-center text-gray-500">
            Sin datos de conexión.
          </div>
        )}
      </div>
    </Container>
  );
};

export { JitsiSalasPage };
