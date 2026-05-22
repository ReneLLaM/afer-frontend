import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import { PRODUCT_TABLE_COLUMNS } from '../../../../shared/config/table-columns/product.columns';
import type { TableColumn } from '../../../../shared/components/data-table/data-table';

@Component({
  selector: 'products-admin-page',
  standalone: true,
  imports: [AdminCatalogStubPage],
  template: `
    <admin-catalog-stub-page
      title="Productos"
      subtitle="CRUD de productos — usa app-data-table con columnas preset."
      [columns]="columns"
      [emptyMessage]="'Conecta AdminProductsService.findAll() para listar productos.'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsAdminPage {
  readonly columns = PRODUCT_TABLE_COLUMNS as TableColumn[];
}
