// Exaxmples of usage:
//* 1. In a background image: <div style={{backgroundImage: `url('${toAbsoluteUrl('/media/misc/pattern-1.jpg')}')`}}>...
//* 2. In img tag: <img src={toAbsoluteUrl('/media/avatars/300-2.jpg')} />
const toAbsoluteUrl = (pathname: string): string => {
  const baseUrl = import.meta.env.BASE_URL;

  if (baseUrl && baseUrl !== '/') {
    return import.meta.env.BASE_URL + pathname;
  } else {
    return pathname;
  }
};

const fixImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  // Clean the path from leading slashes
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Ensure it has the storage/ prefix if it's a relative path and doesn't have it
  if (!cleanPath.startsWith('storage/') && !cleanPath.startsWith('media/') && !cleanPath.startsWith('assets/')) {
    cleanPath = `storage/${cleanPath}`;
  }

  const apiUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:8003/api/';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  return `${baseUrl}/${cleanPath}`;
};

export { toAbsoluteUrl, fixImageUrl };
