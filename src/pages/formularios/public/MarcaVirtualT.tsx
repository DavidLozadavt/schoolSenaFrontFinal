import React from 'react';

/** Monograma "V" en un aro, con el mismo degradado dorado de la placa. */
const Monograma: React.FC = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0" aria-hidden="true">
    <defs>
      <linearGradient id="vt-oro-monograma" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fde68a" />
        <stop offset="0.5" stopColor="#f59e0b" />
        <stop offset="1" stopColor="#fcd34d" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14.5" fill="none" stroke="url(#vt-oro-monograma)" strokeWidth="1.5" />
    <path d="M9.2 10.5h3.7L16 19.3l3.1-8.8h3.7L17.9 22.5h-3.8z" fill="url(#vt-oro-monograma)" />
  </svg>
);

interface Props {
  /** Sin la línea superior ni tanto margen: para pantallas con poco alto (p. ej. dentro de un modal). */
  compacta?: boolean;
}

/**
 * Sello "VirtualT · Soluciones de software" al pie de los formularios públicos.
 * Placa oscura con dorado para que se lea igual sobre fondo claro u oscuro.
 * Las animaciones son lentas y se apagan si el usuario pidió reducir movimiento.
 */
const MarcaVirtualT: React.FC<Props> = ({ compacta = false }) => (
  <div className={`flex flex-col items-center select-none ${compacta ? 'gap-2 py-2' : 'gap-3 pb-12 mt-10'}`}>
    <style>{`
      @keyframes vt-brillo { 0% { transform: translateX(-130%) skewX(-18deg); } 55%, 100% { transform: translateX(330%) skewX(-18deg); } }
      @keyframes vt-halo { 0%, 100% { opacity: .35; transform: scale(.96); } 50% { opacity: .7; transform: scale(1.04); } }
      @keyframes vt-oro { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      .vt-brillo { animation: vt-brillo 4.5s ease-in-out infinite; }
      .vt-halo { animation: vt-halo 5s ease-in-out infinite; }
      .vt-oro { background-size: 220% 100%; animation: vt-oro 7s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .vt-brillo, .vt-halo, .vt-oro { animation: none; } .vt-brillo { display: none; } }
    `}</style>

    {!compacta && (
      <div className="flex items-center gap-3 w-full max-w-[260px]" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/60" />
        <span className="w-1 h-1 rotate-45 bg-amber-400" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/60" />
      </div>
    )}

    <div className="relative">
      {/* Halo dorado que respira detrás de la placa */}
      <div className="vt-halo absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400/40 via-yellow-300/50 to-amber-500/40 blur-xl" aria-hidden="true" />

      {/* Borde dorado: el degradado asoma 1px alrededor del fondo oscuro */}
      <div className="relative rounded-full p-px bg-gradient-to-r from-amber-600 via-yellow-200 to-amber-600 shadow-[0_10px_30px_-8px_rgba(180,120,10,0.55)]">
        <div className="relative overflow-hidden rounded-full bg-gradient-to-b from-neutral-800 via-neutral-900 to-black pl-2.5 pr-6 py-2 flex items-center gap-2.5">
          <Monograma />
          <span className="vt-oro text-[13px] font-black tracking-[0.18em] uppercase bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 text-transparent bg-clip-text">
            VirtualT
          </span>
          <span className="w-px h-3.5 bg-amber-400/40" aria-hidden="true" />
          <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-amber-100/90 whitespace-nowrap">
            Soluciones de software
          </span>

          {/* Brillo que recorre la placa */}
          <span className="vt-brillo pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden="true" />
        </div>
      </div>
    </div>

    <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-amber-700/80 dark:text-amber-300/70">
      Formulario creado con VirtualT
    </p>
  </div>
);

export default MarcaVirtualT;
