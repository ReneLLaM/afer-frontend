# Afer Bolivia — RBAC Admin Agent

> **Propósito**: Guía de arquitectura, RBAC, estructura de carpetas, mejores prácticas y código para el módulo administrativo del frontend de Afer Bolivia. Todo agente o desarrollador debe seguir estas reglas al crear, modificar o mantener código dentro de `02-rbac-admin/`.

---

## 1. Filosofía del RBAC

### 1.1 Modelo de autorización

```
Usuario ──┬── Roles (paquetes de permisos) → Permisos heredados
          │
          └── Permisos directos (extras, pueden tener expiresAt)
```

**Reglas fundamentales:**
- **Un rol es solo un contenedor de permisos.** No tiene poder por sí mismo.
- **El permiso es la unidad real de autorización.** Todo se decide por permisos.
- **Los permisos directos se fusionan con los de roles** → array plano de slugs.
- **NO existe un permiso `admin.access`.** Cualquier usuario con ALGÚN permiso de admin puede entrar al panel y solo verá lo que su permiso le permite.
- **Pueden existir miles de roles**, cada uno con diferentes combinaciones de permisos. El frontend NUNCA hardcodea nombres de roles para lógica de autorización (excepto `isAdmin` como atajo de UI).

### 1.2 Qué devuelve el login

```typescript
interface AuthResponse {
  user: {
    permissions: string[];  // Array plano, ya consolidado (Set en backend)
    roles: string[];        // Solo slugs de roles para UI
    rolePermissions?: RoleWithPermissions[];  // Opcional, para perfil
    extraPermissions?: ExtraPermission[];     // Opcional, para perfil
  };
}
```

**¿Por qué plano?**
- El frontend solo necesita responder: "¿tiene este permiso? Sí/No"
- La estructura jerárquica (rol → permisos) solo se usa en la página de perfil para mostrar de dónde viene cada permiso
- El backend ya consolidó con `Set` para evitar duplicados

### 1.3 Frontend vs Backend

| Capa | Responsabilidad |
|------|----------------|
| **Frontend** | Ocultar UI, proteger rutas, mejorar UX |
| **Backend** | Seguridad real. Rechazar requests sin permisos |

**El frontend NUNCA es la capa de seguridad.** Si alguien modifica el JS del navegador, el backend lo rechaza igual. El RBAC frontend es para **experiencia de usuario**, no para seguridad.

---

## 2. Estructura de carpetas

```
modules/
  02-rbac-admin/
    admin/
      pages/                    ← Páginas ruteables (lazy loaded)
        dashboard/              ← /admin — Dashboard principal
        users/                  ← /admin/usuarios
          users-list/           ← Lista de usuarios (tabla)
          user-create/          ← Crear usuario
          user-edit/            ← Editar usuario
          user-detail/          ← Detalle + asignar permisos
        roles/                  ← /admin/roles
          roles-list/           ← Lista de roles
          role-create/          ← Crear rol + asignar permisos
          role-edit/            ← Editar rol
        permissions/            ← /admin/permisos
          permissions-list/     ← Lista de permisos (solo lectura)
        banners/                ← /admin/banners
          banners-list/
          banner-create/
          banner-edit/
        files/                  ← /admin/archivos
          file-manager/         ← Gestor de archivos subidos
      components/               ← Componentes reutilizables del admin
        admin-table/            ← Tabla con paginación, filtros, acciones
        admin-form/             ← Layout base para formularios
        admin-sidebar/          ← Sidebar con navegación filtrada por permisos
        admin-header/           ← Header del panel
        permission-tree/        ← Checkboxes de permisos agrupados por módulo
        image-uploader/         ← Subir imágenes a /files/:folder
        status-badge/           ← Badge de estado (activo/inactivo/bloqueado)
        confirm-dialog/         ← Diálogo de confirmación genérico
        admin-breadcrumb/       ← Breadcrumbs del admin
      services/                 ← Servicios HTTP del admin
        admin-users.service.ts
        admin-roles.service.ts
        admin-permissions.service.ts
        admin-banners.service.ts
        admin-files.service.ts
      models/                   ← Interfaces de API
        admin-user.model.ts
        admin-role.model.ts
        admin-permission.model.ts
        admin-banner.model.ts
        admin-file.model.ts
      stores/                   ← Signal stores (si el estado lo justifica)
        admin-ui.store.ts       ← Estado de sidebar, modal, etc.
      utils/                    ← Utilidades
        permission.utils.ts     ← Funciones puras para filtrar permisos
        admin-routes.utils.ts   ← Helpers para rutas admin
    shared/                     ← Compartido entre admin y ecommerce
      directives/
        has-permission.directive.ts   ← *hasPermission="'products.create'"
        has-role.directive.ts         ← *hasRole="'admin'"
      guards/
        permission.guard.ts           ← Protege rutas por permisos
        admin-access.guard.ts         ← Verifica que tenga ALGÚN permiso admin
```

