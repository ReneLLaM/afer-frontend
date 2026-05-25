import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { BrandsService, SortByBrandsPublic } from '../../services/brands.service';
import { BrandCard } from '../../components/brand-card/brand-card';
import { SkeletonCard } from '../../../../../shared/components/skeleton-card/skeleton-card';
import { Pagination } from '../../../../../shared/components/pagination/pagination';
import type { ListMeta } from '../../../../../shared/interfaces/list-meta.interface';
import {
  CATALOG_PAGE_SIZE_OPTIONS,
  parseCatalogLimit,
  parseCatalogPage,
  toCatalogOffset,
} from '../../../../../shared/utils/catalog-list-query.utils';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [BrandCard, SkeletonCard, FormsModule, Pagination],
  templateUrl: './brands-page.html',
  styleUrl: './brands-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandsService = inject(BrandsService);

  readonly pageSizeOptions = CATALOG_PAGE_SIZE_OPTIONS;

  private readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  private queryParam(key: string): string | null {
    const value = this.queryParams()[key];
    if (value === undefined || value === null) return null;
    return Array.isArray(value) ? value[0] : String(value);
  }

  readonly sortBy = computed(() => this.queryParam('sortBy') as SortByBrandsPublic | null);
  readonly order = computed(() => this.queryParam('order') as 'ASC' | 'DESC' | null);
  readonly page = computed(() => parseCatalogPage(this.queryParam('page')));
  readonly limit = computed(() => parseCatalogLimit(this.queryParam('limit')));
  readonly isFeatured = computed((): boolean | null => {
    const val = this.queryParam('isFeatured');
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  });

  readonly brandsResource = rxResource({
    params: () => ({
      sortBy: this.sortBy() ?? SortByBrandsPublic.order,
      order: this.order() ?? 'ASC',
      page: this.page(),
      limit: this.limit(),
      isFeatured: this.isFeatured(),
    }),
    stream: ({ params }) => {
      const limit = params.limit;
      return this.brandsService.getBrands({
        sortBy: params.sortBy,
        order: params.order,
        limit,
        offset: toCatalogOffset(params.page, limit),
        isFeatured: params.isFeatured ?? undefined,
      });
    },
  });

  readonly brands = computed(() => this.brandsResource.value()?.data ?? []);
  readonly meta = computed(() => this.brandsResource.value()?.meta);
  readonly paginationMeta = computed((): ListMeta | null => {
    const apiMeta = this.meta();
    if (!apiMeta) return null;

    const limit = this.limit();
    const page = this.page();

    return {
      total: apiMeta.total,
      limit,
      page,
      totalPages: Math.max(1, Math.ceil(apiMeta.total / limit)),
    };
  });
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
    this.irAPagina({ page: String(nuevaPagina) });
  }

  handleLimitChange(limit: number): void {
    this.irAPagina({ limit: String(limit), page: '1' });
  }

  resetFilters(): void {
    this.irAPagina({ sortBy: null, order: null, isFeatured: null, page: 1 });
  }

  private irAPagina(params: Record<string, string | number | null>): void {
    const queryParams: Record<string, string | null> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        queryParams[key] = null;
        continue;
      }
      queryParams[key] = String(value);
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
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
