import type { TableColumn } from '../../components/data-table/data-table';

export interface AdminProductRow {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  isActive?: boolean;
  image?: string;
  createdAt?: string;
}

export const PRODUCT_TABLE_COLUMNS: TableColumn<AdminProductRow>[] = [
  { key: 'image', label: '', type: 'image', width: '56px', imageSize: 'sm' },
  { key: 'name', label: 'Producto', sortable: true, sticky: 'start', minWidth: '160px' },
  { key: 'sku', label: 'SKU', sortable: true, width: '120px', hideBelow: 'md' },
  { key: 'price', label: 'Precio', sortable: true, width: '100px', align: 'right' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
  { key: 'createdAt', label: 'Creado', sortable: true, width: '110px', hideBelow: 'lg' },
];
