import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/03-commerce/ecommerce/ecommerce.routes').then(m => m.default)
  },
  // Rutas protegidas — requieren autenticación
  // Cuando crees el módulo admin, descomenta y ajusta:
  // {
  //   path: 'admin',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./modules/02-admin/admin.routes').then(m => m.default),
  // },
];
