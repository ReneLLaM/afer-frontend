import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { DateRangeField } from '../../../../../shared/material/date-range-field/date-range-field';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminUsersService } from '../../../services/admin-users.service';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AuthStore } from '../../../../01-identity/auth/store/auth.store';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import type { Permission } from '../../../interfaces/admin-permission.interface';
import type {
  AdminUserDetail,
  UpdateAdminUserAccessDto,
  UpdateAdminUserDto,
  UserGender,
  UserStatus,
} from '../../../interfaces/admin-user.interface';
import type {
  AdminRoleDetail,
  AdminRoleListItem,
  AdminRolesResponse,
} from '../../../interfaces/admin-role.interface';
import type { DateRangeValue } from '../../../../../shared/material/date-range-field/date-range-field';

const ROLES_LIMIT = 200;
const PERMISSIONS_LIMIT = 400;
const EMPTY_ROLES_RESPONSE: AdminRolesResponse = {
  data: [],
  meta: { total: 0, limit: ROLES_LIMIT, offset: 0, page: 1, totalPages: 1 },
};

interface TimedRoleAssignment {
  roleId: string;
  startsAt: string;
  expiresAt: string;
}

interface TimedPermissionAssignment {
  permissionId: string;
  startsAt: string;
  expiresAt: string;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

interface SelectedRoleConfig extends TimedRoleAssignment {
  role: AdminRoleListItem | null;
  detail: AdminRoleDetail | null;
  permissionGroups: PermissionGroup[];
}

@Component({
  selector: 'user-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Breadcrumb,
    DateRangeField,
    PermissionActionLabelPipe,
    PermissionModuleLabelPipe,
    HasPermissionDirective,
  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly usersService = inject(AdminUsersService);
  private readonly rolesService = inject(AdminRolesService);
  private readonly permissionsService = inject(AdminPermissionsService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly PERMISSIONS = PERMISSIONS;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.maxLength(50)]],
    gender: ['' as UserGender | ''],
    status: ['active' as UserStatus],
  });

  readonly loading = signal(true);
  readonly loadingRoles = signal(true);
  readonly loadingPermissions = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly user = signal<AdminUserDetail | null>(null);
  readonly roles = signal<AdminRoleListItem[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly roleDetails = signal<Record<string, AdminRoleDetail | null>>({});
  readonly loadingRoleDetails = signal<Record<string, boolean>>({});
  readonly selectedRoles = signal<TimedRoleAssignment[]>([]);
  readonly selectedPermissions = signal<TimedPermissionAssignment[]>([]);

  readonly userId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });
  readonly canUpdate = computed(() => this.authStore.hasPermission(PERMISSIONS.USERS.UPDATE));
  readonly canAssignAccess = computed(() =>
    this.authStore.hasPermission(PERMISSIONS.USERS.ASSIGN_ACCESS),
  );
  readonly selectedCount = computed(() => this.selectedRoles().length);
  readonly selectedPermissionCount = computed(() => this.selectedPermissions().length);
  readonly userName = computed(() => this.user()?.fullName ?? 'Usuario');
  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, Permission[]>();

    for (const permission of this.permissions()) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }

    return Array.from(groups.entries()).map(([module, permissions]) => ({
      module,
      permissions,
    }));
  });

  readonly permissionsBySlug = computed(() => {
    const mapBySlug = new Map<string, Permission>();
    for (const permission of this.permissions()) {
      mapBySlug.set(permission.slug, permission);
    }
    return mapBySlug;
  });

  readonly selectedRoleConfigs = computed<SelectedRoleConfig[]>(() =>
    this.selectedRoles().map((selectedRole) => {
      const role = this.roles().find((item) => item.id === selectedRole.roleId) ?? null;
      const detail = this.roleDetails()[selectedRole.roleId] ?? null;
      const permissionGroups = detail
        ? this.groupPermissions(
            detail.permissionSlugs
              .map((slug) => this.permissionsBySlug().get(slug))
              .filter((permission): permission is Permission => !!permission),
          )
        : [];

      return {
        ...selectedRole,
        role,
        detail,
        permissionGroups,
      };
    }),
  );

  readonly genderOptions: Array<{ value: UserGender; label: string }> = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'undefined', label: 'No definido' },
  ];
  readonly statusOptions: Array<{ value: UserStatus; label: string }> = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'blocked', label: 'Bloqueado' },
  ];

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((id) => {
          if (!id) {
            this.loading.set(false);
            this.loadingRoles.set(false);
            this.loadingPermissions.set(false);
            this.loadError.set('Usuario no especificado');
            return of(null);
          }

          this.loading.set(true);
          this.loadingRoles.set(true);
          this.loadingPermissions.set(true);
          this.loadError.set(null);

          return forkJoin({
            user: this.usersService.findOne(id),
            roles: this.rolesService.findAll({
              limit: ROLES_LIMIT,
              offset: 0,
              sortBy: 'name',
              order: 'ASC',
            }),
            permissions: this.permissionsService.findAll({
              limit: PERMISSIONS_LIMIT,
              offset: 0,
              sortBy: 'module',
              order: 'ASC',
            }),
          }).pipe(
            map(({ user, roles, permissions }) => {
              this.user.set(user);
              this.roles.set(roles.data.filter((role) => !role.deletedAt));
              this.permissions.set(permissions.data);
              this.form.setValue({
                fullName: user.fullName,
                email: user.email,
                phone: user.phone ?? '',
                gender: user.gender ?? '',
                status: user.status,
              });

              this.selectedRoles.set(
                user.roles.map((role) => ({
                  roleId: role.id,
                  startsAt: this.fromApiDate(role.assignedAt),
                  expiresAt: this.fromApiDate(role.expiresAt),
                })),
              );
              this.selectedPermissions.set(
                user.permissions.map((permission) => ({
                  permissionId: permission.id,
                  startsAt: this.fromApiDate(permission.grantedAt),
                  expiresAt: this.fromApiDate(permission.expiresAt),
                })),
              );

              for (const role of user.roles) {
                this.loadRoleDetail(role.id);
              }

              if (!this.canUpdate()) {
                this.form.disable({ emitEvent: false });
              }

              this.loading.set(false);
              this.loadingRoles.set(false);
              this.loadingPermissions.set(false);
              return user;
            }),
            catchError((err) => {
              this.loadError.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar el usuario');
              this.loading.set(false);
              this.loadingRoles.set(false);
              this.loadingPermissions.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  toggleRole(id: string, checked: boolean): void {
    if (!this.canAssignAccess()) return;

    const next = [...this.selectedRoles()];
    const index = next.findIndex((item) => item.roleId === id);

    if (checked && index === -1) {
      next.push({ roleId: id, startsAt: '', expiresAt: '' });
      this.loadRoleDetail(id);
    }

    if (!checked && index >= 0) {
      next.splice(index, 1);
    }

    this.selectedRoles.set(next);
  }

  isSelected(id: string): boolean {
    return this.selectedRoles().some((item) => item.roleId === id);
  }

  getRoleDate(id: string, field: 'startsAt' | 'expiresAt'): string {
    return this.selectedRoles().find((item) => item.roleId === id)?.[field] ?? '';
  }

  onRoleRangeChange(id: string, range: DateRangeValue): void {
    if (!this.canAssignAccess()) return;

    this.selectedRoles.set(
      this.selectedRoles().map((item) =>
        item.roleId === id ? { ...item, startsAt: range.start, expiresAt: range.end } : item,
      ),
    );
  }

  togglePermission(id: string, checked: boolean): void {
    if (!this.canAssignAccess()) return;

    const next = [...this.selectedPermissions()];
    const index = next.findIndex((item) => item.permissionId === id);

    if (checked && index === -1) {
      next.push({ permissionId: id, startsAt: '', expiresAt: '' });
    }

    if (!checked && index >= 0) {
      next.splice(index, 1);
    }

    this.selectedPermissions.set(next);
  }

  isPermissionSelected(id: string): boolean {
    return this.selectedPermissions().some((item) => item.permissionId === id);
  }

  getPermissionDate(id: string, field: 'startsAt' | 'expiresAt'): string {
    return this.selectedPermissions().find((item) => item.permissionId === id)?.[field] ?? '';
  }

  onPermissionRangeChange(id: string, range: DateRangeValue): void {
    if (!this.canAssignAccess()) return;

    this.selectedPermissions.set(
      this.selectedPermissions().map((item) =>
        item.permissionId === id
          ? { ...item, startsAt: range.start, expiresAt: range.end }
          : item,
      ),
    );
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    const userId = this.userId();
    if (userId) {
      this.router.navigate(['/admin/usuarios', userId], {
        queryParamsHandling: 'preserve',
      });
      return;
    }

    this.router.navigate(['/admin/usuarios'], {
      queryParamsHandling: 'preserve',
    });
  }

  submit(): void {
    const currentUserId = this.userId();
    if (!currentUserId) return;

    if (!this.canUpdate() && !this.canAssignAccess()) {
      this.submitError.set('No tienes permisos para actualizar este usuario.');
      return;
    }

    if (this.canUpdate() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);

    const profilePayload: UpdateAdminUserDto = {
      fullName: this.form.controls.fullName.value.trim(),
      email: this.form.controls.email.value.trim().toLowerCase(),
      phone: this.form.controls.phone.value.trim() || undefined,
      gender: this.form.controls.gender.value || undefined,
      status: this.form.controls.status.value,
    };

    const accessPayload: UpdateAdminUserAccessDto = {
      roles: this.selectedRoles().map((role) => ({
        roleId: role.roleId,
        startsAt: this.toPayloadDate(role.startsAt, 'start'),
        expiresAt: this.toPayloadDate(role.expiresAt, 'end'),
      })),
      permissions: this.selectedPermissions().map((permission) => ({
        permissionId: permission.permissionId,
        startsAt: this.toPayloadDate(permission.startsAt, 'start'),
        expiresAt: this.toPayloadDate(permission.expiresAt, 'end'),
      })),
    };

    let request$ = of(this.user());

    if (this.canUpdate()) {
      request$ = request$.pipe(
        switchMap(() => this.usersService.update(currentUserId, profilePayload)),
      );
    }

    if (this.canAssignAccess()) {
      request$ = request$.pipe(
        switchMap(() => this.usersService.updateAccess(currentUserId, accessPayload)),
      );
    }

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          this.toastService.success(
            'Usuario actualizado',
            `Los cambios de "${user?.fullName ?? this.userName()}" se guardaron correctamente.`,
          );
          this.router.navigate(['/admin/usuarios', currentUserId], {
            queryParamsHandling: 'preserve',
          });
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo actualizar el usuario');
        },
      });
  }

  private loadRoleDetail(roleId: string): void {
    if (this.roleDetails()[roleId] || this.loadingRoleDetails()[roleId]) return;

    this.loadingRoleDetails.set({
      ...this.loadingRoleDetails(),
      [roleId]: true,
    });

    this.rolesService
      .findOne(roleId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingRoleDetails.set({
            ...this.loadingRoleDetails(),
            [roleId]: false,
          });
        }),
      )
      .subscribe({
        next: (detail) => {
          this.roleDetails.set({
            ...this.roleDetails(),
            [roleId]: detail,
          });
        },
        error: () => {
          this.toastService.warning(
            'Rol no cargado',
            'No se pudieron cargar los permisos del rol seleccionado.',
          );
        },
      });
  }

  private groupPermissions(permissions: Permission[]): PermissionGroup[] {
    const groups = new Map<string, Permission[]>();

    for (const permission of permissions) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, items]) => ({
        module,
        permissions: [...items].sort((a, b) => {
          const byAction = a.action.localeCompare(b.action);
          return byAction !== 0 ? byAction : a.name.localeCompare(b.name);
        }),
      }));
  }

  private fromApiDate(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  private toPayloadDate(value: string, boundary: 'start' | 'end'): string | undefined {
    if (!value) return undefined;

    const suffix = boundary === 'start' ? 'T00:00:00' : 'T23:59:59';
    const date = new Date(`${value}${suffix}`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
}
