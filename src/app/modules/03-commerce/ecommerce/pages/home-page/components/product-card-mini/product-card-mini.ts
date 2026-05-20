import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Datum } from '../../../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../../../pipes/product-image.pipe';
import { FavoritesStore } from '../../../../../../../core/stores/favorites.store';
import { CartStore } from '../../../../../../../core/stores/cart.store';

@Component({
  selector: 'app-product-card-mini',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card-mini.html',
  styleUrl: './product-card-mini.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardMini {
  private readonly favoritesStore = inject(FavoritesStore);
  private readonly cartStore = inject(CartStore);

  product = input.required<Datum>();

  readonly isFavorite = computed(() => this.favoritesStore.isFavorite(this.product().id));
  readonly isToggling = computed(() => this.favoritesStore.isToggling(this.product().id));

  readonly isAddingToCart = computed(() => this.cartStore.isPending(this.product().id));

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cartStore.addItem(this.product().id, 1, this.product());
  }

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesStore.toggle(this.product().id, this.product());
  }

  getProductUrl(): string {
    return `/productos/${this.product().slug}`;
  }
}