### 2.1 Convención de nombres

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Página | kebab-case + `-page` | `users-list-page` |
| Componente | kebab-case | `admin-table` |
| Servicio | PascalCase + `Service` | `AdminUsersService` |
| Modelo | kebab-case + `.model.ts` | `admin-user.model.ts` |
| Store | kebab-case + `.store.ts` | `admin-ui.store.ts` |
| Utilidad | kebab-case + `.utils.ts` | `permission.utils.ts` |

---

## 3. Constantes de permisos

### 3.1 Archivo de constantes

**Ubicación:** `core/constants/permissions.ts`

```typescript
export const PERMISSIONS = {
  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    EXPORT: 'products.export',
  },
  CATEGORIES: {
    CREATE: 'categories.create',
    READ: 'categories.read',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
  },
  BRANDS: {
    CREATE: 'brands.create',
    READ: 'brands.read',
    UPDATE: 'brands.update',
    DELETE: 'brands.delete',
  },
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    ASSIGN_ACCESS: 'users.assign_access',
  },
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },
  PERMISSIONS: {
    CREATE: 'permissions.create',
    READ: 'permissions.read',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
  },
  BANNERS: {
    CREATE: 'banners.create',
    READ: 'banners.read',
    UPDATE: 'banners.update',
    DELETE: 'banners.delete',
  },
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];
```

### 3.2 Reglas de uso

```typescript
// ✅ CORRECTO: autocomplete, type-safe, sin typos
*hasPermission="PERMISSIONS.PRODUCTS.CREATE"
canActivate: [permissionGuard], data: { permission: PERMISSIONS.USERS.READ }

// ❌ INCORRECTO: hardcodeado, propenso a typos
*hasPermission="'products.create'"
```

---

## 4. AuthStore — Extensiones RBAC

### 4.1 Métodos que debe tener

```typescript
// En modules/01-identity/auth/store/auth.store.ts

// Signals derivadas
readonly permissions = computed(() => this._user()?.permissions ?? []);
readonly roles = computed(() => this._user()?.roles ?? []);

// RBAC: permisos
hasPermission(permission: string): boolean {
  return this.permissions().includes(permission);
}

hasAnyPermission(permissions: string[]): boolean {
  const userPermissions = this.permissions();
  return permissions.some(p => userPermissions.includes(p));
}

hasAllPermissions(permissions: string[]): boolean {
  const userPermissions = this.permissions();
  return permissions.every(p => userPermissions.includes(p));
}

// RBAC: roles
hasRole(role: string): boolean {
  return this.roles().includes(role);
}

hasAnyRole(roles: string[]): boolean {
  const userRoles = this.roles();
  return roles.some(r => userRoles.includes(r));
}

// Atajo de UI: NO usar para autorización, solo para mostrar/ocultar UI genérica
readonly isAdmin = computed(() =>
  this.roles().some(r => r === 'admin' || r === 'super-admin')
);

// Utilidad: verificar si tiene ALGÚN permiso de un módulo
hasModulePermission(module: string): boolean {
  return this.permissions().some(p => p.startsWith(`${module}.`));
}
```

