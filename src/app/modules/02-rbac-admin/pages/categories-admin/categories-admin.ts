import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import type { TableColumn } from '../../components/admin-data-table/admin-data-table';

interface AdminCategoryRow {
  id: string;
  name: string;
  slug?: string;
  level?: number;
  isActive?: boolean;
}

const CATEGORY_TABLE_COLUMNS: TableColumn<AdminCategoryRow>[] = [
  { key: 'name', label: 'Categoría', sortable: true, sticky: 'start', minWidth: '180px' },
  { key: 'slug', label: 'Slug', sortable: true, hideBelow: 'md' },
  { key: 'level', label: 'Nivel', width: '80px', align: 'center', hideBelow: 'sm' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];

@Component({
  selector: 'categories-admin-page',
  standalone: true,
  imports: [AdminCatalogStubPage],
  template: `
    <admin-catalog-stub-page
      title="Categorías"
      subtitle="Árbol o tabla según necesidad — preset de columnas listo."
      [columns]="columns"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesAdminPage {
  readonly columns = CATEGORY_TABLE_COLUMNS as TableColumn[];
}
