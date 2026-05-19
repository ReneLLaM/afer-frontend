import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthResponse, LoginCredentials, User } from '../interfaces';
import { FavoritesStore } from '../../../../core/stores/favorites.store';

// ─── Tipos ───────────────────────────────────────────────
export type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

// ─── Constante ───────────────────────────────────────────
const TOKEN_KEY = 'token';

/**
 * AuthStore — Estado global de autenticación con Angular Signals.
 *
 * Responsabilidades:
 * - Mantener el estado de autenticación (user, token, status)
 * - Persistir el token en localStorage via effect()
 * - Exponer signals readonly para componentes y guards
 * - Proveer métodos RBAC (hasPermission, hasAnyPermission)
 *
 * NO hace:
 * - Peticiones HTTP directas (eso es AuthService)
 * - Lógica de interceptor (eso es authInterceptor)
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService    = inject(AuthService);
  private readonly router         = inject(Router);
  private readonly favoritesStore = inject(FavoritesStore);

  // ─── Estado privado (writable) ──────────────────────────
  private readonly _authStatus = signal<AuthStatus>('checking');
  private readonly _user       = signal<User | null>(null);
  private readonly _token      = signal<string | null>(null);

  // ─── Estado público (readonly) ──────────────────────────
  readonly authStatus  = this._authStatus.asReadonly();
  readonly user        = this._user.asReadonly();
  readonly token       = this._token.asReadonly();

  // ─── Señales derivadas (computed) ───────────────────────
  readonly isAuthenticated = computed(() => this._authStatus() === 'authenticated');
  readonly permissions     = computed(() => this._user()?.permissions ?? []);
  readonly roles           = computed(() => this._user()?.roles ?? []);

  /**
   * rxResource: verifica la sesión automáticamente al iniciar la app.
   * Si hay token en localStorage → valida con el backend.
   * Si no hay token → marca como no autenticado sin hacer request.
   */
  readonly checkStatusResource = rxResource({
    stream: () => this._checkStatus(),
  });

  constructor() {
    // Persiste el token en localStorage cada vez que cambia
    effect(() => {
      const token = this._token();
      untracked(() => {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      });
    });
  }

  // ─── Acciones públicas ──────────────────────────────────

  /**
   * Login: envía credenciales al backend y actualiza el estado.
   * Retorna Observable<boolean> para que el componente sepa si tuvo éxito.
   */
  login(credentials: LoginCredentials): Observable<boolean> {
    return this.authService.login(credentials).pipe(
      tap((response) => this._setSession(response)),
      map(() => true),
      catchError((error) => {
        this._clearSession();
        return throwError(() => error);
      }),
    );
  }

  /**
   * Registro: envía datos al backend para crear cuenta y actualiza el estado.
   * Redirige al inicio (o a la pantalla de verificación).
   */
  register(data: import('../interfaces').RegisterData): Observable<boolean> {
    return this.authService.register(data).pipe(
      tap((response) => this._setSession(response)),
      map(() => true),
      catchError((error) => {
        this._clearSession();
        // Propagamos el error para que el componente pueda mostrar mensajes específicos
        return throwError(() => error);
      }),
    );
  }

  /**
   * Login con Google: intercambia el código de autorización por la sesión.
   */
  loginWithGoogle(code: string): Observable<boolean> {
    return this.authService.exchangeGoogleCode(code).pipe(
      tap((response) => this._setSession(response)),
      map(() => true),
      catchError(() => {
        this._clearSession();
        return of(false);
      }),
    );
  }

  /**
   * Obtiene la URL para iniciar el flujo de OAuth con Google.
   */
  getGoogleAuthUrl(): string {
    return this.authService.getGoogleAuthUrl();
  }

  /**
   * Logout: notifica al backend y limpia el estado local.
   * Incluso si el backend falla, la sesión local se limpia igualmente.
   */
  logout(): void {
    const currentUrl = this.router.url;
    this.authService.logout().subscribe({
      complete: () => {
        this._clearSession();
        this.router.navigateByUrl(currentUrl);
      },
      error: () => {
        this._clearSession();
        this.router.navigateByUrl(currentUrl);
      },
    });
  }

  /**
   * handleRefreshSuccess: llamado por el interceptor cuando el refresh token tiene éxito.
   * Actualiza el token y los datos del usuario sin redirigir.
   *
   * ¿Por qué es público?
   * El interceptor necesita actualizar el store cuando recibe nuevos tokens
   * del endpoint POST /auth/refresh. No podemos hacerlo privado.
   */
  handleRefreshSuccess(response: AuthResponse): void {
    this._setSession(response);
  }

  /**
   * forceLogout: llamado por el interceptor cuando el refresh token falla.
   * Limpia la sesión y redirige al login.
   *
   * ¿Por qué separado de logout()?
   * - logout() notifica al backend (request HTTP)
   * - forceLogout() NO hace request (el token ya es inválido)
   *   Si hiciéramos un request, obtendríamos otro 401 → loop infinito
   */
  forceLogout(): void {
    const currentUrl = this.router.url;
    this._clearSession();
    this.router.navigate(['/iniciar-sesion'], { queryParams: { returnUrl: currentUrl } });
  }

  // ─── RBAC helpers ───────────────────────────────────────

  /**
   * Verifica si el usuario tiene un permiso específico.
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos dados.
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.permissions();
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Actualiza el objeto de usuario en el estado.
   */
  updateUser(user: User): void {
    this._user.set(user);
  }

  // ─── Métodos internos ───────────────────────────────────

  private _checkStatus(): Observable<boolean> {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      this._authStatus.set('not-authenticated');
      return of(false);
    }

    this._token.set(token);

    return this.authService.checkStatus().pipe(
      tap((response) => this._setSession(response)),
      map(() => true),
      catchError(() => {
        this._clearSession();
        return of(false);
      }),
    );
  }

  private _setSession(response: AuthResponse): void {
    this._user.set(response.user);
    this._token.set(response.accessToken);
    this._authStatus.set('authenticated');
    // Carga los IDs de favoritos al autenticar (solo una vez)
    this.favoritesStore.loadIds();
  }

  private _clearSession(): void {
    this._user.set(null);
    this._token.set(null);
    this._authStatus.set('not-authenticated');
    // Limpiar favoritos al cerrar sesión
    this.favoritesStore.reset();
  }
}
