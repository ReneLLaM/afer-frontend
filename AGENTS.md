# Afer Bolivia — Angular Best Practices Agent

> **Propósito**: Guía de arquitectura, rendimiento, gestión de estado y código limpio para el frontend de Afer Bolivia. Todo agente o desarrollador debe seguir estas reglas al crear, modificar o refactorizar código Angular.

---

## 1. Rol y Alcance

Este agente rige **todo el código TypeScript/Angular** del proyecto frontend. Aplica a:
- Components, directives, pipes
- Services, guards, interceptors
- Routing, lazy loading
- State management (signals, stores)
- HTTP layer, caching, error handling

**No cubre**: Estilos CSS/SCSS, diseño UI/UX, sistema de colores (ver `AGENTS-STYLES.md`). Listados admin (tabla, búsqueda, paginación): ver `AGENTS-DATA-LIST.md`.

---

## 2. Reglas de Arquitectura

### 2.1 Standalone Components (obligatorio)

```typescript
@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, ProductImagePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard { }
```

- **NUNCA** crear NgModules
- Todos los componentes son standalone por defecto
- Imports explícitos en el decorator

### 2.2 Estructura de carpetas por dominio

```
modules/
  01-identity/
    auth/
      pages/
      components/
      services/
      interfaces/
      stores/
  02-core/
  03-commerce/
    ecommerce/
      pages/
      components/
      services/
      interfaces/      ← Interfaces y types de API
      stores/          ← Signal stores (si aplica)
```

**Reglas**:
- `pages/` → Componentes ruteables (lazy loaded)
- `components/` → Componentes reutilizables del feature
- `services/` → Servicios inyectables con `inject()`
- `interfaces/` → Interfaces y types para contratos de API
- `stores/` → Signal stores solo si el estado justifica complejidad

### 2.3 Services inyectables

```typescript
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
}
```

- Usar `inject()` en lugar de constructor injection
- `providedIn: 'root'` por defecto (singleton)
- Servicios específicos de feature: `providedIn: 'any'` o provider en ruta
- **NUNCA** lógica de UI en services

### 2.4 Signals para estado local

```typescript
@Component({ /* ... */ })
export class ProductsPage {
  private productsService = inject(ProductsService);

  // Estado
  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Derivados
  totalProducts = computed(() => this.products().length);
  hasError = computed(() => this.error() !== null);

  // Efectos (solo side effects justificados)
  constructor() {
    effect(() => {
      if (this.hasError()) {
        console.error('Products error:', this.error());
      }
    });
  }
}
```

- `signal()` para estado mutable
- `computed()` para valores derivados
- `effect()` solo para side effects (log, sync con DOM externo)
- **NUNCA** usar `BehaviorSubject` para estado nuevo

### 2.5 Input/Output con signal API

```typescript
@Component({ /* ... */ })
export class ProductCard {
  product = input.required<Product>();
  showQuickAdd = input<boolean>(true);

  addToCart = output<string>();
  favoriteToggle = output<string>();

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product().id);
  }
}
```

- Usar `input()`, `input.required()`, `output()` de Angular v17+
- **NO** usar `@Input()` / `@Output()` decorators legacy

---

## 3. Reglas de Rendimiento

### 3.1 OnPush en TODOS los componentes

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

- **Sin excepción**. Todo componente debe tener OnPush
- Si algo no se actualiza, el problema es de reactividad (signals mal usados), no de detección de cambios

### 3.2 Track en @for

```html
@for (product of products(); track product.id) {
  <product-card [product]="product" />
}
```

- **NUNCA** usar `track $index` salvo que la lista sea estática
- El track debe ser un identificador único y estable

### 3.3 Lazy loading en TODAS las rutas

```typescript
// app.routes.ts
{
  path: 'productos',
  loadComponent: () => import('./pages/products-page/products-page').then(m => m.ProductsPage),
}

// Con layout
{
  path: '',
  component: ShopLayout,
  children: [
    {
      path: '',
      loadComponent: () => import('./pages/home-page/home-page').then(m => m.HomePage),
    },
  ],
}
```

- **NUNCA** importar componentes de páginas directamente en rutas
- Usar `loadComponent` para páginas, `loadChildren` para feature modules de rutas

### 3.4 Destrucción automática de subscriptions

```typescript
// Opción 1: takeUntilDestroyed (preferida)
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class ProductsPage {
  private destroyRef = inject(DestroyRef);

  loadData(): void {
    this.service.getProducts().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.products.set(data));
  }
}
```

