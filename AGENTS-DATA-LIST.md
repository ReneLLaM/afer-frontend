# Afer Bolivia — Data List Agent (Tabla, búsqueda, filtros, paginación)

> **Propósito**: Patrón canónico para **listados administrativos** con URL como fuente de verdad, toolbar unificado y `app-data-table`. Complementa `AGENTS.md`, `AGENTS-RBAC.md` y `AGENTS-STYLES.md`.

---

## 1. ¿Cuándo usar qué?

| Contexto | Componentes |
|----------|-------------|
| **Admin** (usuarios, roles, permisos, productos…) | `app-admin-list-toolbar` + `app-data-table` + `app-pagination` |
| **Tienda** (catálogo público) | Cards/grid + `app-pagination` (sin tabla) |
| **Detalle admin** | Ruta hija (`/admin/permisos/:slug`) + card/panel |

---

## 2. Contrato de URL (query params)

Parámetros estándar (siempre en la URL, **nunca** `queryParamsHandling: 'merge'`):

| Param | Default admin | Descripción |
|-------|---------------|-------------|
| `page` | `1` | Página actual |
| `limit` | `10` | Registros por página (`10`, `20`, `50`, `100`) |
| `search` | — | Texto libre (trim en backend) |
| `sortBy` | según entidad | Campo de orden |
| `order` | `ASC` / `DESC` | Dirección |
| `module`, `action`, … | — | Filtros custom por entidad |

### Utilidades (`shared/utils/list-query.utils.ts`)

```typescript
import {
  readListParams,
  buildListQueryPatch,
  toApiOffset,
  sortDirectionFromOrder,
} from '@app/shared/utils/list-query.utils';

// Leer desde queryParams signal
const listParams = computed(() => readListParams(this.queryParams()));
const page = computed(() => listParams().page);
const search = computed(() => listParams().search);

// Actualizar URL
private navigateQuery(patch: Record<string, string | number | null | undefined>) {
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: buildListQueryPatch(this.queryParams(), patch),
    queryParamsHandling: '',
  });
}

// API
const offset = toApiOffset(page, limit);
```

---

## 3. Búsqueda (`app-search-input`)

| Comportamiento | Valor |
|----------------|-------|
| Debounce | `300ms` (input `debounceTime`) |
| Enter | Emite **inmediato** (sin esperar debounce) |
| Limpiar (×) | Vacía input; el padre debe poner `search: null, page: 1` |
| Icono admin | `icon="remix"` → `ri-search-line` |
| Ancho toolbar | `fullWidth` en toolbar admin |

```html
<app-search-input
  placeholder="Buscar..."
  [initialValue]="search()"
  [fullWidth]="true"
  icon="remix"
  (searchChange)="onSearch($event)"
/>
```

---

## 4. Toolbar (`app-admin-list-toolbar`)

Compone búsqueda + `app-filter-bar` (contador y “Quitar filtros”).

```html
<app-admin-list-toolbar
  [search]="search()"
  searchPlaceholder="Buscar permisos..."
  [hasActiveFilters]="hasActiveFilters()"
  [filterCount]="activeFilterCount()"
  (searchChange)="onSearch($event)"
  (clearFilters)="onClearFilters()"
>
  <div filters class="my-page__filters">
    <app-table-filter-select
      label="Módulo"
      placeholder="Todos"
      [value]="moduleFilter()"
      [options]="moduleOptions"
      (valueChange)="onModuleFilter($event)"
    />
  </div>
</app-admin-list-toolbar>
```

---

## 5. Tabla (`app-data-table`)

### Acciones CRUD integradas (ver / editar / eliminar)

La tabla **oculta cada icono** si el usuario no tiene el permiso. No uses `authStore.hasPermission` en la página para los botones de fila.

```typescript
// En el .ts del listado
readonly tableCrud = {
  view: {
    permission: PERMISSIONS.PRODUCTS.READ,
    onClick: (row) => this.router.navigate(['/admin/productos', row.id]),
  },
  edit: {
    permission: PERMISSIONS.PRODUCTS.UPDATE,
    show: (row) => !row.isSystem, // opcional por fila
    onClick: (row) => this.router.navigate(['/admin/productos', row.id, 'editar']),
  },
  delete: {
    permission: PERMISSIONS.PRODUCTS.DELETE,
    onClick: (row) => this.confirmDelete(row),
  },
};
```

```html
<app-data-table
  [columns]="columns"
  [data]="data()"
  [crud]="tableCrud"
  ...
/>
```

- Iconos por defecto: `ri-eye-line`, `ri-edit-line`, `ri-delete-bin-line`
- Alternativa manual: `[actions]` con `permission` en cada `TableAction`
- Helper: `buildCrudTableActions()` en `shared/utils/table-actions.utils.ts`

### Inputs clave

| Input | Uso |
|-------|-----|
| `[crud]` | Ver / editar / eliminar con RBAC automático |
| `[serverSort]="true"` | **Obligatorio** con API paginada (no reordena en cliente) |
| `[showFooterInfo]="false"` | Con `app-pagination` (evita duplicar “Mostrando X de Y”) |
| `trackByKey="id"` | Performance |
| `[reorderable]="true"` | Preparado para marcas (columna drag, CDK futuro) |

### Columnas (`TableColumn<T>`)

