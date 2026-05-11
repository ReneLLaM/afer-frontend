import { Component, computed, inject } from '@angular/core';
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
  imports: [BrandCard, SkeletonCard, FormsModule, PaginationComponent],
  templateUrl: './brands-page.html',
  styleUrl: './brands-page.scss',
})
export class BrandsPage {
  // Herramientas de Angular
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandsService = inject(BrandsService);

  // 1. VIGILANTE DE LA URL: "urlData" siempre sabe qué hay escrito en la barra de direcciones
  private readonly urlData = toSignal(this.route.queryParamMap);

  // 2. TRADUCTORES: Sacan la información de la URL y la dejan lista para usar
  readonly sortBy = computed(() => this.urlData()?.get('sortBy') as SortByBrandsPublic || null);
  readonly order = computed(() => this.urlData()?.get('order') as 'ASC' | 'DESC' || null);
  readonly page = computed(() => Number(this.urlData()?.get('page')) || 1);
  readonly isFeatured = computed(() => {
    const val = this.urlData()?.get('isFeatured');
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  });

  // 3. CARGADOR: Pide los datos al servidor (el servicio se encarga de usar el caché si ya los tiene)
  readonly brandsResource = rxResource({
    params: () => ({
      sortBy: this.sortBy() || SortByBrandsPublic.order,
      order: this.order() || 'ASC',
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

  // 4. DATOS PARA LA PANTALLA: Atajos para no escribir tanto en el HTML
  readonly brands = computed(() => this.brandsResource.value()?.data ?? []);
  readonly meta = computed(() => this.brandsResource.value()?.meta);
  readonly isLoading = computed(() => this.brandsResource.isLoading());

  // 5. ACCIONES: Cuando el usuario toca algo, solo cambiamos la URL y el sistema reacciona solo
  
  handleSortChange(nuevoFiltro: any) {
    this.irAPagina({ sortBy: nuevoFiltro, page: 1 });
  }

  handleOrderChange(nuevaDireccion: any) {
    this.irAPagina({ order: nuevaDireccion, page: 1 });
  }

  toggleFeatured(checked: boolean) {
    this.irAPagina({ isFeatured: checked ? 'true' : null, page: 1 });
  }

  handlePageChange(nuevaPagina: number) {
    this.irAPagina({ page: nuevaPagina });
  }

  resetFilters() {
    this.irAPagina({ sortBy: null, order: null, isFeatured: null, page: 1 });
  }

  // Helper para cambiar la URL sin complicaciones
  private irAPagina(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  // Helpers visuales
  readonly isSortModified = computed(() => this.sortBy() !== null);
  readonly isOrderModified = computed(() => this.order() !== null);
  readonly isFeaturedModified = computed(() => this.isFeatured() !== null);
  readonly isAnyFilterApplied = computed(() => this.isSortModified() || this.isOrderModified() || this.isFeaturedModified());
}
