import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminCatalogStubPage } from '../catalog-stub/catalog-stub';
import { CATEGORY_TABLE_COLUMNS } from '../../../../shared/config/table-columns/category.columns';
import type { TableColumn } from '../../../../shared/components/data-table/data-table';

@Component({
  selector: 'categories-admin-page',
  standalone: true,
  imports: [AdminCatalogStubPage],
  template: `
    <admin-catalog-stub-page
      title="Categorías"
      subtitle="Árbol o tabla según necesidad — preset de columnas listo."
      [columns]="columns"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesAdminPage {
  readonly columns = CATEGORY_TABLE_COLUMNS as TableColumn[];
}
