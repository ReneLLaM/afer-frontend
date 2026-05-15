# Afer Bolivia — Ecommerce Design System & UI/UX Guide (Module Extension)

> **Propósito**: Extensión específica del módulo ecommerce. Complementa las guías de proyecto:
> - [`AGENTS.md`](../../../../../../AGENTS.md) — Angular Best Practices (arquitectura, rendimiento, estado)
> - [`AGENTS-STYLES.md`](../../../../../../AGENTS-STYLES.md) — UI/UX & Design System (colores, tipografía, componentes visuales)
>
> Este documento establece patrones y reglas **específicos del ecommerce** que no están cubiertos a nivel global.

---

## 1. Sistema de Colores

### 1.1 Variables CSS — Modo Claro (`[data-theme='light']`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--afer-primary` | `#ef7e26` | Botones principales, enlaces, elementos destacados |
| `--afer-secondary` | `#006e9e` | Botones secundarios, badges de categoría, acentos |
| `--afer-corporate` | `#d43b00` | Identidad corporativa, logos, detalles institucionales |
| `--afer-accent` | `#f5d020` | Alertas, insignias, llamadas de atención |
| `--afer-background` | `#f2f2f2` | Fondo principal de la página |
| `--afer-surface` | `#ffffff` | Tarjetas, modales, menús desplegables |
| `--afer-text-primary` | `#2a2e35` | Títulos, cuerpo de texto |
| `--afer-text-secondary` | `#5a6169` | Subtítulos, descripciones, metadatos |
| `--afer-text-muted` | `#8a9099` | Placeholders, estados deshabilitados |
| `--afer-shadow` | `rgba(0, 0, 0, 0.08)` | Sombras base para superficies |
| `--afer-hover` | `rgba(0, 0, 0, 0.08)` | Efectos hover |

### 1.2 Variables CSS — Modo Oscuro (`[data-theme='dark']`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--afer-primary` | `#ffffff` | Máximo contraste sobre fondo oscuro |
| `--afer-secondary` | `#ef7e26` | Color secundario (toma el naranja principal) |
| `--afer-corporate` | `#d43b00` | Se mantiene para identidad corporativa |
| `--afer-accent` | `#f5d020` | Acento brillante sobre fondo oscuro |
| `--afer-background` | `#1a1f26` | Fondo oscuro principal |
| `--afer-surface` | `#242a31` | Superficies de tarjetas (ligeramente más claro) |
| `--afer-text-primary` | `#e8eaed` | Texto principal claro |
| `--afer-text-secondary` | `#b8bdc3` | Texto secundario gris claro |
| `--afer-text-muted` | `#878d95` | Texto silenciado |
| `--afer-shadow` | `rgba(0, 0, 0, 0.3)` | Sombras más intensas en modo oscuro |
| `--afer-hover` | `rgba(255, 255, 255, 0.1)` | Efectos hover en modo oscuro |

### 1.3 Versiones Absolute (siempre fijas)

```css
--afer-primary-absolute: #ef7e26;
--afer-secondary-absolute: #006e9e;
--afer-corporate-absolute: #d43b00;
--afer-accent-absolute: #f5d020;
--afer-background-light-absolute: #f2f2f2;
--afer-background-dark-absolute: #1a1f26;
--afer-text-primary-absolute: #2a2e35;
--afer-text-secondary-absolute: #5a6169;
--afer-text-muted-absolute: #8a9099;
--afer-surface-light-absolute: #ffffff;
--afer-surface-dark-absolute: #242a31;
```

**Regla**: Usa las variables `-absolute` cuando necesites un color que NO cambie con el tema (ej: botón de agregar al carrito siempre usa `--afer-secondary-absolute`).

### 1.4 Patrones de uso de color

#### Color mix para transparencias
```scss
// Badge con fondo sutil
background: color-mix(in srgb, var(--afer-secondary), transparent 90%);
border: 1px solid color-mix(in srgb, var(--afer-secondary), transparent 80%);

// Sombras con color de marca
box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
```

