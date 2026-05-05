import clsx from 'clsx';
import { useEffect } from 'react';
import { Container } from '@/components/container';
import { HeaderLogo, HeaderTopbar } from './';
import { Breadcrumbs, useDemo1Layout } from '../';

const Header = () => {
  const { headerSticky } = useDemo1Layout();

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  return (
    <header
      className={clsx(
        'header fixed top-0 z-30 start-0 end-0 flex items-stretch shrink-0 bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark]',
        headerSticky && 'shadow-sm'
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        <HeaderLogo />
        <Breadcrumbs />
        <HeaderTopbar />
      </Container>
    </header>
  );
};

export { Header };
