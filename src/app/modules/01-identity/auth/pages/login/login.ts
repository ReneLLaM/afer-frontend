import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb         = inject(NonNullableFormBuilder);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly authStore  = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  hasError     = signal(false);
  errorMessage = signal('');
  isPosting    = signal(false);
  showPassword = signal(false);
  readonly returnUrl = signal<string | null>(null);

  constructor() {
    this.returnUrl.set(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);

    const { email, password } = this.loginForm.getRawValue();

    this.authStore
      .login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isPosting.set(false);
          const target = this.returnUrl() || '/';
          if (target === '/' && this.authStore.permissions().length > 0) {
            this.router.navigateByUrl('/admin');
          } else {
            this.router.navigateByUrl(target);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isPosting.set(false);
          this.hasError.set(true);

          if (err.status === 429) {
            this.errorMessage.set('Has excedido el límite de intentos de inicio de sesión. Por favor, espera un momento.');
          } else {
            this.errorMessage.set(err?.error?.message || 'Email o contraseña incorrectos.');
          }

          setTimeout(() => this.hasError.set(false), 5000);
        }
      });
  }

  onGoogleLogin(): void {
    const target = this.returnUrl();
    if (target) {
      sessionStorage.setItem('oauth_return_url', target);
    } else {
      sessionStorage.removeItem('oauth_return_url');
    }
    window.location.href = this.authStore.getGoogleAuthUrl();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
