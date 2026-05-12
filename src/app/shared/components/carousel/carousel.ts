import {
  Component,
  ContentChild,
  ElementRef,
  TemplateRef,
  afterNextRender,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Carousel genérico y reutilizable.
 *
 * USO:
 * ```html
 * <app-carousel [items]="myItems()" [title]="'Productos Relacionados'">
 *   <ng-template #carouselItem let-item>
 *     <product-card [product]="item"></product-card>
 *   </ng-template>
 * </app-carousel>
 * ```
 *
 * Funciona con cualquier tipo de card (product, category, brand, etc.)
 */
@Component({
  selector: 'app-carousel',
  imports: [NgTemplateOutlet],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel {
  private readonly injector = inject(Injector);

  /** Array de items de cualquier tipo. */
  items = input.required<any[]>();

  /** Título opcional que se muestra arriba del carrusel. */
  title = input<string>('');

  /** Cuántos items mostrar a la vez (desktop). */
  numVisible = input<number>(4);

  /** Cuántos items se desplazan por click. */
  numScroll = input<number>(1);

  /** Si muestra los indicadores (dots) debajo. */
  showIndicators = input<boolean>(true);

  /** Si el carrusel hace loop infinito. */
  circular = input<boolean>(false);

  /** Tiempo en ms de autoplay. 0 = desactivado. */
  autoplayInterval = input<number>(0);

  /** Template que el consumidor provee para renderizar cada item. */
  @ContentChild('carouselItem', { static: false })
  itemTemplate!: TemplateRef<any>;

  /** Referencia al track (la tira de items). */
  track = viewChild<ElementRef<HTMLDivElement>>('track');

  /** Página actual (0-indexed). */
  currentPage = signal(0);

  /** Cuántos items se ven realmente (responsive). */
  private actualVisible = signal(4);

  /** Total de páginas. */
  totalPages = computed(() => {
    const len = this.items()?.length ?? 0;
    const vis = this.actualVisible();
    const scroll = this.numScroll();
    if (len <= vis) return 1;
    return Math.ceil((len - vis) / scroll) + 1;
  });

  /** Indicadores (dots). */
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  /** Si estamos en la primera página. */
  isFirst = computed(() => this.currentPage() === 0);

  /** Si estamos en la última página. */
  isLast = computed(() => this.currentPage() >= this.totalPages() - 1);

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;

  /**
   * Breakpoints que replican el grid de products-page:
   *   < 768px  → 2 columnas
   *   < 1024px → 3 columnas
   *   >= 1024  → numVisible (default 4)
   */
  private breakpoints = [
    { max: 767, visible: 2 },
    { max: 1023, visible: 3 },
    { max: Infinity, visible: 4 },
  ];

  constructor() {
    // Sincronizar actualVisible con numVisible input
    effect(() => {
      const nv = this.numVisible();
      this.breakpoints[this.breakpoints.length - 1].visible = nv;
      if (typeof window !== 'undefined') {
        this.updateVisibleFromWidth(window.innerWidth);
      }
    });

    // Reset page cuando cambian los items
    effect(() => {
      const _ = this.items();
      this.currentPage.set(0);
    });

    afterNextRender(
      () => {
        this.updateVisibleFromWidth(window.innerWidth);
        window.addEventListener('resize', this.onResize);

        // Autoplay
        const interval = this.autoplayInterval();
        if (interval > 0) {
          this.startAutoplay(interval);
        }
      },
      { injector: this.injector },
    );
  }

  private onResize = () => {
    this.updateVisibleFromWidth(window.innerWidth);
  };

  private updateVisibleFromWidth(width: number): void {
    for (const bp of this.breakpoints) {
      if (width <= bp.max) {
        this.actualVisible.set(bp.visible);
        break;
      }
    }

    // Clamp current page
    const maxPage = this.totalPages() - 1;
    if (this.currentPage() > maxPage) {
      this.currentPage.set(Math.max(0, maxPage));
    }
  }

  private startAutoplay(interval: number): void {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (this.isLast() && !this.circular()) {
        this.currentPage.set(0);
      } else {
        this.next();
      }
    }, interval);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  /** Ir a la página siguiente. */
  next(): void {
    const page = this.currentPage();
    const max = this.totalPages() - 1;
    if (page < max) {
      this.currentPage.set(page + 1);
    } else if (this.circular()) {
      this.currentPage.set(0);
    }
  }

  /** Ir a la página anterior. */
  prev(): void {
    const page = this.currentPage();
    if (page > 0) {
      this.currentPage.set(page - 1);
    } else if (this.circular()) {
      this.currentPage.set(this.totalPages() - 1);
    }
  }

  /** Ir a una página específica. */
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  /** Cálculo del translateX del track. */
  getTrackTransform(): string {
    const page = this.currentPage();
    const scroll = this.numScroll();
    const vis = this.actualVisible();
    const total = this.items()?.length ?? 0;

    // Porcentaje que ocupa cada item
    const itemPercent = 100 / vis;
    let offset = page * scroll * itemPercent;

    // No desplazar más allá del último item visible
    const maxOffset = (total - vis) * itemPercent;
    offset = Math.min(offset, Math.max(0, maxOffset));

    return `translateX(-${offset}%)`;
  }

  /** Ancho de cada item según el número visible. */
  getItemWidth(): string {
    return `${100 / this.actualVisible()}%`;
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
    this.stopAutoplay();
  }

  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const dx = endX - this.touchStartX;
    const threshold = 50;
    if (dx < -threshold) this.next();
    else if (dx > threshold) this.prev();

    // Restart autoplay if active
    const interval = this.autoplayInterval();
    if (interval > 0) this.startAutoplay(interval);
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }
}
