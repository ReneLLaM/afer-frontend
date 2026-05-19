import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesStore } from '../../../../../core/stores/favorites.store';
import { ProductCardV2 } from '../home-page/components/product-card-v2/product-card-v2';
import { SkeletonCard } from '../../../../../shared/components/skeleton-card/skeleton-card';

@Component({
  selector: 'app-mis-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardV2, SkeletonCard],
  templateUrl: './mis-favoritos.html',
  styleUrl: './mis-favoritos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisFavoritosPage implements OnInit {
  readonly favoritesStore = inject(FavoritesStore);

  ngOnInit(): void {
    // Cuando entramos a la página, cargamos los datos completos de los productos favoritos
    this.favoritesStore.loadFavorites();
  }
}
