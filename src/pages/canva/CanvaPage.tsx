import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { CanvaContent } from './CanvaContent';
import { ModalBoard } from './ModalBoard';


const CanvaPage = () => {
  const { currentLayout } = useLayout();

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  

  const handleBoardModalOpen = () => {
    setBoardModalOpen(true);
  };
  const handleModalClose = () => {
    setBoardModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setBoardModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona tus tableros en la aplicación</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleBoardModalOpen}>
                Nuevo Tablero
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <CanvaContent  reload={reloadContent}/>


        <ModalBoard
          open={boardModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
      </Container>
    </Fragment>
  );
};

export { CanvaPage };
