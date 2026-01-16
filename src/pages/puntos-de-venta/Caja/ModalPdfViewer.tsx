import React, { useEffect } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

interface ModalPdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
}

const ModalPdfViewer: React.FC<ModalPdfViewerProps> = ({ isOpen, onClose, pdfUrl }) => {
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <Modal zIndex={100} open={isOpen} onClose={onClose}>
      <ModalContent className="max-w-[800px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle className="text-lg font-semibold">Planilla de Viaje</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="p-6 space-y-6">
          {pdfUrl && (
            <>
              <iframe
                src={pdfUrl}
                width="100%"
                height="500px"
                style={{ border: 'none' }}
                title="PDF Viewer"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Descargar PDF
                </button>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    if (iframe) iframe.contentWindow?.print();
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Imprimir
                </button>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalPdfViewer;