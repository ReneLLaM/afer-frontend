import { Component, computed, inject, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { switchMap, of } from 'rxjs';

import { ProductCard } from '../../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../../shared/components/skeleton-card/skeleton-card';
import { ProductsService } from '../../../services/products.service';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { TreeFilterComponent } from './components/tree-filter/tree-filter';
import { ListFilterComponent } from './components/list-filter/list-filter';
import { BrandsResponse } from '../../brands-page/interfaces/brands-response.interface';

@Component({
  selector: 'products-page',
  imports: [CommonModule, FormsModule, ProductCard, SkeletonCard, PaginationComponent, TreeFilterComponent, ListFilterComponent],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * CARGA DE CATEGORÍAS PARA EL ÁRBOL:
   * Solo se cargan una vez al iniciar la página.
   */
  readonly categoriesResource = rxResource({
    stream: () => this.productsService.getTreeCategories(),
  });

  readonly categories = computed(() => {
    const data = this.categoriesResource.value()?.data ?? [];
    return this.mapCategoriesToSlugs(data);
  });

  /**
   * CARGA DE MARCAS PARA EL FILTRO DE LISTA:
   * Depende de las categorías seleccionadas y del término de búsqueda.
   * Si no hay resultados para los filtros aplicados, mostramos todas las marcas.
   */
  readonly brandsResource = rxResource<BrandsResponse, { categories: string | null, search: string | null }>({
    params: () => ({ 
      categories: this.category(),
      search: this.search() 
    }),
    stream: ({ params }) => {
      const categorySlugs = params.categories ? params.categories.split(',').filter(s => !!s) : [];
      
      return this.productsService.getBrandsByCategories(categorySlugs, params.search || undefined).pipe(
        switchMap(response => {
          // Si no hay marcas y hay filtros aplicados, cargar todas las marcas como fallback
          if (response.data.length === 0 && (params.categories || params.search)) {
            return this.productsService.getBrandsByCategories([], undefined);
          }
          return of(response);
        })
      );
    },
  });

  readonly brands = computed(() => {
    const data = this.brandsResource.value()?.data ?? [];
    return data.map((brand: any) => ({ ...brand, id: brand.slug })); // Usar slug como ID para el filtro
  });

  private mapCategoriesToSlugs(categories: any[]): any[] {
    return categories.map(cat => ({
      ...cat,
      id: cat.slug, // Usar slug como ID para el filtro
      children: cat.children ? this.mapCategoriesToSlugs(cat.children) : []
    }));
  }

  /**
   * LEER PÁGINA DE LA URL:
   */
  private readonly urlParams = toSignal(this.route.queryParamMap);
  readonly page = computed(() => Number(this.urlParams()?.get('page')) || 1);
  readonly category = computed(() => this.urlParams()?.get('category') || null);
  readonly brand = computed(() => this.urlParams()?.get('brand') || null);
  readonly sortBy = computed(() => this.urlParams()?.get('sortBy') || null);
  readonly order = computed(() => this.urlParams()?.get('order') || null);
  readonly isFeatured = computed(() => this.urlParams()?.get('isFeatured') === 'true');
  readonly isTrending = computed(() => this.urlParams()?.get('isTrending') === 'true');
  readonly isNew = computed(() => this.urlParams()?.get('isNew') === 'true');
  readonly search = computed(() => this.urlParams()?.get('search') || null);
  readonly productIds = computed(() => this.urlParams()?.get('productIds') || null);

  constructor() {
    /**
     * EFECTO DE LIMPIEZA DE MARCAS:
     * Si las marcas disponibles cambian (por cambio de categoría),
     * eliminamos de la URL las marcas seleccionadas que ya no existen.
     */
    effect(() => {
      // Solo ejecutamos la limpieza si las marcas han terminado de cargar
      if (this.brandsResource.isLoading()) return;

      const availableBrands = this.brands();
      if (availableBrands.length === 0 && this.category()) {
        // Si hay categorías pero no hay marcas disponibles, y tenemos marcas en la URL, las limpiamos
        if (this.brand()) this.navegar({ brand: null });
        return;
      }

      const availableIds = new Set(availableBrands.map((b: any) => b.id));
      const currentSelected = this.brand() ? this.brand()!.split(',') : [];

      if (currentSelected.length === 0) return;

      const validSelected = currentSelected.filter((id) => availableIds.has(id));

      if (validSelected.length !== currentSelected.length) {
        this.navegar({
          brand: validSelected.length > 0 ? validSelected.join(',') : null,
        });
      }
    });
  }

  /**
   * CARGA DE PRODUCTOS:
   * Se dispara solo cuando cambia la página en la URL.
   */
  readonly productsResource = rxResource({
    params: () => ({
      page: this.page(),
      category: this.category(),
      brand: this.brand(),
      sortBy: this.sortBy(),
      order: this.order(),
      isFeatured: this.isFeatured(),
      isTrending: this.isTrending(),
      isNew: this.isNew(),
      search: this.search(),
      productIds: this.productIds(),
    }),
    stream: ({ params }) => {
      const limit = 12;
      const offset = (params.page - 1) * limit;

      return this.productsService.getProducts({ 
        limit, 
        offset,
        categories: params.category ? params.category.split(',').filter(id => !!id) : undefined,
        brands: params.brand ? params.brand.split(',').filter(id => !!id) : undefined,
        productIds: params.productIds ? params.productIds.split(',').filter(id => !!id) : undefined,
        sortBy: (params.sortBy as any) || undefined,
        order: (params.order as any) || undefined,
        isFeatured: params.isFeatured || undefined,
        isTrending: params.isTrending || undefined,
        isNew: params.isNew || undefined,
        search: params.search || undefined,
      });
    },
  });

  // Atajos para el HTML
  readonly products = computed(() => this.productsResource.value()?.data ?? []);
  readonly meta = computed(() => this.productsResource.value()?.meta);
  readonly isLoading = computed(() => this.productsResource.isLoading());

  /**
   * ACCIONES
   */
  handlePageChange(nuevaPagina: number) {
    this.navegar({ page: nuevaPagina });
  }

  handleFavorite(productId: string): void {
    console.log('Favorito:', productId);
  }

  handleAddToCart(productId: string): void {
    console.log('Carrito:', productId);
  }

  handleSelectionChange(categories: string[]): void {
    this.navegar({ category: categories.length > 0 ? categories.join(',') : null, page: 1 });
  }

  handleBrandSelectionChange(brands: string[]): void {
    this.navegar({ brand: brands.length > 0 ? brands.join(',') : null, page: 1 });
  }

  handleSortChange(sortBy: string | null): void {
    this.navegar({ sortBy: sortBy || null, page: 1 });
  }

  handleOrderChange(order: string | null): void {
    this.navegar({ order: order || null, page: 1 });
  }

  toggleFlag(selectedFlag: 'isFeatured' | 'isTrending' | 'isNew', value: boolean): void {
    // Para el comportamiento de radio button, enviamos el flag seleccionado como 'true' o null
    // y los otros dos SIEMPRE como null para que se limpien si estaban activos.
    // Gracias a 'queryParamsHandling: merge', el sortBy y order NO se verán afectados.
    const params: any = {
      page: 1,
      isFeatured: selectedFlag === 'isFeatured' && value ? 'true' : null,
      isTrending: selectedFlag === 'isTrending' && value ? 'true' : null,
      isNew:      selectedFlag === 'isNew'      && value ? 'true' : null,
    };

    this.navegar(params);
  }

  resetFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
    });
  }

  isAnyFilterApplied = computed(() => {
    return !!(this.category() || this.brand() || this.sortBy() || this.order() || this.isFeatured() || this.isTrending() || this.isNew() || this.search() || this.productIds());
  });

  // Función para cambiar de página en la URL
  navegar(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge', // Mantiene los que no estén en 'params'
    });
  }
}
