import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Breadcrumb } from '../../../../shared/components/breadcrumb/breadcrumb';
import {
  DataTable,
  type TableColumn,
} from '../../components/admin-data-table/admin-data-table';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { AdminListToolbar } from '../../components/admin-list-toolbar/admin-list-toolbar';
import type { ListMeta } from '../../../../shared/interfaces/list-meta.interface';

@Component({
  selector: 'admin-catalog-stub-page',
  standalone: true,
  imports: [Breadcrumb, DataTable, Pagination, AdminListToolbar],
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
  search = input<string>('');
  data = input<unknown[]>([]);
  meta = input<ListMeta>({ total: 0, limit: 10, page: 1, totalPages: 1 });
  loading = input<boolean>(false);

  searchChange = output<string>();
  pageChange = output<number>();
  limitChange = output<number>();

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }

  onClearFilters(): void {}

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onLimitChange(limit: number): void {
    this.limitChange.emit(limit);
  }
}
