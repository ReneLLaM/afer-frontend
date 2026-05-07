import { Routes } from "@angular/router";
import { ShopLayout } from "../../../layout/shop-layout/shop-layout";

export const ecommerceRoutes: Routes = [
  {
    path: '',
    component: ShopLayout,  
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/products/products').then(m => m.Products)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./pages/categories/categories').then(m => m.Categories)
      },
      {
        path: 'marcas',
        loadComponent: () => import('./pages/brands/brands').then(m => m.Brands)
      }

    ],
  },
  {
    path: '**',
    redirectTo: ''
  }
];

export default ecommerceRoutes;