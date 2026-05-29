import axios from 'axios';
import type { TMenuConfig } from '@/components/menu';

const fetchPermissionsMenu = async (): Promise<TMenuConfig> => {
  try {
    const res = await axios.get('/permisos_jerarquia');
    const data = res.data;
    if (!Array.isArray(data)) return [];
    return data as TMenuConfig;
  } catch (err) {
    console.error('Error fetching permission hierarchy', err);
    return [];
  }
};

export { fetchPermissionsMenu };
