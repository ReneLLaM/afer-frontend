import { Location } from '@angular/common';
import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminBrandsService } from '../../../services/admin-brands.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import type { AdminBrandDetail } from '../../../interfaces/admin-brand.interface';

const BRAND_IMAGE_PLACEHOLDER = 'assets/images/placeholder.png';

@Component({
  selector: 'brand-detail-page',
  standalone: true,
  imports: [Breadcrumb, LocaleDatePipe, HasPermissionDirective, RouterLink, NgStyle],
  templateUrl: './brand-detail.html',
  styleUrl: './brand-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminBrandsService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly brand = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const term = params.get('term');
        if (!term) {
          this.loading.set(false);
          this.error.set('Marca no especificada');
          return of(null as AdminBrandDetail | null);
        }

        this.loading.set(true);
        this.error.set(null);

        return this.service.findOne(term).pipe(
          map((brand) => {
            this.loading.set(false);
            return {
              ...brand,
              imageUrl: brand.imageUrl || brand.image || BRAND_IMAGE_PLACEHOLDER,
              image: brand.image || brand.imageUrl || BRAND_IMAGE_PLACEHOLDER,
            };
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró la marca');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as AdminBrandDetail | null },
  );

  readonly statusBadge = computed(() => {
    const brand = this.brand();

    if (!brand) {
      return { label: 'Sin estado', variant: 'neutral' as const };
    }

    if (brand.deletedAt) {
      return { label: 'Eliminada', variant: 'deleted' as const };
    }

    if (brand.status === 'active') {
      return { label: 'Activa', variant: 'active' as const };
    }

    if (brand.status === 'inactive') {
      return { label: 'Inactiva', variant: 'inactive' as const };
    }

    return { label: 'Deprecada', variant: 'deprecated' as const };
  });

  readonly heroStyle = computed(() => {
    const backgroundColor = this.brand()?.backgroundColor || '#f4f6f8';
    return { 'background-color': backgroundColor };
  });

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/marcas'], {
      queryParamsHandling: 'preserve',
    });
  }

  editBrand(): void {
    const brand = this.brand();
    if (!brand || !!brand.deletedAt) return;

    this.router.navigate(['/admin/marcas', brand.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteBrand(): void {
    const brand = this.brand();
    if (!brand || !!brand.deletedAt) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Marca',
        message: `¿Estas seguro de eliminar la marca "${brand.name}"? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(brand.id).subscribe({
          next: () => {
            this.toastService.success('Marca eliminada', `La marca "${brand.name}" fue eliminada correctamente.`);
            this.router.navigate(['/admin/marcas'], { queryParamsHandling: 'preserve' });
          },
          error: (err) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo eliminar la marca');
          },
        });
      });
  }
}
