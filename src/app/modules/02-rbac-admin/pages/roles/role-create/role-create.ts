import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, tap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import type { PermissionSlug } from '../../../../../core/constants/permissions';
import type { Permission } from '../../../interfaces/admin-permission.interface';

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const PERMISSIONS_LIMIT = 500;

@Component({
  selector: 'role-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Breadcrumb,
    PermissionModuleLabelPipe,
    PermissionActionLabelPipe,
  ],
  templateUrl: './role-create.html',
  styleUrl: './role-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly rolesService = inject(AdminRolesService);
  private readonly permissionsService = inject(AdminPermissionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly loadingPermissions = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly selectedPermissionSlugs = signal<PermissionSlug[]>([]);
  readonly permissions = signal<Permission[]>([]);

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

  readonly selectedCount = computed(() => this.selectedPermissionSlugs().length);

  constructor() {
    this.permissionsService
      .findAll({
        limit: PERMISSIONS_LIMIT,
        offset: 0,
        sortBy: 'module',
        order: 'ASC',
      })
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

  togglePermission(slug: string, checked: boolean): void {
    const permissionSlug = slug as PermissionSlug;
    const next = new Set(this.selectedPermissionSlugs());
    if (checked) next.add(permissionSlug);
    else next.delete(permissionSlug);
    this.selectedPermissionSlugs.set(Array.from(next));
  }

  isSelected(slug: string): boolean {
    return this.selectedPermissionSlugs().includes(slug as PermissionSlug);
  }

  toggleModule(module: string, checked: boolean): void {
    const group = this.permissionGroups().find((item) => item.module === module);
    if (!group) return;

    const next = new Set(this.selectedPermissionSlugs());
    for (const permission of group.permissions) {
      const permissionSlug = permission.slug as PermissionSlug;
      if (checked) next.add(permissionSlug);
      else next.delete(permissionSlug);
    }
    this.selectedPermissionSlugs.set(Array.from(next));
  }

  isModuleSelected(module: string): boolean {
    const group = this.permissionGroups().find((item) => item.module === module);
    if (!group || group.permissions.length === 0) return false;
    return group.permissions.every((permission) => this.isSelected(permission.slug));
  }

  goBack(): void {
    this.router.navigate(['/admin/roles'], {
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
      name: this.form.controls.name.value.trim(),
      description: this.form.controls.description.value.trim(),
      permissionSlugs: this.selectedPermissionSlugs(),
    };

    this.rolesService
      .create(payload)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (role) => {
          this.toastService.success('Rol creado', `El rol "${role.name}" fue creado correctamente.`);
          this.router.navigate(['/admin/roles', role.id]);
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo crear el rol');
        },
      });
  }
}
