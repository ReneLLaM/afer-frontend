import { Pipe, PipeTransform } from '@angular/core';

const PERMISSION_ACTION_LABELS: Record<string, string> = {
  create: 'Crear',
  read: 'Leer',
  update: 'Editar',
  delete: 'Eliminar',
  export: 'Exportar',
  import: 'Importar',
  assign_access: 'Asignar acceso',
};

@Pipe({ name: 'permissionActionLabel', standalone: true })
export class PermissionActionLabelPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value == null) return '';
    const key = String(value).toLowerCase();
    return PERMISSION_ACTION_LABELS[key] ?? String(value);
  }
}