- Usar `takeUntilDestroyed()` en todos los `.subscribe()`
- Si el componente es standalone, `takeUntilDestroyed()` sin argumentos usa el DestroyRef del injector
- **NUNCA** hacer `.subscribe()` sin mecanismo de cleanup

### 3.5 Preferir toSignal() y async pipe

```typescript
// toSignal para convertir Observable a Signal
productsSignal = toSignal(this.productsService.getProducts(options), {
  initialValue: [],
  requireSync: false,
});

// En template
@for (product of productsSignal(); track product.id) { }
```

- `toSignal()` cuando necesitas el valor en el TS
- `async` pipe cuando solo lo usas en el template
- **EVITAR** `.subscribe()` manual si puedes usar `toSignal()`

### 3.6 Prohibido markForCheck salvo justificación

- Si necesitas `markForCheck()`, hay un problema de arquitectura
- Excepción: integración con librerías externas que modifican el DOM fuera de Zoneless

---

## 4. Estrategia de Caché

### 4.1 HttpInterceptor de caché (por implementar)

```typescript
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

export interface CacheConfig {
  ttlMs: number;
  includeParams?: boolean;
}

export const CACHE_CONFIG = new InjectionToken<Map<string, CacheConfig>>('CACHE_CONFIG');

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, { response: HttpResponse<any>, timestamp: number }>();
  private pendingRequests = new Map<string, Observable<HttpEvent<any>>>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') {
      // Invalidar caché en mutations
      this.invalidateCache(req.url);
      return next.handle(req);
    }

    const cacheKey = this.buildCacheKey(req);
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < this.getTtlForUrl(req.url))) {
      return of(cached.response);
    }

    // Cancelar requests duplicados
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const request$ = next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(cacheKey, { response: event, timestamp: Date.now() });
          this.pendingRequests.delete(cacheKey);
        }
      })
    );

    this.pendingRequests.set(cacheKey, request$);
    return request$;
  }

  private buildCacheKey(req: HttpRequest<any>): string {
    return `${req.urlWithParams}`;
  }

  private getTtlForUrl(url: string): number {
    // Default 60s, configurable via CACHE_CONFIG
    return 60_000;
  }

  private invalidateCache(url: string): void {
    // Invalidar keys relacionadas con el recurso
    for (const key of this.cache.keys()) {
      if (key.includes(url.split('/').slice(0, -1).join('/'))) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 4.2 shareReplay para observables compartidos

```typescript
// HomeService — banners se comparten entre múltiples componentes
private banners$?: Observable<BannerResponse[]>;

getPublicBanners(): Observable<BannerResponse[]> {
  if (!this.banners$) {
    this.banners$ = this.http.get<BannerResponse[]>(`${this.baseUrl}/banners/public`).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
  return this.banners$;
}
```

- `shareReplay(1)` o `shareReplay({ bufferSize: 1, refCount: true })` para evitar requests duplicados
- `refCount: true` para liberar la subscription cuando no hay subscribers

### 4.3 switchMap para GETs, nunca mergeMap

```typescript
// CORRECTO: cancela la request anterior si cambian los params
searchResults$ = this.searchTerm$.pipe(
  debounceTime(300),
  switchMap(term => this.productsService.search(term)),
);

// INCORRECTO: acumula requests concurrentes
searchResults$ = this.searchTerm$.pipe(
  mergeMap(term => this.productsService.search(term)), // NO
);
```

### 4.4 Cache invalidation en mutations

```typescript
createProduct(dto: CreateProductDto): Observable<Product> {
  return this.http.post<Product>(`${this.baseUrl}/products`, dto).pipe(
    tap(() => {
      // Invalidar caché de products list
      this.cacheInvalidationService.invalidate('products');
    })
  );
}
```

- POST/PUT/DELETE deben invalidar caché del recurso afectado
- Implementar servicio de invalidación o usar el interceptor

### 4.5 httpResource() (Angular v21+)

```typescript
// Cuando Angular v21+ lo soporte, preferir httpResource sobre manual
products = httpResource<Product[]>(
  () => `${this.baseUrl}/products/public?limit=20`,
  { defaultValue: [] }
);
```

- `httpResource()` maneja loading, error, y caché automáticamente
- Usar cuando la versión de Angular lo permita (v21+)

---

## 5. Gestión de Estado

### 5.1 Jerarquía de estado

| Alcance | Herramienta | Cuándo usar |
|---------|-------------|-------------|
| Componente local | `signal()`, `computed()` | Estado de un solo componente |
| Feature compartido | Signal Store o servicio con signals | Estado compartido entre componentes de un feature |
| Global app | `@ngrx/signals` o servicio root | Estado que cruza múltiples features (auth, carrito) |

### 5.2 NO usar BehaviorSubject para estado nuevo

```typescript
// ANTES (incorrecto)
private productsSubject = new BehaviorSubject<Product[]>([]);
products$ = this.productsSubject.asObservable();

// DESPUÉS (correcto)
products = signal<Product[]>([]);
```

- Migrar BehaviorSubject existentes a `signal()`
- Si necesitas un Observable, usar `toObservable(signal)`

### 5.3 Signal Store (solo si justifica)

```typescript
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';

interface CartState {
  items: CartItem[];
  loading: boolean;
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [], loading: false }),
  withComputed(({ items }) => ({
    totalItems: computed(() => items().reduce((sum, item) => sum + item.quantity, 0)),
    totalPrice: computed(() => items().reduce((sum, item) => sum + item.price * item.quantity, 0)),
  })),
  withMethods((store, cartService = inject(CartService)) => ({
    addItem(product: Product) {
      // ...
    },
  }))
);
```

- Usar `@ngrx/signals` solo si el estado tiene más de 3 señales relacionadas y múltiples consumers
- Para estado simple: signals directamente en el componente

---

## 6. Estándares de Código

### 6.1 Tipos estrictos

```typescript
// tsconfig.json debe tener:
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 6.2 Prohibido `any` salvo imposibilidad documentada