---

## 2. Tipografía

### 2.1 Familia
- **Fuente principal**: `Inter` (Google Fonts)
- **Monospace**: Para SKU y datos técnicos

### 2.2 Escala tipográfica

| Elemento | Tamaño | Peso | Uso |
|----------|--------|------|-----|
| H1 / Hero | `clamp(1.5rem, 4vw, 2.5rem)` | 900 | Títulos principales |
| H2 / Section | `clamp(1.25rem, 4vw, 1.75rem)` | 900 | Títulos de sección |
| H3 / Card title | `clamp(0.9rem, 2vw, 1rem)` | 800 | Títulos de tarjeta |
| Body | `0.95rem - 1rem` | 400-600 | Texto cuerpo |
| Small / Meta | `0.75rem - 0.85rem` | 600-700 | Metadatos, badges |
| Micro | `0.55rem - 0.7rem` | 700-800 | SKU, tags pequeños |

### 2.3 Reglas tipográficas
- **Títulos de sección**: `text-transform: uppercase`, `letter-spacing: -1px`
- **Badges y tags**: `text-transform: uppercase`, `letter-spacing: 0.5px - 1px`, `font-weight: 800`
- **Precios**: `font-weight: 900`, `letter-spacing: -0.5px`
- **Body text**: `line-height: 1.4 - 1.6`
- **Títulos compactos**: `line-height: 1.2`

### 2.4 Truncamiento de texto
```scss
// Truncamiento multi-línea estándar
display: -webkit-box;
-webkit-line-clamp: 2; // o 3
-webkit-box-orient: vertical;
overflow: hidden;
```

---

## 3. Espaciado y Layout

### 3.1 Sistema de spacing

| Token | Valor | Uso |
|-------|-------|-----|
| xs | `4px` | Gap mínimo, padding micro |
| sm | `6px - 8px` | Gap entre elementos pequeños |
| md | `12px - 16px` | Padding de tarjetas, gap estándar |
| lg | `20px - 24px` | Gap entre secciones |
| xl | `40px` | Padding de página |
| 2xl | `60px+` | Separación de bloques principales |

### 3.2 Contenedores
```scss
// Contenedor principal de página
max-width: 1400px;
margin: 0 auto;
padding: 0 1rem;

// Contenedor de secciones
padding: 2.5rem 1rem;
max-width: 1400px;
margin: 0 auto;
```

### 3.3 Grid patterns
```scss
// Grid responsive automático
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

// Breakpoints de grid
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 650px) { grid-template-columns: 1fr; gap: 1rem; }
```

---

## 4. Border Radius

| Elemento | Radio | Uso |
|----------|-------|-----|
| Tarjetas grandes | `clamp(12px, 1.5vw, 16px)` | Product cards, brand cards |
| Botones | `clamp(10px, 1.5vw, 14px) 0` | Botón agregar (asimétrico) |
| Badges / Pills | `12px` | Badges de marca, categoría |
| Iconos circulares | `50%` | Avatares, iconos de categoría |
| Inputs / Contenedores | `8px - 12px` | Elementos de formulario |
| Secciones | `0 0 30px 30px` | Bordes inferiores redondeados |

---

## 5. Sombras

### 5.1 Sombras estándar
```scss
// Sombra sutil (hover cards)
box-shadow: 0 6px 15px rgba(0, 0, 0, 0.06);

// Sombra media (botones)
box-shadow: 0 4px 10px color-mix(in srgb, var(--afer-secondary), transparent 80%);

// Sombra elevada (hover botones)
box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);

// Sombra de sección
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
```

### 5.2 Sombras en modo oscuro
```scss
// Sombra más intensa necesaria en fondo oscuro
box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
```

---

## 6. Componentes — Patrones y Estilos

### 6.1 Product Card (original)

