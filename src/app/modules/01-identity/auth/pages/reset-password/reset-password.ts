import { Component, inject, signal, OnInit, OnDestroy, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit, OnDestroy {
  private readonly fb          = inject(NonNullableFormBuilder);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef  = inject(DestroyRef);

  isPosting           = signal(false);
  hasError            = signal(false);
  hasSuccess          = signal(false);
  message             = signal('');
  token               = signal<string | null>(null);
  showPassword        = signal(false);
  showConfirmPassword = signal(false);

  private redirectTimeout?: ReturnType<typeof setTimeout>;

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.hasError.set(true);
      this.message.set('Token de recuperación no válido o ausente.');
      return;
    }
    this.token.set(token);
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const currentToken = this.token();
    if (!currentToken) {
      this.hasError.set(true);
      this.message.set('No se puede procesar la solicitud sin un token válido.');
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    const { password } = this.resetForm.getRawValue();

    this.authService.resetPassword(currentToken, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isPosting.set(false);
          this.hasSuccess.set(true);
          this.message.set(res.message || 'Tu contraseña ha sido restablecida con éxito.');
          
          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/iniciar-sesion']);
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          this.isPosting.set(false);
          this.hasError.set(true);

          if (err.status === 429) {
            this.message.set('Has excedido el límite de solicitudes para restablecer tu contraseña. Por favor, espera un momento.');
          } else {
            this.message.set(err?.error?.message || 'Error al restablecer la contraseña. El enlace podría haber expirado.');
          }
        }
      });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }
}
