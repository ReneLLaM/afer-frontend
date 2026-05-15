import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'skeleton-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-card.html',
  styleUrl: './skeleton-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCard {
  count = input<number>(10);

  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
