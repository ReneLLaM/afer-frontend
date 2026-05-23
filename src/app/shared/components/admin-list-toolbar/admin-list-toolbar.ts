import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../search-input/search-input';

@Component({
  selector: 'app-admin-list-toolbar',
  standalone: true,
  imports: [SearchInputComponent, MatIconModule],
  templateUrl: './admin-list-toolbar.html',
  styleUrl: './admin-list-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminListToolbarComponent {
  search = input<string>('');
  searchPlaceholder = input<string>('Buscar...');
  hasActiveFilters = input<boolean>(false);
  filterCount = input<number>(0);

  searchChange = output<string>();
  clearFilters = output<void>();

  onClear(): void {
    this.clearFilters.emit();
  }
}
