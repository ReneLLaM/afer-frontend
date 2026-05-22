import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import type { ListMeta } from '../../models/list-meta.model';

/** @deprecated Usar ListMeta */
export type PaginationMeta = ListMeta;

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  meta = input.required<ListMeta>();

  pageChange = output<number>();
  limitChange = output<number>();

  readonly pageSizeOptions = [10, 20, 50, 100];

  pages = computed((): (number | string)[] => {
    const total = this.meta().totalPages;
    const current = this.meta().page;
    const range = 2;

    let start = Math.max(1, current - range);
    let end = Math.min(total, current + range);

    if (current <= range) {
      end = Math.min(total, range * 2 + 1);
    }
    if (current > total - range) {
      start = Math.max(1, total - range * 2);
    }

    const pagesArray: (number | string)[] = [];

    if (start > 1) {
      pagesArray.push(1);
      if (start > 2) pagesArray.push('...');
    }

    for (let i = start; i <= end; i++) {
      pagesArray.push(i);
    }

    if (end < total) {
      if (end < total - 1) pagesArray.push('...');
      pagesArray.push(total);
    }

    return pagesArray;
  });

  onPageClick(page: number | string): void {
    if (typeof page === 'number' && page !== this.meta().page) {
      this.pageChange.emit(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onPrev(): void {
    if (this.meta().page > 1) {
      this.onPageClick(this.meta().page - 1);
    }
  }

  onNext(): void {
    if (this.meta().page < this.meta().totalPages) {
      this.onPageClick(this.meta().page + 1);
    }
  }

  onLimitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.limitChange.emit(Number(select.value));
  }
}