```typescript
// INCORRECTO
handleData(data: any) { }

// CORRECTO
interface ApiResponse<T> {
  data: T;
  meta: { total: number; page: number };
}

handleData(data: ApiResponse<Product[]>) { }

// Si es IMPOSIBLE tipar (documentar motivo)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: Third-party library returns dynamic JSON schema
handleDynamic(data: any) { }
```

### 6.3 Interfaces para contratos de API

```typescript
// interfaces/product.interface.ts
export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  images: string[];
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}
```

### 6.4 Types para unions y aliases

```typescript
export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type SortOrder = 'ASC' | 'DESC';
export type ProductCardLayout = 'original' | 'v2' | 'mini';
```

### 6.5 Funciones puras en utils

```typescript
// utils/product.utils.ts
export function formatPrice(price: number, currency: string = 'BOB'): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export function getProductImageUrl(images: string[]): string | null {
  return images.length > 0 ? images[0] : null;
}
```

- Sin efectos secundarios
- Mismo input → mismo output siempre
- No mutan argumentos

### 6.6 Control flow nuevo (no *ngIf / *ngFor)

```html
@if (loading()) {
  <skeleton-card [count]="6" />
} @else if (hasError()) {
  <error-state [message]="error()" />
} @else {
  @for (product of products(); track product.id) {
    <product-card [product]="product" />
  } @empty {
    <empty-state message="No se encontraron productos" />
  }
}
```

### 6.7 Naming conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Component selector | kebab-case | `product-card` |
| Component class | PascalCase | `ProductCard` |
| Service class | PascalCase + Service | `ProductsService` |
| Interface | PascalCase | `ProductResponse` |
| Type alias | PascalCase | `ProductStatus` |
| Variable/función | camelCase | `getProducts` |
| Constant | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| Enum | PascalCase | `SortOrder` |
| Private property | camelCase con `_` opcional | `private http` o `private _http` |

### 6.8 Orden de imports

```typescript
// 1. Angular core
import { Component, inject, signal } from '@angular/core';

// 2. Angular modules
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// 3. RxJS
import { Observable, switchMap, tap } from 'rxjs';

// 4. Internal - absolute paths
import { Product } from '../../interfaces/product.interface';
import { ProductsService } from '../../services/products.service';

// 5. Internal - relative paths
import { ProductCard } from '../components/product-card/product-card';
```

---

## 7. Patrones de Referencia

### 7.1 Page component con carga de datos

```typescript
import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'products-page',
  standalone: true,
  imports: [/* ... */],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private productsService = inject(ProductsService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);

  products = toSignal<Product[]>(
    this.route.queryParams.pipe(
      switchMap(params => {
        this.loading.set(true);
        this.error.set(null);
        return this.productsService.getProducts({
          limit: Number(params['limit'] ?? 20),
          offset: Number(params['offset'] ?? 0),
          search: params['search'],
          categories: params['categories']?.split(','),
          brands: params['brands']?.split(','),
        }).pipe(
          tap({
            next: () => this.loading.set(false),
            error: (err) => {
              this.loading.set(false);
              this.error.set(err.message ?? 'Error desconocido');
            },
          })
        );
      })
    ),
    { initialValue: [] }
  );

  totalProducts = computed(() => this.products().length);
  hasProducts = computed(() => this.totalProducts() > 0);
}
```

