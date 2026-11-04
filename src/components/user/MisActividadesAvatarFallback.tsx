import type { FC } from 'react';

import { KeenIcon } from '@/components';

/**
 * Mismo fallback visual que en Mis Actividades (`ActividadesAprendiz` → avatar del instructor sin foto):
 * círculo exterior + borde punteado primary + ícono usuario.
 */
export type MisActividadesAvatarFallbackVariant = 'sm' | 'md' | 'lg' | 'hero';

const VARIANT_MAP: Record<
  MisActividadesAvatarFallbackVariant,
  { outer: string; inner: string; icon: string }
> = {
  /** Header / dropdown (~36px), proporción similar a md */
  sm: {
    outer: 'w-9 h-9',
    inner: 'w-8 h-8',
    icon: 'text-sm'
  },
  /** Tarjetas Mis Actividades (referencia exacta: w-12 / w-10) */
  md: {
    outer: 'w-12 h-12',
    inner: 'w-10 h-10',
    icon: 'text-base'
  },
  /** Vista previa formulario perfil (~cuadrado w-48) */
  lg: {
    outer: 'w-44 h-44',
    inner: 'w-36 h-36',
    icon: 'text-5xl'
  },
  /** Perfil: mismo estilo escalado (~120px exterior) */
  hero: {
    outer: 'w-[120px] h-[120px]',
    inner: 'w-[100px] h-[100px]',
    icon: 'text-4xl'
  }
};

type MisActividadesAvatarFallbackProps = {
  variant?: MisActividadesAvatarFallbackVariant;
  title?: string;
  className?: string;
};

const MisActividadesAvatarFallback: FC<MisActividadesAvatarFallbackProps> = ({
  variant = 'md',
  title = 'Sin foto de perfil',
  className = ''
}) => {
  const v = VARIANT_MAP[variant];
  return (
    <div
      className={`${v.outer} rounded-full flex items-center justify-center bg-white shrink-0 dark:bg-coal-400/40 ${className}`}
      title={title}
      aria-label={title}
    >
      <div
        className={`${v.inner} rounded-full border-2 border-dashed border-primary flex items-center justify-center text-primary`}
      >
        <KeenIcon icon="user" className={v.icon} />
      </div>
    </div>
  );
};

export { MisActividadesAvatarFallback };