### 4.2 Reglas

- `hasPermission()` → para checks individuales
- `hasAnyPermission()` → para checks "al menos uno"
- `hasAllPermissions()` → para checks "todos requeridos"
- `hasRole()` → solo para UI (badges, mensajes), NO para autorización
- `isAdmin` → solo para UI, NO para autorización
- `hasModulePermission()` → para el sidebar (saber si mostrar un módulo)

---

## 5. Guards

### 5.1 permissionGuard

**Ubicación:** `core/guards/permission.guard.ts`

```typescript
export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const requiredPermission = route.data['permission'] as string | string[] | undefined;
  const permissionMode = route.data['permissionMode'] as 'any' | 'all' | undefined;
  const requiredRole = route.data['role'] as string | string[] | undefined;

  // Si hay role requerido
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!authStore.hasAnyRole(roles)) {
      router.navigate(['/']);
      return false;
    }
    return true;
  }

  // Si hay permiso requerido
  if (requiredPermission) {
    const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    if (permissionMode === 'all') {
      if (!authStore.hasAllPermissions(perms)) {
        router.navigate(['/']);
        return false;
      }
    } else {
      // Default: 'any'
      if (!authStore.hasAnyPermission(perms)) {
        router.navigate(['/']);
        return false;
      }
    }
  }

  return true;
};
```

**Uso en rutas:**

```typescript
// Un permiso
{ path: 'usuarios', canActivate: [permissionGuard], data: { permission: PERMISSIONS.USERS.READ } }

// Múltiples permisos (cualquiera)
{ path: 'roles', canActivate: [permissionGuard], data: { permission: [PERMISSIONS.ROLES.READ, PERMISSIONS.ROLES.CREATE] } }

// Múltiples permisos (todos requeridos)
{ path: 'config', canActivate: [permissionGuard], data: { permission: [PERMISSIONS.USERS.UPDATE, PERMISSIONS.ROLES.UPDATE], permissionMode: 'all' } }

// Por rol
{ path: 'super-config', canActivate: [permissionGuard], data: { role: 'super-admin' } }
```

### 5.2 Acceso al admin — Layout-based redirect

**NO se usa un guard separado para `/admin`.** El `AdminLayout` verifica en `ngOnInit` si el usuario tiene algún permiso de admin. Si no tiene ninguno, redirige a `/`.

```typescript
// layout/admin-layout/admin-layout.ts
ngOnInit(): void {
  const hasAnyAdminPermission = this.navItems.some(item =>
    this.authStore.hasAnyPermission(item.permissions)
  );

  if (!hasAnyAdminPermission) {
    this.router.navigate(['/']);
  }
}
```

**Ruta padre:** solo usa `authGuard` (cualquier logueado entra al layout). El layout decide si renderizar o redirigir.

```typescript
{
  path: 'admin',
  canActivate: [authGuard],
  component: AdminLayout,
  children: [ ... ]
}
```

**Cada ruta hija** se protege individualmente con `permissionGuard` + su permiso específico.

---

## 6. Directivas

### 6.1 HasPermissionDirective

**Ubicación:** `shared/directives/has-permission.directive.ts`

```typescript
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  hasPermission = input.required<string | string[]>();
  mode = input<'any' | 'all'>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      const required = this.hasPermission();
      const m = this.mode();
      let hasAccess = false;

      if (Array.isArray(required)) {
        hasAccess = m === 'all'
          ? this.authStore.hasAllPermissions(required)
          : this.authStore.hasAnyPermission(required);
      } else {
        hasAccess = this.authStore.hasPermission(required);
      }

      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
```

**Uso:**

```html
<!-- Un permiso -->
<button *hasPermission="PERMISSIONS.PRODUCTS.CREATE">Crear Producto</button>

<!-- Múltiples (cualquiera) -->
<div *hasPermission="[PERMISSIONS.USERS.READ, PERMISSIONS.USERS.CREATE]">...</div>

<!-- Múltiples (todos requeridos) -->
<div *hasPermission="[PERMISSIONS.USERS.UPDATE, PERMISSIONS.ROLES.UPDATE]" mode="all">...</div>
```

