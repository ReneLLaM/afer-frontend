# Afer Bolivia â€” Data List Agent (Tabla, bÃºsqueda, filtros, paginaciÃ³n)

> **PropÃ³sito**: PatrÃ³n canÃ³nico para **listados administrativos** con URL como fuente de verdad, toolbar unificado y `app-data-table`. Complementa `AGENTS.md`, `AGENTS-RBAC.md` y `AGENTS-STYLES.md`.

---

## 1. Â¿CuÃ¡ndo usar quÃ©?

| Contexto | Componentes |
|----------|-------------|
| **Admin** (usuarios, roles, permisos, productosâ€¦) | `app-admin-list-toolbar` + `app-data-table` + `app-pagination` |
| **Tienda** (catÃ¡logo pÃºblico) | Cards/grid + `app-pagination` (sin tabla) |
| **Detalle admin** | Ruta hija (`/admin/permisos/:slug`) + card/panel |

---

## 2. Contrato de URL (query params)

ParÃ¡metros estÃ¡ndar (siempre en la URL, **nunca** `queryParamsHandling: 'merge'`):

| Param | Default admin | DescripciÃ³n |
|-------|---------------|-------------|
| `page` | `1` | PÃ¡gina actual |
| `limit` | `10` | Registros por pÃ¡gina (`10`, `20`, `50`, `100`) |
| `search` | â€” | Texto libre (trim en backend) |
| `sortBy` | segÃºn entidad | Campo de orden |
| `order` | `ASC` / `DESC` | DirecciÃ³n |
| `module`, `action`, â€¦ | â€” | Filtros custom por entidad |

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

## 3. BÃºsqueda (`app-search-input`)

| Comportamiento | Valor |
|----------------|-------|
| Debounce | `300ms` (input `debounceTime`) |
| Enter | Emite **inmediato** (sin esperar debounce) |
| Limpiar (Ã—) | VacÃ­a input; el padre debe poner `search: null, page: 1` |
| Icono admin | `icon="svg"` (lupa interna) |
| Espaciado lupa/input | `padding-left` del input >= `46px` para evitar solape |
| Ancho toolbar | `fullWidth` en toolbar admin |

```html
<app-search-input
  placeholder="Buscar..."
  [initialValue]="search()"
  [fullWidth]="true"
  icon="svg"
  (searchChange)="onSearch($event)"
/>
```

---

## 4. Toolbar (`app-admin-list-toolbar`)

Compone bÃºsqueda + `app-filter-bar` (contador y â€œQuitar filtrosâ€).

**DistribuciÃ³n obligatoria**:
- Zona 1: bÃºsqueda (`admin-list-toolbar__search`)
- Zona 2: filtros (`admin-list-toolbar__filters`)
- Zona 3: acciÃ³n limpiar (`admin-list-toolbar__clear-slot`)
- Desktop: 3 columnas (`search | filtros | limpiar`) centradas.
- Tablet/mobile: baja a 1 columna sin dejar huecos cuando no hay filtros activos.

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
      label="MÃ³dulo"
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

La tabla **oculta cada icono** si el usuario no tiene el permiso. No uses `authStore.hasPermission` en la pÃ¡gina para los botones de fila.

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
| `[crud]` | Ver / editar / eliminar con RBAC automÃ¡tico |
| `[serverSort]="true"` | **Obligatorio** con API paginada (no reordena en cliente) |
| `[showFooterInfo]="false"` | Con `app-pagination` (evita duplicar â€œMostrando X de Yâ€) |
| `trackByKey="id"` | Performance |
| `[reorderable]="true"` | Preparado para marcas (columna drag, CDK futuro) |

### Columnas (`TableColumn<T>`)

```typescript
{
  key: 'slug',
  label: 'Slug',
  sortable: true,
  wrap: true,              // texto multilÃ­nea en desktop
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

`shared/config/table-columns/` â†’ `permission.columns.ts`, `product.columns.ts`, `brand.columns.ts`, etc.

### Pipes reutilizables

- `LocaleDatePipe` â€” fechas
- `TruncatePipe` â€” textos largos
- `ModuleLabelPipe` â€” mÃ³dulos RBAC en espaÃ±ol

---

## 6. PaginaciÃ³n (`app-pagination`)

```html
<app-pagination
  [meta]="meta()"
  (pageChange)="onPageChange($event)"
  (limitChange)="onLimitChange($event)"
