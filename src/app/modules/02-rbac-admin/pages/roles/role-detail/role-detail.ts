import { Location } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, map } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AdminRolesService } from '../../../services/admin-roles.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PermissionActionLabelPipe } from '../../permissions/pipes/permission-action-label.pipe';
import { PermissionModuleLabelPipe } from '../../permissions/pipes/permission-module-label.pipe';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import type {
  AdminRoleDetail,
  RolePermissionSummary,
} from '../../../interfaces/admin-role.interface';

@Component({
  selector: 'role-detail-page',
  standalone: true,
  imports: [
    Breadcrumb,
    LocaleDatePipe,
    HasPermissionDirective,
    RouterLink,
    PermissionActionLabelPipe,
    PermissionModuleLabelPipe,
  ],
  templateUrl: './role-detail.html',
  styleUrl: './role-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminRolesService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly PERMISSIONS = PERMISSIONS;
  loading = signal(true);
  error = signal<string | null>(null);

  role = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) {
          this.loading.set(false);
          this.error.set('Rol no especificado');
          return of(null as AdminRoleDetail | null);
        }

        this.loading.set(true);
        this.error.set(null);

        return this.service.findOne(id).pipe(
          map((role) => {
            this.loading.set(false);
            return role;
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el rol');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as AdminRoleDetail | null },
  );

  permissionsCount = computed(() => this.role()?.permissions.length ?? 0);
  permissionGroups = computed(() =>
    this.groupPermissionsByModule(this.role()?.permissions ?? []),
  );

  trackPermission = (_index: number, permission: RolePermissionSummary): string =>
    permission.id || permission.slug;

  trackPermissionGroup = (_index: number, group: { module: string }): string => group.module;

  private groupPermissionsByModule(
    permissions: RolePermissionSummary[],
  ): Array<{ module: string; permissions: RolePermissionSummary[] }> {
    const grouped = new Map<string, RolePermissionSummary[]>();

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

    this.router.navigate(['/admin/roles'], {
      queryParamsHandling: 'preserve',
    });
  }

  editRole(): void {
    const role = this.role();
    if (!role || role.isSystem || !!role.deletedAt) return;

    this.router.navigate(['/admin/roles', role.id, 'editar'], {
      queryParams: {
        ...this.route.snapshot.queryParams,
        returnTo: 'detail',
      },
    });
  }

  deleteRole(): void {
    const role = this.role();
    if (!role || role.isSystem || !!role.deletedAt) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Rol',
        message: `¿Estás seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(role.id).subscribe({
          next: () => {
            this.toastService.success('Rol eliminado', `El rol "${role.name}" fue eliminado correctamente.`);
            this.router.navigate(['/admin/roles'], { queryParamsHandling: 'preserve' });
          },
          error: (err) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo eliminar el rol');
          },
        });
      });
  }
}
