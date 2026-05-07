import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/03-commerce/ecommerce/ecommerce.routes').then(m => m.default)
  }
];
