import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePusher } from './PusherProvider';

interface Business {
    id: number;
    name: string;
    logo: string;
    category: string;
    lat?: number;
    lng?: number;
    latitud?: number;
    longitud?: number;
    direccion?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    businesses?: Business[];           // Negocios encontrados (con resultados)
    suggestedBusinesses?: any[];       // Negocios de ciudad alterna (cero resultados)
    suggestedCity?: string;            // Ciudad de los negocios sugeridos
    searchedCategory?: string;         // Categoría que se buscó originalmente
    isZeroResult?: boolean;
}

interface LyraContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    conversationId: string;
    highlightedBusinessId: number | null;
    setHighlightedBusinessId: (id: number | null) => void;
    isPoweredOn: boolean;
    setIsPoweredOn: (powered: boolean) => void;
    filtersApplied: any;
    setFiltersApplied: (filters: any) => void;
    checkHealth: () => Promise<void>;
}

const LyraContext = createContext<LyraContextType | undefined>(undefined);

export const LyraProvider = ({ children }: { children: ReactNode }) => {
    // 1. Conversation ID Persistence
    const [conversationId] = useState(() => {
        const saved = localStorage.getItem('lyra_conversation_id');
        if (saved) return saved;
        const newId = uuidv4();
        localStorage.setItem('lyra_conversation_id', newId);
        return newId;
    });

    // 2. Open State Persistence
    const [isOpen, setIsOpenState] = useState(() => {
        return localStorage.getItem('lyra_is_open') === 'true';
    });

    const setIsOpen = (open: boolean) => {
        setIsOpenState(open);
        localStorage.setItem('lyra_is_open', String(open));
    };

    // 3. Highlighted Business State
    const [highlightedBusinessId, setHighlightedBusinessId] = useState<number | null>(null);

    // 4. Messages Persistence Removed (Refresh clears chat)
    const [messages, setMessages] = useState<Message[]>([]);
    const [filtersApplied, setFiltersApplied] = useState<any>(null);

    // 5. Lyra Power Status
    const { pusher } = usePusher();
    const [isPoweredOn, setIsPoweredOnState] = useState(() => {
        return localStorage.getItem('lyra_is_powered_on') !== 'false';
    });

    const setIsPoweredOn = useCallback((powered: boolean) => {
        setIsPoweredOnState(powered);
        localStorage.setItem('lyra_is_powered_on', String(powered));
    }, []);

    const checkHealth = useCallback(async () => {
        try {
            const lyraUrl = import.meta.env.VITE_LYRA_API_URL || 'http://127.0.0.1:8099';
            const response = await fetch(`${lyraUrl}/status`, { 
                signal: AbortSignal.timeout(2000) 
            });
            if (!response.ok) throw new Error('Unreachable');
            const result = await response.json();
            setIsPoweredOn(result?.data?.status === 'online');
        } catch (error) {
            setIsPoweredOn(false);
        }
    }, [setIsPoweredOn]);

    // No background polling is used. Pusher is used for real-time status updates,
    // and checkHealth can be triggered manually (e.g., via "Reintentar conexión").

    // ── 2. PUSHER REAL-TIME SYNC (Instant updates) ──
    useEffect(() => {
        if (!pusher) {
            console.log('⏳ Waiting for Pusher to be initialized...');
            return;
        }

        console.log('📡 Subscribing to lyra-channel...');
        const channel = pusher.subscribe('lyra-channel');
        
        channel.bind('power_status_updated', (data: { isPoweredOn: boolean }) => {
            console.log('✅ Received power_status_updated via Pusher:', data);
            setIsPoweredOn(data.isPoweredOn);
        });

        pusher.connection.bind('connected', () => {
            console.log('🟢 Pusher Connected Successfully');
        });

        pusher.connection.bind('error', (err: any) => {
            console.error('🔴 Pusher Connection Error:', err);
        });

        return () => {
            console.log('🔌 Unsubscribing from lyra-channel');
            pusher.unsubscribe('lyra-channel');
        };
    }, [pusher]);

    return (
        <LyraContext.Provider value={{ 
            messages, 
            setMessages, 
            isOpen, 
            setIsOpen, 
            conversationId,
            highlightedBusinessId,
            setHighlightedBusinessId,
            isPoweredOn,
            setIsPoweredOn,
            filtersApplied,
            setFiltersApplied,
            checkHealth
        }}>
            {children}
        </LyraContext.Provider>
    );
};

export const useLyra = () => {
    const context = useContext(LyraContext);
    if (!context) {
        throw new Error('useLyra must be used within a LyraProvider');
    }
    return context;
};
