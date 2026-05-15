import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActiveFilter {
  id: string;
  label: string;
  type: 'category' | 'brand';
}

@Component({
  selector: 'active-filter-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (filters().length > 0) {
      <div class="chips-container">
        @for (filter of filters(); track filter.id) {
          <button class="filter-chip" type="button" (click)="remove.emit(filter.id)">
            @if (filter.type === 'category') {
              <svg class="chip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            } @else {
              <svg class="chip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            }
            <span class="chip-label">{{ filter.label }}</span>
            <span class="chip-remove">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
          </button>
        }
        <button class="clear-all" type="button" (click)="clearAll.emit()">
          Limpiar
        </button>
      </div>
    }
  `,
  styleUrl: './active-filter-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveFilterChipsComponent {
  filters = input<ActiveFilter[]>([]);
  remove = output<string>();
  clearAll = output<void>();
}
