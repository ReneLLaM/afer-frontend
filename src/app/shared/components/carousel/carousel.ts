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
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel<T = unknown> {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  items = input.required<T[]>();
  title = input<string>('');
  numVisible = input<number>(4);
  numScroll = input<number>(1);
  showIndicators = input<boolean>(true);
  circular = input<boolean>(false);
  autoplayInterval = input<number>(0);

  @ContentChild('carouselItem', { static: false })
  itemTemplate!: TemplateRef<unknown>;

  track = viewChild<ElementRef<HTMLDivElement>>('track');

  currentPage = signal(0);
  private actualVisible = signal(4);

  totalPages = computed(() => {
    const len = this.items().length;
    const vis = this.actualVisible();
    const scroll = this.numScroll();
    if (len <= vis) return 1;
    return Math.ceil((len - vis) / scroll) + 1;
  });

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));
  isFirst = computed(() => this.currentPage() === 0);
  isLast = computed(() => this.currentPage() >= this.totalPages() - 1);

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;

  private breakpoints = [
    { max: 767, visible: 2 },
    { max: 1023, visible: 3 },
    { max: Infinity, visible: 4 },
  ];

  constructor() {
    effect(() => {
      const nv = this.numVisible();
      this.breakpoints[this.breakpoints.length - 1].visible = nv;
      if (typeof window !== 'undefined') {
        this.updateVisibleFromWidth(window.innerWidth);
      }
    });

    effect(() => {
      const _ = this.items();
      this.currentPage.set(0);
    });

    afterNextRender(
      () => {
        this.updateVisibleFromWidth(window.innerWidth);
        window.addEventListener('resize', this.onResize);

        const interval = this.autoplayInterval();
        if (interval > 0) {
          this.startAutoplay(interval);
        }
      },
      { injector: this.injector },
    );

    window.removeEventListener.bind(window);
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

  next(): void {
    const page = this.currentPage();
    const max = this.totalPages() - 1;
    if (page < max) {
      this.currentPage.set(page + 1);
    } else if (this.circular()) {
      this.currentPage.set(0);
    }
  }

  prev(): void {
    const page = this.currentPage();
    if (page > 0) {
      this.currentPage.set(page - 1);
    } else if (this.circular()) {
      this.currentPage.set(this.totalPages() - 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getTrackTransform(): string {
    const page = this.currentPage();
    const scroll = this.numScroll();
    const vis = this.actualVisible();
    const total = this.items().length;

    const itemPercent = 100 / vis;
    let offset = page * scroll * itemPercent;

    const maxOffset = (total - vis) * itemPercent;
    offset = Math.min(offset, Math.max(0, maxOffset));

    return `translateX(-${offset}%)`;
  }

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
