/**
 * Módulos del sistema
 */
export enum PermissionModule {
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  BRANDS = 'brands',
  USERS = 'users',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  BANNERS = 'banners',
}

/**
 * Acciones disponibles en el sistema
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSIGN_ACCESS = 'assign_access',
}

/**
 * Constantes de permisos del sistema
 * Uso: data: { permission: PERMISSIONS.PRODUCTS.CREATE }
 */
export const PERMISSIONS = {
  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    EXPORT: 'products.export',
  },
  CATEGORIES: {
    CREATE: 'categories.create',
    READ: 'categories.read',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
  },
  BRANDS: {
    CREATE: 'brands.create',
    READ: 'brands.read',
    UPDATE: 'brands.update',
    DELETE: 'brands.delete',
  },
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    ASSIGN_ACCESS: 'users.assign_access',
  },
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },
  PERMISSIONS: {
    CREATE: 'permissions.create',
    READ: 'permissions.read',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
  },
  BANNERS: {
    CREATE: 'banners.create',
    READ: 'banners.read',
    UPDATE: 'banners.update',
    DELETE: 'banners.delete',
  },
} as const;

/**
 * Tipo que representa todos los permisos válidos del sistema
 */
export type PermissionSlug = {
  [K in keyof typeof PERMISSIONS]: (typeof PERMISSIONS)[K][keyof (typeof PERMISSIONS)[K]];
}[keyof typeof PERMISSIONS];

/**
 * Metadata de permisos con nombres legibles
 */
export const PERMISSION_METADATA = {
  'products.create': {
    name: 'Crear productos',
    description: 'Permite crear nuevos productos',
  },
  'products.read': {
    name: 'Ver productos',
    description: 'Permite ver la lista de productos',
  },
  'products.update': {
    name: 'Actualizar productos',
    description: 'Permite modificar productos existentes',
  },
  'products.delete': {
    name: 'Eliminar productos',
    description: 'Permite eliminar productos',
  },
  'products.export': {
    name: 'Exportar productos',
    description: 'Permite exportar productos a Excel/CSV',
  },

  'categories.create': {
    name: 'Crear categorías',
    description: 'Permite crear nuevas categorías',
  },
  'categories.read': {
    name: 'Ver categorías',
    description: 'Permite ver la lista de categorías',
  },
  'categories.update': {
    name: 'Actualizar categorías',
    description: 'Permite modificar categorías existentes',
  },
  'categories.delete': {
    name: 'Eliminar categorías',
    description: 'Permite eliminar categorías',
  },

  'brands.create': {
    name: 'Crear marcas',
    description: 'Permite crear nuevas marcas',
  },
  'brands.read': {
    name: 'Ver marcas',
    description: 'Permite ver la lista de marcas',
  },
  'brands.update': {
    name: 'Actualizar marcas',
    description: 'Permite modificar marcas existentes',
  },
  'brands.delete': {
    name: 'Eliminar marcas',
    description: 'Permite eliminar marcas',
  },

  'users.create': {
    name: 'Crear usuarios',
    description: 'Permite crear nuevos usuarios',
  },
  'users.read': {
    name: 'Ver usuarios',
    description: 'Permite ver la lista de usuarios',
  },
  'users.update': {
    name: 'Actualizar usuarios',
    description: 'Permite modificar usuarios existentes',
  },
  'users.delete': {
    name: 'Eliminar usuarios',
    description: 'Permite eliminar usuarios',
  },
  'users.assign_access': {
    name: 'Asignar acceso a usuarios',
    description: 'Permite asignar roles y permisos a usuarios',
  },

  'roles.create': {
    name: 'Crear roles',
    description: 'Permite crear nuevos roles',
  },
  'roles.read': {
    name: 'Ver roles',
    description: 'Permite ver la lista de roles',
  },
  'roles.update': {
    name: 'Actualizar roles',
    description: 'Permite modificar roles existentes',
  },
  'roles.delete': {
    name: 'Eliminar roles',
    description: 'Permite eliminar roles',
  },

  'permissions.create': {
    name: 'Crear permisos',
    description: 'Permite crear nuevos permisos',
  },
  'permissions.read': {
    name: 'Ver permisos',
    description: 'Permite ver la lista de permisos',
  },
  'permissions.update': {
    name: 'Actualizar permisos',
    description: 'Permite modificar permisos existentes',
  },
  'permissions.delete': {
    name: 'Eliminar permisos',
    description: 'Permite eliminar permisos',
  },

  'banners.create': {
    name: 'Crear banners',
    description: 'Permite crear nuevos banners publicitarios',
  },
  'banners.read': {
    name: 'Ver banners',
    description: 'Permite ver la lista de banners publicitarios',
  },
  'banners.update': {
    name: 'Actualizar banners',
    description: 'Permite modificar banners publicitarios existentes',
  },
  'banners.delete': {
    name: 'Eliminar banners',
    description: 'Permite eliminar banners publicitarios',
  },
} as const;
