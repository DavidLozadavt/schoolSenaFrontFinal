import type { TMenuConfig } from '@/components/menu';
import { userHasAnyPermission } from '@/utils/permissionUtils';

/**
 * Reglas de visibilidad del menú lateral. Las usa el sidebar para pintar el
 * menú y Lyra para saber a qué secciones puede llevar al usuario: si las dos
 * no compartieran la regla, el asistente podría ofrecer una sección que el
 * usuario no ve.
 */
export const isMenuItemAllowed = (
  requiredPermissions: string[] | undefined,
  userPermissions: string[],
  userRoles: string[]
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const isAllowedByPermission = userHasAnyPermission(requiredPermissions, userPermissions ?? []);

  const instructorSenaBypass =
    Array.isArray(userRoles) &&
    userRoles.includes('INSTRUCTOR SENA') &&
    requiredPermissions.includes('AULA_VIRTUAL_INSTRUCTOR');

  return isAllowedByPermission || instructorSenaBypass;
};

export const filterMenuByPermissions = (
  items: TMenuConfig,
  userPermissions: string[],
  userRoles: string[]
): TMenuConfig => {
  return items
    .map((item) => {
      if (item.requiredPermissions?.some((perm) => perm.includes('HIDDEN'))) {
        return null;
      }

      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, userPermissions, userRoles);
        const parentAllowed = isMenuItemAllowed(item.requiredPermissions, userPermissions, userRoles);

        if (filteredChildren.length === 0) {
          if (!parentAllowed || !item.path) {
            return null;
          }
          return { ...item, children: [] };
        }

        return { ...item, children: filteredChildren };
      }

      if (!isMenuItemAllowed(item.requiredPermissions, userPermissions, userRoles)) {
        return null;
      }

      return item;
    })
    .filter(Boolean) as TMenuConfig;
};

export interface NavCatalogItem {
  title: string;
  path: string;
}

/**
 * Secciones navegables que el usuario ve en su menú, aplanadas como
 * "Padre › Hijo". Es lo único a lo que Lyra puede llevarlo.
 */
export const buildNavCatalog = (
  menu: TMenuConfig | null,
  userPermissions: string[],
  userRoles: string[]
): NavCatalogItem[] => {
  if (!menu) return [];
  const out: NavCatalogItem[] = [];
  const seen = new Set<string>();

  const walk = (items: TMenuConfig, parents: string[]) => {
    for (const item of items) {
      const title = (item.title || '').trim();
      const path = item.path;
      if (path && path.startsWith('/') && !path.startsWith('//') && !seen.has(path) && title) {
        seen.add(path);
        out.push({ title: [...parents, title].join(' › ').slice(0, 120), path });
      }
      if (item.children?.length) {
        walk(item.children, title ? [...parents, title] : parents);
      }
    }
  };

  walk(filterMenuByPermissions(menu, userPermissions ?? [], userRoles ?? []), []);
  return out.slice(0, 300);
};
