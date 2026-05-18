import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
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
      @if (hasError()) {
        <div class="error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Error en la autenticación con Google.</p>
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
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  hasError = signal(false);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error || !code) {
      this.hasError.set(true);
      return;
    }

    this.authStore.loginWithGoogle(code).subscribe((success) => {
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.hasError.set(true);
      }
    });
  }

  returnToLogin(): void {
    this.router.navigate(['/login']);
  }
}