**Estructura**:
```
article.product-card
├── .product-card__header (brand + SKU)
├── a.product-card__link
│   ├── .product-card__visual
│   │   ├── img.product-card__image
│   │   └── .product-card__labels
│   └── .product-card__info
│       ├── .product-card__tags
│       ├── h3.product-card__title
│       └── .product-card__price
└── .product-card__actions
    ├── button.product-card__add
    └── button.product-card__favorite
```

**Características clave**:
- Layout vertical (flex-column)
- Aspect ratio de imagen: `1.2 / 1`
- Labels en la parte inferior de la imagen (NUEVO, TENDENCIA, DESTACADO)
- Botón agregar sólido en modo claro, glass en modo oscuro
- Hover: `border-color: var(--afer-secondary)`, sin shadow en la card

### 6.2 Product Card V2 (horizontal)

**Estructura**:
```
article.product-card
├── .product-card__left (imagen)
│   ├── .product-card__badges-top (brand + SKU)
│   └── .product-card__img-container
└── .product-card__right (info)
    ├── .product-card__info-top
    │   ├── .product-card__status-row (badges)
    │   ├── .product-card__category
    │   └── h3.product-card__title
    └── .product-card__bottom
        ├── .product-card__price-wrapper
        └── .product-card__actions
```

**Características clave**:
- Layout horizontal (220px height)
- Imagen a la izquierda (160px width)
- Badges de estado arriba de la imagen
- Altura fija en desktop, auto en responsive
- Mismo patrón de botón glass en modo oscuro

### 6.3 Product Card Mini

**Estructura**:
```
article.product-mini
├── .product-mini__img-container
├── .product-mini__info
│   ├── h3.product-mini__title
│   └── .product-mini__price
└── button.btn-quick-add (posicionado absolute)
```

**Características clave**:
- Layout vertical compacto
- Aspect ratio de imagen: `1 / 1`
- Botón quick-add flotante (bottom-right)
- Min-width: `120px`
- Usado en carruseles

### 6.4 Brand Card

**Estructura**:
```
.brand-card
├── a.brand-card__link
│   ├── .brand-card__visual (logo)
│   │   ├── img.brand-card__image
│   │   └── .brand-card__badge
│   └── .brand-card__info
│       ├── h3.brand-card__name
│       └── p.brand-card__description
```

**Características clave**:
- Aspect ratio de visual: `1.5 / 1`
- Fondo siempre blanco para logos (`#ffffff`)
- Mismo border-radius que product-card

### 6.5 Category Card

**Estructura**:
```
.category-card
├── .category-card__icon-wrapper
│   └── img.category-card__icon
├── span.category-card__name
└── .category-card__indicator (oculto)
```

**Características clave**:
- Icono circular de 64px
- Border-bottom de 4px para estado activo
- Padding: `16px 20px`
- Border-radius: `20px 20px 0 0`

### 6.6 Product Section

**Estructura**:
```
section.product-section
├── .product-section__header
│   ├── h2.product-section__title
│   ├── .product-section__accent
│   └── a.product-section__link
├── .product-section__container
│   └── .product-section__content (--grid | --carousel | --original)
└── .product-section__footer
```

**Layouts soportados**:
- `grid`: Grid responsive con auto-fill
- `carousel`: Flex horizontal con drag scroll
- `original`: Grid compacto (minmax 250px)

### 6.7 Featured Product Grid

**Características**:
- Fondo `--afer-surface`
- Border-radius inferior: `0 0 30px 30px`
- Usa product-card-v2 internamente
- Grid: `minmax(350px, 1fr)`

### 6.8 Brand Section

**Características**:
- Todas las brand cards en el carousel tienen tamaño fijo: `170x140px` desktop, `140x115px` mobile
- Logo con `aspect-ratio: 1.5 / 1`, truncado de nombre y descripción a 1 línea
- Mismo patrón de header con accent line sólida

### 6.9 Hero Slider

**Características**:
- Altura: `clamp(260px, 38vw, 680px)`
- Items activos: 75% width, scale(1)
- Items prev/next: 70% width, opacity 0.5, blur
- Animaciones: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Dots: 10px circle, activo se expande a 26px pill

