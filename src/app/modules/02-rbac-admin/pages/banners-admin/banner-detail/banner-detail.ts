import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { Breadcrumb } from '../../../../../shared/components/breadcrumb/breadcrumb';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { AdminBannersService } from '../../../services/admin-banners.service';
import { PERMISSIONS } from '../../../../../core/constants/permissions';
import type { AdminBannerDetail } from '../../../interfaces/admin-banner.interface';

@Component({
  selector: 'banner-detail-page',
  standalone: true,
  imports: [Breadcrumb, LocaleDatePipe, HasPermissionDirective, RouterLink],
  templateUrl: './banner-detail.html',
  styleUrl: './banner-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(AdminBannersService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly banner = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (!id) {
          this.loading.set(false);
          this.error.set('Banner no especificado');
          return of(null as AdminBannerDetail | null);
        }

        this.loading.set(true);
        this.error.set(null);

        return this.service.findOne(id).pipe(
          map((banner) => {
            this.loading.set(false);
            return banner;
          }),
          catchError((err) => {
            this.loading.set(false);
            this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el banner');
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null as AdminBannerDetail | null },
  );

  readonly relationGroups = computed(() => {
    const banner = this.banner();
    return [
      {
        label: 'Categorías',
        route: '/admin/categorias',
        items: (banner?.categories ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.slug,
          query: item.name,
        })),
      },
      {
        label: 'Marcas',
        route: '/admin/marcas',
        items: (banner?.brands ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.slug,
          query: item.name,
        })),
      },
      {
        label: 'Productos',
        route: '/admin/productos',
        items: (banner?.products ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.sku || item.slug,
          query: item.title,
        })),
      },
    ];
  });

  readonly scheduleState = computed(() => this.getScheduleState(this.banner()));

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/banners'], {
      queryParamsHandling: 'preserve',
    });
  }

  editBanner(): void {
    const banner = this.banner();
    if (!banner || !!banner.deletedAt) return;

    this.router.navigate(['/admin/banners', banner.id, 'editar'], {
      queryParamsHandling: 'preserve',
    });
  }

  deleteBanner(): void {
    const banner = this.banner();
    if (!banner || !!banner.deletedAt) return;

    this.dialogService
      .confirm({
        title: 'Eliminar Banner',
        message: `¿Estás seguro de eliminar el banner "${banner.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'warning',
      })
      .then((confirmed) => {
        if (!confirmed) return;

        this.service.delete(banner.id).subscribe({
          next: (result) => {
            this.toastService.success('Banner eliminado', result.message);
            this.router.navigate(['/admin/banners'], { queryParamsHandling: 'preserve' });
          },
          error: (err) => {
            this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo eliminar el banner');
          },
        });
      });
  }

  protected isScheduleActive(): boolean {
    return this.scheduleState() === 'active';
  }

  protected isScheduleExpired(): boolean {
    return this.scheduleState() === 'expired';
  }

  protected isScheduleUpcoming(): boolean {
    return this.scheduleState() === 'upcoming';
  }

  protected scheduleLabel(): string {
    const state = this.scheduleState();
    if (state === 'expired') return 'Vencido';
    if (state === 'upcoming') return 'Proximo';
    return 'Vigente';
  }

  private getScheduleState(
    banner: AdminBannerDetail | null,
  ): 'active' | 'expired' | 'upcoming' {
    if (!banner) return 'active';

    const now = Date.now();
    const startsAt = banner.startsAt ? new Date(banner.startsAt).getTime() : null;
    const endsAt = banner.endsAt ? new Date(banner.endsAt).getTime() : null;

    if (startsAt && startsAt > now) return 'upcoming';
    if (endsAt && endsAt < now) return 'expired';

    return 'active';
  }
}
