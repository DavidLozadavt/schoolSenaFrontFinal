import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { PremiumEventCard } from './PremiumEventCard';
import ModalDetalleEvento from './ModalDetalleEvento';

interface Evento {
  idEvento: number;
  nombre: string;
  descripcion?: string;
  fechaInicial: string;
  fechaFinal?: string;
  hora: string;
  hora_final?: string;
  url?: string;
  linkRegistro?: string;
  tipoEvento: string;
  estado: string;
  esPublico: boolean;
  area?: {
    id: number;
    nombre: string;
  };
}

const EventsDashboard = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventoDetalle, setSelectedEventoDetalle] = useState<Evento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [eventos]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('eventos-multimedia');
        // Handle both simple array and Laravel paginated response
        let data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const now = new Date();

        // Filter: Hide finished events if more than 12 hours have passed since their end time
        const twelveHoursInMs = 12 * 60 * 60 * 1000;
        data = data.filter((evento: Evento) => {
          const start = new Date(`${evento.fechaInicial.split('T')[0]}T${evento.hora}`);
          const end = evento.hora_final 
            ? new Date(`${(evento.fechaFinal || evento.fechaInicial).split('T')[0]}T${evento.hora_final}`) 
            : new Date(start.getTime() + 2 * 60 * 60 * 1000);
          
          if (now > end && (now.getTime() - end.getTime()) > twelveHoursInMs) {
            return false;
          }
          return true;
        });

        // Smart sorting: Live/Upcoming first (ASC), then Finished (DESC)
        data = data.sort((a: Evento, b: Evento) => {
          const startA = new Date(`${a.fechaInicial.split('T')[0]}T${a.hora}`);
          const startB = new Date(`${b.fechaInicial.split('T')[0]}T${b.hora}`);
          
          const endA = a.hora_final ? new Date(`${(a.fechaFinal || a.fechaInicial).split('T')[0]}T${a.hora_final}`) : new Date(startA.getTime() + 2 * 60 * 60 * 1000);
          const endB = b.hora_final ? new Date(`${(b.fechaFinal || b.fechaInicial).split('T')[0]}T${b.hora_final}`) : new Date(startB.getTime() + 2 * 60 * 60 * 1000);

          const isFinishedA = now > endA;
          const isFinishedB = now > endB;

          // Priority 1: Not finished
          if (isFinishedA && !isFinishedB) return 1;
          if (!isFinishedA && isFinishedB) return -1;

          if (!isFinishedA && !isFinishedB) {
            // Both upcoming: closest start first
            return startA.getTime() - startB.getTime();
          }

          // Both finished: most recent first
          return startB.getTime() - startA.getTime();
        });

        setEventos(data);
      } catch (err) {
        console.error('Error fetching dashboard events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scroll-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative shrink-0 w-[140px] sm:w-[160px] aspect-[9/16] rounded-2xl bg-gray-200 dark:bg-coal-300 animate-pulse" />
        ))}
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-coal-500/30 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-gray-800 text-center">
        <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">No hay eventos próximos</p>
      </div>
    );
  }

  return (
    <div className="w-full relative group/events">
      {/* Navigation Arrows (Smart Visibility) */}
      {canScrollLeft && (
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 hidden sm:block animate-fade-in">
          <button 
            onClick={() => scroll('left')}
            className="p-3 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      )}

      {canScrollRight && (
        <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 hidden sm:block animate-fade-in">
          <button 
            onClick={() => scroll('right')}
            className="p-3 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-white/30 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-4 scroll-hide snap-x"
      >
        {eventos.map((evento) => (
          <PremiumEventCard 
            key={evento.idEvento} 
            evento={evento} 
            onClick={(e) => {
              setSelectedEventoDetalle(e);
              setModalOpen(true);
            }}
          />
        ))}
      </div>

      {modalOpen && selectedEventoDetalle && (
        <ModalDetalleEvento 
          onClose={() => setModalOpen(false)} 
          evento={selectedEventoDetalle} 
        />
      )}

      <style>{`
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default EventsDashboard;
