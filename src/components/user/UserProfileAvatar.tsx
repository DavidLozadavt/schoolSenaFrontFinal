import { useEffect, useState } from 'react';

import { ImageZoomModal } from '@/components';
import { getResolvedPersonaPhotoUrl } from '@/utils/profilePhotoUrl';

import {
  MisActividadesAvatarFallback,
  type MisActividadesAvatarFallbackVariant
} from './MisActividadesAvatarFallback';

export interface PersonaFotoFields {
  rutaFotoUrl?: string | null;
  rutaFoto?: string | null;
}

interface UserProfileAvatarProps {
  persona?: PersonaFotoFields | null;
  /**
   * Si se pasa (incluso `null`), tiene prioridad sobre `persona`.
   * `undefined` = usar solo datos de `persona`.
   */
  srcOverride?: string | null;
  /** sm = header/dropdown; md = Mis Actividades (misma foto que allí: w-10) */
  variant?: MisActividadesAvatarFallbackVariant;
  alt?: string;
  className?: string;
  /** Si true y hay foto válida, clic abre zoom con modal existente */
  enableZoom?: boolean;
}

const VARIANT_IMG_RING: Record<MisActividadesAvatarFallbackVariant, string> = {
  sm: 'size-9 rounded-full border-2 border-primary/60 object-cover',
  /** Misma escala que `AvatarCreadorActividad`: img w-10 */
  md: 'size-10 rounded-full border-2 border-primary/60 object-cover',
  lg: 'size-44 rounded-full border-2 border-primary/60 object-cover',
  hero: 'w-[120px] h-[120px] rounded-full border-4 border-success object-cover'
};

/**
 * Avatar de perfil: mismo fallback que Mis Actividades (borde punteado + user).
 * Sin foto o error de carga: no `<img src="">`; zoom solo cuando hay foto real.
 */
const UserProfileAvatar = ({
  persona,
  srcOverride,
  variant = 'sm',
  alt = 'Foto de perfil',
  className = '',
  enableZoom = false
}: UserProfileAvatarProps) => {
  const resolvedFromPersona = getResolvedPersonaPhotoUrl(persona ?? undefined);
  const photoUrl =
    srcOverride !== undefined
      ? srcOverride && String(srcOverride).trim()
        ? srcOverride
        : null
      : resolvedFromPersona;
  const hasPhoto = Boolean(photoUrl);

  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [photoUrl]);

  const [zoomOpen, setZoomOpen] = useState(false);

  if (!hasPhoto || broken) {
    return (
      <MisActividadesAvatarFallback variant={variant} className={className} title="Sin foto de perfil" />
    );
  }

  const img = (
    <img
      src={photoUrl as string}
      alt={alt}
      className={`${VARIANT_IMG_RING[variant]} ${className}`}
      title={enableZoom ? 'Ampliar foto' : alt}
      onError={() => setBroken(true)}
    />
  );

  if (enableZoom) {
    return (
      <>
        <button
          type="button"
          className="cursor-pointer shrink-0 rounded-full border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setZoomOpen(true)}
          aria-label="Ampliar foto"
        >
          {img}
        </button>
        <ImageZoomModal
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          src={photoUrl as string}
          alt={alt}
          title={alt}
        />
      </>
    );
  }

  return img;
};

export { UserProfileAvatar };
