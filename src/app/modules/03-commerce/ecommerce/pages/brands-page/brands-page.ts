import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { BrandsService, SortByBrandsPublic } from '../../services/brands.service';
import { BrandCard } from '../../components/brand-card/brand-card';
import { SkeletonCard } from '../../../../../shared/components/skeleton-card/skeleton-card';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [BrandCard, SkeletonCard, FormsModule, PaginationComponent],
  templateUrl: './brands-page.html',
  styleUrl: './brands-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandsService = inject(BrandsService);

  private readonly urlData = toSignal(this.route.queryParamMap);

  readonly sortBy = computed(() => this.urlData()?.get('sortBy') as SortByBrandsPublic | null);
  readonly order = computed(() => this.urlData()?.get('order') as 'ASC' | 'DESC' | null);
  readonly page = computed(() => Number(this.urlData()?.get('page')) || 1);
  readonly isFeatured = computed((): boolean | null => {
    const val = this.urlData()?.get('isFeatured');
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  });

  readonly brandsResource = rxResource({
    params: () => ({
      sortBy: this.sortBy() ?? SortByBrandsPublic.order,
      order: this.order() ?? 'ASC',
      page: this.page(),
      isFeatured: this.isFeatured(),
    }),
    stream: ({ params }) => {
      return this.brandsService.getBrands({
        sortBy: params.sortBy,
        order: params.order,
        limit: 16,
        offset: (params.page - 1) * 16,
        isFeatured: params.isFeatured ?? undefined,
      });
    },
  });

  readonly brands = computed(() => this.brandsResource.value()?.data ?? []);
  readonly meta = computed(() => this.brandsResource.value()?.meta);
  readonly isLoading = computed(() => this.brandsResource.isLoading());

  handleSortChange(nuevoFiltro: SortByBrandsPublic | null): void {
    this.irAPagina({ sortBy: nuevoFiltro, page: 1 });
  }

  handleOrderChange(nuevaDireccion: 'ASC' | 'DESC' | null): void {
    this.irAPagina({ order: nuevaDireccion, page: 1 });
  }

  toggleFeatured(checked: boolean): void {
    this.irAPagina({ isFeatured: checked ? 'true' : null, page: 1 });
  }

  handlePageChange(nuevaPagina: number): void {
    this.irAPagina({ page: nuevaPagina });
  }

  resetFilters(): void {
    this.irAPagina({ sortBy: null, order: null, isFeatured: null, page: 1 });
  }

  private irAPagina(params: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  readonly isSortModified = computed(() => this.sortBy() !== null);
  readonly isOrderModified = computed(() => this.order() !== null);
  readonly isFeaturedModified = computed(() => this.isFeatured() !== null);
  readonly isAnyFilterApplied = computed(() =>
    this.isSortModified() || this.isOrderModified() || this.isFeaturedModified()
  );
}
