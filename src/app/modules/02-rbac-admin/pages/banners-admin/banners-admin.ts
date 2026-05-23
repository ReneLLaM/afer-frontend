import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import type { TableColumn } from '../../components/admin-data-table/admin-data-table';

interface AdminBannerRow {
  id: string;
  title: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}

const BANNER_TABLE_COLUMNS: TableColumn<AdminBannerRow>[] = [
  { key: 'image', label: '', type: 'image', width: '80px', imageSize: 'md' },
  { key: 'title', label: 'Título', sortable: true, sticky: 'start' },
  { key: 'order', label: 'Orden', width: '80px', align: 'center' },
  { key: 'isActive', label: 'Activo', type: 'boolean', width: '80px', align: 'center' },
];

@Component({
  selector: 'banners-admin-page',
  standalone: true,
  imports: [AdminCatalogStubPage],
  template: `
    <admin-catalog-stub-page
      title="Banners"
      [columns]="columns"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannersAdminPage {
  readonly columns = BANNER_TABLE_COLUMNS as TableColumn[];
}