### 7.2 Smart + Presentational pattern

```typescript
// Smart component (page)
@Component({
  selector: 'products-page',
  standalone: true,
  imports: [ProductList, ProductFilters],
  template: `
    <product-filters
      (filterChange)="onFilterChange($event)"
    />
    <product-list
      [products]="products()"
      [loading]="loading()"
      (addToCart)="onAddToCart($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage { /* ... */ }

// Presentational component
@Component({
  selector: 'product-list',
  standalone: true,
  imports: [ProductCard],
  template: `
    @for (product of products(); track product.id) {
      <product-card
        [product]="product"
        (addToCart)="addToCart.emit($event)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList {
  products = input.required<readonly Product[]>();
  addToCart = output<string>();
}
```

### 7.3 Service con caché + invalidation

```typescript
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  getProducts(options: ProductsQuery): Observable<ProductsResponse> {
    const key = JSON.stringify(options);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return of(cached.data as ProductsResponse);
    }

    return this.http.get<ProductsResponse>(`${this.baseUrl}/products/public`, {
      params: this.buildParams(options),
    }).pipe(
      tap(response => this.cache.set(key, { data: response, timestamp: Date.now() }))
    );
  }

  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, dto).pipe(
      tap(() => this.cache.clear()) // Invalidar todo el caché de products
    );
  }

  private buildParams(options: ProductsQuery): HttpParams {
    let params = new HttpParams();
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.offset) params = params.set('offset', options.offset.toString());
    if (options.search) params = params.set('search', options.search);
    return params;
  }
}
```

---

## 8. Anti-patrones (NO HACER)

### 8.1 Arquitectura
- ❌ No crear NgModules
- ❌ No usar `@Input()` / `@Output()` legacy (usar signal API)
- ❌ No poner lógica de UI en services
- ❌ No importar componentes directamente en rutas (usar lazy loading)

### 8.2 Rendimiento
- ❌ No omitir `changeDetection: ChangeDetectionStrategy.OnPush`
- ❌ No usar `track $index` en @for con listas dinámicas
- ❌ No hacer `.subscribe()` sin `takeUntilDestroyed()`
- ❌ No usar `markForCheck()` como parche de reactividad rota

### 8.3 HTTP y Caché
- ❌ No usar `mergeMap` para GETs (usar `switchMap`)
- ❌ No hacer requests duplicados (usar `shareReplay`)
- ❌ No olvidar invalidar caché en mutations
- ❌ No hardcodear URLs de API (usar `environment.baseUrl`)

### 8.4 Tipos
- ❌ No usar `any` sin documentar el motivo
- ❌ No usar `Object` como tipo (usar `unknown` o interfaz específica)
- ❌ No omitir tipos de retorno en funciones públicas

---

## 9. Checklist de Code Review

### Antes de commitear:
- [ ] ¿El componente tiene `changeDetection: ChangeDetectionStrategy.OnPush`?
- [ ] ¿Usa `input()` / `output()` en lugar de `@Input()` / `@Output()`?
- [ ] ¿Los @for tienen `track` con ID único?
- [ ] ¿Las rutas usan `loadComponent` / `loadChildren`?
- [ ] ¿Las subscriptions tienen `takeUntilDestroyed()`?
- [ ] ¿No hay `any` sin justificación?
- [ ] ¿Los servicios usan `inject()`?
- [ ] ¿Hay caché para GETs repetitivos?
- [ ] ¿Las mutations invalidan caché?
- [ ] ¿Los tipos son estrictos (noImplicitAny)?

---

## 10. Pipes y Utilidades (Especial Ecommerce)

### 10.1 Product Image Pipe
Para renderizar las imágenes de los productos en plantillas, utilizar obligatoriamente el pipe `productImage`. Este pipe se encarga de transformar de manera segura un array de strings en la URL adecuada:
```html
<img [src]="product.images | productImage" />
```

### 10.2 Slice Pipe para truncamiento preventivo
Para truncamientos estables directamente en el HTML (por ejemplo, categorías secundarias o textos largos que no se deseen gestionar por CSS `text-overflow`), usar el pipe `slice` estándar de Angular:
```html
{{ product.sku.length > 12 ? (product.sku | slice: 0 : 12) + '...' : product.sku }}
```

---

*Última actualización: Mayo 2026*
*Angular v21 | Este documento es vivo y debe actualizarse con cada mejora de arquitectura.*