---

## 7. Sistema de Badges y Tags

### 7.1 Badge de Marca / Categoría
```scss
color: var(--afer-secondary);
background: color-mix(in srgb, var(--afer-secondary), transparent 90%);
font-size: clamp(0.6rem, 1vw, 0.75rem);
font-weight: 800;
text-transform: uppercase;
letter-spacing: 1px;
padding: 2px 12px;
border-radius: 12px;
border: 1px solid color-mix(in srgb, var(--afer-secondary), transparent 80%);

&:hover {
  background: var(--afer-secondary);
  color: #ffffff;
}
```

### 7.2 Labels de estado (sobre imagen)
```scss
.label {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: clamp(0.55rem, 1vw, 0.6rem);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #ffffff;
  backdrop-filter: blur(4px);

  &--new { background: rgba(16, 185, 129, 0.7); }
  &--trending { background: color-mix(in srgb, var(--afer-secondary), transparent 30%); }
  &--featured { background: color-mix(in srgb, var(--afer-accent-absolute), transparent 30%); }
}
```

---

## 8. Botones

### 8.1 Botón Agregar (primario)
```scss
background: var(--afer-secondary-absolute);
color: #ffffff;
border: 1px solid transparent;
border-radius: clamp(10px, 1.5vw, 14px) 0;
padding: clamp(8px, 1.5vw, 10px) 16px;
font-size: clamp(0.7rem, 1.2vw, 0.85rem);
font-weight: 700;
letter-spacing: 0.5px;

&:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
  filter: brightness(1.1);
}

&:active {
  transform: translateY(0) scale(0.98);
}
```

### 8.2 Modo oscuro — Botón Glass
```scss
:host-context([data-theme='dark']) & {
  background: color-mix(in srgb, var(--afer-secondary-absolute), transparent 90%);
  color: var(--afer-secondary-absolute);
  border: 1px solid color-mix(in srgb, var(--afer-secondary-absolute), transparent 75%);

  &:hover {
    background: var(--afer-secondary-absolute);
    color: #ffffff;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
  }
}
```

### 8.3 Botón Favorito
```scss
background: color-mix(in srgb, var(--afer-secondary), transparent 90%);
border: 1px solid color-mix(in srgb, var(--afer-secondary), transparent 80%);
color: var(--afer-secondary);
border-radius: 8px;
padding: 6px;

&--active {
  background: var(--afer-secondary);
  color: #ffffff;
  border-color: transparent;
}
```

### 8.4 Botón Quick-Add (mini card)
```scss
position: absolute;
bottom: 6px;
right: 6px;
width: 26px;
height: 26px;
background: var(--afer-secondary);
border-radius: 6px;
box-shadow: 0 2px 6px color-mix(in srgb, var(--afer-secondary), transparent 85%);

&:hover {
  background: var(--afer-primary);
  transform: scale(1.1);
}
```

---

## 9. Dark Mode — Reglas y Patrones

### 9.1 Principio fundamental
**NO hay transiciones al cambiar de tema**. Los cambios de color son instantáneos. Solo se animan interacciones de usuario (hover, click, etc.).

```scss
// CORRECTO: Solo animar interacciones
transition: transform 0.3s ease, box-shadow 0.3s ease;

// INCORRECTO: No animar cambio de tema
transition: all 0.3s ease; // Esto animaría el cambio de tema
```

### 9.2 Patrón de implementación
```scss
:host-context([data-theme='dark']) .element {
  // Estilos específicos para modo oscuro
}
```

### 9.3 Patrones de adaptación

#### Superficies
```scss
// Modo claro
background: var(--afer-surface);

// Modo oscuro
background: color-mix(in srgb, var(--afer-surface), #000 15%);
```

#### Bordes
```scss
// Modo claro
border: 1px solid rgba(128, 128, 128, 0.15);

// Modo oscuro
border-color: color-mix(in srgb, var(--afer-hover), transparent 30%);
```

