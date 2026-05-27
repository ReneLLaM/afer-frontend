import { Component, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SeoService } from '../../../../../core/services/seo.service';
import { GiftCardModal } from '../../../../../layout/components/gift-card/modal/modal';
import { HeroSlider } from './hero-slider/hero-slider';
import { CategoryCarousel } from './components/category-carousel/category-carousel';
import { FeaturedProductGrid } from './components/featured-product-grid/featured-product-grid';
import { ProductSection } from './components/product-section/product-section';
import { BrandSection } from './components/brand-section/brand-section';
import { HomeService, FeaturedCategory } from '../../services/home.service';

@Component({
  selector: 'home-page',
  standalone: true,
  imports: [
    GiftCardModal,
    HeroSlider,
    CategoryCarousel,
    FeaturedProductGrid,
    ProductSection,
    BrandSection,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private homeService = inject(HomeService);
  private seoService = inject(SeoService);

  showModal = signal(this.shouldShowGiftCardModal());
  featuredCategories = toSignal(this.homeService.getFeaturedCategories(), { initialValue: [] as FeaturedCategory[] });
  selectedCategory = signal<FeaturedCategory | null>(null);

  constructor() {
    this.seoService.updateSeoData({}); // Use defaults for home page
    effect(() => {
      const categories = this.featuredCategories();
      if (categories.length > 0 && !this.selectedCategory()) {
        this.selectedCategory.set(categories[0]);
      }
    });
  }

  private shouldShowGiftCardModal(): boolean {
    const hasSeen = sessionStorage.getItem('hasSeenGiftCardModal');
    if (!hasSeen) {
      sessionStorage.setItem('hasSeenGiftCardModal', 'true');
      return true;
    }
    return false;
  }

  onCategorySelected(category: FeaturedCategory): void {
    this.selectedCategory.set(category);
  }
}
