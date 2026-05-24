import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PERMISSIONS } from '../../core/constants/permissions';
import { ALL_ADMIN_PERMISSIONS } from '../../core/constants/admin-nav.config';
import { AdminLayout } from '../../layout/admin-layout/admin-layout';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    component: AdminLayout,
    data: { breadcrumb: 'Admin' },
    children: [
      {
        path: '',
        canActivate: [permissionGuard],
        data: { permission: ALL_ADMIN_PERMISSIONS, breadcrumb: 'Dashboard' },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'productos',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PRODUCTS.READ, breadcrumb: 'Productos' },
        loadComponent: () => import('./pages/products-admin/products-admin').then(m => m.ProductsAdminPage),
      },
      {
        path: 'categorias',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CATEGORIES.READ, breadcrumb: 'Categorías' },
        loadComponent: () => import('./pages/categories-admin/categories-admin').then(m => m.CategoriesAdminPage),
      },
      {
        path: 'marcas',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BRANDS.READ, breadcrumb: 'Marcas' },
        loadComponent: () => import('./pages/brands-admin/brands-admin').then(m => m.BrandsAdminPage),
      },
      {
        path: 'banners',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BANNERS.READ, breadcrumb: 'Banners' },
        loadComponent: () => import('./pages/banners-admin/banners-admin').then(m => m.BannersAdminPage),
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.READ, breadcrumb: 'Usuarios' },
        loadComponent: () => import('./pages/users/users').then(m => m.UsersPage),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ROLES.READ, breadcrumb: 'Roles' },
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/roles/role-page/roles').then(m => m.RolesPage),
          },
          {
            path: 'crear',
            canActivate: [permissionGuard],
            data: { permission: PERMISSIONS.ROLES.CREATE, breadcrumb: 'Crear' },
            loadComponent: () => import('./pages/roles/role-create/role-create').then(m => m.RoleCreatePage),
          },
          {
            path: ':id/editar',
            canActivate: [permissionGuard],
            data: { permission: PERMISSIONS.ROLES.UPDATE, breadcrumb: 'Editar' },
            loadComponent: () => import('./pages/roles/role-edit/role-edit').then(m => m.RoleEditPage),
          },
          {
            path: ':id',
            data: { breadcrumb: 'Detalle' },
            loadComponent: () => import('./pages/roles/role-detail/role-detail').then(m => m.RoleDetailPage),
          },
        ],
      },
      {
        path: 'permisos',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PERMISSIONS.READ, breadcrumb: 'Permisos' },
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/permissions/permissions-page/permissions').then(m => m.PermissionsPage),
          },
          {
            path: ':term',
            data: { breadcrumb: 'Detalle' },
            loadComponent: () =>
              import('./pages/permissions/permission-detail/permission-detail').then(m => m.PermissionDetailPage),
          },
        ],
      },
    ],
  },
];

export default adminRoutes;
