import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/03-commerce/ecommerce/ecommerce.routes').then(m => m.default)
  },
  {
    path: '',
    loadChildren: () => import('./modules/02-rbac-admin/admin/admin.routes').then(m => m.default)
  },
  {
    path: '**',
    redirectTo: ''
  },
];
