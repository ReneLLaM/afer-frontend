import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeaturedCategory } from '../../../../services/home.service';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCard {
  category = input.required<FeaturedCategory>();
  isActive = input<boolean>(false);
  selected = output<FeaturedCategory>();
}
