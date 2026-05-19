import { Routes } from '@angular/router';
import { guestGuard } from '../../../core/guards/guest.guard';
import { authGuard } from '../../../core/guards/auth.guard';

/**
 * Auth Routes — Todas protegidas por guestGuard.
 *
 * guestGuard impide que un usuario YA autenticado acceda a estas rutas.
 * Si alguien logueado intenta ir a /login, es redirigido a / automáticamente.
 */
export const authRoutes: Routes = [
  // --- Spanish Routes ---
  {
    path: 'iniciar-sesion',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
    data: { breadcrumb: 'Iniciar Sesión' }
  },
  {
    path: 'registrarse',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterPage),
    data: { breadcrumb: 'Registrarse' }
  },
  {
    path: 'recuperar-contrasena',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPasswordPage),
    data: { breadcrumb: 'Recuperar Contraseña' }
  },
  {
    path: 'verificar-correo',
    loadComponent: () => import('./pages/verify-email/verify-email').then(m => m.VerifyEmailPage),
    data: { breadcrumb: 'Verificar Correo' }
  },
  {
    path: 'auth/restablecer-contrasena',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPasswordPage),
    data: { breadcrumb: 'Restablecer Contraseña' }
  },
  {
    path: 'auth/google-callback',
    loadComponent: () => import('./pages/google-callback/google-callback').then(m => m.GoogleCallbackPage),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePage),
    data: { breadcrumb: 'Mi Perfil' }
  },
  {
    path: 'mis-favoritos',
    canActivate: [authGuard],
    loadComponent: () => import('../../03-commerce/ecommerce/pages/mis-favoritos/mis-favoritos').then(m => m.MisFavoritosPage),
    data: { breadcrumb: 'Mis Favoritos' }
  },

  // --- Redirects for backward compatibility ---
  { path: 'login', redirectTo: 'iniciar-sesion', pathMatch: 'full' },
  { path: 'register', redirectTo: 'registrarse', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: 'recuperar-contrasena', pathMatch: 'full' },
  { path: 'verify-email', redirectTo: 'verificar-correo', pathMatch: 'full' },
  { path: 'auth/reset-password', redirectTo: 'auth/restablecer-contrasena', pathMatch: 'full' },
];

export default authRoutes;
