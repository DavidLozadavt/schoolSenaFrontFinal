import React, { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import MisClases from './MisClases';
import ReporteAsistencias from './ReporteAsistencias';

const MisClasesPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [filtro, setFiltro] = useState<'todas' | 'completadas'>('todas');
  const [mostrarReporte, setMostrarReporte] = useState(false);

  const handleVerReporte = () => {
    setMostrarReporte(true);
  };

  const handleVolverAClases = () => {
    setMostrarReporte(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && !mostrarReporte && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Seguimiento de todas tus clases programadas</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="flex items-center gap-3">
                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value as 'todas' | 'completadas')}
                  className="select select-sm w-auto min-w-[180px] bg-white dark:bg-coal-400 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="todas">Todas las clases</option>
                  <option value="completadas">Solo completadas</option>
                </select>
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={handleVerReporte}
                >
                  Ver reporte de asistencias
                </button>
              </div>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      {mostrarReporte ? (
        <ReporteAsistencias onVolver={handleVolverAClases} />
      ) : (
        <Container>
          <MisClases filtro={filtro} />
        </Container>
      )}
    </Fragment>
  );
};

export default MisClasesPage;
