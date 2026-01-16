import React, { useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
}

const FileViewerModal = ({ open, onClose, fileUrl, fileName }: FileViewerModalProps) => {
  const [currentFileUrl, setCurrentFileUrl] = React.useState(fileUrl);

  useEffect(() => {
    if (open) {
      setCurrentFileUrl(fileUrl);
    }
  }, [open, fileUrl]);

  const getFileType = (url?: string): string => {
    if (!url) return 'unsupported';

    try {
      const extension = url.split('.').pop()?.toLowerCase() || '';

      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      const videoExtensions = ['mp4', 'webm', 'ogg'];
      const pdfExtensions = ['pdf'];
      const wordExtensions = ['doc', 'docx'];
      const excelExtensions = ['xls', 'xlsx'];

      if (imageExtensions.includes(extension)) return 'image';
      if (videoExtensions.includes(extension)) return 'video';
      if (pdfExtensions.includes(extension)) return 'pdf';
      if (wordExtensions.includes(extension)) return 'word';
      if (excelExtensions.includes(extension)) return 'excel';

      return 'unsupported';
    } catch (error) {
      console.error('Error al analizar el tipo de archivo:', error);
      return 'unsupported';
    }
  };

  const fileType = getFileType(currentFileUrl);

  const handleOpenInNewTab = () => {
    window.open(currentFileUrl, '_blank');
  };

  const handleModalClose = () => {
    setCurrentFileUrl(''); 
    onClose(); 
  };

  return (
    <Modal open={open} onClose={handleModalClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{fileName || 'Visualizador de Archivos'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={handleModalClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          {fileType === 'image' && <img src={currentFileUrl} alt="Preview" className="w-full h-auto rounded" />}
          {fileType === 'video' && (
            <video controls className="w-full h-auto rounded">
              <source src={currentFileUrl} type={`video/${currentFileUrl.split('.').pop()}`} />
              Tu navegador no soporta el elemento de video.
            </video>
          )}
          {fileType === 'pdf' && (
            <iframe
              src={currentFileUrl}
              title="PDF Viewer"
              className="w-full h-[500px]"
              frameBorder="0"
            ></iframe>
          )}
          {(fileType === 'word' || fileType === 'excel') && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentFileUrl)}`}
              title="Office Viewer"
              className="w-full h-[500px]"
              frameBorder="0"
            ></iframe>
          )}
          {fileType === 'unsupported' && (
            <p className="text-center text-gray-500">Tipo de archivo no soportado.</p>
          )}

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={handleModalClose}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={handleOpenInNewTab}>
              Abrir en nueva pestaña
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FileViewerModal;
