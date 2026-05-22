import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  hasActiveFilters = input<boolean>(false);
  filterCount = input<number>(0);

  clearFilters = output<void>();

  onClear(): void {
    this.clearFilters.emit();
  }
}