### 6.2 HasRoleDirective

**Ubicación:** `shared/directives/has-role.directive.ts`

```typescript
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  hasRole = input.required<string | string[]>();
  mode = input<'any' | 'all'>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      const required = this.hasRole();
      const m = this.mode();
      let hasAccess = false;

      if (Array.isArray(required)) {
        hasAccess = m === 'all'
          ? required.every(r => this.authStore.hasRole(r))
          : required.some(r => this.authStore.hasRole(r));
      } else {
        hasAccess = this.authStore.hasRole(required);
      }

      if (hasAccess && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasAccess && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
```

**Uso:**

```html
<!-- Solo para super-admin -->
<div *hasRole="'super-admin'">Configuración avanzada</div>

<!-- Admin o super-admin -->
<div *hasRole="['admin', 'super-admin']">Panel de gestión</div>
```

---

## 7. Sidebar con filtrado por permisos

### 7.1 Estructura de navegación

```typescript
// admin-sidebar/navigation.config.ts

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  /** Permisos necesarios para ver este ítem. Si tiene alguno, se muestra. */
  permissions: string[];
  children?: AdminNavItem[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/admin',
    permissions: ['products.read', 'categories.read', 'brands.read', 'users.read', 'roles.read', 'permissions.read', 'banners.read'],
  },
  {
    label: 'Productos',
    icon: 'inventory_2',
    route: '/admin/productos',
    permissions: Object.values(PERMISSIONS.PRODUCTS),
    children: [
      { label: 'Lista', icon: 'list', route: '/admin/productos', permissions: [PERMISSIONS.PRODUCTS.READ] },
      { label: 'Crear', icon: 'add', route: '/admin/productos/crear', permissions: [PERMISSIONS.PRODUCTS.CREATE] },
    ],
  },
  {
    label: 'Categorías',
    icon: 'category',
    route: '/admin/categorias',
    permissions: Object.values(PERMISSIONS.CATEGORIES),
  },
  {
    label: 'Marcas',
    icon: 'branding_watermark',
    route: '/admin/marcas',
    permissions: Object.values(PERMISSIONS.BRANDS),
  },
  {
    label: 'Usuarios',
    icon: 'people',
    route: '/admin/usuarios',
    permissions: Object.values(PERMISSIONS.USERS),
  },
  {
    label: 'Roles',
    icon: 'admin_panel_settings',
    route: '/admin/roles',
    permissions: Object.values(PERMISSIONS.ROLES),
  },
  {
    label: 'Permisos',
    icon: 'key',
    route: '/admin/permisos',
    permissions: Object.values(PERMISSIONS.PERMISSIONS),
  },
  {
    label: 'Banners',
    icon: 'view_carousel',
    route: '/admin/banners',
    permissions: Object.values(PERMISSIONS.BANNERS),
  },
];
```

### 7.2 Filtrado en el componente

```typescript
// admin-sidebar/admin-sidebar.ts

export class AdminSidebar {
  private readonly authStore = inject(AuthStore);

  navItems = input.required<AdminNavItem[]>();

  filteredItems = computed(() =>
    this.navItems().filter(item =>
      this.authStore.hasAnyPermission(item.permissions)
    )
  );
}
```

```html
<!-- admin-sidebar/admin-sidebar.html -->
@for (item of filteredItems(); track item.route) {
  <a [routerLink]="item.route" routerLinkActive="active">
    <mat-icon>{{ item.icon }}</mat-icon>
    <span>{{ item.label }}</span>
  </a>

  @if (item.children) {
    @for (child of item.children; track child.route) {
      @if (authStore.hasAnyPermission(child.permissions)) {
        <a [routerLink]="child.route" routerLinkActive="active" class="child">
          <span>{{ child.label }}</span>
        </a>
      }
    }
  }
}
```

---

## 8. Componente AdminTable

