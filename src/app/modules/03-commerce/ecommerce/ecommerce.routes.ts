import { Routes } from '@angular/router';
import { ShopLayout } from '../../../layout/shop-layout/shop-layout';

export const ecommerceRoutes: Routes = [
  {
    path: '',
    component: ShopLayout,
    data: { breadcrumb: 'Inicio' },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
        pathMatch: 'full'
      },
      {
        path: '',
        loadChildren: () => import('../../01-identity/auth/auth.routes').then(m => m.default)
      },
      {
        path: 'productos',
        data: { breadcrumb: 'Productos' },
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/products-page/products-page/products-page').then((m) => m.ProductsPage),
          },
          {
            path: ':slug',
            loadComponent: () => import('./pages/products-page/product-detail-page/product-detail-page').then((m) => m.ProductDetailPage),
            data: { breadcrumb: 'Detalle Producto' },
          },
        ],
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
      {
        path: 'nuestros-servicios',
        loadComponent: () => import('./pages/nuestros-servicios-page/nuestros-servicios-page').then((m) => m.NuestrosServiciosPage),
        data: { breadcrumb: 'Nuestros Servicios' },
      },
      {
        path: 'preguntas-frecuentes',
        loadComponent: () => import('./pages/preguntas-frecuentes-page/preguntas-frecuentes-page').then((m) => m.PreguntasFrecuentesPage),
        data: { breadcrumb: 'Preguntas Frecuentes' },
      },
      {
        path: 'gift-card',
        loadComponent: () => import('./pages/gift-card-page/gift-card-page').then((m) => m.GiftCardPage),
        data: { breadcrumb: 'Gift Card' },
      },
      {
        path: 'acerca-de-nosotros',
        loadComponent: () => import('./pages/acerca-de-nosotros-page/acerca-de-nosotros-page').then((m) => m.AcercaDeNosotrosPage),
        data: { breadcrumb: 'Acerca de Nosotros' },
      },
      {
        path: 'mi-carrito',
        loadComponent: () => import('./pages/mi-carrito/mi-carrito').then((m) => m.MiCarritoPage),
        data: { breadcrumb: 'Mi Carrito' },
      },
    ],
  },
];

export default ecommerceRoutes;
