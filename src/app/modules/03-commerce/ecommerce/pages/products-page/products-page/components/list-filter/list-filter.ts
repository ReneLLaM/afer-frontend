import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterItem {
  id: string;
  name: string;
}

@Component({
  selector: 'list-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-filter.html',
  styleUrl: './list-filter.scss',
})
export class ListFilterComponent {
  // ── Inputs / Outputs ────────────────────────────────────────────────────────

  data = input<FilterItem[]>([]);
  title = input<string>('Filtro');
  selectedIdsInput = input<string[]>([], { alias: 'selectedIds' });
  selectionChange = output<string[]>();

  // ── Reactive state ──────────────────────────────────────────────────────────

  filterText = signal('');
  checkedIds = signal<Set<string>>(new Set());

  constructor() {
    // Sincronizar input externo con estado interno
    effect(() => {
      const external = this.selectedIdsInput();
      this.checkedIds.set(new Set(external));
    }, { allowSignalWrites: true });
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  selectedCount = computed(() => this.checkedIds().size);

  visibleItems = computed(() => {
    const query = this.filterText().toLowerCase().trim();
    if (!query) return this.data();
    return this.data().filter(item => 
      item.name.toLowerCase().includes(query)
    );
  });

  // ── Template helpers ────────────────────────────────────────────────────────

  trackById(_: number, item: FilterItem): string {
    return item.id;
  }

  clearFilter(): void {
    this.filterText.set('');
  }

  // ── Interactions ────────────────────────────────────────────────────────────

  toggleCheck(id: string): void {
    this.checkedIds.update(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      
      // Emit selection change
      this.selectionChange.emit(Array.from(next));
      
      return next;
    });
  }
}
