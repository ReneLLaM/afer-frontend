import { Routes } from '@angular/router';
import { guestGuard } from '../../../core/guards/guest.guard';

/**
 * Auth Routes — Todas protegidas por guestGuard.
 *
 * guestGuard impide que un usuario YA autenticado acceda a estas rutas.
 * Si alguien logueado intenta ir a /login, es redirigido a / automáticamente.
 */
export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
    data: { breadcrumb: 'Iniciar Sesión' }
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterPage),
    data: { breadcrumb: 'Registrarse' }
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordPage),
    data: { breadcrumb: 'Recuperar Contraseña' }
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then(m => m.VerifyEmailPage),
    data: { breadcrumb: 'Verificar Email' }
  },
  {
    path: 'auth/google-callback',
    loadComponent: () => import('./pages/google-callback/google-callback').then(m => m.GoogleCallbackPage),
    // No necesita guard ni breadcrumb, es una página de transición
  },
];

export default authRoutes;