```typescript
{
  key: 'slug',
  label: 'Slug',
  sortable: true,
  wrap: true,              // texto multilínea en desktop
  truncate: false,
  hideBelow: 'md',         // oculta en pantallas < 768px
  sticky: 'start',         // fija al scroll horizontal
  type: 'badge',
  badgeFn: (v) => ({ label: String(v), variant: 'info' }),
  pipe: localeDatePipe,
  pipeArgs: ['short'],
  format: (v, row) => customString(v, row),
}
```

### Presets de columnas

`shared/config/table-columns/` → `permission.columns.ts`, `product.columns.ts`, `brand.columns.ts`, etc.

### Pipes reutilizables

- `LocaleDatePipe` — fechas
- `TruncatePipe` — textos largos
- `ModuleLabelPipe` — módulos RBAC en español

---

## 6. Paginación (`app-pagination`)

```html
<app-pagination
  [meta]="meta()"
  (pageChange)="onPageChange($event)"
  (limitChange)="onLimitChange($event)"
/>
```

`ListMeta`: `{ total, limit, page, totalPages }` — unificado en `shared/models/list-meta.model.ts`.

**Reglas:**

- `limitChange` → siempre resetear `page: 1`
- `searchChange` / filtros → `page: 1`
- Scroll al top: lo hace el componente al cambiar página

---

## 7. Flujo completo (permisos)

```
URL ?page=1&limit=10&search=foo&module=products&sortBy=slug&order=ASC
  → readListParams()
  → GET /api/permissions?limit=10&offset=0&search=foo&module=products&...
  → app-data-table [data] [serverSort] [sortKey] [sortDir]
  → app-pagination [meta]
  → Ver detalle → /admin/permisos/:slug (GET /api/permissions/:term)
```

---

## 8. Anti-patrones

| No hacer | Hacer |
|----------|-------|
| `sortedData` con sort de servidor | `[serverSort]="true"` |
| Footer tabla + paginación duplicados | `[showFooterInfo]="false"` |
| Slugs hardcodeados `'users.create'` | `PERMISSIONS.USERS.CREATE` |
| `@if (canX())` en iconos de fila | `[crud]` con `permission` en la tabla |
| `@if (canX())` en botones de cabecera | `*hasPermission` + `admin-btn` |
| `filter: brightness()` en hover | `admin-btn--primary` (tema claro/oscuro) |
| Detalle centrado estrecho | Grid ancho completo (`permission-detail`) |
| `queryParamsHandling: 'merge'` | `buildListQueryPatch` + `''` |
| Dialog como único detalle | Ruta `/admin/.../:slug` + `queryParamsHandling: 'preserve'` |

---

## 9. Migración rápida (antes → después)

| Antes | Después |
|-------|---------|
| `updateQueryParams` manual en cada página | `buildListQueryPatch` |
| Toolbar + clear duplicados | `app-admin-list-toolbar` |
| `<select>` inline | `app-table-filter-select` |
| `TableMeta` / `PaginationMeta` separados | `ListMeta` + `toListMeta()` |
| Detalle en `dialogService` | `router.navigate(['/admin/permisos', slug])` |

---

## 10. Toolbar — alineación de filtros

- Toolbar: `align-items: center` (búsqueda, selects y “Quitar filtros” a **38px** de alto).
- Filtros en slot `[filters]`:

```html
<div filters class="mi-pagina__filters">
  <app-table-filter-select ... />
</div>
```

```scss
.mi-pagina__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;  // obligatorio
  gap: 0.65rem;
}
```

## 11. Botones de cabecera (Seed, Crear)

Usar clases compartidas (`shared/styles/admin-buttons.scss`):

```scss
@use '../../shared/styles/admin-buttons';
```

```html
<button *hasPermission="PERMISSIONS.X.CREATE" class="admin-btn admin-btn--primary" type="button">
  <i class="ri-database-2-line"></i>
  Sincronizar Seed
</button>
<button class="admin-btn admin-btn--secondary" type="button">Crear</button>
```

- **No** usar `filter: brightness()` en hover (rompe dark mode).
- Variantes: `--primary`, `--secondary`

## 12. Página de detalle (ancho completo)

- **Sin** `max-width` centrado (usar `width: 100%` como el listado).
- Ruta hija opcional en URL: `/admin/permisos/:slug` (slug en path, query del listado con `preserve`).
- Layout: hero full-width + grid de paneles (`permission-detail` como referencia).

```html
<section class="detail__hero">...</section>
<div class="detail__grid">
  <article class="detail__panel detail__panel--wide">...</article>
  <article class="detail__panel">...</article>
</div>
```

## 13. Plantilla rápida — nuevo módulo admin

1. Columnas en `shared/config/table-columns/{entity}.columns.ts`
2. Página listado: `readListParams` + toolbar + tabla `[crud]` + paginación
3. `@use admin-buttons` + `*hasPermission` en acciones de cabecera
4. Detalle: ruta `:id` o `:slug`, panel ancho completo
5. Constantes `PERMISSIONS.{MODULE}.*` — nunca strings sueltos

## 14. Referencias cruzadas

- **Arquitectura Angular** → `AGENTS.md`
- **RBAC, guards, PERMISSIONS** → `AGENTS-RBAC.md`
- **Estilos toolbar/tabla (`--dt-*`, search focus)** → `AGENTS-STYLES.md`