### 8.1 Interfaz

```typescript
// admin-table/admin-table.ts

interface AdminTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  /** Renderizado custom con template */
  template?: TemplateRef<{ $implicit: T }>;
}

interface AdminTableAction<T> {
  label: string;
  icon: string;
  permission?: string;
  action: (item: T) => void;
  variant?: 'primary' | 'danger' | 'ghost';
}

interface AdminTableConfig<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  actions: AdminTableAction<T>[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  searchable: boolean;
  searchTerm: string;
}
```

### 8.2 Uso

```html
<admin-table
  [data]="users()"
  [columns]="userColumns"
  [actions]="userActions"
  [loading]="loading()"
  [totalItems]="totalUsers()"
  [currentPage]="page()"
  [pageSize]="pageSize()"
  [searchable]="true"
  (pageChange)="onPageChange($event)"
  (searchChange)="onSearchChange($event)"
  (sortChange)="onSortChange($event)"
/>
```

```typescript
export class UsersListPage {
  userColumns: AdminTableColumn<User>[] = [
    { key: 'fullName', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roles', label: 'Roles', template: this.rolesTemplate },
    { key: 'status', label: 'Estado', template: this.statusTemplate },
  ];

  userActions: AdminTableAction<User>[] = [
    { label: 'Ver', icon: 'visibility', action: (u) => this.router.navigate(['/admin/usuarios', u.id]) },
    { label: 'Editar', icon: 'edit', permission: PERMISSIONS.USERS.UPDATE, action: (u) => this.router.navigate(['/admin/usuarios', u.id, 'editar']) },
    { label: 'Eliminar', icon: 'delete', permission: PERMISSIONS.USERS.DELETE, action: (u) => this.confirmDelete(u), variant: 'danger' },
  ];
}
```

---

## 9. PermissionTree — Checkboxes de permisos

### 9.1 Uso (crear/editar rol)

```html
<!-- role-create/role-create.html -->
<form [formGroup]="form">
  <h3>Asignar permisos al rol</h3>

  <permission-tree
    [availablePermissions]="allPermissions()"
    [selectedPermissions]="selectedPermissions()"
    (selectedChange)="onPermissionsChange($event)"
  />
</form>
```

### 9.2 Estructura

```typescript
// permission-tree/permission-tree.ts

interface PermissionGroup {
  module: string;
  label: string;
  permissions: { slug: string; name: string; description?: string }[];
}

export class PermissionTree {
  availablePermissions = input.required<Permission[]>();
  selectedPermissions = input.required<string[]>();
  selectedChange = output<string[]>();

  groups = computed(() => {
    const grouped: Record<string, PermissionGroup> = {};
    for (const p of this.availablePermissions()) {
      if (!grouped[p.module]) {
        grouped[p.module] = { module: p.module, label: this.moduleLabel(p.module), permissions: [] };
      }
      grouped[p.module].permissions.push({ slug: p.slug, name: p.name, description: p.description });
    }
    return Object.values(grouped);
  });

  private moduleLabel(module: string): string {
    const labels: Record<string, string> = {
      products: 'Productos',
      categories: 'Categorías',
      brands: 'Marcas',
      users: 'Usuarios',
      roles: 'Roles',
      permissions: 'Permisos',
      banners: 'Banners',
    };
    return labels[module] ?? module;
  }

  onCheckChange(slug: string, checked: boolean): void {
    const current = this.selectedPermissions();
    const updated = checked
      ? [...current, slug]
      : current.filter(s => s !== slug);
    this.selectedPermissions.set(updated);
    this.selectedChange.emit(updated);
  }

  onModuleCheck(module: string, checked: boolean): void {
    const modulePerms = this.groups().find(g => g.module === module)?.permissions.map(p => p.slug) ?? [];
    const current = this.selectedPermissions();
    const updated = checked
      ? [...new Set([...current, ...modulePerms])]
      : current.filter(s => !modulePerms.includes(s));
    this.selectedPermissions.set(updated);
    this.selectedChange.emit(updated);
  }
}
```

