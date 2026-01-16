import { IScrollspyMenuItems, ScrollspyMenu } from '@/partials/menu';

const SettingsConfiguracionNomina = () => {
  const items: IScrollspyMenuItems = [
    {
      title: 'Configuración de Valores',
      target: '1',
      active: true
    },
    {
      title: 'Auxilio de Transporte',
      target: '2'
    },
    {
      title: 'Horas Extras',
      target: '3'
    },
    {
      title: 'Deducciones (%)',
      target: '4'
    },
    {
      title: 'Configuración de Auxilio FSP',
      target: '5'
    },
    {
      title: 'Parafiscales (%)',
      target: '6'
    },
    {
      title: 'Apropiaciones (%)',
      target: '7'
    },

    {
      title: 'Configuración de Retenciones',
      target: '8'
    },
    {
      title: 'Confirmar',
      target: '9'
    }
  ];

  return <ScrollspyMenu items={items} />;
};

export { SettingsConfiguracionNomina };
