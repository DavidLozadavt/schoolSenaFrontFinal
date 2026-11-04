import axios from 'axios';

/** Construye URL pública para documentos de excusa/almacenamiento. */
export const getAsistenciaDocumentUrl = (url?: string | null): string | null => {
  if (!url) return null;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      if (path.startsWith('/excusas/')) {
        const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
        return base + '/storage' + path;
      }

      if (path.startsWith('/storage/')) {
        if (urlObj.hostname === 'localhost' && !urlObj.port) {
          const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
          return base + path;
        }
        return url;
      }

      if (urlObj.hostname === 'localhost' && !urlObj.port) {
        const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
        return base + path;
      }

      return url;
    } catch {
      return url;
    }
  }

  if (url.startsWith('/storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + url;
  }
  if (url.startsWith('storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/' + url;
  }
  if (url.startsWith('/excusas/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/storage' + url;
  }
  if (url.startsWith('excusas/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/storage/' + url;
  }

  const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
  return base + '/storage/' + url;
};
