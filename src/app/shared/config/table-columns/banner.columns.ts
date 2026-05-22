import type { TableColumn } from '../../components/data-table/data-table';

export interface AdminBannerRow {
  id: string;
  title: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}

export const BANNER_TABLE_COLUMNS: TableColumn<AdminBannerRow>[] = [
  { key: 'image', label: '', type: 'image', width: '80px', imageSize: 'md' },
  { key: 'title', label: 'Título', sortable: true, sticky: 'start' },
  { key: 'order', label: 'Orden', width: '80px', align: 'center' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];
