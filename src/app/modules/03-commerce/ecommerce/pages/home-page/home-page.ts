import { Component, signal, inject, effect } from '@angular/core';
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
    BrandSection
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private homeService = inject(HomeService);
  
  showModal = signal(false);
  selectedCategory = signal<FeaturedCategory | null>(null);

  constructor() {
    // Verificar si el modal ya se mostró en esta sesión
    const hasSeenModal = sessionStorage.getItem('hasSeenGiftCardModal');
    if (!hasSeenModal) {
      this.showModal.set(true);
      sessionStorage.setItem('hasSeenGiftCardModal', 'true');
    }

    // Cargar la primera categoría destacada por defecto cuando estén disponibles
    this.homeService.getFeaturedCategories().subscribe(categories => {
      if (categories.length > 0 && !this.selectedCategory()) {
        this.selectedCategory.set(categories[0]);
      }
    });
  }

  onCategorySelected(category: FeaturedCategory) {
    this.selectedCategory.set(category);
  }
}
