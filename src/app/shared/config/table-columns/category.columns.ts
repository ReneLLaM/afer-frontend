import type { TableColumn } from '../../components/data-table/data-table';

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug?: string;
  level?: number;
  isActive?: boolean;
}

export const CATEGORY_TABLE_COLUMNS: TableColumn<AdminCategoryRow>[] = [
  { key: 'name', label: 'Categoría', sortable: true, sticky: 'start', minWidth: '180px' },
  { key: 'slug', label: 'Slug', sortable: true, hideBelow: 'md' },
  { key: 'level', label: 'Nivel', width: '80px', align: 'center', hideBelow: 'sm' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];
