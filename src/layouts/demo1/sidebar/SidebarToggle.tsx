import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { useDemo1Layout } from '../Demo1LayoutProvider';

/** Flecha dentro del header del sidebar (sin salir al contenido): contraer / expandir barra principal. */
const SidebarToggle = () => {
  const { layout, setSidebarCollapse } = useDemo1Layout();
  const collapsed = Boolean(layout.options.sidebar.collapse);

  const handleClick = () => {
    setSidebarCollapse(!collapsed);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'shrink-0 self-center inline-flex items-center justify-center rounded-md p-1.5',
        'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary',
        'bg-transparent border-0 shadow-none outline-none',
        'transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1'
      )}
      aria-expanded={!collapsed}
      title={collapsed ? 'Expandir menú (ver textos)' : 'Contraer menú (solo iconos)'}
      aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
    >
      <KeenIcon
        icon={collapsed ? 'black-right-line' : 'black-left-line'}
        className="text-xl leading-none"
      />
    </button>
  );
};

export { SidebarToggle };