---

## 10. Servicios admin

### 10.1 Patrón base

```typescript
// admin-users.service.ts

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  findAll(options: { page?: number; limit?: number; search?: string }): Observable<AdminUsersResponse> {
    return this.http.get<AdminUsersResponse>(`${this.baseUrl}/users`, {
      params: { page: options.page, limit: options.limit, search: options.search },
    });
  }

  findOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  create(dto: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, dto);
  }

  update(id: string, dto: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}`, dto);
  }

  updateAccess(id: string, dto: UpdateUserAccessDto): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/users/${id}/access`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
```

### 10.2 AdminFilesService

```typescript
// admin-files.service.ts

@Injectable({ providedIn: 'root' })
export class AdminFilesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  uploadImage(file: File, folder: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/${folder}`, formData, {
      responseType: 'text',
    }).pipe(map(url => url as string));
  }

  getImageUrl(folder: string, imageName: string): string {
    return `${this.baseUrl}/files/${folder}/${imageName}`;
  }
}
```

---

## 11. Rutas admin

```typescript
// admin/admin.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { AdminLayout } from '../../layout/admin-layout/admin-layout';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    component: AdminLayout,
    children: [
      // Dashboard
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage),
      },

      // Usuarios
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.READ },
        loadComponent: () => import('./pages/users/users-list/users-list').then(m => m.UsersListPage),
      },
      {
        path: 'usuarios/crear',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.CREATE },
        loadComponent: () => import('./pages/users/user-create/user-create').then(m => m.UserCreatePage),
      },
      {
        path: 'usuarios/:id',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.READ },
        loadComponent: () => import('./pages/users/user-detail/user-detail').then(m => m.UserDetailPage),
      },
      {
        path: 'usuarios/:id/editar',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.USERS.UPDATE },
        loadComponent: () => import('./pages/users/user-edit/user-edit').then(m => m.UserEditPage),
      },

      // Roles
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ROLES.READ },
        loadComponent: () => import('./pages/roles/roles-list/roles-list').then(m => m.RolesListPage),
      },
      {
        path: 'roles/crear',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ROLES.CREATE },
        loadComponent: () => import('./pages/roles/role-create/role-create').then(m => m.RoleCreatePage),
      },
      {
        path: 'roles/:id/editar',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ROLES.UPDATE },
        loadComponent: () => import('./pages/roles/role-edit/role-edit').then(m => m.RoleEditPage),
      },

      // Permisos
      {
        path: 'permisos',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PERMISSIONS.READ },
        loadComponent: () => import('./pages/permissions/permissions-list/permissions-list').then(m => m.PermissionsListPage),
      },

      // Banners
      {
        path: 'banners',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BANNERS.READ },
        loadComponent: () => import('./pages/banners/banners-list/banners-list').then(m => m.BannersListPage),
      },
      {
        path: 'banners/crear',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BANNERS.CREATE },
        loadComponent: () => import('./pages/banners/banner-create/banner-create').then(m => m.BannerCreatePage),
      },
      {
        path: 'banners/:id/editar',
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.BANNERS.UPDATE },
        loadComponent: () => import('./pages/banners/banner-edit/banner-edit').then(m => m.BannerEditPage),
      },
    ],
  },
];
```

---

## 12. AdminLayout

```typescript
// layout/admin-layout/admin-layout.ts

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebar, AdminHeader],
  template: `
    <div class="admin-layout">
      <admin-sidebar [items]="navItems" />
      <div class="admin-main">
        <admin-header />
        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  navItems = ADMIN_NAV_ITEMS;
}
```

---

## 13. Asignar permisos extras a usuarios

### 13.1 Flujo

1. Admin va a `/admin/usuarios/:id`
2. Ve la sección "Permisos directos"
3. Puede agregar permisos individuales (adicionales a los del rol)
4. Puede setear `expiresAt` para permisos temporales
5. Los permisos del rol se muestran como "heredados" (no editables desde aquí)

### 13.2 UI

