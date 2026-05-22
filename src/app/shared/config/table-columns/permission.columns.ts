import type { TableColumn } from '../../components/data-table/data-table';
import type { Permission } from '../../../modules/02-rbac-admin/models/admin-permission.model';
import { LocaleDatePipe } from '../../pipes/locale-date.pipe';
import { ModuleLabelPipe } from '../../pipes/module-label.pipe';

const localeDate = new LocaleDatePipe();
const moduleLabel = new ModuleLabelPipe();

const MODULE_BADGES: Record<string, { label: string; variant: 'primary' | 'info' | 'success' | 'warning' | 'neutral' }> = {
  products: { label: 'Productos', variant: 'primary' },
  categories: { label: 'Categorías', variant: 'info' },
  brands: { label: 'Marcas', variant: 'success' },
  users: { label: 'Usuarios', variant: 'warning' },
  roles: { label: 'Roles', variant: 'neutral' },
  permissions: { label: 'Permisos', variant: 'neutral' },
  banners: { label: 'Banners', variant: 'primary' },
};

const ACTION_BADGES: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral' }> = {
  create: { label: 'Crear', variant: 'success' },
  read: { label: 'Leer', variant: 'info' },
  update: { label: 'Editar', variant: 'warning' },
  delete: { label: 'Eliminar', variant: 'danger' },
  export: { label: 'Exportar', variant: 'neutral' },
  import: { label: 'Importar', variant: 'neutral' },
  assign_access: { label: 'Asignar', variant: 'info' },
};

export const PERMISSION_TABLE_COLUMNS: TableColumn<Permission>[] = [
  { key: 'name', label: 'Nombre', sortable: true, minWidth: '140px' },
  {
    key: 'slug',
    label: 'Slug',
    sortable: true,
    minWidth: '200px',
    cellClass: 'cell-slug',
  },
  {
    key: 'module',
    label: 'Módulo',
    sortable: true,
    minWidth: '110px',
    type: 'badge',
    badgeFn: (v) => MODULE_BADGES[String(v).toLowerCase()] ?? { label: moduleLabel.transform(v), variant: 'neutral' },
  },
  {
    key: 'action',
    label: 'Acción',
    sortable: true,
    minWidth: '90px',
    type: 'badge',
    badgeFn: (v) => ACTION_BADGES[String(v).toLowerCase()] ?? { label: String(v), variant: 'neutral' },
  },
  {
    key: 'description',
    label: 'Descripción',
    minWidth: '220px',
    format: (v) => (v ? String(v) : '—'),
  },
  {
    key: 'createdAt',
    label: 'Creado',
    sortable: true,
    minWidth: '100px',
    pipe: localeDate,
    pipeArgs: ['short'],
    hideBelow: 'sm',
  },
];
