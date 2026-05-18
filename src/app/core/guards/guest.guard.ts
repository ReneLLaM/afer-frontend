import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthStore, AuthStatus } from '../../modules/01-identity/auth/store/auth.store';

/**
 * guestGuard — Protege rutas que SOLO deben ver usuarios NO autenticados.
 *
 * Flujo:
 * 1. Espera a que el AuthStore termine de verificar ('checking').
 * 2. Si el usuario NO está autenticado → permite acceso (return true)
 * 3. Si el usuario YA está autenticado → redirige a / (home)
 */
export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router    = inject(Router);

  return toObservable(authStore.authStatus).pipe(
    filter((status: AuthStatus) => status !== 'checking'),
    map((status: AuthStatus) => {
      if (status === 'authenticated') {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};
