import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { ListaActividades } from './actividades';
import axios from 'axios';
import { useState, useEffect } from 'react';
import type { Actividad } from './actividades';

const ActividadesPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        setLoading(true);
        // TODO: Implementar endpoint para obtener actividades del estudiante
        // Por ahora, usar endpoint temporal o mostrar mensaje
        const response = await axios.get('actividades');
        setActividades(response.data?.data || []);
      } catch (error: any) {
        console.error('Error al obtener actividades:', error);
        setActividades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Visualiza y gestiona tus actividades asignadas</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ListaActividades
          actividades={actividades}
          loading={loading}
          modo="asignadas"
          emptyMessage="No tienes actividades asignadas"
        />
      </Container>
    </Fragment>
  );
};

export default ActividadesPage;