#### Sombras
```scss
// Modo claro
box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);

// Modo oscuro (más intensas)
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
```

#### Filtros de imagen
```scss
// Modo claro
filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.1));

// Modo oscuro
filter: drop-shadow(0 8px 26px rgb(0 0 0 / 0.5));
```

### 9.4 Elementos que NO cambian
- `--afer-corporate`: Siempre `#d43b00`
- `--afer-accent-absolute`: Siempre `#f5d020`
- Imágenes de logos: Fondo siempre blanco
- Badges de estado sobre imagen: Colores fijos con transparencia

---

## 10. Responsive Design

### 10.1 Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| Mobile | `480px` | Ajustes finos de móvil |
| Mobile large | `600px` | Galería, lightbox |
| Tablet | `768px` | Cambio de layout principal |
| Tablet large | `900px` | Product detail grid |
| Desktop small | `992px` | Grid de 3 columnas |
| Desktop | `1100px` | Grid de 2 columnas |
| Desktop large | `1200px` | Ajustes de cards horizontales |

### 10.2 Patrones responsive

#### Mobile-first approach
```scss
// Estilos base (mobile)
.product-card {
  padding: 8px;
}

// Progressive enhancement
@media (min-width: 768px) {
  .product-card {
    padding: 16px;
  }
}
```

#### Clamp para valores fluidos
```scss
// Tipografía fluida
font-size: clamp(0.9rem, 2vw, 1rem);

// Border radius fluido
border-radius: clamp(12px, 1.5vw, 16px);

// Padding fluido
padding: clamp(8px, 1.5vw, 10px) 16px;
```

#### Grid adaptativo
```scss
// Auto-fill con mínimo
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

// Override en breakpoints
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 650px) { grid-template-columns: 1fr; }
```

#### Hide en mobile
```scss
.hide-mobile {
  @media (max-width: 768px) {
    display: none !important;
  }
}
```

### 10.3 Patrón de mobile para cards
```scss
@media (max-width: 480px) {
  &__header { padding: 8px 12px 4px; }
  &__info { padding: 10px 12px; }
  &__actions { padding: 4px 12px 10px; }
  
  // Reducir tamaños de fuente y elementos
  font-size: 0.7rem;
  
  // Iconos más pequeños
  svg { width: 14px; height: 14px; }
}
```

---

## 11. Transiciones y Animaciones

### 11.1 Easing functions
```scss
// Estándar (la mayoría de interacciones)
cubic-bezier(0.4, 0, 0.2, 1)

// Slider (más elástica)
cubic-bezier(0.2, 0.8, 0.2, 1)

// Simple
ease
```

### 11.2 Duraciones
| Duración | Uso |
|----------|-----|
| `0.15s - 0.2s` | Micro-interacciones, focus states |
| `0.2s - 0.3s` | Hover states, border changes |
| `0.3s` | Transformaciones estándar (elevación) |
| `0.4s - 0.5s` | Image zoom, transformaciones grandes |
| `0.7s` | Slider transitions |

### 11.3 Patrones de hover
```scss
// Card hover
&:hover {
  border-color: var(--afer-secondary);
  // NO agregar box-shadow en la card, solo en botones
}

// Botón hover (elevación)
&:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
}

// Imagen hover (zoom sutil)
&:hover .product-card__image {
  transform: scale(1.08);
}

// Icono hover (rotación + scale)
&:hover svg {
  transform: rotate(-10deg) scale(1.1);
}
```

### 11.4 Active states
```scss
&:active {
  transform: translateY(0) scale(0.98);
}
```

### 11.5 Animaciones prohibidas en cambio de tema
```scss
// NO HACER: Esto anima el cambio de tema
transition: all 0.3s ease;
transition: background 0.3s ease, color 0.3s ease;

// HACER: Solo animar interacciones
transition: transform 0.3s ease, box-shadow 0.3s ease;
```

---

## 12. Accesibilidad

