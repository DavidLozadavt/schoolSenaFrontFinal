import React, { forwardRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useDemo1Layout } from '../';
import { toAbsoluteUrl } from '@/utils';

const logoLightSrc = toAbsoluteUrl('/media/app/logoweb.png');
const logoDarkSrc = toAbsoluteUrl('/media/app/logoweb-dark.png');

const SidebarHeader = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { layout } = useDemo1Layout();

  const lightLogo = () => (
    <Fragment>
      <Link to="/" className="dark:hidden flex flex-1 min-w-0 items-center pe-1">
        <img
          src={logoLightSrc}
          alt="School"
          className="default-logo h-auto w-full max-h-[72px] min-h-[52px] object-contain object-left"
        />
        <img
          src={logoLightSrc}
          alt=""
          className="small-logo h-[52px] w-[76px] max-w-[76px] object-cover object-left shrink-0 rounded-sm"
        />
      </Link>
      <Link to="/" className="hidden dark:flex dark:flex-1 dark:min-w-0 dark:items-center dark:pe-1">
        <img
          src={logoDarkSrc}
          alt="School"
          className="default-logo h-auto w-full max-h-[72px] min-h-[52px] object-contain object-left"
        />
        <img
          src={logoDarkSrc}
          alt=""
          className="small-logo h-[52px] w-[76px] max-w-[76px] object-cover object-left shrink-0 rounded-sm"
        />
      </Link>
    </Fragment>
  );

  const darkLogo = () => (
    <Link to="/" className="flex flex-1 min-w-0 items-center pe-1">
      <img
        src={logoDarkSrc}
        alt="School"
        className="default-logo h-auto w-full max-h-[72px] min-h-[52px] object-contain object-left"
      />
      <img
        src={logoDarkSrc}
        alt=""
        className="small-logo h-[52px] w-[76px] max-w-[76px] object-cover object-left shrink-0 rounded-sm"
      />
    </Link>
  );

  return (
    <div
      ref={ref}
      className="sidebar-header relative hidden min-w-0 shrink-0 px-3 sm:px-4 lg:flex lg:flex-col"
    >
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        {layout.options.sidebar.theme === 'light' ? lightLogo() : darkLogo()}
      </div>
    </div>
  );
});

export { SidebarHeader };
