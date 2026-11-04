import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';

import { useDemo1Layout } from '../';

const logoLightSrc = toAbsoluteUrl('/media/app/logoweb.png');
const logoDarkSrc = toAbsoluteUrl('/media/app/logoweb-dark.png');

const HeaderLogo = () => {
  const { setMobileSidebarOpen, setMobileMegaMenuOpen, megaMenuEnabled } = useDemo1Layout();

  const handleSidebarOpen = () => {
    setMobileSidebarOpen(true);
  };

  const handleMegaMenuOpen = () => {
    setMobileMegaMenuOpen(true);
  };

  return (
    <div className="flex gap-1 lg:hidden items-center">
      <Link to="/" className="shrink-0 relative block">
        <img
          src={logoLightSrc}
          className="h-[36px] w-auto max-w-[165px] object-contain object-left dark:hidden"
          alt="School"
        />
        <img
          src={logoDarkSrc}
          className="hidden h-[36px] w-auto max-w-[165px] object-contain object-left dark:block"
          alt="School"
        />
      </Link>

      <div className="flex items-center">
        <button
          type="button"
          className="btn btn-icon btn-light btn-clear btn-sm"
          onClick={handleSidebarOpen}
        >
          <KeenIcon icon="menu" />
        </button>

        {megaMenuEnabled && (
          <button
            type="button"
            className="btn btn-icon btn-light btn-clear btn-sm"
            onClick={handleMegaMenuOpen}
          >
            <KeenIcon icon="burger-menu-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export { HeaderLogo };
