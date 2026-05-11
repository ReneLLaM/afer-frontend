import { Routes } from '@angular/router';
import { ShopLayout } from '../../../layout/shop-layout/shop-layout';

export const ecommerceRoutes: Routes = [
  {
    path: '',
    component: ShopLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
        data: { breadcrumb: 'Inicio' },
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/products-page/products-page/products-page').then((m) => m.ProductsPage),
        data: { breadcrumb: 'Productos' },
      },
      {
        path: 'productos/:slug',
        loadComponent: () => import('./pages/products-page/product-detail-page/product-detail-page').then((m) => m.ProductDetailPage),
        data: { breadcrumb: 'Detalle Producto' },
      },
      {
        path: 'categorias',
        loadComponent: () => import('./pages/categories-page/categories-page').then((m) => m.CategoriesPage),
        data: { breadcrumb: 'Categorías' },
      },
      {
        path: 'marcas',
        loadComponent: () => import('./pages/brands-page/brands-page').then((m) => m.BrandsPage),
        data: { breadcrumb: 'Marcas' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

export default ecommerceRoutes;
