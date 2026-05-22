import type { TableColumn } from '../../components/data-table/data-table';

export interface AdminBrandRow {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  isActive?: boolean;
  order?: number;
}

export const BRAND_TABLE_COLUMNS: TableColumn<AdminBrandRow>[] = [
  { key: 'logo', label: '', type: 'image', width: '56px', imageSize: 'sm', imageRound: true },
  { key: 'name', label: 'Marca', sortable: true, sticky: 'start', minWidth: '160px' },
  { key: 'slug', label: 'Slug', sortable: true, hideBelow: 'md' },
  { key: 'order', label: 'Orden', sortable: true, width: '80px', align: 'center' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];
