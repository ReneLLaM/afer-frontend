import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import type { TableColumn } from '../../components/admin-data-table/admin-data-table';

interface AdminProductRow {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  isActive?: boolean;
  image?: string;
  createdAt?: string;
}

const PRODUCT_TABLE_COLUMNS: TableColumn<AdminProductRow>[] = [
  { key: 'image', label: '', type: 'image', width: '56px', imageSize: 'sm' },
  { key: 'name', label: 'Producto', sortable: true, sticky: 'start', minWidth: '160px' },
  { key: 'sku', label: 'SKU', sortable: true, width: '120px', hideBelow: 'md' },
  { key: 'price', label: 'Precio', sortable: true, width: '100px', align: 'right' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
  { key: 'createdAt', label: 'Creado', sortable: true, width: '110px', hideBelow: 'lg' },
];

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
