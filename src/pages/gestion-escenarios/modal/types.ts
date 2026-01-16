export interface Escenario {
  id: number;
  numero: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  capacidad: number | string;
  idCompany: number | string;
  imagenUrl?: string; // imagen principal
  imagenes?: { id: number; url?: string; urlImage?: string }[]; // secundarias
  videos?: { id?: number; url?: string; urlVideo?: string }[]; // ahora incluye urlVideo
  created_at?: string;
  updated_at?: string;
}

