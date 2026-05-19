import { Component, computed, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Datum } from '../../../../pages/products-page/interfaces/products-response.interface';
import { ProductImagePipe } from '../../../../pipes/product-image.pipe';
import { FavoritesStore } from '../../../../../../../core/stores/favorites.store';

@Component({
  selector: 'app-product-card-v2',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductImagePipe],
  templateUrl: './product-card-v2.html',
  styleUrl: './product-card-v2.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardV2 {
  private readonly router         = inject(Router);
  private readonly favoritesStore = inject(FavoritesStore);

  product = input.required<Datum>();

  /** Reactivo: se actualiza automáticamente cuando cambia el store global */
  readonly isFavorite = computed(() => this.favoritesStore.isFavorite(this.product().id));

  /** True mientras el toggle está en vuelo (previene doble clic) */
  readonly isToggling = computed(() => this.favoritesStore.isToggling(this.product().id));

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    // TODO: CartStore
  }

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesStore.toggle(this.product().id, this.product());
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
}
