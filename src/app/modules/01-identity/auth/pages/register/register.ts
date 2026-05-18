import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb        = inject(FormBuilder);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);

  hasError     = signal(false);
  errorMessage = signal('');
  isPosting    = signal(false);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: any) {
    return g.get('password').value === g.get('confirmPassword').value
      ? null : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);

    const { fullName, email, password } = this.registerForm.getRawValue();

    this.authStore
      .register({ fullName: fullName!, email: email!, password: password! })
      .subscribe({
        next: () => {
          this.isPosting.set(false);
          // Al registrarse, el backend devuelve el token pero requiere validación
          // de email. Redirigimos a verify-email.
          this.router.navigate(['/verify-email']);
        },
        error: (err) => {
          this.isPosting.set(false);
          this.hasError.set(true);
          // Extraer mensaje del backend si existe
          const msg = err?.error?.message || 'Error al crear la cuenta.';
          this.errorMessage.set(msg);
        }
      });
  }

  onGoogleLogin(): void {
    window.location.href = this.authStore.getGoogleAuthUrl();
  }
}
