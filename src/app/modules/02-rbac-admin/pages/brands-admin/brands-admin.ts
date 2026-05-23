import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import type { TableColumn } from '../../components/admin-data-table/admin-data-table';

interface AdminBrandRow {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  isActive?: boolean;
  order?: number;
}

const BRAND_TABLE_COLUMNS: TableColumn<AdminBrandRow>[] = [
  { key: 'logo', label: '', type: 'image', width: '56px', imageSize: 'sm', imageRound: true },
  { key: 'name', label: 'Marca', sortable: true, sticky: 'start', minWidth: '160px' },
  { key: 'slug', label: 'Slug', sortable: true, hideBelow: 'md' },
  { key: 'order', label: 'Orden', sortable: true, width: '80px', align: 'center' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];

@Component({
  selector: 'brands-admin-page',
  standalone: true,
  imports: [AdminCatalogStubPage],
  template: `
    <admin-catalog-stub-page
      title="Marcas"
      subtitle="Orden por drag-and-drop — columna de reorden preparada."
      [columns]="columns"
      [reorderable]="true"
      [emptyMessage]="'Conecta AdminBrandsService y habilita CDK drag-drop en filas.'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminPage {
  readonly columns = BRAND_TABLE_COLUMNS as TableColumn[];
}
