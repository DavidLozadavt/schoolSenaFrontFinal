import { Fragment, useRef, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import RevisionVehiculosContent from './RevisionVehiculosContent';
import { Download } from 'lucide-react';
import axios from 'axios';

const RevicionVehiculosPage = () => {
  const { currentLayout } = useLayout();
  const [dRevisionModalOpen, setdRevisionModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handledRevisionModalOpen = () => {
    setdRevisionModalOpen(true);
  };

  const handleModalClose = () => {
    setdRevisionModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setdRevisionModalOpen(false);
  };

  const handleDownloadPDF = async () => {
  try {
    setIsDownloading(true);
    
    const response = await axios.get('test-pdf-observaciones', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Solo abrir en nueva ventana
    window.open(url, '_blank');
 setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error al abrir el PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor intenta nuevamente.');
  } finally {
    setIsDownloading(false);
  }
};

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Revision de vehiculos con pendientes</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button 
                className="btn btn-sm btn-light"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="me-2" size={16} />
                    Descargar PDF
                  </>
                )}
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <RevisionVehiculosContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export default RevicionVehiculosPage;