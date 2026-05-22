import { PERMISSIONS } from './permissions';

export interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  permissions: string[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Productos',
    icon: 'inventory_2',
    route: '/admin/productos',
    permissions: Object.values(PERMISSIONS.PRODUCTS),
  },
  {
    label: 'Categorías',
    icon: 'category',
    route: '/admin/categorias',
    permissions: Object.values(PERMISSIONS.CATEGORIES),
  },
  {
    label: 'Marcas',
    icon: 'branding_watermark',
    route: '/admin/marcas',
    permissions: Object.values(PERMISSIONS.BRANDS),
  },
  {
    label: 'Banners',
    icon: 'view_carousel',
    route: '/admin/banners',
    permissions: Object.values(PERMISSIONS.BANNERS),
  },
  {
    label: 'Usuarios',
    icon: 'people',
    route: '/admin/usuarios',
    permissions: Object.values(PERMISSIONS.USERS),
  },
  {
    label: 'Roles',
    icon: 'admin_panel_settings',
    route: '/admin/roles',
    permissions: Object.values(PERMISSIONS.ROLES),
  },
  {
    label: 'Permisos',
    icon: 'key',
    route: '/admin/permisos',
    permissions: Object.values(PERMISSIONS.PERMISSIONS),
  },
];

/** Cualquier permiso de módulo admin permite entrar al dashboard */
export const ALL_ADMIN_PERMISSIONS: string[] = [
  ...new Set(ADMIN_NAV_ITEMS.flatMap((item) => item.permissions)),
];
