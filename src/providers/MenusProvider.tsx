import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';

import { IMenuItemConfig, TMenuConfig } from '@/components/menu';

export interface IMenusProps {
  configs: Map<string, TMenuConfig | null>;
  setMenuConfig: (name: string, config: TMenuConfig | null) => void;
  getMenuConfig: (name: string) => TMenuConfig | null;
  setCurrentMenuItem: (config: IMenuItemConfig | null) => void;
  getCurrentMenuItem: () => IMenuItemConfig | null;
  clearMenuConfigs: () => void;
}

const initialProps: IMenusProps = {
  configs: new Map(),
  setMenuConfig: () => {},
  getMenuConfig: () => null,
  setCurrentMenuItem: () => {},
  getCurrentMenuItem: () => null,
  clearMenuConfigs: () => {}
};

const MenuContext = createContext<IMenusProps>(initialProps);

const useMenus = () => useContext(MenuContext);

const MenusProvider = ({ children }: PropsWithChildren) => {
  const [configs, setConfigs] = useState<Map<string, TMenuConfig | null>>(() => new Map());
  const [currentMenuItem, setCurrentMenuItem] = useState<IMenuItemConfig | null>(null);

  const setMenuConfig = useCallback((name: string, config: TMenuConfig | null) => {
    setConfigs((prev) => {
      const next = new Map(prev);

      if (config === null) {
        next.delete(name);
      } else {
        next.set(name, config);
      }

      return next;
    });
  }, []);

  const getMenuConfig = useCallback(
    (name: string): TMenuConfig | null => {
      return configs.get(name) ?? null;
    },
    [configs]
  );

  const getCurrentMenuItem = useCallback((): IMenuItemConfig | null => {
    return currentMenuItem;
  }, [currentMenuItem]);

  const clearMenuConfigs = useCallback(() => {
    setConfigs(new Map());
    setCurrentMenuItem(null);
  }, []);

  const value = useMemo(
    () => ({
      configs,
      setMenuConfig,
      getMenuConfig,
      setCurrentMenuItem,
      getCurrentMenuItem,
      clearMenuConfigs
    }),
    [configs, setMenuConfig, getMenuConfig, currentMenuItem, getCurrentMenuItem, clearMenuConfigs]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export { MenusProvider, useMenus };
