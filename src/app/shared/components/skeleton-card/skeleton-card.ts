import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'skeleton-card',
  imports: [CommonModule],
  templateUrl: './skeleton-card.html',
  styleUrl: './skeleton-card.scss',
})
export class SkeletonCard {
  /** Cuántas cards skeleton mostrar en el grid */
  count = input<number>(10);

  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
