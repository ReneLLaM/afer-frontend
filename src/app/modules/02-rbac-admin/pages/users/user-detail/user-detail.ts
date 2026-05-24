import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminUsersService } from '../../../services/admin-users.service';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import { AuthStore } from '../../../../01-identity/auth/store/auth.store';
import type {
  AdminUserDetail,
  AdminUserDirectPermission,
  AdminUserRolePermission,
  UserGender,
  UserStatus,
} from '../../../interfaces/admin-user.interface';

@Component({
  selector: 'user-detail-page',
  standalone: true,
  imports: [
    Breadcrumb,
    LocaleDatePipe,
    HasPermissionDirective,
    PermissionActionLabelPipe,
    PermissionModuleLabelPipe,
    RouterLink,
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminUsersService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly authStore = inject(AuthStore);

  readonly PERMISSIONS = PERMISSIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly user = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) {
          this.loading.set(false);
          this.error.set('Usuario no especificado');
          return of(null as AdminUserDetail | null);
        }

        this.loading.set(true);
        this.error.set(null);

        return this.service.findOne(id).pipe(
          map((user) => {
            this.loading.set(false);
            return user;
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el usuario');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as AdminUserDetail | null },
  );

  readonly rolesCount = computed(() => this.user()?.roles.length ?? 0);
  readonly permissionsCount = computed(() => this.user()?.permissions.length ?? 0);
  readonly canEdit = computed(() =>
    this.authStore.hasAnyPermission([PERMISSIONS.USERS.UPDATE, PERMISSIONS.USERS.ASSIGN_ACCESS]),
  );

  readonly rolePermissionGroups = computed(() =>
    (this.user()?.roles ?? []).map((role) => ({
      roleId: role.id,
      groups: this.groupPermissionsByModule(role.permissions),
    })),
  );

  readonly directPermissionGroups = computed(() =>
    this.groupPermissionsByModule(this.user()?.permissions ?? []),
  );

  readonly statusLabel: Record<UserStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    blocked: 'Bloqueado',
  };

  readonly genderLabel: Record<UserGender, string> = {
    male: 'Masculino',
    female: 'Femenino',
    undefined: 'No definido',
  };

  trackPermission = (_index: number, permission: { id: string; slug: string }): string =>
    permission.id || permission.slug;

  trackPermissionGroup = (_index: number, group: { module: string }): string => group.module;

  permissionDetailTerm(permission: AdminUserRolePermission | AdminUserDirectPermission): string {
    return permission.id || permission.slug;
  }

  private groupPermissionsByModule<T extends AdminUserRolePermission | AdminUserDirectPermission>(
    permissions: T[],
  ): Array<{ module: string; permissions: T[] }> {
    const grouped = new Map<string, T[]>();

    for (const permission of permissions) {
      const key = permission.module || 'otros';
      const current = grouped.get(key) ?? [];
      current.push(permission);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, items]) => ({
        module,
        permissions: [...items].sort((a, b) => {
          const byAction = a.action.localeCompare(b.action);
          return byAction !== 0 ? byAction : a.name.localeCompare(b.name);
        }),
      }));
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/usuarios'], {
      queryParamsHandling: 'preserve',
    });
  }

  editUser(): void {
    const user = this.user();
    if (!user || !!user.deletedAt || !this.canEdit()) return;

    this.router.navigate(['/admin/usuarios', user.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteUser(): void {
    const user = this.user();
    if (!user || !!user.deletedAt) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Usuario',
        message: `¿Estás seguro de eliminar al usuario "${user.fullName}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(user.id).subscribe({
          next: (result) => {
            this.toastService.success('Usuario eliminado', result.message);
            this.router.navigate(['/admin/usuarios'], { queryParamsHandling: 'preserve' });
          },
          error: (err) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo eliminar el usuario');
          },
        });
      });
  }
}
