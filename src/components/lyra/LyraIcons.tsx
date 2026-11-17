import React from 'react';

/**
 * Iconos de trazo del asistente. Un solo estilo (24x24, trazo 1.9, puntas
 * redondeadas) para que cabecera, sugerencias y controles se lean como una
 * familia. Decorativos: el texto accesible lo pone el botón que los contiene.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number, className?: string) => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    className,
});

export const IconClose = ({ size = 20, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

export const IconChevronDown = ({ size = 16, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

export const IconChevronRight = ({ size = 16, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M9 6l6 6-6 6" />
    </svg>
);

export const IconArrowRight = ({ size = 14, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

export const IconArrowDown = ({ size = 14, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
);

export const IconSend = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)} strokeWidth={2.3}>
        <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </svg>
);

export const IconSpinner = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)} strokeWidth={2.4}>
        <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
);

export const IconMic = ({ size = 19, className }: IconProps) => (
    <svg {...base(size, className)}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
);

export const IconStop = ({ size = 16, className }: IconProps) => (
    <svg {...base(size, className)} fill="currentColor" stroke="none">
        <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
);

export const IconVolume = ({ size = 19, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
);

export const IconVolumeOff = ({ size = 19, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </svg>
);

export const IconCheck = ({ size = 16, className }: IconProps) => (
    <svg {...base(size, className)} strokeWidth={2.4}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
);

export const IconRefresh = ({ size = 15, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M20 11a8 8 0 1 0-2.3 6.1M20 5v6h-6" />
    </svg>
);

export const IconWifiOff = ({ size = 24, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.2-2M10.7 6.1A15 15 0 0 1 22 9.6M2 9.6a15 15 0 0 1 3.4-2.4" />
        <circle cx="12" cy="20" r="0.8" fill="currentColor" />
    </svg>
);

export const IconNewChat = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M12 5H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
        <path d="M17.5 3.5a1.8 1.8 0 0 1 2.5 2.5L12 14l-3.5 1 1-3.5 8-8z" />
    </svg>
);

/* Sugerencias y glifos de invitación */

export const IconMap = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.4" />
    </svg>
);

export const IconSearch = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
    </svg>
);

export const IconStore = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M4 9l1.2-4.5h13.6L20 9M4 9v10h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 19v-5h4v5" />
    </svg>
);

export const IconSparkles = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6L10 4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
    </svg>
);

export const IconChat = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h-.5A1.5 1.5 0 0 1 5 13.5v-7z" />
    </svg>
);

export const IconCalendar = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
        <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </svg>
);

export const IconChecklist = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M5 7l1.6 1.6L9.5 5.5M5 14l1.6 1.6 2.9-3.1M13 7.5h6M13 14.5h6" />
    </svg>
);

export const IconCompass = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </svg>
);

export const IconGradCap = ({ size = 18, className }: IconProps) => (
    <svg {...base(size, className)}>
        <path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5zM6.5 11.7v4.3c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.3M21.5 9.5v5" />
    </svg>
);

export const IconInfo = ({ size = 15, className }: IconProps) => (
    <svg {...base(size, className)}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5M12 8v.01" />
    </svg>
);
