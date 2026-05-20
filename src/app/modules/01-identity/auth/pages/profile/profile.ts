import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../store/auth.store';
import { User } from '../../interfaces';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly fb           = inject(NonNullableFormBuilder);
  private readonly authService  = inject(AuthService);
  readonly authStore            = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router       = inject(Router);
  private readonly destroyRef   = inject(DestroyRef);

  // Estados generales de la página
  isLoading = signal(true);
  loadError = signal('');

  // Modos de edición
  isEditingProfile  = signal(false);
  isEditingPassword = signal(false);

  // Estado de carga en peticiones
  isSavingProfile  = signal(false);
  isSavingPassword = signal(false);

  // Controladores de visibilidad de contraseñas
  showCurrentPassword = signal(false);
  showNewPassword     = signal(false);
  showConfirmPassword = signal(false);

  // Formulario de perfil
  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    gender: ['undefined'],
  });

  // Formulario de contraseña
  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [
      Validators.required, 
      Validators.minLength(6),
      Validators.maxLength(50),
      Validators.pattern(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
    ]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.authService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user: User) => {
          this.authStore.updateUser(user);
          this.resetProfileFormValues(user);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar perfil:', err);
          if (err.status === 429) {
            this.loadError.set('Demasiadas solicitudes. Por favor, intenta más tarde.');
          } else {
            this.loadError.set('No se pudo cargar la información de tu perfil. Inténtalo de nuevo.');
          }
          this.isLoading.set(false);
        }
      });
  }

  resetProfileFormValues(user: User): void {
    this.profileForm.patchValue({
      fullName: user.fullName,
      phone: user.phone || '',
      gender: user.gender || 'undefined',
    });
  }

  enableEditProfile(): void {
    const user = this.authStore.user();
    if (user) {
      this.resetProfileFormValues(user);
    }
    this.isEditingProfile.set(true);
    this.isEditingPassword.set(false); // Cierra el otro formulario
  }

  cancelEditProfile(): void {
    const user = this.authStore.user();
    if (user) {
      this.resetProfileFormValues(user);
    }
    this.isEditingProfile.set(false);
  }

  enableEditPassword(): void {
    this.passwordForm.reset();
    
    // Si el usuario no tiene contraseña registrada (ej. ingresó con Google), no solicitamos contraseña actual
    const hasPwd = this.authStore.user()?.hasPassword !== false;
    const currentPwdCtrl = this.passwordForm.get('currentPassword');
    
    if (currentPwdCtrl) {
      if (hasPwd) {
        currentPwdCtrl.setValidators([Validators.required]);
        currentPwdCtrl.setValue('');
      } else {
        currentPwdCtrl.clearValidators();
        currentPwdCtrl.setValue('google-auth-no-password'); // Dummy para satisfacer el IsNotEmpty() del DTO
      }
      currentPwdCtrl.updateValueAndValidity();
    }

    this.isEditingPassword.set(true);
    this.isEditingProfile.set(false); // Cierra el otro formulario
  }

  cancelEditPassword(): void {
    this.passwordForm.reset();
    this.isEditingPassword.set(false);
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid || this.isSavingProfile()) return;

    this.isSavingProfile.set(true);

    const formValues = this.profileForm.getRawValue();
    const updateData = {
      fullName: formValues.fullName.trim(),
      phone: formValues.phone ? formValues.phone.trim() : undefined,
      gender: formValues.gender,
    };

    this.authService.updateProfile(updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser: User) => {
          this.authStore.updateUser(updatedUser);
          this.isSavingProfile.set(false);
          this.isEditingProfile.set(false);
          this.toastService.success('Perfil Actualizado', 'Tus datos se guardaron correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al actualizar perfil:', err);
          this.isSavingProfile.set(false);
          let errorMsg = 'Ocurrió un error inesperado al actualizar tu perfil.';
          if (err.status === 429) {
            errorMsg = 'Demasiadas solicitudes. Por favor, espera un momento.';
          } else if (err.error?.message) {
            errorMsg = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }
          this.toastService.error('Error al Guardar', errorMsg);
        }
      });
  }

  onUpdatePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);

    const formValues = this.passwordForm.getRawValue();

    this.authService.updatePassword({
      currentPassword: formValues.currentPassword,
      newPassword: formValues.newPassword
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSavingPassword.set(false);
          this.isEditingPassword.set(false);
          
          // Actualizamos localmente el store para indicar que ya tiene contraseña
          const currentUser = this.authStore.user();
          if (currentUser) {
            this.authStore.updateUser({
              ...currentUser,
              hasPassword: true
            });
          }

          this.passwordForm.reset();
          const hasPwd = this.authStore.user()?.hasPassword !== false;
          this.toastService.success(
            hasPwd ? 'Contraseña Actualizada' : 'Contraseña Creada', 
            hasPwd ? 'Tu contraseña se cambió con éxito.' : 'Se configuró tu nueva contraseña con éxito.'
          );
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al actualizar contraseña:', err);
          this.isSavingPassword.set(false);
          let errorMsg = 'Ocurrió un error al actualizar tu contraseña.';
          
          if (err.status === 429) {
            errorMsg = 'Demasiadas solicitudes. Por favor, espera un momento.';
          } else if (err.status === 401 || err.status === 400) {
            if (err.error?.message) {
              const msg = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
              if (msg.toLowerCase().includes('current password') || msg.toLowerCase().includes('actual')) {
                errorMsg = 'La contraseña actual ingresada es incorrecta.';
              } else {
                errorMsg = msg;
              }
            } else {
              errorMsg = 'La contraseña actual es incorrecta o los datos no son válidos.';
            }
          } else if (err.error?.message) {
            errorMsg = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }

          this.toastService.error('Error de Contraseña', errorMsg);
        }
      });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmNewPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPassword(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getGenderLabel(gender: string | null | undefined): string {
    if (gender === 'male') return 'Masculino';
    if (gender === 'female') return 'Femenino';
    return 'Sin especificar';
  }

  onLogout(): void {
    this.authStore.logout();
    this.router.navigate(['/']);
  }
}
