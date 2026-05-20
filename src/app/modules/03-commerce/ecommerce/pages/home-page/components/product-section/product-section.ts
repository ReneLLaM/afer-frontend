import { Component, inject, input, signal, effect, ChangeDetectionStrategy, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService, SortByProductsPublic } from '../../../../services/products.service';
import { ProductCardV2 } from '../product-card-v2/product-card-v2';
import { ProductCardMini } from '../product-card-mini/product-card-mini';
import { ProductCard } from '../../../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../../../shared/components/skeleton-card/skeleton-card';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { FeaturedCategory } from '../../../../services/home.service';
import { Datum, ProductsResponse } from '../../../products-page/interfaces/products-response.interface';

const EMPTY_RESPONSE: ProductsResponse = { data: [], meta: { total: 0, limit: 0, page: 0, totalPages: 0 } };

@Component({
  selector: 'app-product-section',
  standalone: true,
  imports: [CommonModule, ProductCardV2, ProductCardMini, ProductCard, SkeletonCard, RouterLink],
  templateUrl: './product-section.html',
  styleUrl: './product-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSection {
  private productsService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  title = input.required<string>();
  isFeatured = input<boolean>(false);
  isTrending = input<boolean>(false);
  isNew = input<boolean>(false);
  limit = input<number>(8);
  viewAllLink = input<string>('/productos');
  layout = input<'grid' | 'carousel' | 'original'>('grid');
  cardStyle = input<'v2' | 'mini' | 'original'>('v2');
  category = input<FeaturedCategory | null>(null);

  viewAllPath = computed(() => {
    const url = this.viewAllLink();
    const idx = url.indexOf('?');
    return idx > -1 ? url.substring(0, idx) : url;
  });

  viewAllQueryParams = computed<Record<string, string>>(() => {
    const url = this.viewAllLink();
    const idx = url.indexOf('?');
    if (idx === -1) return {};
    const params: Record<string, string> = {};
    url.substring(idx + 1).split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
    return params;
  });

  products = signal<Datum[]>([]);
  isLoading = signal(true);

  constructor() {
    effect(() => {
      this.category();
      this.loadProducts();
    });
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    const cat = this.category();

    this.productsService
      .getProducts({
        limit: this.limit(),
        isFeatured: this.isFeatured() || undefined,
        isTrending: this.isTrending() || undefined,
        isNew: this.isNew() || undefined,
        categories: cat?.slug ? [cat.slug] : undefined,
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

  handleFavorite(_id: string): void {
    // TODO: Favorite service
  }
}
