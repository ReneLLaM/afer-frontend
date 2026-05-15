import { Component, inject, input, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../../services/products.service';
import { ProductCardV2 } from '../product-card-v2/product-card-v2';
import { ProductCardMini } from '../product-card-mini/product-card-mini';
import { ProductCard } from '../../../../components/product-card/product-card';
import { SkeletonCard } from '../../../../../../../shared/components/skeleton-card/skeleton-card';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { FeaturedCategory } from '../../../../services/home.service';

@Component({
  selector: 'app-product-section',
  standalone: true,
  imports: [CommonModule, ProductCardV2, ProductCardMini, ProductCard, SkeletonCard, RouterLink],
  templateUrl: './product-section.html',
  styleUrl: './product-section.scss',
})
export class ProductSection implements OnInit, OnChanges {
  private productsService = inject(ProductsService);

  title = input.required<string>();
  isFeatured = input<boolean>(false);
  isTrending = input<boolean>(false);
  isNew = input<boolean>(false);
  limit = input<number>(8);
  viewAllLink = input<string>('/productos');
  layout = input<'grid' | 'carousel' | 'original'>('grid');
  cardStyle = input<'v2' | 'mini' | 'original'>('v2');
  category = input<FeaturedCategory | null>(null);

  products = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category']) {
      this.loadProducts();
    }
  }

  private loadProducts() {
    this.isLoading.set(true);
    const cat = this.category();
    
    this.productsService.getProducts({
      limit: this.limit(),
      isFeatured: this.isFeatured() || undefined,
      isTrending: this.isTrending() || undefined,
      isNew: this.isNew() || undefined,
      categories: cat?.slug ? [cat.slug] : undefined,
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
  }

  handleFavorite(id: string) {
    console.log('Toggle favorite:', id);
  }
}
