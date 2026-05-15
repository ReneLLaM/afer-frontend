import { Component, inject, input, output, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeService, FeaturedCategory } from '../../../../services/home.service';
import { CategoryCard } from '../category-card/category-card';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoryCard],
  templateUrl: './category-carousel.html',
  styleUrl: './category-carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCarousel {
  private homeService = inject(HomeService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  categories = toSignal(this.homeService.getFeaturedCategories(), { initialValue: [] });
  selectedSlug = input<string | null>(null, { alias: 'selectedId' });
  categorySelected = output<FeaturedCategory>();

  onCategorySelect(category: FeaturedCategory): void {
    this.categorySelected.emit(category);
  }

  scroll(direction: 'left' | 'right'): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
