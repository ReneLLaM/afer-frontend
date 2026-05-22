import { Pipe, PipeTransform } from '@angular/core';

const MODULE_LABELS: Record<string, string> = {
  products: 'Productos',
  categories: 'Categorías',
  brands: 'Marcas',
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  banners: 'Banners',
};

@Pipe({ name: 'moduleLabel', standalone: true })
export class ModuleLabelPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value == null) return '';
    const key = String(value).toLowerCase();
    return MODULE_LABELS[key] ?? String(value);
  }
}
