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
import { Download } from 'lucide-react';
import axios from 'axios';
import ReservasContent from './ReservasContent';

const ReservasPage = () => {
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



  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestión de reservas</ToolbarDescription>
            </ToolbarHeading>
            {/* <ToolbarActions>
             
            </ToolbarActions> */}
          </Toolbar>
        </Container>
      )}

      <Container>
        <ReservasContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export default ReservasPage;