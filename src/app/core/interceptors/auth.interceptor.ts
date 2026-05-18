import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';
import { AuthService } from '../../modules/01-identity/auth/services/auth.service';

/**
 * Estado compartido entre todas las invocaciones del interceptor.
 *
 * ¿Por qué variables fuera de la función?
 * Las funciones interceptoras se llaman en cada request. Necesitamos estado
 * compartido para coordinar el refresh token entre requests concurrentes.
 *
 * isRefreshing: evita que múltiples 401 disparen múltiples refresh
 * refreshTokenSubject: cola de espera para requests que llegan durante el refresh
 */
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * authInterceptor — Adjunta Bearer token + maneja refresh automático.
 *
 * Flujo:
 * 1. Si hay token → adjunta Authorization: Bearer <token>
 * 2. Si el backend responde 401:
 *    a. Si NO estamos refrescando → llama POST /auth/refresh
 *    b. Si YA estamos refrescando → pone el request en cola
 *    c. Cuando el refresh termina → reintenta TODOS los requests en cola
 * 3. Si el refresh falla → limpia sesión (logout)
 *
 * ¿Por qué no usar retry()?
 * retry() reintentaría con el mismo token expirado.
 * Necesitamos esperar el nuevo token y luego reintentar.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore   = inject(AuthStore);
  const authService = inject(AuthService);

  // URLs que NO deben tener token ni refresh logic
  const isAuthUrl = req.url.includes('/auth/login')
                 || req.url.includes('/auth/register')
                 || req.url.includes('/auth/refresh');

  // Paso 1: Adjuntar token (si existe y no es ruta de auth)
  const authReq = addToken(req, authStore.token());

  return next(authReq).pipe(
    catchError((error) => {
      // Solo interceptamos errores 401 en rutas que no son de auth
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthUrl) {
        return handle401(authReq, next, authStore, authService);
      }
      return throwError(() => error);
    }),
  );
};

/**
 * Clona el request y adjunta el Bearer token si existe.
 */
function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Maneja un error 401 intentando refrescar el token.
 *
 * Escenario A: Primer 401 (isRefreshing === false)
 * → Llama POST /auth/refresh
 * → Si éxito: actualiza el store, reintenta el request original
 * → Si falla: limpia sesión
 *
 * Escenario B: 401 mientras ya estamos refrescando (isRefreshing === true)
 * → El request espera en cola (refreshTokenSubject)
 * → Cuando el refresh termina, refreshTokenSubject emite el nuevo token
 * → Todos los requests en cola se reintentan con el nuevo token
 */
function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: AuthStore,
  authService: AuthService,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null); // Bloquea la cola

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        // Actualiza el store con los nuevos datos
        authStore.handleRefreshSuccess(response);
        // Desbloquea la cola: todos los requests esperando recibirán el nuevo token
        refreshTokenSubject.next(response.accessToken);
        // Reintenta el request original con el nuevo token
        return next(addToken(req, response.accessToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        // El refresh falló → la sesión expiró completamente
        authStore.forceLogout();
        return throwError(() => err);
      }),
    );
  }

  // Ya estamos refrescando → poner este request en cola
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null), // Espera hasta que haya un token nuevo
    take(1), // Solo toma el primer token emitido
    switchMap((token) => next(addToken(req, token))), // Reintenta con el nuevo token
  );
}
