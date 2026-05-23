import type { TableAction } from '../components/admin-data-table/admin-data-table';

export interface CrudActionDef<T> {
  permission?: string | string[];
  permissionMode?: 'any' | 'all';
  label?: string;
  icon?: string;
  class?: string;
  show?: (row: T) => boolean;
  onClick: (row: T) => void;
}

export interface CrudTableActionsConfig<T> {
  view?: CrudActionDef<T>;
  edit?: CrudActionDef<T>;
  delete?: CrudActionDef<T>;
  /** Acciones extra después de ver/editar/eliminar */
  extra?: TableAction<T>[];
}

const DEFAULT_CRUD = {
  view: { icon: 'visibility', label: 'Ver detalle', class: 'btn-view' },
  edit: { icon: 'edit', label: 'Editar', class: 'btn-edit' },
  delete: { icon: 'delete', label: 'Eliminar', class: 'btn-delete' },
} as const;

/** Genera acciones CRUD estándar; la tabla filtra por `permission` automáticamente. */
export function buildCrudTableActions<T>(
  config: CrudTableActionsConfig<T>,
): TableAction<T>[] {
  const actions: TableAction<T>[] = [];

  const push = (key: keyof typeof DEFAULT_CRUD, def?: CrudActionDef<T>) => {
    if (!def) return;
    actions.push({
      icon: def.icon ?? DEFAULT_CRUD[key].icon,
      label: def.label ?? DEFAULT_CRUD[key].label,
      class: def.class ?? DEFAULT_CRUD[key].class,
      permission: def.permission,
      permissionMode: def.permissionMode,
      show: def.show,
      callback: def.onClick,
    });
  };

  push('view', config.view);
  push('edit', config.edit);
  push('delete', config.delete);

  if (config.extra?.length) {
    actions.push(...config.extra);
  }

  return actions;
}