### 12.1 Focus states
```scss
&:focus-visible {
  outline: 2px solid var(--afer-primary);
  outline-offset: 2px;
}
```

### 12.2 Aria labels
```html
<button aria-label="Agregar a favoritos">...</button>
<button aria-label="Añadir al carrito">...</button>
```

### 12.3 Touch targets
- Mínimo: `44px` en mobile
- Estándar: `52px` en desktop
- Botones de cantidad: `40px` desktop, `32px` mobile

### 12.4 Safe areas
```scss
padding: max(1rem, env(safe-area-inset-left)) 
         max(1rem, env(safe-area-inset-top))
         max(1rem, env(safe-area-inset-bottom))
         max(1rem, env(safe-area-inset-right));
```

---

## 13. Naming Conventions

### 13.1 BEM modificado
```scss
// Bloque
.product-card { }

// Elemento
.product-card__header { }
.product-card__image { }

// Modificador
.product-card__favorite--active { }
.label--new { }
```

### 13.2 Reglas de nombrado
- **Bloques**: kebab-case, descriptivo (`.product-card`, `.brand-card`)
- **Elementos**: doble guion bajo (`__element`)
- **Modificadores**: doble guion (`--modifier`)
- **Host context**: `:host-context([data-theme='dark'])`
- **Clases utilitarias**: kebab-case (`.hide-mobile`, `.product-item`)

### 13.3 Estructura de archivos
```
component-name/
├── component-name.ts
├── component-name.html
├── component-name.scss
└── component-name.spec.ts
```

---

## 14. Anti-patrones (NO HACER)

### 14.1 Colores
- ❌ No usar colores hardcodeados (excepto blancos/negros puros)
- ❌ No usar `#fff` o `#000` donde existe una variable
- ✅ Usar siempre las variables CSS `--afer-*`

### 14.2 Transiciones
- ❌ No usar `transition: all`
- ❌ No animar `background` o `color` para cambio de tema
- ✅ Especificar solo las propiedades que se animan

### 14.3 Layout
- ❌ No usar anchos fijos sin responsive
- ❌ No usar `!important` excepto en utilitarias como `.hide-mobile`
- ✅ Usar `clamp()`, `minmax()`, y media queries

### 14.4 Componentes
- ❌ No mezclar estilos de product-card, product-card-v2, product-card-mini
- ❌ No duplicar estilos que ya existen en variables
- ✅ Reutilizar patrones existentes

### 14.5 Z-index
- ❌ No usar valores arbitrarios de z-index
- ✅ Seguir la escala existente:
  - `1`: Elementos base
  - `2-3`: Labels, overlays
  - `4-6`: Items de slider prev/next
  - `10`: Elemento activo, badges importantes
  - `10500`: Lightbox

---

## 15. Home Page — Estructura y Flujo

### 15.1 Orden de secciones
```
1. Hero Slider (app-hero-slider)
2. Category Carousel (app-category-carousel)
3. Featured Product Grid (app-featured-product-grid)
4. Productos Destacados (app-product-section, carousel, mini cards)
5. Tendencias (app-product-section, grid, v2 cards)
6. Novedades (app-product-section, original, original cards)
7. Brands Section (app-brand-section)
```

### 15.2 Espaciado entre secciones
- Las secciones manejan su propio padding internamente
- `home-main-container`: `gap: 0`, sin spacing entre hijos
- Cada sección tiene `padding: 2.5rem 1rem`

### 15.3 Card style por sección
| Sección | Layout | Card Style | Cantidad |
|---------|--------|------------|----------|
| Featured Grid | Grid | v2 (horizontal) | 6 |
| Destacados | Carousel | mini | 20 |
| Tendencias | Grid | v2 | 8 |
| Novedades | Grid | original | 8 |

---

## 16. Product Detail — Layout

