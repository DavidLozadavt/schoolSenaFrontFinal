export interface AfiliacionEstadoInterface {
  id: number;
  fechaInicial: string;
  fechaFinal: string | null;
  observacion: string;
  idAfiliacion: number;
  estado: string;
  created_at: string;
  updated_at: string;
  diasTranscurridos: number;
}
