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
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import type { PermissionSlug } from '../../../../../core/constants/permissions';
import type { Permission } from '../../../interfaces/admin-permission.interface';
import type { AdminRoleDetail } from '../../../interfaces/admin-role.interface';

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

const PERMISSIONS_LIMIT = 500;

@Component({
  selector: 'role-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Breadcrumb,
    PermissionModuleLabelPipe,
    PermissionActionLabelPipe,
  ],
  templateUrl: './role-edit.html',
  styleUrl: './role-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly rolesService = inject(AdminRolesService);
  private readonly permissionsService = inject(AdminPermissionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly selectedPermissionSlugs = signal<PermissionSlug[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly role = signal<AdminRoleDetail | null>(null);

  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, Permission[]>();

    for (const permission of this.permissions()) {
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }

    return Array.from(groups.entries()).map(([module, permissions]) => ({ module, permissions }));
  });

  readonly selectedCount = computed(() => this.selectedPermissionSlugs().length);
  readonly roleName = computed(() => this.role()?.name ?? 'Rol');
  readonly roleId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), { initialValue: null });
  readonly returnTo = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('returnTo'))), { initialValue: null });
  readonly isListReturn = computed(() => this.returnTo() === 'list');

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((id) => {
          if (!id) {
            this.loading.set(false);
            this.loadError.set('Rol no especificado');
            return of(null);
          }

          this.loading.set(true);
          this.loadError.set(null);

          return forkJoin({
            role: this.rolesService.findOne(id),
            permissions: this.permissionsService.findAll({
              limit: PERMISSIONS_LIMIT,
              offset: 0,
              sortBy: 'module',
              order: 'ASC',
            }),
          }).pipe(
            tap(({ role, permissions }) => {
              this.role.set(role);
              this.permissions.set(permissions.data);
              this.selectedPermissionSlugs.set(role.permissionSlugs);
              this.form.setValue({
                name: role.name,
                description: role.description ?? '',
              });
              this.loading.set(false);
            }),
            catchError((err) => {
              this.loadError.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar el rol');
              this.loading.set(false);
              return of(null);
            }),
          );
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
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    if (this.isListReturn()) {
      this.router.navigate(['/admin/roles'], { queryParamsHandling: 'preserve' });
      return;
    }

    const roleId = this.roleId();
    if (roleId) {
      this.router.navigate(['/admin/roles', roleId], { queryParamsHandling: 'preserve' });
      return;
    }

    this.router.navigate(['/admin/roles'], { queryParamsHandling: 'preserve' });
  }

  submit(): void {
    const currentRoleId = this.roleId();
    if (!currentRoleId) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);

    this.rolesService
      .update(currentRoleId, {
        name: this.form.controls.name.value.trim(),
        description: this.form.controls.description.value.trim(),
        permissionSlugs: this.selectedPermissionSlugs(),
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Rol actualizado', 'Los cambios del rol se guardaron correctamente.');

          if (this.isListReturn()) {
            this.router.navigate(['/admin/roles'], { queryParamsHandling: 'preserve' });
            return;
          }

          this.router.navigate(['/admin/roles', currentRoleId], { queryParamsHandling: 'preserve' });
        },
        error: (err) => {
          this.submitError.set(err?.error?.message ?? err?.message ?? 'No se pudo actualizar el rol');
        },
      });
  }
}
