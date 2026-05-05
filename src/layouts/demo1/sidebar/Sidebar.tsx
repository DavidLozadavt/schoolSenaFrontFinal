/* eslint-disable react-hooks/exhaustive-deps */
import { Drawer } from '@/components';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useResponsive, useViewport } from '@/hooks';
import { useDemo1Layout } from '../';
import { SidebarContent, SidebarHeader } from './';
import clsx from 'clsx';
import { getHeight } from '@/utils';
import { usePathname } from '@/providers';

const Sidebar = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const scrollableOffset = 40;
  const [viewportHeight] = useViewport();
  const { pathname, prevPathname } = usePathname();

  const desktopMode = useResponsive('up', 'lg');
  const { mobileSidebarOpen, setSidebarMouseLeave, setMobileSidebarOpen } = useDemo1Layout();
  const { layout } = useDemo1Layout();

  useLayoutEffect(() => {
    if (!desktopMode) {
      setScrollableHeight(0);
      return;
    }
    const measure = () => {
      const headerHeight = headerRef.current ? getHeight(headerRef.current) : 0;
      const availableHeight = viewportHeight - headerHeight - scrollableOffset;
      setScrollableHeight(Math.max(0, availableHeight));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [viewportHeight, desktopMode, layout.options.sidebar.collapse]);
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const handleMouseEnter = () => {
    setSidebarMouseLeave(false);
  };

  const handleMouseLeave = () => {
    setSidebarMouseLeave(true);
  };

  const renderContent = () => {
    return (
      <div
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={clsx(
          'sidebar lg:fixed lg:z-[15] lg:top-0 lg:bottom-0 lg:start-0 lg:translate-x-0 flex min-h-0 flex-col items-stretch shrink-0 bg-light lg:border lg:border-r-gray-200',
          themeClass
        )}
      >
        {desktopMode && <SidebarHeader ref={headerRef} />}
        <SidebarContent {...(desktopMode && { height: scrollableHeight })} />
      </div>
    );
  };

  useEffect(() => {
    // Hide drawer on route chnage after menu link click
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Drawer
        open={mobileSidebarOpen}
        onClose={handleMobileSidebarClose}
        ModalProps={{
          keepMounted: true
        }}
      >
        {renderContent()}
      </Drawer>
    );
  }
};

export { Sidebar };
