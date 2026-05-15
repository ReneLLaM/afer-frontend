import { Component, inject, input, signal, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService, SortByProductsPublic } from '../../../../services/products.service';
import { ProductCardV2 } from '../product-card-v2/product-card-v2';
import { SkeletonCard } from '../../../../../../../shared/components/skeleton-card/skeleton-card';
import { catchError, of } from 'rxjs';
import { FeaturedCategory } from '../../../../services/home.service';
import { Datum, ProductsResponse } from '../../../products-page/interfaces/products-response.interface';

const EMPTY_RESPONSE: ProductsResponse = { data: [], meta: { total: 0, limit: 0, page: 0, totalPages: 0 } };

@Component({
  selector: 'app-featured-product-grid',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardV2, SkeletonCard],
  templateUrl: './featured-product-grid.html',
  styleUrl: './featured-product-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductGrid {
  private productsService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);

  category = input<FeaturedCategory | null>(null);

  products = signal<Datum[]>([]);
  isLoading = signal(false);

  constructor() {
    effect(() => {
      const slug = this.category()?.slug;
      if (slug) {
        this.loadProducts(slug);
      }
    });
  }

  private loadProducts(categorySlug: string): void {
    this.isLoading.set(true);

    this.productsService
      .getProducts({
        limit: 8,
        categories: [categorySlug],
        order: 'DESC',
        sortBy: SortByProductsPublic.title,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(EMPTY_RESPONSE))
      )
      .subscribe((response) => {
        this.products.set(response.data);
        this.isLoading.set(false);
      });
  }

  handleAddToCart(_id: string): void {
    // TODO: Cart service
  }

  handleFavorite(_id: string): void {
    // TODO: Favorite service
  }
}
