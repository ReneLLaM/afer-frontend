import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { ProductCard } from '../../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../../shared/components/skeleton-card/skeleton-card';
import { ProductsService } from '../../../services/products.service';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'products-page',
  imports: [ProductCard, SkeletonCard, PaginationComponent],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * LEER PÁGINA DE LA URL:
   * Vigilamos la URL para saber en qué página estamos.
   */
  private readonly urlParams = toSignal(this.route.queryParamMap);
  readonly page = computed(() => Number(this.urlParams()?.get('page')) || 1);
  readonly category = computed(() => this.urlParams()?.get('category') || null);
  readonly brand = computed(() => this.urlParams()?.get('brand') || null);
  readonly sortBy = computed(() => this.urlParams()?.get('sortBy') || null);
  readonly order = computed(() => this.urlParams()?.get('order') || null);

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
    }),
    stream: ({ params }) => {
      const limit = 12;
      const offset = (params.page - 1) * limit;

      return this.productsService.getProducts({ 
        limit, 
        offset,
        categoryId: params.category || undefined, // El backend debe aceptar slug como ID o mapearlo
        brandId: params.brand || undefined,
        sortBy: (params.sortBy as any) || undefined,
        order: (params.order as any) || undefined
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

  // Función para cambiar de página en la URL
  private navegar(params: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: false, // Permite usar el botón "Atrás" del navegador
    });
  }
}
