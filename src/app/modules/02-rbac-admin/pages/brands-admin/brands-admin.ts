import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import { BRAND_TABLE_COLUMNS } from '../../../../shared/config/table-columns/brand.columns';
import type { TableColumn } from '../../../../shared/components/data-table/data-table';

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
