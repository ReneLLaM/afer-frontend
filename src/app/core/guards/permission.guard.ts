import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';

/**
 * permissionGuard — Protege rutas basadas en permisos (RBAC).
 *
 * Uso en routes:
 *   { 
 *     path: 'products/create', 
 *     canActivate: [permissionGuard],
 *     data: { permission: 'products.create' }
 *   }
 *
 * Flujo:
 * 1. Lee el permiso requerido de los datos de la ruta.
 * 2. Si no se especifica permiso, permite el acceso (fallback seguro o error de dev, aquí permitimos pero idealmente es error).
 * 3. Verifica si el usuario tiene el permiso en el AuthStore.
 * 4. Si tiene el permiso → permite acceso.
 * 5. Si no tiene → redirige a una página de "No autorizado" o al dashboard.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Obtener el permiso requerido de la configuración de la ruta
  const requiredPermission = route.data['permission'] as string | undefined;

  // Si la ruta no define un permiso, podríamos bloquear o permitir.
  // Es mejor permitir y que sea responsabilidad del desarrollador poner el data.permission.
  if (!requiredPermission) {
    return true;
  }

  if (authStore.hasPermission(requiredPermission)) {
    return true;
  }

  // Redirigir a una página de acceso denegado o al inicio
  // TODO: Crear una página /403 o similar
  router.navigate(['/']);
  return false;
};
