import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Pusher from 'pusher-js';

interface PusherContextType {
  pusher: Pusher | null;
}

const PusherContext = createContext<PusherContextType>({ pusher: null });

export const usePusher = () => useContext(PusherContext);

interface PusherProviderProps {
  children: ReactNode;
}

export const PusherProvider: React.FC<PusherProviderProps> = ({ children }) => {
  const [pusher, setPusher] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

    if (!pusherKey) {
      console.warn('⚠️ Pusher key not found in environment variables');
      return;
    }

    console.log('📡 Initializing Pusher connection...');
    const pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster || 'us2',
      forceTLS: true,
    });

    pusherInstance.connection.bind('state_change', (states: any) => {
      console.log('🔄 Pusher connection state:', states.current);
    });

    setPusher(pusherInstance);

    return () => {
      if (pusherInstance) {
        console.log('🔌 Disconnecting Pusher...');
        // Solo desconectar si no está ya desconectado para evitar advertencias de WebSocket
        if (pusherInstance.connection.state !== 'disconnected') {
          pusherInstance.disconnect();
        }
      }
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusher }}>
      {children}
    </PusherContext.Provider>
  );
};
