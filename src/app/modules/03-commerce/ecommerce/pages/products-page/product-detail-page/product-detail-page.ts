import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { BreadcrumbService } from '../../../../../../shared/components/breadcrumb/breadcrumb.service';
import { SafeHtmlPipe } from '../../../../../../shared/pipes/safe-html.pipe';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'product-detail-page',
  imports: [RouterLink, SafeHtmlPipe],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage {
  activatedRoute = inject(ActivatedRoute);
  productService = inject(ProductsService);
  breadcrumbService = inject(BreadcrumbService);

  productSlug = this.activatedRoute.snapshot.paramMap.get('slug');

  productResource = rxResource({
    params: () => ({ slug: this.productSlug }),
    stream: ({ params }) => {
      return this.productService.getProductById(params.slug!).pipe(
        catchError(() => of(null)), // Si hay un error (ej. 404), retornamos null para salir del estado "loading"
      );
    },
  });

  product = computed(() => this.productResource.value());
  isLoading = computed(() => this.productResource.isLoading());
  // Si terminó de cargar y no hay producto, asumimos que es un error (404)
  isError = computed(() => !this.isLoading() && this.product() === null);

  /** Índice de la imagen grande (miniaturas y flechas sincronizadas). */
  activeImageIndex = signal(0);

  imageCount = computed(() => this.product()?.images?.length ?? 0);

  hasMultipleImages = computed(() => this.imageCount() > 1);

  currentMainImageUrl = computed(() => {
    const p = this.product();
    const i = this.activeImageIndex();
    return p?.images?.[i] ?? '';
  });

  private touchStartX = 0;

  selectImage(index: number): void {
    const n = this.imageCount();
    if (n === 0) return;
    this.activeImageIndex.set(Math.max(0, Math.min(index, n - 1)));
  }

  prevImage(): void {
    const n = this.imageCount();
    if (n <= 1) return;
    const i = this.activeImageIndex();
    if (i > 0) this.activeImageIndex.set(i - 1);
  }

  nextImage(): void {
    const n = this.imageCount();
    if (n <= 1) return;
    const i = this.activeImageIndex();
    if (i < n - 1) this.activeImageIndex.set(i + 1);
  }

  canGoPrev = computed(() => this.activeImageIndex() > 0);

  canGoNext = computed(
    () =>
      this.imageCount() > 1 &&
      this.activeImageIndex() < this.imageCount() - 1,
  );

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
    // Escuchamos cuando el producto se carga y reemplazamos el UUID por su nombre
    effect(() => {
      const data = this.product();
      // Si la API es lenta o estamos usando any, asegúrate de acceder a los campos correctos.
      // Como tu observable devuelve ProductResponse directamente, 'data' es el producto.
      if (data && data.title) {
        // La URL actual es /productos/SLUG
        const currentUrl = `/productos/${this.productSlug}`;
        this.breadcrumbService.setDynamicLabel(currentUrl, data.title);

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
