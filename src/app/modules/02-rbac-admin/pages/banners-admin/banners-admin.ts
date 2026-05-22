import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import { BANNER_TABLE_COLUMNS } from '../../../../shared/config/table-columns/banner.columns';
import type { TableColumn } from '../../../../shared/components/data-table/data-table';

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
