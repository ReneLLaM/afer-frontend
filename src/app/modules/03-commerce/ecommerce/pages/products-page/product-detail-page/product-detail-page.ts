import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreadcrumbService } from '../../../../../../shared/components/breadcrumb/breadcrumb.service';
import { SafeHtmlPipe } from '../../../../../../shared/pipes/safe-html.pipe';
import { catchError, fromEvent, map, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductCard } from '../../../components/product-card/product-card';
import { Carousel } from '../../../../../../shared/components/carousel/carousel';
import { ProductResponse } from '../interfaces/product-response.interface';
import { Datum } from '../interfaces/products-response.interface';
import { FavoritesStore } from '../../../../../../core/stores/favorites.store';
import { AuthStore } from '../../../../../01-identity/auth/store/auth.store';

@Component({
  selector: 'product-detail-page',
  standalone: true,
  imports: [RouterLink, SafeHtmlPipe, ProductCard, Carousel],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly productService = inject(ProductsService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly favoritesStore = inject(FavoritesStore);
  readonly authStore = inject(AuthStore);

  readonly isFavorite = computed(() => {
    const p = this.product() as ProductResponse | null | undefined;
    return p ? this.favoritesStore.isFavorite(p.id) : false;
  });

  readonly isToggling = computed(() => {
    const p = this.product() as ProductResponse | null | undefined;
    return p ? this.favoritesStore.isToggling(p.id) : false;
  });

  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const p = this.product() as ProductResponse | null | undefined;
    if (p) {
      // Usar 'any' temporalmente porque FavoritesStore requiere un Datum y ProductResponse tiene algunas diferencias tipológicas.
      this.favoritesStore.toggle(p.id, p as any);
    }
  }

  lightboxCloseBtn = viewChild<ElementRef<HTMLButtonElement>>('lightboxClose');

  productSlug = toSignal<string | null>(
    this.activatedRoute.paramMap.pipe(map(pm => pm.get('slug'))),
  );

  productResource = rxResource({
    params: () => ({ slug: this.productSlug() }),
    stream: ({ params }) => {
      if (!params.slug) return of(null as ProductResponse | null);
      return this.productService.getProductBySlug(params.slug).pipe(
        catchError(() => of(null as ProductResponse | null)),
      );
    },
  });

  product = computed(() => this.productResource.value());
  isLoading = computed(() => this.productResource.isLoading());
  isError = computed(() => !this.isLoading() && this.product() === null);

  relatedProductsResource = rxResource({
    params: () => ({ product: this.product() }),
    stream: ({ params }) => {
      const p = params.product;
      if (!p || !p.categories || p.categories.length === 0) {
        return of(null);
      }
      const categorySlugs = p.categories.map(c => c.slug);
      return this.productService.getProducts({ limit: 10, categories: categorySlugs }).pipe(
        catchError(() => of(null))
      );
    },
  });

  relatedProducts = computed((): Datum[] => {
    const data = this.relatedProductsResource.value()?.data || [];
    const currentId = this.product()?.id;
    return data.filter(p => p.id !== currentId).slice(0, 4);
  });

  activeImageIndex = signal(0);
  imageCount = computed(() => this.product()?.images?.length ?? 0);
  hasMultipleImages = computed(() => this.imageCount() > 1);

  currentMainImageUrl = computed(() => {
    const p = this.product();
    const i = this.activeImageIndex();
    return p?.images?.[i] ?? '';
  });

  imageFaded = signal(false);
  lightboxOpen = signal(false);

  private touchStartX = 0;
  private imageChangeBusy = false;
  private lastFocusEl: HTMLElement | null = null;

  private runImageChange(action: () => void): void {
    const n = this.imageCount();
    if (n <= 1) {
      action();
      return;
    }
    if (this.imageChangeBusy) return;
    this.imageChangeBusy = true;
    this.imageFaded.set(true);
    window.setTimeout(() => {
      action();
      requestAnimationFrame(() => {
        this.imageFaded.set(false);
        window.setTimeout(() => {
          this.imageChangeBusy = false;
        }, 200);
      });
    }, 120);
  }

  selectImage(index: number): void {
    const n = this.imageCount();
    if (n === 0) return;
    const clamped = Math.max(0, Math.min(index, n - 1));
    if (clamped === this.activeImageIndex()) return;
    this.runImageChange(() => this.activeImageIndex.set(clamped));
  }

  prevImage(): void {
    const n = this.imageCount();
    if (n <= 1) return;
    this.runImageChange(() => {
      const i = this.activeImageIndex();
      this.activeImageIndex.set(i <= 0 ? n - 1 : i - 1);
    });
  }

  nextImage(): void {
    const n = this.imageCount();
    if (n <= 1) return;
    this.runImageChange(() => {
      const i = this.activeImageIndex();
      this.activeImageIndex.set(i >= n - 1 ? 0 : i + 1);
    });
  }

  onGalleryKeydown(event: KeyboardEvent): void {
    if (!this.hasMultipleImages()) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextImage();
    }
  }

  openLightbox(): void {
    this.lastFocusEl = this.doc.activeElement as HTMLElement | null;
    this.lightboxOpen.set(true);
    this.doc.body.style.overflow = 'hidden';
    afterNextRender(
      () => {
        this.lightboxCloseBtn()?.nativeElement?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  closeLightbox(): void {
    if (!this.lightboxOpen()) return;
    this.lightboxOpen.set(false);
    this.doc.body.style.overflow = '';
    this.lastFocusEl?.focus({ preventScroll: true });
    this.lastFocusEl = null;
  }

  onLightboxBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeLightbox();
  }

  onViewportSlotKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openLightbox();
    }
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.hasMultipleImages()) return;
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.hasMultipleImages()) return;
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const dx = endX - this.touchStartX;
    const threshold = 48;
    if (dx < -threshold) this.nextImage();
    else if (dx > threshold) this.prevImage();
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.doc.body.style.overflow = '';
    });

    fromEvent<KeyboardEvent>(this.doc, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ev => {
        if (ev.key === 'Escape' && this.lightboxOpen()) {
          ev.preventDefault();
          this.closeLightbox();
          return;
        }
        if (!this.lightboxOpen() || !this.hasMultipleImages()) return;
        if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          this.prevImage();
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          this.nextImage();
        }
      });

    effect(() => {
      const data = this.product();
      if (data && data.title) {
        const currentUrl = `/productos/${this.productSlug()}`;
        this.breadcrumbService.setDynamicLabel(currentUrl, data.title);

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (data.videos && data.videos.length > 0) {
          setTimeout(() => {
            const oldScript = document.getElementById('tiktok-embed-script');
            if (oldScript) oldScript.remove();
            const script = document.createElement('script');
            script.id = 'tiktok-embed-script';
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
          }, 200);
        }
      }
    });

    effect(() => {
      const id = this.product()?.id;
      if (id) this.activeImageIndex.set(0);
    });
  }
}
