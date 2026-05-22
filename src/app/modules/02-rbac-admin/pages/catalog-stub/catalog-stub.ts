import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import {
  DataTableComponent,
  type TableColumn,
} from '../../../../shared/components/data-table/data-table';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { AdminListToolbarComponent } from '../../../../shared/components/admin-list-toolbar/admin-list-toolbar';
import type { ListMeta } from '../../../../shared/models/list-meta.model';

@Component({
  selector: 'admin-catalog-stub-page',
  standalone: true,
  imports: [Breadcrumb, DataTableComponent, PaginationComponent, AdminListToolbarComponent],
  templateUrl: './catalog-stub.html',
  styleUrl: './catalog-stub.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCatalogStubPage {
  title = input.required<string>();
  subtitle = input<string>('Listado administrativo — conecta el API para cargar datos.');
  // Acepta presets tipados (Product, Brand, etc.)
  columns = input.required<TableColumn[]>();
  reorderable = input<boolean>(false);
  emptyMessage = input<string>('Próximamente: conecta el servicio de listado.');

  readonly data: unknown[] = [];
  readonly meta: ListMeta = { total: 0, limit: 10, page: 1, totalPages: 1 };

  onSearch(_value: string): void {}
  onClearFilters(): void {}
}
