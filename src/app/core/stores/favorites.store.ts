import { computed, effect, inject, Injectable, Injector, signal, untracked } from '@angular/core';

import { FavoritesService, FavoriteItem } from '../../modules/03-commerce/ecommerce/services/favorites.service';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';
import { DialogService } from '../../shared/services/dialog.service';
import { Router } from '@angular/router';

/**
 * FavoritesStore — Estado global de favoritos con Angular Signals.
 *
 * Responsabilidades:
 * - Mantener el Set de IDs favoritos para consultas O(1) en cualquier card
 * - Mantener la lista completa para la página /mis-favoritos
 * - Proveer toggle() con optimistic update (UI instantáneo)
 * - Cargarse una sola vez cuando el usuario se autentica
 *
 * NO hace:
 * - Peticiones HTTP directas (eso es FavoritesService)
 * - Manejo de autenticación (eso es AuthStore)
 *
 * Flujo de carga:
 *  AuthStore detecta autenticación → llama favoritesStore.loadIds()
 *  → Se cargan solo los UUIDs (GET /favorites/ids)
 *  → Cuando el usuario va a /mis-favoritos → se llama loadFavorites()
 */
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly favoritesService = inject(FavoritesService);
  private readonly injector = inject(Injector);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);

  private get authStore() {
    return this.injector.get(AuthStore);
  }

  // ─── Estado privado ──────────────────────────────────────
  private readonly _favoriteIds  = signal<Set<string>>(new Set());
  private readonly _favorites    = signal<FavoriteItem[]>([]);
  private readonly _isLoaded     = signal(false);       // ids cargados
  private readonly _isFullLoaded = signal(false);       // datos completos cargados
  private readonly _isLoading    = signal(false);
  private readonly _isToggling   = signal<Set<string>>(new Set()); // products en mid-request

  // ─── Estado público (readonly) ──────────────────────────
  readonly favoriteIds  = this._favoriteIds.asReadonly();
  readonly favorites    = this._favorites.asReadonly();
  readonly isLoaded     = this._isLoaded.asReadonly();
  readonly isLoading    = this._isLoading.asReadonly();

  // ─── Computed ────────────────────────────────────────────

  /** Número total de favoritos */
  readonly count = computed(() => this._favoriteIds().size);

  /**
   * Verifica si un producto está en favoritos en O(1).
   * Usado por cada product-card para mostrar el corazón activo.
   */
  isFavorite(productId: string): boolean {
    return this._favoriteIds().has(productId);
  }

  /**
   * Verifica si un producto está siendo procesado (para deshabilitar el botón).
   */
  isToggling(productId: string): boolean {
    return this._isToggling().has(productId);
  }

  // ─── Acciones ────────────────────────────────────────────

  /**
   * Carga solo los IDs de favoritos del usuario.
   * Llamado al autenticar. Rápido y ligero.
   */
  loadIds(): void {
    if (this._isLoaded()) return; // Evitar re-carga innecesaria

    this._isLoading.set(true);

    this.favoritesService.getFavoriteIds().subscribe({
      next: (ids) => {
        this._favoriteIds.set(new Set(ids));
        this._isLoaded.set(true);
        this._isLoading.set(false);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Carga la lista completa de favoritos con datos del producto.
   * Llamado solo cuando el usuario navega a /mis-favoritos.
   */
  loadFavorites(): void {
    this._isLoading.set(true);

    this.favoritesService.getFavorites().subscribe({
      next: (items) => {
        this._favorites.set(items);
        // Sincronizar los IDs con los items cargados
        const ids = new Set(items.map(f => f.productId));
        this._favoriteIds.set(ids);
        this._isFullLoaded.set(true);
        this._isLoaded.set(true);
        this._isLoading.set(false);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Toggle favorito con optimistic update:
   * 1. Actualiza la UI inmediatamente (sin esperar respuesta del backend)
   * 2. Si el backend falla → revierte el cambio
   *
   * @param productId UUID del producto
   * @param productData Datos completos del producto (para agregar a _favorites si está cargado)
   */
  async toggle(productId: string, productData?: import('../../modules/03-commerce/ecommerce/pages/products-page/interfaces/products-response.interface').Datum): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      const confirm = await this.dialogService.confirm({
        title: 'Favoritos',
        message: 'Debes iniciar sesión para guardar productos en tus favoritos.',
        confirmText: 'Iniciar Sesión',
        cancelText: 'Más tarde',
        type: 'info'
      });

      if (confirm) {
        this.router.navigate(['/iniciar-sesion']);
      }
      return;
    }

    if (this.isToggling(productId)) return; // Evitar doble clic

    const wasFavorite = this.isFavorite(productId);

    // 1. Marcar como en proceso
    this._isToggling.update(set => {
      const next = new Set(set);
      next.add(productId);
      return next;
    });

    // 2. Optimistic update — actualizar UI antes de que responda el backend
    if (wasFavorite) {
      // Quitar de favoritos optimisticamente
      this._favoriteIds.update(set => {
        const next = new Set(set);
        next.delete(productId);
        return next;
      });
      this._favorites.update(list => list.filter(f => f.productId !== productId));
    } else {
      // Agregar a favoritos optimisticamente
      this._favoriteIds.update(set => new Set([...set, productId]));
      if (productData) {
        const optimisticItem: FavoriteItem = {
          id: `optimistic-${productId}`,
          userId: '',
          productId,
          createdAt: new Date().toISOString(),
          product: productData,
        };
        this._favorites.update(list => [optimisticItem, ...list]);
      }
    }

    // 3. Llamada al backend
    const onError = () => {
      // Revertir optimistic update
      if (wasFavorite) {
        this._favoriteIds.update(set => new Set([...set, productId]));
      } else {
        this._favoriteIds.update(set => {
          const next = new Set(set);
          next.delete(productId);
          return next;
        });
        this._favorites.update(list => list.filter(f => f.productId !== productId));
      }
      this._removeFromToggling(productId);
    };

    if (wasFavorite) {
      this.favoritesService.removeFromFavorites(productId).subscribe({
        next: () => this._removeFromToggling(productId),
        error: onError,
      });
    } else {
      this.favoritesService.addToFavorites(productId).subscribe({
        next: (realItem) => {
          // Reemplazar el item optimistic con el real del backend
          this._favorites.update(list =>
            list.map(f => f.id === `optimistic-${productId}` ? realItem : f)
          );
          this._removeFromToggling(productId);
        },
        error: onError,
      });
    }
  }

  /**
   * Resetea el store al hacer logout.
   * Llamado por el AuthStore.
   */
  reset(): void {
    this._favoriteIds.set(new Set());
    this._favorites.set([]);
    this._isLoaded.set(false);
    this._isFullLoaded.set(false);
    this._isLoading.set(false);
    this._isToggling.set(new Set());
  }

  // ─── Helpers privados ────────────────────────────────────

  private _removeFromToggling(productId: string): void {
    this._isToggling.update(set => {
      const next = new Set(set);
      next.delete(productId);
      return next;
    });
  }
}
