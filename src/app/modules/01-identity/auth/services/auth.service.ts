import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AuthResponse, LoginCredentials } from '../interfaces';

/**
 * AuthService — SOLO responsable de las peticiones HTTP al backend.
 *
 * ¿Por qué separar HTTP del estado?
 * 1. Single Responsibility: Este servicio no sabe nada de signals, localStorage, ni routing.
 * 2. Testeable: Puedes mockear HttpClient sin preocuparte del estado global.
 * 3. Reutilizable: Cualquier Store o componente puede consumir estos métodos.
 *
 * El AuthStore es quien consume estas respuestas y actualiza el estado.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = environment.baseUrl;

  /**
   * POST /auth/login
   * El interceptor NO agrega token aquí (no hay sesión aún).
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  /**
   * GET /auth/check-status
   * El interceptor agrega el Bearer token automáticamente.
   * El backend valida el JWT, genera nuevos tokens, y devuelve el usuario actualizado.
   */
  checkStatus(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.baseUrl}/auth/check-status`);
  }

  /**
   * POST /auth/refresh
   * El refreshToken viaja en la cookie httpOnly (el navegador la envía automáticamente).
   * No necesitamos enviar nada en el body ni en headers.
   * withCredentials: true permite que el navegador envíe la cookie al backend.
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {}, {
      withCredentials: true,
    });
  }

  /**
   * POST /auth/logout
   * El interceptor agrega el Bearer token.
   * El backend invalida el refreshToken hasheado en la DB.
   */
  logout(): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/auth/logout`, {});
  }

  /**
   * POST /auth/google/exchange
   * Envía el código temporal generado por el backend después del redirect de Google
   * para obtener los tokens de sesión.
   */
  exchangeGoogleCode(code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/google/exchange`, { code }, {
      withCredentials: true, // Importante para que el backend setee la cookie de refresh
    });
  }

  /**
   * Helper para obtener la URL de login con Google (redirección).
   */
  getGoogleAuthUrl(): string {
    return `${this.baseUrl}/auth/google`;
  }

  /**
   * POST /auth/register
   * Crea una nueva cuenta de usuario. Retorna AuthResponse, pero la cuenta
   * estará con emailVerified: false.
   */
  register(data: import('../interfaces').RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data);
  }

  /**
   * GET /auth/verify-email
   * Envía el código de verificación al backend para validar el correo.
   */
  verifyEmail(code: string): Observable<{ ok: boolean; message: string }> {
    return this.http.get<{ ok: boolean; message: string }>(`${this.baseUrl}/auth/verify-email`, {
      params: { code }
    });
  }

  /**
   * POST /auth/resend-verification
   * Solicita que se reenvíe el código de verificación al correo.
   */
  resendVerificationEmail(email: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/auth/resend-verification`, { email });
  }

  /**
   * POST /auth/forgot-password
   * Solicita un enlace de recuperación de contraseña.
   */
  forgotPassword(email: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  /**
   * POST /auth/reset-password
   * Restablece la contraseña utilizando el token recibido por correo.
   */
  resetPassword(token: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.baseUrl}/auth/reset-password`, { token, password });
  }
}