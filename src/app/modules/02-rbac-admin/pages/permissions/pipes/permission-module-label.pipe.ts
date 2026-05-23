import { Pipe, PipeTransform } from '@angular/core';

const PERMISSION_MODULE_LABELS: Record<string, string> = {
  products: 'Productos',
  categories: 'Categorías',
  brands: 'Marcas',
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  banners: 'Banners',
};

@Pipe({ name: 'permissionModuleLabel', standalone: true })
export class PermissionModuleLabelPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value == null) return '';
    const key = String(value).toLowerCase();
    return PERMISSION_MODULE_LABELS[key] ?? String(value);
  }
}
