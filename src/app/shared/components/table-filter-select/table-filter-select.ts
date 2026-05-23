import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';

export interface TableFilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-table-filter-select',
  standalone: true,
  templateUrl: './table-filter-select.html',
  styleUrl: './table-filter-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFilterSelectComponent {
  label = input<string>('');
  placeholder = input<string>('Todos');
  value = input<string>('');
  options = input.required<TableFilterOption[]>();
  isActive = computed(() => this.value().trim().length > 0);

  valueChange = output<string>();

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.valueChange.emit(value);
  }
}
