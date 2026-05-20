import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { CartResponse } from '../pages/mi-carrito/interfaces/mi-carrito.interface';

const baseUrl = environment.baseUrl;

/**
 * CartService — SOLO peticiones HTTP al carrito.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${baseUrl}/cart`);
  }

  addItem(productId: string, quantity: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      `${baseUrl}/cart/items`,
      { productId, quantity },
    );
  }

  updateItem(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Observable<CartResponse> {
    return this.http.patch<CartResponse>(
      `${baseUrl}/cart/${cartId}/items/${itemId}`,
      { quantity },
    );
  }

  removeItem(cartId: string, itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      `${baseUrl}/cart/${cartId}/items/${itemId}`,
    );
  }

  clearCart(cartId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      `${baseUrl}/cart/${cartId}`,
    );
  }

  mergeCart(items: { productId: string; quantity: number }[]): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      `${baseUrl}/cart/merge`,
      { items },
    );
  }
}
