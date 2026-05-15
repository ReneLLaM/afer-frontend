import { Component, signal, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { GiftCardModalComponent } from '../../../../../layout/components/gift-card/modal/modal';
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
    GiftCardModalComponent,
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

  showModal = signal(this.shouldShowGiftCardModal());
  featuredCategories = toSignal<FeaturedCategory[]>(
    this.homeService.getFeaturedCategories(),
    { initialValue: [] }
  );
  selectedCategory = signal<FeaturedCategory | null>(null);

  constructor() {
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

  onCategorySelected(category: FeaturedCategory) {
    this.selectedCategory.set(category);
  }
}
