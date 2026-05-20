import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { CartService } from '../../modules/03-commerce/ecommerce/services/cart.service';
import {
  CartItem,
  CartMeta,
  CartResponse,
} from '../../modules/03-commerce/ecommerce/models/cart.model';
import { Datum } from '../../modules/03-commerce/ecommerce/pages/products-page/interfaces/products-response.interface';

const EMPTY_META: CartMeta = {
  itemCount: 0,
  totalQuantity: 0,
  subtotal: 0,
};

const LOCAL_CART_KEY = 'afer_cart_items';

/**
 * CartStore — Estado global del carrito con Angular Signals.
 * Maneja localStorage para invitados y API para usuarios autenticados.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartService = inject(CartService);

  private readonly _cartId = signal<string | null>(null);
  private readonly _items = signal<CartItem[]>([]);
  private readonly _meta = signal<CartMeta>(EMPTY_META);
  private readonly _isLoaded = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _isSidebarOpen = signal(false);
  private readonly _isAuthenticated = signal(false);
  private readonly _pendingProductIds = signal<Set<string>>(new Set());
  private readonly _pendingItemIds = signal<Set<string>>(new Set());

  readonly cartId = this._cartId.asReadonly();
  readonly items = this._items.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSidebarOpen = this._isSidebarOpen.asReadonly();

  readonly count = computed(() => this._meta().totalQuantity);
  readonly subtotal = computed(() => this._meta().subtotal);
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Persistencia local para invitados
    effect(() => {
      const items = this._items();
      const authenticated = this._isAuthenticated();

      untracked(() => {
        if (!authenticated) {
          localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
        }
      });
    });
  }

  setAuthenticated(value: boolean): void {
    this._isAuthenticated.set(value);
    this._isLoaded.set(false); // Forzar recarga según el nuevo estado
  }

  openSidebar(): void {
    this._isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this._isSidebarOpen.set(false);
  }

  getItemQuantity(productId: string): number {
    const item = this._items().find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }

  isPending(productId: string): boolean {
    return this._pendingProductIds().has(productId);
  }

  isItemPending(itemId: string): boolean {
    return this._pendingItemIds().has(itemId);
  }

  /**
   * Carga el carrito.
   * Si es invitado: desde localStorage.
   * Si es usuario: desde el servidor.
   */
  loadCart(force = false): void {
    if (this._isLoaded() && !force) return;

    if (!this._isAuthenticated()) {
      this._loadLocalCart();
      return;
    }

    const showSkeleton = !this._isLoaded();
    if (showSkeleton) {
      this._isLoading.set(true);
    }

    this.cartService.getCart().subscribe({
      next: (cart) => this._applyCart(cart),
      error: () => this._isLoading.set(false),
    });
  }

  private _loadLocalCart(): void {
    const saved = localStorage.getItem(LOCAL_CART_KEY);
    if (saved) {
      try {
        const items = JSON.parse(saved) as CartItem[];
        this._items.set(items);
        this._meta.set(this._recalcMeta(items));
      } catch (e) {
        console.error('Error al cargar carrito local', e);
        this._items.set([]);
      }
    }
    this._isLoaded.set(true);
    this._isLoading.set(false);
  }

  addItem(productId: string, quantity: number = 1, productData?: Datum): void {
    if (this.isPending(productId)) return;

    if (!this._isAuthenticated()) {
      this._optimisticAdd(productId, quantity, productData);
      return;
    }

    const snapshot = this._snapshot();
    this._pendingProductIds.update((set) => new Set([...set, productId]));
    this._optimisticAdd(productId, quantity, productData);

    this.cartService.addItem(productId, quantity).subscribe({
      next: (cart) => {
        this._applyCart(cart, { preserveOrder: true });
        this._removePendingProduct(productId);
      },
      error: () => {
        this._restore(snapshot);
        this._removePendingProduct(productId);
      },
    });
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (this.isItemPending(itemId) || quantity < 1) return;

    if (!this._isAuthenticated()) {
      this._optimisticUpdateQuantity(itemId, quantity);
      return;
    }

    const cartId = this._cartId();
    if (!cartId) return;

    const snapshot = this._snapshot();
    this._pendingItemIds.update((set) => new Set([...set, itemId]));
    this._optimisticUpdateQuantity(itemId, quantity);

    this.cartService.updateItem(cartId, itemId, quantity).subscribe({
      next: (cart) => {
        this._applyCart(cart, { preserveOrder: true });
        this._removePendingItem(itemId);
      },
      error: () => {
        this._restore(snapshot);
        this._removePendingItem(itemId);
      },
    });
  }

  removeItem(itemId: string): void {
    if (this.isItemPending(itemId)) return;

    if (!this._isAuthenticated()) {
      this._optimisticRemoveItem(itemId);
      return;
    }

    const cartId = this._cartId();
    if (!cartId) return;

    const snapshot = this._snapshot();
    this._pendingItemIds.update((set) => new Set([...set, itemId]));
    this._optimisticRemoveItem(itemId);

    this.cartService.removeItem(cartId, itemId).subscribe({
      next: (cart) => {
        this._applyCart(cart, { preserveOrder: true });
        this._removePendingItem(itemId);
      },
      error: () => {
        this._restore(snapshot);
        this._removePendingItem(itemId);
      },
    });
  }

  clear(): void {
    if (this._isLoading()) return;

    if (!this._isAuthenticated()) {
      this._items.set([]);
      this._meta.set(EMPTY_META);
      localStorage.removeItem(LOCAL_CART_KEY);
      return;
    }

    const cartId = this._cartId();
    if (!cartId) return;

    const snapshot = this._snapshot();
    this._items.set([]);
    this._meta.set(EMPTY_META);
    this._isLoading.set(true);

    this.cartService.clearCart(cartId).subscribe({
      next: (cart) => {
        this._applyCart(cart);
        this._isLoading.set(false);
      },
      error: () => {
        this._restore(snapshot);
        this._isLoading.set(false);
      },
    });
  }

  merge(): void {
    const items = this._items().map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    if (items.length === 0) {
      this.loadCart(true);
      return;
    }

    this.cartService.mergeCart(items).subscribe({
      next: (cart) => {
        this._applyCart(cart);
        localStorage.removeItem(LOCAL_CART_KEY);
      },
      error: () => {
        this.loadCart(true);
      },
    });
  }

  getLocalItemsForMerge(): { productId: string; quantity: number }[] {
    return this._items().map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));
  }

  clearLocalCart(): void {
    localStorage.removeItem(LOCAL_CART_KEY);
    if (!this._isAuthenticated()) {
      this._items.set([]);
      this._meta.set(EMPTY_META);
    }
  }

  reset(): void {
    this._cartId.set(null);
    this._items.set([]);
    this._meta.set(EMPTY_META);
    this._isLoaded.set(false);
    this._isLoading.set(false);
    this._pendingProductIds.set(new Set());
    this._pendingItemIds.set(new Set());
  }

  private _applyCart(
    cart: CartResponse,
    options?: { preserveOrder?: boolean },
  ): void {
    let items = cart.items;

    if (options?.preserveOrder) {
      items = this._mergeItemsPreservingOrder(this._items(), cart.items);
    }

    this._cartId.set(cart.id);
    this._items.set(items);
    this._meta.set(cart.meta);
    this._isLoaded.set(true);
    this._isLoading.set(false);
  }

  /** Mantiene el orden visual al sincronizar con el servidor. */
  private _mergeItemsPreservingOrder(
    current: CartItem[],
    incoming: CartItem[],
  ): CartItem[] {
    if (current.length === 0) return incoming;

    const byId = new Map(incoming.map((i) => [i.id, i]));
    const byProductId = new Map(incoming.map((i) => [i.productId, i]));
    const ordered: CartItem[] = [];
    const used = new Set<string>();

    for (const cur of current) {
      const match =
        byId.get(cur.id) ??
        (cur.id.startsWith('optimistic-')
          ? byProductId.get(cur.productId)
          : undefined);

      if (match && !used.has(match.id)) {
        ordered.push(match);
        used.add(match.id);
      }
    }

    for (const item of incoming) {
      if (!used.has(item.id)) {
        ordered.push(item);
        used.add(item.id);
      }
    }

    return ordered;
  }

  private _snapshot(): {
    cartId: string | null;
    items: CartItem[];
    meta: CartMeta;
  } {
    return {
      cartId: this._cartId(),
      items: [...this._items()],
      meta: { ...this._meta() },
    };
  }

  private _restore(snapshot: {
    cartId: string | null;
    items: CartItem[];
    meta: CartMeta;
  }): void {
    this._cartId.set(snapshot.cartId);
    this._items.set(snapshot.items);
    this._meta.set(snapshot.meta);
  }

  private _recalcMeta(items: CartItem[]): CartMeta {
    const itemCount = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    return { itemCount, totalQuantity, subtotal };
  }

  private _optimisticAdd(
    productId: string,
    quantity: number,
    productData?: Datum,
  ): void {
    const items = [...this._items()];
    const existing = items.find((i) => i.productId === productId);
    const cartId = this._cartId() ?? 'pending';

    if (existing) {
      const unitPrice = existing.unitPrice;
      const newQty = existing.quantity + quantity;
      existing.quantity = newQty;
      existing.lineTotal = unitPrice * newQty;
    } else if (productData) {
      const unitPrice = Number(productData.price);
      items.push({
        id: `optimistic-${productId}`,
        cartId,
        productId,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
        product: productData,
      });
    }

    this._items.set(items);
    this._meta.set(this._recalcMeta(items));
  }

  private _optimisticUpdateQuantity(itemId: string, quantity: number): void {
    const items = this._items().map((item) => {
      if (item.id !== itemId) return item;
      const lineTotal = item.unitPrice * quantity;
      return { ...item, quantity, lineTotal };
    });
    this._items.set(items);
    this._meta.set(this._recalcMeta(items));
  }

  private _optimisticRemoveItem(itemId: string): void {
    const items = this._items().filter((i) => i.id !== itemId);
    this._items.set(items);
    this._meta.set(this._recalcMeta(items));
  }

  private _removePendingProduct(productId: string): void {
    this._pendingProductIds.update((set) => {
      const next = new Set(set);
      next.delete(productId);
      return next;
    });
  }

  private _removePendingItem(itemId: string): void {
    this._pendingItemIds.update((set) => {
      const next = new Set(set);
      next.delete(itemId);
      return next;
    });
  }
}
