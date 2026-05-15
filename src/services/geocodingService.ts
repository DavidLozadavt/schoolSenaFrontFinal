import axios from 'axios';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
}

const LYRA_API_URL = import.meta.env.VITE_LYRA_API_URL || 'http://127.0.0.1:8099';

// ─── Caché en memoria (10 min TTL) ───────────────────────────────────────────
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function cacheGet(key: string): any | null {
  const e = _cache.get(key);
  if (e && (Date.now() - e.ts < CACHE_TTL)) return e.data;
  
  try {
    const stored = localStorage.getItem(`nexi_geo_cache_v5_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.ts < 30 * 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (err) {}
  
  return null;
}

function cacheSet(key: string, data: any) {
  const entry = { data, ts: Date.now() };
  _cache.set(key, entry);
  try {
    localStorage.setItem(`nexi_geo_cache_v5_${key}`, JSON.stringify(entry));
  } catch (err) {}
}

/**
 * Geocoding (Dirección -> Coordenadas)
 * Usa el backend de Lyra como proxy para evitar CORS.
 */
export async function geocodeAddress(
  address: string,
  city = 'Popayán',
  state = '',
  country = 'Colombia'
): Promise<GeocodeResult | null> {
  const query = `${address}, ${city}, ${country}`.trim();
  const cacheKey = `geo:${query.toLowerCase().replace(/\s+/g, '_')}`;
  
  let data = cacheGet(cacheKey);

  if (!data) {
    try {
      const res = await axios.get(`${LYRA_API_URL}/geocode`, {
        params: { q: query }
      });
      data = res.data;
      if (Array.isArray(data) && data.length > 0) cacheSet(cacheKey, data);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  const bestResult = data[0];
  return {
    lat: parseFloat(bestResult.lat),
    lng: parseFloat(bestResult.lon),
    displayName: bestResult.display_name
  };
}

/**
 * Reverse Geocoding (Coordenadas -> Ciudad/Barrio)
 * Usa el backend de Lyra (Google Maps API segura) para mayor precisión.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    let data = cacheGet(cacheKey);

    if (!data) {
        try {
            const res = await axios.get(`${LYRA_API_URL}/reverse-geocode`, {
                params: { lat, lng }
            });
            data = res.data;
            if (data.success) cacheSet(cacheKey, data);
        } catch {
            return "Ubicación detectada";
        }
    }

    if (data && data.success && data.city) {
        return data.city;
    }

    return "Ubicación detectada";
}

/**
 * searchCities (Autocompletado de ciudades)
 */
export async function searchCities(query: string): Promise<any[]> {
    if (!query || query.length < 1) return [];
    
    const cacheKey = `search:${query.toLowerCase().trim()}`;
    let data = cacheGet(cacheKey);

    if (!data) {
        try {
            const res = await axios.get(`${LYRA_API_URL}/geocode`, {
                params: { q: query }
            });
            data = res.data;
            if (Array.isArray(data)) cacheSet(cacheKey, data);
        } catch {
            return [];
        }
    }

    return Array.isArray(data) ? data : [];
}

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
