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

@Component({
  selector: 'product-detail-page',
  imports: [RouterLink, SafeHtmlPipe, ProductCard, Carousel],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage {
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  activatedRoute = inject(ActivatedRoute);
  productService = inject(ProductsService);
  breadcrumbService = inject(BreadcrumbService);

  lightboxCloseBtn = viewChild<ElementRef<HTMLButtonElement>>('lightboxClose');

  /** Slug reactivo: se actualiza cuando el usuario navega a otro producto. */
  productSlug = toSignal(
    this.activatedRoute.paramMap.pipe(map((pm) => pm.get('slug'))),
  );

  productResource = rxResource({
    params: () => ({ slug: this.productSlug() }),
    stream: ({ params }) => {
      if (!params.slug) return of(null);
      return this.productService.getProductById(params.slug).pipe(
        catchError(() => of(null)),
      );
    },
  });

  product = computed(() => this.productResource.value());
  isLoading = computed(() => this.productResource.isLoading());
  // Si terminó de cargar y no hay producto, asumimos que es un error (404)
  isError = computed(() => !this.isLoading() && this.product() === null);

  relatedProductsResource = rxResource({
    params: () => ({ product: this.product() }),
    stream: ({ params }) => {
      const p = params.product;
      if (!p || !p.categories || p.categories.length === 0) {
        return of(null);
      }
      const categorySlugs = p.categories.map((c: any) => c.slug);
      return this.productService.getProducts({ limit: 10, categories: categorySlugs }).pipe(
        catchError(() => of(null))
      );
    },
  });

  relatedProducts = computed(() => {
    const data = this.relatedProductsResource.value()?.data || [];
    const currentId = this.product()?.id;
    return data.filter((p: any) => p.id !== currentId).slice(0, 4);
  });

  /** Índice de la imagen grande (miniaturas y flechas sincronizadas). */
  activeImageIndex = signal(0);

  imageCount = computed(() => this.product()?.images?.length ?? 0);

  hasMultipleImages = computed(() => this.imageCount() > 1);

  currentMainImageUrl = computed(() => {
    const p = this.product();
    const i = this.activeImageIndex();
    return p?.images?.[i] ?? '';
  });

  /** Transición suave al cambiar de imagen (galería y lightbox). */
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
      .subscribe((ev) => {
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

    // Escuchamos cuando el producto se carga y reemplazamos el UUID por su nombre
    effect(() => {
      const data = this.product();
      // Si la API es lenta o estamos usando any, asegúrate de acceder a los campos correctos.
      // Como tu observable devuelve ProductResponse directamente, 'data' es el producto.
      if (data && data.title) {
        // La URL actual es /productos/SLUG
        const currentUrl = `/productos/${this.productSlug()}`;
        this.breadcrumbService.setDynamicLabel(currentUrl, data.title);

        // Scroll al inicio al cambiar de producto
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Si tiene videos de TikTok, cargamos el script oficial para que calcule alturas y evite redirecciones
        if (data.videos && data.videos.length > 0) {
          setTimeout(() => {
            const oldScript = document.getElementById('tiktok-embed-script');
            if (oldScript) {
              oldScript.remove();
            }
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
