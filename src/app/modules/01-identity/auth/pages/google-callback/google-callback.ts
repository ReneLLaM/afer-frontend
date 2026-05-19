import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="google-callback-container">
      @if (errorMessage()) {
        <div class="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ errorMessage() }}</p>
          <button class="btn-return" (click)="returnToLogin()">Volver a Iniciar Sesión</button>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Completando inicio de sesión...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .google-callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
      width: 100%;
    }
    
    .loading-state, .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
      color: var(--afer-text-primary);
    }
    
    .error-message {
      color: var(--afer-corporate);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid color-mix(in srgb, var(--afer-primary), transparent 80%);
      border-radius: 50%;
      border-top-color: var(--afer-primary);
      animation: spin 1s ease-in-out infinite;
    }
    
    .btn-return {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--afer-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 0.9;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class GoogleCallbackPage implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly authStore  = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  // Mantenemos un mensaje de error explícito en lugar de un booleano genérico
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const code  = this.route.snapshot.queryParamMap.get('code');
    const error = this.route.snapshot.queryParamMap.get('error');

    // 1. Validaciones preventivas
    if (error) {
      this.errorMessage.set('Autenticación cancelada o rechazada por Google.');
      return;
    }

    if (!code) {
      this.errorMessage.set('No se recibió el código de autorización válido.');
      return;
    }

    // [MITIGACIÓN CSRF]: En una app empresarial estricta, el estado enviado
    // al backend previamente se valida aquí contra el query param 'state'.
    // const state = this.route.snapshot.queryParamMap.get('state');
    // if (state !== sessionStorage.getItem('oauth_state')) { ... }

    // 2. Limpieza de URL (Seguridad + UX)
    // Evita que el código de autorización quede expuesto en la barra de direcciones o 
    // que el usuario lo comparta accidentalmente al copiar la URL.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { code: null, error: null, scope: null, prompt: null, authuser: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    // 3. Ejecución del intercambio de código
    this.authStore.loginWithGoogle(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((success) => {
        if (success) {
          const returnUrl = sessionStorage.getItem('oauth_return_url') || '/';
          sessionStorage.removeItem('oauth_return_url');
          // 4. Navegación segura: replaceUrl evita volver a la pantalla de callback al presionar 'Atrás'
          this.router.navigateByUrl(returnUrl, { replaceUrl: true });
        } else {
          this.errorMessage.set('El enlace de autenticación ha expirado o es inválido. Intenta nuevamente.');
        }
      });
  }

  returnToLogin(): void {
    const returnUrl = sessionStorage.getItem('oauth_return_url');
    if (returnUrl) {
      this.router.navigate(['/iniciar-sesion'], { queryParams: { returnUrl }, replaceUrl: true });
    } else {
      this.router.navigate(['/iniciar-sesion'], { replaceUrl: true });
    }
  }
}
