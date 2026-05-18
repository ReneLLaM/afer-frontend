import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'verify-email-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore   = inject(AuthStore);

  isPosting      = signal(false);
  isResending    = signal(false);
  hasError       = signal(false);
  hasSuccess     = signal(false);
  message        = signal('');
  userEmail      = signal<string | null>(null);

  // Lógica de límite (2 veces por minuto)
  resendAttempts = signal<number[]>([]);
  resendCooldown = signal(0);
  private cooldownInterval: any;

  verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit() {
    const user = this.authStore.user();
    if (user && !user.emailVerified) {
      this.userEmail.set(user.email);
    }
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isPosting.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    const code = this.verifyForm.getRawValue().code!;

    this.authService.verifyEmail(code).subscribe({
      next: (res) => {
        this.isPosting.set(false);
        this.hasSuccess.set(true);
        this.message.set(res.message);
        
        this.authStore.checkStatusResource.reload();
        
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => {
        this.isPosting.set(false);
        this.hasError.set(true);
        this.message.set(err?.error?.message || 'Error al verificar el código.');
      }
    });
  }

  onResendCode(): void {
    if (this.resendCooldown() > 0) return;

    const email = this.userEmail();
    if (!email) {
      this.hasError.set(true);
      this.message.set('No se encontró el correo en sesión. Inicia sesión primero.');
      return;
    }

    const now = Date.now();
    let attempts = this.resendAttempts();
    
    // Limpiar intentos más viejos de 60 segundos
    attempts = attempts.filter(time => now - time < 60000);
    
    attempts.push(now);
    this.resendAttempts.set(attempts);

    // Si llegó al límite (2 intentos), iniciar el cooldown visual
    if (attempts.length >= 2) {
      const remainingTime = 60000 - (now - attempts[0]);
      this.resendCooldown.set(Math.ceil(remainingTime / 1000));
      
      this.cooldownInterval = setInterval(() => {
        const current = this.resendCooldown();
        if (current <= 1) {
          clearInterval(this.cooldownInterval);
          this.resendCooldown.set(0);
          this.resendAttempts.set([]); // Reset visual
        } else {
          this.resendCooldown.set(current - 1);
        }
      }, 1000);
    }

    this.isResending.set(true);
    this.hasError.set(false);
    this.hasSuccess.set(false);

    this.authService.resendVerificationEmail(email).subscribe({
      next: (res) => {
        this.isResending.set(false);
        this.hasSuccess.set(true);
        this.message.set(res.message);
      },
      error: (err) => {
        this.isResending.set(false);
        this.hasError.set(true);
        
        // Si el backend lanza error 429 por throttle, actualizar mensaje
        if (err.status === 429) {
          this.message.set('Has excedido el límite de intentos. Espera un momento.');
        } else {
          this.message.set(err?.error?.message || 'Error al reenviar el código.');
        }
      }
    });
  }
}
