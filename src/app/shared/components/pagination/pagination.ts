import { Component, computed, input, output } from '@angular/core';

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class PaginationComponent {
  meta = input.required<PaginationMeta>();
  pageChange = output<number>();

  pages = computed(() => {
    const total = this.meta().totalPages;
    const current = this.meta().page;
    const range = 2; // Cantidad de páginas a mostrar a los lados de la actual
    
    let start = Math.max(1, current - range);
    let end = Math.min(total, current + range);

    // Ajustar si estamos cerca del inicio o fin
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

  onPageClick(page: number | string) {
    if (typeof page === 'number' && page !== this.meta().page) {
      this.pageChange.emit(page);
      
      // Scroll suave hacia arriba al cambiar de página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onPrev() {
    if (this.meta().page > 1) {
      this.onPageClick(this.meta().page - 1);
    }
  }

  onNext() {
    if (this.meta().page < this.meta().totalPages) {
      this.onPageClick(this.meta().page + 1);
    }
  }
}
