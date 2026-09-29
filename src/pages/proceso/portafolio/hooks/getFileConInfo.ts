import { PortafolioDocumento } from '../interface/Portafolios';

type FileIconInfo = {
  icon: string;
  colorClass: string;
};

const getFileExtension = (filename: string | null | undefined): string => {
  if (!filename) return '';
  const match = filename.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
  return match ? match[1].toLowerCase() : '';
};

export const getFileIconInfo = (doc: PortafolioDocumento): FileIconInfo => {
  const source = doc.urlDocumentoUrl ?? doc.descripcion ?? '';
  const ext = getFileExtension(source);

  if (ext === 'pdf') {
    // ki-file-sheet es el ícono de documento genérico disponible en outline
    return { icon: 'ki-file-sheet', colorClass: 'text-red-500' };
  }
  if (['xls', 'xlsx', 'xlsm', 'csv'].includes(ext)) {
    return { icon: 'ki-tablet-text-up', colorClass: 'text-green-600' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'ki-document', colorClass: 'text-blue-600' };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { icon: 'ki-slider', colorClass: 'text-orange-500' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return { icon: 'ki-picture', colorClass: 'text-purple-500' };
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return { icon: 'ki-files', colorClass: 'text-amber-600' };
  }
  return { icon: 'ki-document', colorClass: 'text-amber-500' };
};
