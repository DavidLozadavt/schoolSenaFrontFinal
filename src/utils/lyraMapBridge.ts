/**
 * lyraMapBridge.ts
 * EventBus ligero para comunicar LyraAssistant ↔ MapaInteractivo
 * sin prop drilling. Usa CustomEvents del DOM como bus interno.
 *
 * Eventos disponibles:
 *   - lyra:map:fly_to   → { lat, lng, zoom? }
 *   - lyra:map:highlight → { businessId }
 *   - lyra:map:show     → (sin payload, abre el mapa fullscreen si está oculto)
 *   - lyra:map:fit_all  → (ajusta el mapa para mostrar todos los marcadores)
 *   - lyra:map:zoom_in  → (acerca el mapa un nivel)
 *   - lyra:map:zoom_out → (aleja el mapa un nivel)
 *   - lyra:map:locate   → (centra el mapa en la posición GPS del usuario)
 */

export type LyraMapFlyToPayload = { lat: number; lng: number; zoom?: number };
export type LyraMapHighlightPayload = { businessId: number };

// ── Emisores (Lyra los llama) ─────────────────────────────────
export const lyraMapFlyTo = (lat: number, lng: number, zoom = 16) => {
  window.dispatchEvent(
    new CustomEvent<LyraMapFlyToPayload>('lyra:map:fly_to', {
      detail: { lat, lng, zoom },
    })
  );
};

export const lyraMapHighlight = (businessId: number) => {
  window.dispatchEvent(
    new CustomEvent<LyraMapHighlightPayload>('lyra:map:highlight', {
      detail: { businessId },
    })
  );
};

export const lyraMapShow = () => {
  window.dispatchEvent(new CustomEvent('lyra:map:show'));
};

export const lyraMapFitAll = () => {
  window.dispatchEvent(new CustomEvent('lyra:map:fit_all'));
};

export const lyraMapZoomIn = () => {
  window.dispatchEvent(new CustomEvent('lyra:map:zoom_in'));
};

export const lyraMapZoomOut = () => {
  window.dispatchEvent(new CustomEvent('lyra:map:zoom_out'));
};

export const lyraMapLocate = () => {
  window.dispatchEvent(new CustomEvent('lyra:map:locate'));
};

// ── Suscriptores (MapaInteractivo los escucha) ────────────────
export const onLyraMapFlyTo = (
  cb: (payload: LyraMapFlyToPayload) => void
) => {
  const handler = (e: Event) => cb((e as CustomEvent<LyraMapFlyToPayload>).detail);
  window.addEventListener('lyra:map:fly_to', handler);
  return () => window.removeEventListener('lyra:map:fly_to', handler);
};

export const onLyraMapHighlight = (
  cb: (payload: LyraMapHighlightPayload) => void
) => {
  const handler = (e: Event) => cb((e as CustomEvent<LyraMapHighlightPayload>).detail);
  window.addEventListener('lyra:map:highlight', handler);
  return () => window.removeEventListener('lyra:map:highlight', handler);
};

export const onLyraMapShow = (cb: () => void) => {
  window.addEventListener('lyra:map:show', cb);
  return () => window.removeEventListener('lyra:map:show', cb);
};

export const onLyraMapFitAll = (cb: () => void) => {
  window.addEventListener('lyra:map:fit_all', cb);
  return () => window.removeEventListener('lyra:map:fit_all', cb);
};

export const onLyraMapZoomIn = (cb: () => void) => {
  window.addEventListener('lyra:map:zoom_in', cb);
  return () => window.removeEventListener('lyra:map:zoom_in', cb);
};

export const onLyraMapZoomOut = (cb: () => void) => {
  window.addEventListener('lyra:map:zoom_out', cb);
  return () => window.removeEventListener('lyra:map:zoom_out', cb);
};

export const onLyraMapLocate = (cb: () => void) => {
  window.addEventListener('lyra:map:locate', cb);
  return () => window.removeEventListener('lyra:map:locate', cb);
};

/** Show the manual city input overlay (GPS denied or no signal) */
export const lyraShowCityInput = (reason?: string) => {
  window.dispatchEvent(new CustomEvent('lyra:show_city_input', { detail: { reason } }));
};

export const onLyraShowCityInput = (cb: (detail: { reason?: string }) => void) => {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener('lyra:show_city_input', handler);
  return () => window.removeEventListener('lyra:show_city_input', handler);
};

/** Notify that city was confirmed (GPS or manual) */
export const lyraSetCity = (city: string) => {
  window.dispatchEvent(new CustomEvent('lyra:set_city', { detail: { city } }));
};

export const onLyraSetCity = (cb: (city: string) => void) => {
  const handler = (e: Event) => cb((e as CustomEvent<{ city: string }>).detail.city);
  window.addEventListener('lyra:set_city', handler);
  return () => window.removeEventListener('lyra:set_city', handler);
};
