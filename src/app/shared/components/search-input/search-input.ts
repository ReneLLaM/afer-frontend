import {
  Component,
  computed,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  effect,
  untracked,
} from '@angular/core';

export type SearchIconStyle = 'svg' | 'remix';
export type SearchSize = 'md' | 'lg';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [],
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  placeholder = input<string>('Buscar...');
  initialValue = input<string>('');
  debounceTime = input<number>(300);
  icon = input<SearchIconStyle>('remix');
  size = input<SearchSize>('md');
  fullWidth = input<boolean>(false);

  searchChange = output<string>();

  internalValue = signal('');
  private skipFirst = true;

  value = computed(() => this.internalValue());
  hasValue = computed(() => this.internalValue().trim().length > 0);
  useRemixIcon = computed(() => this.icon() === 'remix');

  constructor() {
    effect(() => {
      const init = this.initialValue();
      untracked(() => {
        this.internalValue.set(init);
        this.skipFirst = true;
      });
    });

    effect((onCleanup) => {
      const val = this.internalValue();
      if (this.skipFirst) {
        untracked(() => (this.skipFirst = false));
        return;
      }
      const timeout = setTimeout(() => {
        this.searchChange.emit(val.trim());
      }, this.debounceTime());
      onCleanup(() => clearTimeout(timeout));
    });
  }

  onInputChange(value: string): void {
    this.internalValue.set(value);
  }

  onClear(): void {
    this.internalValue.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchChange.emit(this.internalValue().trim());
    }
  }
}
