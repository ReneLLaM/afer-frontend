import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Datum } from '../pages/products-page/interfaces/products-response.interface';

const baseUrl = environment.baseUrl;

// ─── Interfaces ──────────────────────────────────────────
export interface FavoriteItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Datum;
}

/**
 * FavoritesService — SOLO responsable de peticiones HTTP al backend.
 *
 * Endpoints disponibles:
 *  GET  /favorites       → lista completa con producto embebido
 *  GET  /favorites/ids   → solo los UUIDs (para marcar corazones)
 *  POST /favorites/:id   → agregar a favoritos
 *  DELETE /favorites/:id → quitar de favoritos
 *
 * El interceptor agrega el Bearer token automáticamente.
 * El FavoritesStore consume estos métodos y mantiene el estado.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);

  /**
   * GET /favorites/ids
   * Retorna solo los IDs de productos favoritos del usuario.
   * Útil al iniciar sesión para marcar corazones sin cargar datos completos.
   */
  getFavoriteIds(): Observable<string[]> {
    return this.http.get<string[]>(`${baseUrl}/favorites/ids`);
  }

  /**
   * GET /favorites
   * Retorna la lista de favoritos con producto embebido.
   * Usado en la página /mis-favoritos.
   */
  getFavorites(limit: number = 50, offset: number = 0): Observable<FavoriteItem[]> {
    return this.http
      .get<{ data: FavoriteItem[]; meta: any }>(`${baseUrl}/favorites`, {
        params: { limit, offset }
      })
      .pipe(map((res) => res.data));
  }

  /**
   * POST /favorites/:productId
   * Agrega un producto a favoritos del usuario autenticado.
   */
  addToFavorites(productId: string): Observable<FavoriteItem> {
    return this.http.post<FavoriteItem>(`${baseUrl}/favorites/${productId}`, {});
  }

  /**
   * DELETE /favorites/:productId
   * Elimina un producto de los favoritos del usuario autenticado.
   */
  removeFromFavorites(productId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${baseUrl}/favorites/${productId}`);
  }
}
