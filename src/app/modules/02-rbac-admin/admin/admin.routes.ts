import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { permissionGuard } from '../../../core/guards/permission.guard';
import { PERMISSIONS } from '../../../core/constants/permissions';
import { AdminLayout } from '../../../layout/admin-layout/admin-layout';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    component: AdminLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'productos',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PRODUCTS.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'categorias',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CATEGORIES.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'marcas',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BRANDS.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'banners',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BANNERS.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ROLES.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'permisos',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PERMISSIONS.READ },
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },
    ],
  },
];

export default adminRoutes;
