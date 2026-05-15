import { Component, inject, input, output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService, FeaturedCategory } from '../../../../services/home.service';
import { CategoryCard } from '../category-card/category-card';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule, CategoryCard],
  templateUrl: './category-carousel.html',
  styleUrl: './category-carousel.scss',
})
export class CategoryCarousel {
  private homeService = inject(HomeService);
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  categories = toSignal(this.homeService.getFeaturedCategories(), { initialValue: [] });
  selectedSlug = input<string | null>(null, { alias: 'selectedId' });
  categorySelected = output<FeaturedCategory>();

  onCategorySelect(category: FeaturedCategory) {
    this.categorySelected.emit(category);
  }

  scroll(direction: 'left' | 'right') {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
