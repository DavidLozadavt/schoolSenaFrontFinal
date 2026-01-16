export interface Escenario {
  id: number;
  numero: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  capacidad: number | string; // puede venir como string desde el backend
  idCompany: number | string;
  imagenUrl?: string;
  imagenes?: { id: number; url?: string }[];
  videos?: { id: number; url?: string }[];
  created_at?: string;
  updated_at?: string;
}
