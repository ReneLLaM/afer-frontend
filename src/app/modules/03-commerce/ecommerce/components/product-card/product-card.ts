import { CommonModule } from '@angular/common';
import { Component, computed, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Datum } from '../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../pipes/product-image.pipe';
import { FavoritesStore } from '../../../../../core/stores/favorites.store';
import { CartStore } from '../../../../../core/stores/cart.store';

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  private readonly router         = inject(Router);
  private readonly favoritesStore = inject(FavoritesStore);
  private readonly cartStore = inject(CartStore);

  product = input.required<Datum>();

  /** Reactivo: se actualiza automáticamente cuando cambia el store global */
  readonly isFavorite = computed(() => this.favoritesStore.isFavorite(this.product().id));

  /** True mientras el toggle está en vuelo (previene doble clic) */
  readonly isToggling = computed(() => this.favoritesStore.isToggling(this.product().id));
  readonly isAddingToCart = computed(() => this.cartStore.isPending(this.product().id));

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesStore.toggle(this.product().id, this.product());
  }

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartStore.addItem(this.product().id, 1, this.product());
  }

  onBrandClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const brandSlug = this.product().brand?.slug;
    if (brandSlug) {
      this.router.navigate(['/productos'], { queryParams: { brand: brandSlug } });
    }
  }

  onCategoryClick(event: Event, categorySlug: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/productos'], { queryParams: { category: categorySlug } });
  }

  getProductUrl(): string {
    return `/productos/${this.product().slug}`;
  }
}
