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

import axios from 'axios';
import { KeenIcon } from '@/components';
import { LiquidacionNominaContent } from './LiquidacionNominaContent';
import { NominasContent } from './NominasContent';
import { useLocation } from 'react-router';

const NominasPage = () => {
  const { currentLayout } = useLayout();

  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
  };

  const location = useLocation();
  const { id, fecha, fechaInicialPeriodo, fechaFinalPeriodo } = location.state || {};

  const formatoFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const periodoFormateado =
    fechaInicialPeriodo && fechaFinalPeriodo
      ? `${formatoFecha(fechaInicialPeriodo)} - ${formatoFecha(fechaFinalPeriodo)}`
      : '';

  

  const exportToExcelRef = useRef<(() => void) | null>(null);
  const exportAPRef = useRef<(() => void) | null>(null);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold leading-none text-gray-900">
                  Periodo de Nómina
                </h1>

                {periodoFormateado && (
                  <span className="text-gray-600 text-lg font-medium">{periodoFormateado}</span>
                )}
              </div>
              <ToolbarDescription>Gestiona las nominas existentes</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => exportToExcelRef.current?.()} className="btn btn-sm btn-light">
                <KeenIcon icon="arrow-up" className="mr-2" />
                Exportar
              </button>

              <button onClick={() => exportAPRef.current?.()} className="btn btn-sm btn-light">
                <KeenIcon icon="arrow-up" className="mr-2" />
                Exportar Aportes en Linea
              </button>

           
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <NominasContent
          reload={reloadContent}
           onExportReady={(fn) => (exportToExcelRef.current = fn)}
          onExportAPReady={(fn) => (exportAPRef.current = fn)}
        />
      </Container>
    </Fragment>
  );
};

export { NominasPage };
