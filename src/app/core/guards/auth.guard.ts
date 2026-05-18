import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthStore, AuthStatus } from '../../modules/01-identity/auth/store/auth.store';

/**
 * authGuard — Protege rutas que requieren autenticación.
 *
 * Flujo:
 * 1. Espera a que el AuthStore termine de verificar ('checking').
 * 2. Si el usuario ESTÁ autenticado → permite acceso (return true)
 * 3. Si el usuario NO está autenticado → redirige a /login
 */
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router    = inject(Router);

  return toObservable(authStore.authStatus).pipe(
    filter((status: AuthStatus) => status !== 'checking'),
    map((status: AuthStatus) => {
      if (status === 'authenticated') {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