```html
<!-- user-detail/user-detail.html -->
<section>
  <h3>Permisos del rol (heredados)</h3>
  @for (rp of user().rolePermissions; track rp.roleSlug) {
    <div class="role-group">
      <h4>{{ rp.roleName }}</h4>
      @for (perm of rp.permissionNames; track perm) {
        <span class="badge inherited">{{ perm }}</span>
      }
    </div>
  }
</section>

<section *hasPermission="PERMISSIONS.USERS.ASSIGN_ACCESS">
  <h3>Permisos directos (extras)</h3>
  
  @for (perm of user().extraPermissions; track perm.slug) {
    <div class="extra-permission">
      <span>{{ perm.name }}</span>
      <button (click)="removeExtraPermission(perm.slug)">Quitar</button>
    </div>
  }

  <button (click)="openPermissionSelector()">+ Agregar permiso directo</button>
</section>
```

---

## 14. Mejores prácticas RBAC

### 14.1 DO

- ✅ Usar constantes `PERMISSIONS.*` siempre
- ✅ Proteger rutas con `permissionGuard`
- ✅ Ocultar UI con `*hasPermission`
- ✅ Filtrar sidebar por `hasModulePermission`
- ✅ El backend SIEMPRE valida (ya lo hace con `@Auth(PERMISSIONS.X.Y)`)
- ✅ Mostrar feedback cuando una acción es rechazada (toast de error)

### 14.2 DON'T

- ❌ NO hardcodear strings de permisos
- ❌ NO usar `hasRole()` para autorización (solo para UI)
- ❌ NO confiar en el frontend para seguridad
- ❌ NO crear un permiso `admin.access` (el acceso se basa en permisos reales)
- ❌ NO asumir que un rol siempre tendrá los mismos permisos
- ❌ NO exponer datos sensibles en el frontend basándose en roles

### 14.3 Checklist de seguridad

- [ ] ¿Cada ruta admin tiene `permissionGuard`?
- [ ] ¿Cada botón de acción tiene `*hasPermission`?
- [ ] ¿El sidebar filtra ítems por permisos?
- [ ] ¿El backend protege cada endpoint con `@Auth(PERMISSIONS.X.Y)`?
- [ ] ¿Los servicios admin usan las rutas correctas del backend?
- [ ] ¿Hay manejo de errores 403 en los servicios?

---

## 15. Anti-patrones específicos de RBAC

### 15.1 NO crear middleware de permisos en el frontend

```typescript
// ❌ INCORRECTO: el frontend no debe "verificar" permisos para enviar requests
async function createProduct(dto: CreateProductDto) {
  if (!authStore.hasPermission(PERMISSIONS.PRODUCTS.CREATE)) {
    return; // El backend ya rechazaría esto
  }
  return http.post('/products', dto);
}

// ✅ CORRECTO: dejar que el backend rechace, manejar el error
async function createProduct(dto: CreateProductDto) {
  return http.post('/products', dto).pipe(
    catchError(err => {
      if (err.status === 403) {
        toast.error('No tienes permiso para crear productos');
      }
      throw err;
    })
  );
}
```

### 15.2 NO mezclar lógica de permisos con lógica de negocio

```typescript
// ❌ INCORRECTO
function processOrder(order: Order) {
  if (authStore.hasPermission('orders.process')) {
    // lógica de negocio
  }
}

// ✅ CORRECTO: la UI decide si mostrar el botón, el servicio procesa
// En el template:
<button *hasPermission="'orders.process'" (click)="processOrder(order)">Procesar</button>

// En el componente:
processOrder(order: Order) {
  return this.ordersService.process(order.id);
}
```

### 15.3 NO cachear permisos fuera del AuthStore

```typescript
// ❌ INCORRECTO
const myPermissions = JSON.parse(localStorage.getItem('permissions'));

// ✅ CORRECTO
const perms = authStore.permissions();
```

---

*Última actualización: Mayo 2026*
*Este documento es vivo y debe actualizarse con cada mejora de arquitectura.*
