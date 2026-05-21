import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';

export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const requiredRole = route.data['role'] as string | string[] | undefined;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!authStore.hasAnyRole(roles)) {
      router.navigate(['/']);
      return false;
    }
    return true;
  }

  const requiredPermission = route.data['permission'] as string | string[] | undefined;
  const permissionMode = route.data['permissionMode'] as 'any' | 'all' | undefined;

  if (requiredPermission) {
    const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    if (permissionMode === 'all') {
      if (!authStore.hasAllPermissions(perms)) {
        router.navigate(['/']);
        return false;
      }
    } else {
      if (!authStore.hasAnyPermission(perms)) {
        router.navigate(['/']);
        return false;
      }
    }
  }

  return true;
};
