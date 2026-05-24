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
    pages/                    ← Páginas ruteables (lazy loaded)
      dashboard/              ← /admin — Dashboard principal
      users/                  ← /admin/usuarios
      roles/                  ← /admin/roles
      permissions/            ← /admin/permisos
      banners/                ← /admin/banners
    components/               ← Componentes reutilizables del admin
      (ver app-data-table en shared/components)
      admin-form/
      admin-sidebar/
      admin-header/
      permission-tree/
      image-uploader/
      status-badge/
      confirm-dialog/
      admin-breadcrumb/
    interfaces/               ← Interfaces de API (fuera de pages/)
      admin-user.interface.ts
      admin-role.interface.ts
      admin-permission.interface.ts
      admin-banner.interface.ts
      admin-file.interface.ts
    services/                 ← Servicios HTTP (fuera de pages/)
      admin-users.service.ts
      admin-roles.service.ts
      admin-permissions.service.ts
      admin-banners.service.ts
      admin-files.service.ts
    stores/                   ← Signal stores (si el estado lo justifica)
      admin-ui.store.ts
    utils/                    ← Utilidades
      permission.utils.ts
      admin-routes.utils.ts
    shared/                   ← Compartido entre admin y ecommerce
      directives/
        has-permission.directive.ts
      guards/
        permission.guard.ts
        admin-access.guard.ts
```

### 2.1 Convención de nombres

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Página | kebab-case + `-page` | `users-list-page` |
| Componente | kebab-case | `admin-table` |
| Servicio | PascalCase + `Service` | `AdminUsersService` |
| Interface | kebab-case + `.interface.ts` | `admin-user.interface.ts` |
| Store | kebab-case + `.store.ts` | `admin-ui.store.ts` |
| Utilidad | kebab-case + `.utils.ts` | `permission.utils.ts` |

### 2.2 Densidad visual del admin

- En `02-rbac-admin/`, formularios y vistas de detalle deben usar estilos compactos.
- Evitar `gap`, `margin-bottom` y paddings grandes si no aportan claridad real.
- Preferir panels, chips y bloques informativos mÃ¡s densos antes que layouts con mucho aire.
- Evitar degradados decorativos en pantallas admin; usar color sÃ³lido, borde y contraste.
- En registros soft-deleted mostrados con `showDeleted`, ocultar o deshabilitar acciones destructivas y de ediciÃ³n. Un registro eliminado no debe ofrecer `Editar` ni `Eliminar` en la UI.
- Las vistas detalle admin con auditorÃ­a deben preferir un bloque de `Trazabilidad` con eventos `Creado`, `Actualizado` y `Eliminado`, mostrando responsable y fecha juntos.

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
- `hasModulePermission()` → para el sidebar (saber si mostrar un módulo)
- Base de autorización y visibilidad: permisos, no roles
- `hasRole()` e `isAdmin` quedan solo como compatibilidad puntual; no crear nueva lógica basada en roles salvo requisito explícito

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

**Ubicación:** `modules/02-rbac-admin/directives/has-permission.directive.ts`

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

### 6.2 Roles

- El proyecto debe basar autorización de rutas y visibilidad de acciones en permisos.
- No existe `HasRoleDirective`; no crear nuevas directivas, guards ni checks de UI basados en roles salvo requisito explícito del negocio.
- Si aparece lógica heredada con roles, tratarla como excepción y preferir migrarla a permisos.

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

## 8. Listados admin — `app-data-table` (no `admin-table`)

> **Guía completa**: ver [`AGENTS-DATA-LIST.md`](AGENTS-DATA-LIST.md) (URL, búsqueda, filtros, paginación, presets).

### 8.1 Stack estándar

```html
<app-admin-list-toolbar ... (searchChange)="onSearch($event)" (clearFilters)="onClearFilters()">
  <div filters>...</div>
</app-admin-list-toolbar>

<app-data-table
  [columns]="columns"
  [data]="data()"
  [loading]="loading()"
  [serverSort]="true"
  [showFooterInfo]="false"
  trackByKey="id"
  [sortKey]="sortBy()"
  [sortDir]="sortDirection()"
  [actions]="tableActions()"
  (sortChange)="onSort($event)"
/>

