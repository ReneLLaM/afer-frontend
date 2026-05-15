import { Component, inject, input, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../../services/products.service';
import { ProductCardV2 } from '../product-card-v2/product-card-v2';
import { FeaturedCategory } from '../../../../services/home.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, tap } from 'rxjs';
import { SkeletonCard } from '../../../../../../../shared/components/skeleton-card/skeleton-card';

@Component({
  selector: 'app-featured-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardV2, SkeletonCard],
  templateUrl: './featured-product-grid.html',
  styleUrl: './featured-product-grid.scss',
})
export class FeaturedProductGrid {
  private productsService = inject(ProductsService);
  
  category = input<FeaturedCategory | null>(null);
  
  products = signal<any[]>([]);
  isLoading = signal(false);

  constructor() {
    effect(() => {
      const cat = this.category();
      if (cat) {
        this.loadProducts(cat.slug);
      }
    });
  }

  private loadProducts(categorySlug: string) {
    this.isLoading.set(true);
    this.productsService.getProducts({ 
      limit: 8, 
      categories: [categorySlug],
      order: 'DESC',
      sortBy: 'title' as any
    }).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(() => {
        this.isLoading.set(false);
        return of({ data: [] });
      })
    ).subscribe(response => {
      this.products.set(response.data);
    });
  }

  handleAddToCart(id: string) {
    console.log('Add to cart:', id);
    // TODO: Implement cart service call
  }

  handleFavorite(id: string) {
    console.log('Toggle favorite:', id);
    // TODO: Implement favorite service call
  }
}
