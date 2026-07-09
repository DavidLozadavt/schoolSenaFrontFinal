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
import { useAuthContext } from '@/auth';
import { ESTUDIANTE_UP_ROLE } from '@/utils/aulaVirtualEstudianteUp';
import MisClases from './MisClases';
import ReporteAsistencias from './ReporteAsistencias';
import HorarioEstudianteMisClases from './HorarioEstudianteMisClases';

type VistaMisClases = 'clases' | 'reporte' | 'horario';

const MisClasesPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const { roles } = useAuthContext();
  const esEstudianteColegio = roles?.includes(ESTUDIANTE_UP_ROLE) ?? false;

  const [filtro, setFiltro] = useState<'todas' | 'completadas'>('todas');
  const [vista, setVista] = useState<VistaMisClases>(esEstudianteColegio ? 'horario' : 'clases');

  const handleVerReporte = () => {
    setVista('reporte');
  };

  const handleVerHorario = () => {
    setVista('horario');
  };

  const handleVolverAClases = () => {
    setVista(esEstudianteColegio ? 'horario' : 'clases');
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && vista === 'clases' && !esEstudianteColegio && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Seguimiento de todas tus clases programadas</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value as 'todas' | 'completadas')}
                  className="select select-sm w-auto min-w-[180px] bg-white dark:bg-coal-400 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="todas">Todas las clases</option>
                  <option value="completadas">Solo completadas</option>
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-light border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  onClick={handleVerHorario}
                >
                  Ver horario
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleVerReporte}
                >
                  Asistencias y justificar faltas
                </button>
              </div>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      {currentLayout?.name === 'demo1-layout' && (vista === 'horario' || esEstudianteColegio) && vista !== 'reporte' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                {esEstudianteColegio
                  ? 'Tu horario semanal: día, materia, hora y docente'
                  : 'Vista semanal de tus clases'}
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <div className="flex flex-wrap items-center gap-3">
                {!esEstudianteColegio ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-light border border-gray-300 dark:border-gray-600"
                    onClick={handleVolverAClases}
                  >
                    Ver sesiones
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleVerReporte}
                >
                  Asistencias y justificar faltas
                </button>
              </div>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      {vista === 'reporte' ? (
        <ReporteAsistencias onVolver={handleVolverAClases} />
      ) : vista === 'horario' || esEstudianteColegio ? (
        <HorarioEstudianteMisClases
          onVolver={esEstudianteColegio ? undefined : handleVolverAClases}
          modoColegio={esEstudianteColegio}
        />
      ) : (
        <Container>
          <MisClases filtro={filtro} />
        </Container>
      )}
    </Fragment>
  );
};

export default MisClasesPage;