<app-pagination [meta]="meta()" (pageChange)="..." (limitChange)="..." />
```

### 8.2 Utilidades URL

`modules/02-rbac-admin/utils/admin-list-query.utils.ts` — `readListParams`, `buildListQueryPatch`, `toApiOffset`.

### 8.3 RBAC en listados

- Rutas: `permissionGuard` + `data.permission: PERMISSIONS.*`
- Botones: `*hasPermission="PERMISSIONS.USERS.CREATE"` (directiva con `hasPermissionMode: 'all' | 'any'`)
- Acciones tabla: filtrar en `computed` con `authStore.hasPermission(PERMISSIONS.*)`

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
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/roles/role-page/roles').then(m => m.RolesPage),
          },
          {
            path: 'crear',
            canActivate: [permissionGuard],
            data: { permission: PERMISSIONS.ROLES.CREATE },
            loadComponent: () => import('./pages/roles/role-create/role-create').then(m => m.RoleCreatePage),
          },
          {
            path: ':id',
            loadComponent: () => import('./pages/roles/role-detail/role-detail').then(m => m.RoleDetailPage),
          },
          {
            path: ':id/editar',
            canActivate: [permissionGuard],
            data: { permission: PERMISSIONS.ROLES.UPDATE },
            loadComponent: () => import('./pages/roles/role-edit/role-edit').then(m => m.RoleEditPage),
          },
        ],
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
- ✅ En `roles`, navegar `Ver/Crear/Editar` a páginas reales; evitar dialogs para CRUD principal
- ✅ En `roles`, mostrar toast de éxito en crear, actualizar, eliminar y sincronizar seed
- ✅ En `roles`, refrescar el listado después de eliminar o sincronizar aunque la query no cambie
- ✅ En `roles`, devolver desde backend el shape de `findOne()` también en `create()` y `update()`
- ✅ En `roles`, usar `permissionSlugs` en detalle/create/edit para preselección confiable
- ✅ En `roles`, tratar `slug` como derivado del `name`; si cambia el nombre, cambia el slug
- ✅ En filtros booleanos por query string (`isSystem`, `showDeleted`), normalizar explícitamente `true/false`
- ✅ Los roles `isSystem` no se editan ni eliminan en UI ni backend

### 14.2 DON'T

- ❌ NO hardcodear strings de permisos
- ❌ NO usar roles para autorización o visibilidad nueva; usar permisos
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

## 15. Filtros y paginación en URL (query params)

### 15.1 Regla fundamental

**Todos los filtros, búsqueda, ordenamiento y paginación DEBEN reflejarse en la URL.** Esto permite:
- Compartir URLs con filtros aplicados
- Recargar la página sin perder el estado
- Navegar adelante/atrás manteniendo filtros
- Bookmarks de vistas filtradas

### 15.2 Query params soportados

| Param | Tipo | Ejemplo | Descripción |
|-------|------|---------|-------------|
| `page` | number | `?page=2` | Página actual |
| `limit` | number | `?limit=20` | Items por página |
| `search` | string | `?search=crear` | Término de búsqueda |
| `sort` | string | `?sort=name` | Campo de ordenamiento |
| `order` | ASC\|DESC | `?order=DESC` | Dirección del orden |
| Filtros custom | string | `?module=users` | Filtros específicos del módulo |

### 15.3 Patrón en páginas admin

```typescript
import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import { AdminPermissionsService } from '../../services/admin-permissions.service';

@Component({
  selector: 'permissions-list-page',
  standalone: true,
  templateUrl: './permissions-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminPermissionsService);

  // Leer query params como signal
  queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  // Derivar opciones de la URL
  page = computed(() => Number(this.queryParams()['page'] ?? 1));
  limit = computed(() => Number(this.queryParams()['limit'] ?? 20));
  search = computed(() => this.queryParams()['search'] ?? '');
  sort = computed(() => this.queryParams()['sort'] ?? '');
  order = computed(() => this.queryParams()['order'] ?? 'ASC');

  // Construir opciones para el servicio
  options = computed(() => ({
    page: this.page(),
    limit: this.limit(),
    search: this.search(),
    sort: this.sort(),
    order: this.order(),
  }));

  // Fetch data reactivamente
  response = toSignal(
    this.options.pipe(
      switchMap(opts => this.service.findAll(opts))
    ),
    { initialValue: { data: [], meta: { total: 0, totalPages: 1 } } }
  );

  data = computed(() => this.response().data);
  meta = computed(() => this.response().meta);

  // Actualizar URL sin recargar
  private updateQueryParams(params: Record<string, string | number | null>): void {
    const current = this.queryParams();
    const updated = { ...current };

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === '' || value === undefined) {
        delete updated[key];
      } else {
        updated[key] = String(value);
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updated,
      queryParamsHandling: '',
    });
  }

  onSearch(term: string): void {
    this.updateQueryParams({ search: term, page: 1 });
  }

  onSort(field: string): void {
    const currentOrder = this.order();
    const currentSort = this.sort();
    const newOrder = currentSort === field && currentOrder === 'ASC' ? 'DESC' : 'ASC';
    this.updateQueryParams({ sort: field, order: newOrder });
  }

  onPageChange(newPage: number): void {
    this.updateQueryParams({ page: newPage });
  }

  onClearFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: '1' },
      queryParamsHandling: '',
    });
  }
}
```

### 15.4 Sincronizar componentes de UI con la URL

```html
<!-- El search input lee el valor inicial de la URL -->
<app-search-input
  [initialValue]="search()"
  (searchChange)="onSearch($event)"
/>

<!-- La paginación lee la página actual de la URL -->
<app-pagination
  [currentPage]="page()"
  [totalPages]="meta().totalPages"
  (pageChange)="onPageChange($event)"
/>
```

### 15.5 Reglas

- ✅ **SIEMPRE** reflejar filtros en la URL
- ✅ **SIEMPRE** leer el estado inicial de los query params
- ✅ **SIEMPRE** resetear a `page=1` cuando cambia un filtro
- ✅ **SIEMPRE** usar `router.navigate([], { relativeTo: this.route })` para no perder child routes
- ❌ **NUNCA** mantener estado de filtros solo en signals locales
- ❌ **NUNCA** usar `queryParamsHandling: 'merge'` si quieres control total de los params

### 15.6 Ejemplo: múltiples filtros

```typescript
onFilterChange(filterKey: string, value: string | null): void {
  this.updateQueryParams({ [filterKey]: value, page: 1 });
}

// En el template:
<app-filter-bar
  [moduleFilter]="queryParams()['module'] ?? ''"
  [resourceFilter]="queryParams()['resource'] ?? ''"
  (moduleChange)="onFilterChange('module', $event)"
  (resourceChange)="onFilterChange('resource', $event)"
/>
```

---

## 16. Anti-patrones específicos de RBAC

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
