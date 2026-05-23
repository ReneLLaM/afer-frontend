import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, map } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { AdminPermissionsService } from '../../../services/admin-permissions.service';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { ModuleLabelPipe } from '../../../../../shared/pipes/module-label.pipe';
import type { Permission } from '../../../interfaces/admin-permission.interface';

@Component({
  selector: 'permission-detail-page',
  standalone: true,
  imports: [Breadcrumb, LocaleDatePipe, ModuleLabelPipe],
  templateUrl: './permission-detail.html',
  styleUrl: './permission-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminPermissionsService);

  loading = signal(true);
  error = signal<string | null>(null);

  permission = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const term = params.get('term');
        if (!term) {
          this.loading.set(false);
          this.error.set('Permiso no especificado');
          return of(null as Permission | null);
        }
        this.loading.set(true);
        this.error.set(null);
        return this.service.findOne(term).pipe(
          map((p) => {
            this.loading.set(false);
            return p;
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el permiso');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as Permission | null },
  );

  goBack(): void {
    this.router.navigate(['/admin/permisos'], {
      queryParamsHandling: 'preserve',
    });
  }
}
