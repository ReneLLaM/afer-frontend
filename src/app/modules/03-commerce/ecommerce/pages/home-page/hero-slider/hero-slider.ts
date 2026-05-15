import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SliderService } from './slide.service';
import { HomeService } from '../../../services/home.service';
import { HeroSlideItem } from './hero-slide-item/hero-slide-item';
import { Slide, SlideQueryParams } from './slide.model';
import { BannerResponse } from '../interfaces/banner-response.interface';

type SlidePosition = 'prev2' | 'prev' | 'active' | 'next' | 'next2';
type Direction = 'left' | 'right' | null;

interface VisibleSlide {
  slide: Slide;
  position: SlidePosition;
}

interface DynamicStyle {
  transform?: string;
  opacity?: number;
  filter?: string;
  transition?: string;
  'pointer-events'?: string;
  'z-index'?: number;
}

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule, HeroSlideItem],
  templateUrl: './hero-slider.html',
  styleUrl: './hero-slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSlider implements OnDestroy {
  private sliderService = inject(SliderService);
  private homeService = inject(HomeService);
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('sliderTrack') set sliderTrack(content: ElementRef) {
    if (content) {
      this.initEventListeners(content.nativeElement);
    }
  }

  slides = signal<Slide[]>([]);
  currentIndex = signal(0);
  isLoading = signal(true);
  direction = signal<Direction>(null);
  isAnimating = signal(false);
  dragOffset = signal(0);
  isDragging = signal(false);
  autoplayEnabled = signal(true);

  private autoplayTimer: ReturnType<typeof setInterval> | undefined;
  private readonly AUTOPLAY_DELAY = 7000;

  private startX = 0;
  private startY = 0;
  private readonly SWIPE_THRESHOLD = 50;

  private startHandler!: (e: TouchEvent | MouseEvent) => void;
  private moveHandler!: (e: TouchEvent | MouseEvent) => void;
  private endHandler!: (e: TouchEvent | MouseEvent) => void;

  visibleSlides = computed<VisibleSlide[]>(() => {
    const all = this.slides();
    if (!all.length) return [];
    const total = all.length;
    const i = this.currentIndex();

    return [
      { slide: all[(i - 2 + total) % total], position: 'prev2' },
      { slide: all[(i - 1 + total) % total], position: 'prev' },
      { slide: all[i], position: 'active' },
      { slide: all[(i + 1) % total], position: 'next' },
      { slide: all[(i + 2) % total], position: 'next2' },
    ];
  });

  constructor() {
    this.loadSlides();
  }

  private loadSlides(): void {
    this.homeService.getPublicBanners().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (banners) => {
        if (!banners?.length) {
          this.loadMockSlides();
          return;
        }

        const mappedSlides = banners.map((b): Slide => {
          const queryParams: SlideQueryParams = {};
          if (b.categories?.length) queryParams.category = b.categories.join(',');
          if (b.brands?.length) queryParams.brand = b.brands.join(',');
          if (b.products?.length) queryParams.productIds = b.products.join(',');
          if (b.isFeatured) queryParams.isFeatured = 'true';
          if (b.isTrending) queryParams.isTrending = 'true';
          if (b.isNew) queryParams.isNew = 'true';

          return {
            id: b.id,
            title: b.title,
            description: b.description,
            image: b.image,
            ctaLabel: b.ctaLabel || 'Ver Productos',
            ctaLink: '/productos',
            queryParams,
          };
        });

        this.slides.set(mappedSlides);
        this.isLoading.set(false);
        this.startAutoplay();
      },
      error: () => this.loadMockSlides(),
    });
  }

  private loadMockSlides(): void {
    this.sliderService.getSlides().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      this.slides.set(data);
      this.isLoading.set(false);
      this.startAutoplay();
    });
  }

  private startAutoplay(): void {
    if (!this.autoplayEnabled()) return;
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (!this.isDragging() && !this.isAnimating()) {
        this.next();
      }
    }, this.AUTOPLAY_DELAY);
  }

  private stopAutoplay(permanently = false): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
    if (permanently) {
      this.autoplayEnabled.set(false);
    }
  }

  private initEventListeners(track: HTMLElement): void {
    this.cleanupListeners(track);

    this.startHandler = (e: TouchEvent | MouseEvent) => {
      if (this.isAnimating()) return;

      this.stopAutoplay(true);

      const touch = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.isDragging.set(true);
      this.dragOffset.set(0);
    };

    this.moveHandler = (e: TouchEvent | MouseEvent) => {
      if (!this.isDragging()) return;

      const touch = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      const deltaX = touch.clientX - this.startX;
      const deltaY = touch.clientY - this.startY;

      const resistance = 0.8;
      this.dragOffset.set(deltaX * resistance);

      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    this.endHandler = (_e: TouchEvent | MouseEvent) => {
      if (!this.isDragging()) return;

      const deltaX = this.dragOffset();
      this.isDragging.set(false);
      this.dragOffset.set(0);

      if (Math.abs(deltaX) > this.SWIPE_THRESHOLD) {
        deltaX < 0 ? this.next() : this.prev();
      }
    };

    track.addEventListener('touchstart', this.startHandler, { passive: true });
    track.addEventListener('touchmove', this.moveHandler, { passive: false });
    track.addEventListener('touchend', this.endHandler, { passive: true });

    track.addEventListener('mousedown', this.startHandler);
    window.addEventListener('mousemove', this.moveHandler);
    window.addEventListener('mouseup', this.endHandler);
  }

  private cleanupListeners(track?: HTMLElement): void {
    const t = track || this.el.nativeElement.querySelector('.slider-track');
    if (t) {
      t.removeEventListener('touchstart', this.startHandler);
      t.removeEventListener('touchmove', this.moveHandler);
      t.removeEventListener('touchend', this.endHandler);
      t.removeEventListener('mousedown', this.startHandler);
    }
    window.removeEventListener('mousemove', this.moveHandler);
    window.removeEventListener('mouseup', this.endHandler);
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
    this.stopAutoplay(true);
  }

  goTo(index: number): void {
    if (this.isAnimating() || index === this.currentIndex()) return;
    this.stopAutoplay(true);
    const dir: Direction = index > this.currentIndex() ? 'left' : 'right';
    this.animate(dir, () => this.currentIndex.set(index));
  }

  prev(): void {
    if (this.isAnimating()) return;
    this.stopAutoplay(true);
    this.animate('right', () => {
      const total = this.slides().length;
      this.currentIndex.update((i) => (i - 1 + total) % total);
    });
  }

  next(): void {
    if (this.isAnimating()) return;
    this.animate('left', () => {
      const total = this.slides().length;
      this.currentIndex.update((i) => (i + 1) % total);
    });
  }

  handleItemClick(position: string): void {
    if (Math.abs(this.dragOffset()) > 10) return;

    this.stopAutoplay(true);
    if (position === 'prev') this.prev();
    else if (position === 'next') this.next();
  }

  getDynamicStyles(position: string): DynamicStyle {
    if (this.isAnimating()) {
      return { 'pointer-events': 'none' };
    }

    const offset = this.dragOffset();
    const isDragging = this.isDragging();

    if (!isDragging) {
      return {
        transition: 'all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
      };
    }

    const absOffset = Math.abs(offset);
    const threshold = 250;
    const progress = Math.min(absOffset / threshold, 1);

    let baseTranslateX = -50;
    let baseScale = 1;
    let baseOpacity = 1;
    let baseFilter = 'none';

    if (position === 'active') {
      baseScale = 1 - progress * 0.1;
      baseOpacity = 1 - progress * 0.6;
      baseFilter = `brightness(${1 - progress * 0.3}) blur(${progress * 4}px)`;
    } else if (position === 'prev') {
      baseTranslateX = -95;
      const isEntering = offset > 0;
      baseScale = 0.9 + (isEntering ? progress * 0.1 : -progress * 0.05);
      baseOpacity = 0.5 + (isEntering ? progress * 0.5 : -progress * 0.3);
      baseFilter = isEntering
        ? `brightness(${0.8 + progress * 0.2}) blur(${2 - progress * 2}px)`
        : 'brightness(0.8) blur(2px)';
    } else if (position === 'next') {
      baseTranslateX = -5;
      const isEntering = offset < 0;
      baseScale = 0.9 + (isEntering ? progress * 0.1 : -progress * 0.05);
      baseOpacity = 0.5 + (isEntering ? progress * 0.5 : -progress * 0.3);
      baseFilter = isEntering
        ? `brightness(${0.8 + progress * 0.2}) blur(${2 - progress * 2}px)`
        : 'brightness(0.8) blur(2px)';
    } else if (position === 'prev2') {
      baseTranslateX = -150;
      baseScale = 0.8;
      baseOpacity = 0;
    } else if (position === 'next2') {
      baseTranslateX = 50;
      baseScale = 0.8;
      baseOpacity = 0;
    }

    const transform = `translate(calc(${baseTranslateX}% + ${offset}px), 0) scale(${baseScale})`;

    return {
      transform,
      opacity: baseOpacity,
      filter: baseFilter,
      'z-index': position === 'active' ? 10 : 5,
      transition: 'none',
    };
  }

  private animate(dir: Direction, updateIndex: () => void): void {
    this.isAnimating.set(true);
    this.direction.set(dir);
    updateIndex();
    setTimeout(() => {
      this.isAnimating.set(false);
      this.direction.set(null);
    }, 700);
  }
}
