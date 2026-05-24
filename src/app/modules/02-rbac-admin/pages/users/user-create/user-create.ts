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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, tap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { DateRangeField } from '../../../../../shared/material/date-range-field/date-range-field';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminUsersService } from '../../../services/admin-users.service';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import type { Permission } from '../../../interfaces/admin-permission.interface';
import type { UserGender } from '../../../interfaces/admin-user.interface';
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
  selector: 'user-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Breadcrumb,
    DateRangeField,
    PermissionActionLabelPipe,
    PermissionModuleLabelPipe,
  ],
  templateUrl: './user-create.html',
  styleUrl: './user-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly usersService = inject(AdminUsersService);
  private readonly rolesService = inject(AdminRolesService);
  private readonly permissionsService = inject(AdminPermissionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/),
      ],
    ],
    phone: ['', [Validators.maxLength(50)]],
    gender: ['' as UserGender | ''],
  });

  readonly loadingRoles = signal(true);
  readonly loadingPermissions = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly roles = signal<AdminRoleListItem[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly roleDetails = signal<Record<string, AdminRoleDetail | null>>({});
  readonly loadingRoleDetails = signal<Record<string, boolean>>({});
  readonly selectedRoles = signal<TimedRoleAssignment[]>([]);
  readonly selectedPermissions = signal<TimedPermissionAssignment[]>([]);

  readonly selectedCount = computed(() => this.selectedRoles().length);
  readonly selectedPermissionCount = computed(() => this.selectedPermissions().length);
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
    const map = new Map<string, Permission>();
    for (const permission of this.permissions()) {
      map.set(permission.slug, permission);
    }
    return map;
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

  constructor() {
    this.rolesService
      .findAll({ limit: ROLES_LIMIT, offset: 0, sortBy: 'name', order: 'ASC' })
      .pipe(
        tap((response) => {
          this.roles.set(response.data.filter((role) => !role.deletedAt));
          this.loadingRoles.set(false);
        }),
        catchError((err) => {
          this.loadError.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar los roles');
          this.loadingRoles.set(false);
          return of(EMPTY_ROLES_RESPONSE);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.permissionsService
      .findAll({ limit: PERMISSIONS_LIMIT, offset: 0, sortBy: 'module', order: 'ASC' })
      .pipe(
        tap((response) => {
          this.permissions.set(response.data);
          this.loadingPermissions.set(false);
        }),
        catchError((err) => {
          this.loadError.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar los permisos');
          this.loadingPermissions.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  toggleRole(id: string, checked: boolean): void {
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

  updateRoleDate(id: string, field: 'startsAt' | 'expiresAt', value: string): void {
    this.selectedRoles.set(
      this.selectedRoles().map((item) =>
        item.roleId === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  getRoleDate(id: string, field: 'startsAt' | 'expiresAt'): string {
    return this.selectedRoles().find((item) => item.roleId === id)?.[field] ?? '';
  }

  onRoleRangeChange(id: string, range: DateRangeValue): void {
    this.selectedRoles.set(
      this.selectedRoles().map((item) =>
        item.roleId === id
          ? { ...item, startsAt: range.start, expiresAt: range.end }
          : item,
      ),
    );
  }

  togglePermission(id: string, checked: boolean): void {
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

  updatePermissionDate(
    id: string,
    field: 'startsAt' | 'expiresAt',
    value: string,
  ): void {
    this.selectedPermissions.set(
      this.selectedPermissions().map((item) =>
        item.permissionId === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  getPermissionDate(id: string, field: 'startsAt' | 'expiresAt'): string {
    return this.selectedPermissions().find((item) => item.permissionId === id)?.[field] ?? '';
  }

  onPermissionRangeChange(id: string, range: DateRangeValue): void {
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

    this.router.navigate(['/admin/usuarios'], {
      queryParamsHandling: 'preserve',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);

    const payload = {
      fullName: this.form.controls.fullName.value.trim(),
      email: this.form.controls.email.value.trim().toLowerCase(),
      password: this.form.controls.password.value.trim(),
      phone: this.form.controls.phone.value.trim() || undefined,
      gender: this.form.controls.gender.value || undefined,
      roles:
        this.selectedRoles().length > 0
          ? this.selectedRoles().map((role) => ({
              roleId: role.roleId,
              startsAt: this.toPayloadDate(role.startsAt, 'start'),
              expiresAt: this.toPayloadDate(role.expiresAt, 'end'),
            }))
          : undefined,
      permissions:
        this.selectedPermissions().length > 0
          ? this.selectedPermissions().map((permission) => ({
              permissionId: permission.permissionId,
              startsAt: this.toPayloadDate(permission.startsAt, 'start'),
              expiresAt: this.toPayloadDate(permission.expiresAt, 'end'),
            }))
          : undefined,
    };

    this.usersService
      .create(payload)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          this.toastService.success('Usuario creado', `El usuario "${user.fullName}" fue creado correctamente.`);
          this.router.navigate(['/admin/usuarios', user.id]);
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo crear el usuario');
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

  private toPayloadDate(value: string, boundary: 'start' | 'end'): string | undefined {
    if (!value) return undefined;

    const suffix = boundary === 'start' ? 'T00:00:00' : 'T23:59:59';
    const date = new Date(`${value}${suffix}`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
}
