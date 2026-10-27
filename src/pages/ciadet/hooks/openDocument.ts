import axios from "axios";
import { ArchivoCarpeta } from "../types/carpetasViajeras";
import { enqueueSnackbar } from "notistack";

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  html: 'text/html'
};

const getExtension = (name: string) => {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
};

const descargarBlob = (blob: Blob, nombre: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const handleOpenArchivo = async (archivo: ArchivoCarpeta, carpetaId: number) => {
  const nombreArchivo = archivo.nombreArchivo || `archivo_${archivo.id}`;
  const extension = getExtension(nombreArchivo);
  const esVisualizable = Boolean(EXTENSION_MIME_MAP[extension]);

  try {
    const response = await axios.get(
      `carpetas-viajeras/${carpetaId}/archivos/${archivo.id}/ver`,
      { responseType: 'blob' }
    );

    const rawBlob = response.data as Blob;
    const mimeType = EXTENSION_MIME_MAP[extension] || rawBlob.type || 'application/octet-stream';
    const blob = mimeType !== rawBlob.type ? new Blob([rawBlob], { type: mimeType }) : rawBlob;

    if (esVisualizable) {
      const blobUrl = window.URL.createObjectURL(blob);
      const nuevaVentana = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!nuevaVentana) {
        descargarBlob(blob, nombreArchivo);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
      }
    } else {
      descargarBlob(blob, nombreArchivo);
    }
  } catch (error) {
    console.error('Error al abrir/descargar el archivo:', error);
    enqueueSnackbar('No se pudo abrir el archivo. Verifique su conexión o inténtelo de nuevo.', {
      variant: 'error'
    });
  }
};