/>
```

`ListMeta`: `{ total, limit, page, totalPages }` â€” unificado en `shared/models/list-meta.model.ts`.

**Reglas:**

- `limitChange` â†’ siempre resetear `page: 1`
- `searchChange` / filtros â†’ `page: 1`
- Scroll al top: lo hace el componente al cambiar pÃ¡gina

---

## 7. Flujo completo (permisos)

```
URL ?page=1&limit=10&search=foo&module=products&sortBy=slug&order=ASC
  â†’ readListParams()
  â†’ GET /api/permissions?limit=10&offset=0&search=foo&module=products&...
  â†’ app-data-table [data] [serverSort] [sortKey] [sortDir]
  â†’ app-pagination [meta]
  â†’ Ver detalle â†’ /admin/permisos/:slug (GET /api/permissions/:term)
```

---

## 8. Anti-patrones

| No hacer | Hacer |
|----------|-------|
| `sortedData` con sort de servidor | `[serverSort]="true"` |
| Footer tabla + paginaciÃ³n duplicados | `[showFooterInfo]="false"` |
| Slugs hardcodeados `'users.create'` | `PERMISSIONS.USERS.CREATE` |
| `@if (canX())` en iconos de fila | `[crud]` con `permission` en la tabla |
| `@if (canX())` en botones de cabecera | `*hasPermission` + `admin-btn` |
| `filter: brightness()` en hover | `admin-btn--primary` (tema claro/oscuro) |
| Detalle centrado estrecho | Grid ancho completo (`permission-detail`) |
| `queryParamsHandling: 'merge'` | `buildListQueryPatch` + `''` |
| Dialog como Ãºnico detalle | Ruta `/admin/.../:slug` + `queryParamsHandling: 'preserve'` |

---

## 9. MigraciÃ³n rÃ¡pida (antes â†’ despuÃ©s)

| Antes | DespuÃ©s |
|-------|---------|
| `updateQueryParams` manual en cada pÃ¡gina | `buildListQueryPatch` |
| Toolbar + clear duplicados | `app-admin-list-toolbar` |
| `<select>` inline | `app-table-filter-select` |
| `TableMeta` / `PaginationMeta` separados | `ListMeta` + `toListMeta()` |
| Detalle en `dialogService` | `router.navigate(['/admin/permisos', slug])` |

---

## 10. Toolbar â€” alineaciÃ³n de filtros

- Toolbar: `align-items: center` (bÃºsqueda, selects y â€œQuitar filtrosâ€ a **38px** de alto).
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

### 10.1 Estado activo en filtros (obligatorio)

- Cada `app-table-filter-select` debe mostrar estado activo visual:
  - Dot junto al label.
  - Borde/fondo activo en el select.
- En **dark mode** el activo debe reforzar contraste (label + dot + borde) para que se vea claramente sobre `--afer-surface`.
- El toolbar tambiÃ©n debe reforzar borde cuando `hasActiveFilters` sea `true`.

## 11. Botones de cabecera (Seed, Crear)

Definir clases de botones en el `scss` local de cada página/componente (sin `@use` compartido).

```html
<button *hasPermission="PERMISSIONS.X.CREATE" class="admin-btn admin-btn--primary" type="button">
  <i class="ri-database-2-line"></i>
  Sincronizar Seed
</button>
<button class="admin-btn admin-btn--secondary" type="button">Crear</button>
```

- **Nunca** usar `@use` para `admin-buttons`; cada módulo define su bloque local `.admin-btn`.
- **No** usar `filter: brightness()` en hover (rompe dark mode).
- Variantes: `--primary`, `--secondary`

## 12. PÃ¡gina de detalle (ancho completo)

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

## 13. Plantilla rÃ¡pida â€” nuevo mÃ³dulo admin

1. Columnas en `shared/config/table-columns/{entity}.columns.ts`
2. PÃ¡gina listado: `readListParams` + toolbar + tabla `[crud]` + paginaciÃ³n
3. `.admin-btn` local + `*hasPermission` en acciones de cabecera
4. Detalle: ruta `:id` o `:slug`, panel ancho completo
5. Constantes `PERMISSIONS.{MODULE}.*` â€” nunca strings sueltos

## 14. Referencias cruzadas

- **Arquitectura Angular** â†’ `AGENTS.md`
- **RBAC, guards, PERMISSIONS** â†’ `AGENTS-RBAC.md`
- **Estilos toolbar/tabla (`--dt-*`, search focus)** â†’ `AGENTS-STYLES.md`
