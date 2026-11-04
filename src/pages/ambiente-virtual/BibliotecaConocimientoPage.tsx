import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { useAuthContext } from '@/auth';
import MaterialApoyoAprendiz from './actividades/MaterialApoyoAprendiz';
import MaterialApoyoFichaView from './actividades/MaterialApoyoFichaView';

/**
 * Biblioteca de conocimiento: recursos generales por Competencia → RAP (materialApoyoRap).
 * Independiente de Material de Apoyo (Ficha → Competencia).
 * Aprendiz: solo lectura. Instructor: consulta y CRUD sin selector de ficha.
 */
const BibliotecaConocimientoPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const { permissions, roles } = useAuthContext();
  const puedeAdministrar =
    (permissions ?? []).includes('AULA_VIRTUAL_INSTRUCTOR') ||
    (roles ?? []).includes('INSTRUCTOR SENA');

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/35 dark:text-blue-300">
                  <KeenIcon icon="book-open" className="text-xl" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                    Biblioteca de conocimiento
                  </h1>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5">
                    Recursos generales de consulta: documentos, enlaces y videos.
                  </p>
                </div>
              </div>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        {puedeAdministrar ? (
          <MaterialApoyoFichaView modoGeneral />
        ) : (
          <MaterialApoyoAprendiz
            modoBibliotecaGlobal
            hideGroupHeaders
            emptyMessage="No hay recursos en la biblioteca de conocimiento para tu programa."
          />
        )}
      </Container>
    </Fragment>
  );
};

export default BibliotecaConocimientoPage;