### 16.1 Estructura
```
.product-detail
├── .product-detail__top (grid 2 columnas)
│   ├── .product-gallery (izquierda)
│   │   ├── .product-gallery__main
│   │   │   └── .product-gallery__viewport
│   │   └── .product-gallery__thumbnails
│   └── .product-info (derecha)
│       ├── .product-info__header
│       ├── .product-badges
│       ├── .product-title
│       ├── .product-pricing
│       └── .product-actions
└── .product-detail__bottom
    └── Tabs (descripción, especificaciones)
```

### 16.2 Galería
- Thumbnails horizontales abajo
- Flechas circulares superpuestas
- Lightbox con contención flex
- Safe area padding en mobile

### 16.3 Acciones
- Selector de cantidad + botón agregar + favorito
- En mobile: flex-wrap nowrap, gap reducido

---

## 17. Skeleton / Loading States

### 17.1 Patrón
```html
<skeleton-card [count]="6" />
```

### 17.2 Shimmer animation
```scss
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

background: linear-gradient(90deg, #efefef 25%, #e0e0e0 50%, #efefef 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

---

## 18. Pipes y Utilidades

### 18.1 Product Image Pipe
```html
<img [src]="product.images | productImage" />
```
- Transforma el array de imágenes en la URL correcta
- Usar siempre este pipe para imágenes de producto

### 18.2 Slice pipe para truncamiento
```html
{{ product.sku.length > 12 ? (product.sku | slice: 0 : 12) + '...' : product.sku }}
```

---

## 19. Angular — Patrones de Componente

### 19.1 Signals
```typescript
// Input
product = input.required<Datum>();

// Output
favoriteToggle = output<string>();
addToCart = output<string>();
```

### 19.2 Event handling
```typescript
onAddToCart(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  this.addToCart.emit(this.product().id);
}
```

### 19.3 Control flow
```html
@if (condition) { }
@for (item of items; track item.id) { }
@switch (value) { }
```

---

## 20. Checklist de Implementación

### Antes de crear un nuevo componente:
- [ ] ¿Existe un componente similar que pueda reutilizar?
- [ ] ¿Estoy usando las variables CSS correctas?
- [ ] ¿El componente funciona en modo claro y oscuro?
- [ ] ¿Tiene responsive design para todos los breakpoints?
- [ ] ¿Los focus states son visibles?
- [ ] ¿Los touch targets son >= 44px en mobile?
- [ ] ¿Estoy siguiendo la convención BEM?
- [ ] ¿Las transiciones NO animan el cambio de tema?
- [ ] ¿Los colores usan variables, no hardcodeados?
- [ ] ¿El componente tiene skeleton loading state?

### Antes de modificar un componente existente:
- [ ] ¿El cambio es consistente con el sistema de diseño?
- [ ] ¿Se mantiene la funcionalidad en ambos temas?
- [ ] ¿Se mantiene el responsive design?
- [ ] ¿No se rompen los hover/active states existentes?

---

## 21. Referencia Rápida — Valores Comunes

| Propiedad | Valor | Contexto |
|-----------|-------|----------|
| Border card | `1px solid rgba(128, 128, 128, 0.15)` | Todas las cards |
| Hover border | `var(--afer-secondary)` | Cards interactivas |
| Card radius | `clamp(12px, 1.5vw, 16px)` | Product, brand cards |
| Badge radius | `12px` | Pills de marca/categoría |
| Button radius | `clamp(10px, 1.5vw, 14px) 0` | Agregar al carrito |
| Font weight bold | `800 - 900` | Títulos, badges, precios |
| Font weight normal | `400 - 600` | Body text |
| Gap estándar | `12px - 16px` | Entre elementos de card |
| Padding card | `12px 16px` | Info sections de cards |
| Image aspect | `1.2 / 1` | Product card original |
| Image aspect | `1 / 1` | Product card mini |
| Hover transform | `translateY(-3px)` | Elevación estándar |
| Hover scale | `scale(1.08)` | Zoom de imagen |
| Active scale | `scale(0.98)` | Feedback de click |

---

*Última actualización: Mayo 2026*
*Este documento es vivo y debe actualizarse con cada cambio significativo al sistema de diseño.*
