import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import React, { Fragment, useState } from 'react';
import ProfesoresContent from './ProfesoresContent';

const ProfesoresPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && <Container></Container>}
      <Container>
        <ProfesoresContent />
      </Container>
    </Fragment>
  );
};

export default ProfesoresPage;
