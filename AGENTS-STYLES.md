# Afer Bolivia — UI/UX & Design System Agent

> **Propósito**: Guía completa unificada de diseño UI/UX, sistema de estilos, componentes visuales y patrones de interfaz para todo el proyecto frontend de Afer Bolivia. Todo agente o desarrollador debe seguir estas reglas para mantener la consistencia visual y máxima calidad de la interfaz.

---

## 1. Rol y Alcance

Este agente rige **todo el código CSS/SCSS/HTML visual** del proyecto frontend. Aplica a:
- Variables CSS y sistema de colores
- Tipografía y escala tipográfica
- Espaciado, layout y grid
- Componentes visuales (cards, botones, badges, etc.)
- Dark mode y transiciones
- Responsive design y breakpoints
- Animaciones y micro-interacciones
- Accesibilidad visual

**No cubre**: Lógica TypeScript, arquitectura Angular, gestión de estado (ver `AGENTS.md`). Patrón de listados admin: ver `AGENTS-DATA-LIST.md`.

---

## 1.1 Tokens — Tabla y toolbar admin

| Área | Variables / clases |
|------|-------------------|
| Tabla | `--dt-surface`, `--dt-accent`, `--dt-border`, `--dt-row-hover` en `data-table.scss` |
| Búsqueda | Focus: `border-color: var(--afer-secondary-absolute)` + ring en `search-input.scss` |
| Toolbar | `admin-list-toolbar` — search `flex: 1` en desktop (`--full`) |
| Filtros | `table-filter-select` + slot `[filters]` con `align-items: center` |
| Botones cabecera | `admin-btn`, `admin-btn--primary`, `admin-btn--secondary` |

---

## 2. Sistema de Colores

### 2.1 Variables CSS — Modo Claro (`[data-theme='light']`)

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

### 2.2 Variables CSS — Modo Oscuro (`[data-theme='dark']`)

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

### 2.3 Versiones Absolute (siempre fijas)

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

> [!NOTE]
> Usa las variables `-absolute` cuando necesites un color que NO cambie con el tema. Por ejemplo, el botón de agregar al carrito siempre debe mantener su tono azul de marca en modo claro u oscuro.

### 2.4 Color mix para transparencias

```scss
// Badge con fondo sutil
background: color-mix(in srgb, var(--afer-secondary), transparent 90%);
border: 1px solid color-mix(in srgb, var(--afer-secondary), transparent 80%);

// Sombras con color de marca
box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
```

---

## 3. Tipografía

### 3.1 Familia
- **Fuente principal**: `Inter` (Google Fonts)
- **Monospace**: Para SKU y datos técnicos

### 3.2 Escala tipográfica

| Elemento | Tamaño | Peso | Uso |
|----------|--------|------|-----|
| H1 / Hero | `clamp(1.5rem, 4vw, 2.5rem)` | 900 | Títulos principales |
| H2 / Section | `clamp(1.25rem, 4vw, 1.75rem)` | 900 | Títulos de sección |
| H3 / Card title | `clamp(0.9rem, 2vw, 1rem)` | 800 | Títulos de tarjeta |
| Body | `0.95rem - 1rem` | 400-600 | Texto cuerpo |
| Small / Meta | `0.75rem - 0.85rem` | 600-700 | Metadatos, badges |
| Micro | `0.55rem - 0.7rem` | 700-800 | SKU, tags pequeños |

### 3.3 Reglas tipográficas
- **Títulos de sección**: `text-transform: uppercase`, `letter-spacing: -1px`
- **Badges y tags**: `text-transform: uppercase`, `letter-spacing: 0.5px - 1px`, `font-weight: 800`
- **Precios**: `font-weight: 900`, `letter-spacing: -0.5px`
- **Body text**: `line-height: 1.4 - 1.6`
- **Títulos compactos**: `line-height: 1.2`

### 3.4 Truncamiento de texto

```scss
// Truncamiento multi-línea estándar
display: -webkit-box;
-webkit-line-clamp: 2; // o 3
-webkit-box-orient: vertical;
overflow: hidden;
```

---

## 4. Espaciado y Layout

### 4.1 Sistema de spacing

| Token | Valor | Uso |
|-------|-------|-----|
| xs | `4px` | Gap mínimo, padding micro |
| sm | `6px - 8px` | Gap entre elementos pequeños |
| md | `12px - 16px` | Padding de tarjetas, gap estándar |
| lg | `20px - 24px` | Gap entre secciones |
| xl | `40px` | Padding de página |
| 2xl | `60px+` | Separación de bloques principales |

### 4.2 Contenedores

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

### 4.3 Grid patterns

```scss
// Grid responsive automático
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

// Breakpoints de grid
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 650px) { grid-template-columns: 1fr; gap: 1rem; }
```

---

## 5. Border Radius

| Elemento | Radio | Uso |
|----------|-------|-----|
| Tarjetas grandes | `clamp(12px, 1.5vw, 16px)` | Product cards, brand cards |
| Botones | `clamp(10px, 1.5vw, 14px) 0` | Botón agregar (asimétrico) |
| Auth inputs/buttons | `10px 0` | Inputs y botones de auth (asimétrico) |
| Badges / Pills | `12px` | Badges de marca, categoría |
| Iconos circulares | `50%` | Avatares, iconos de categoría |
| Inputs / Contenedores | `8px - 12px` | Elementos de formulario |
| Secciones | `0 0 30px 30px` | Bordes inferiores redondeados |

---

## 6. Sombras

### 6.1 Sombras estándar

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

### 6.2 Sombras en modo oscuro

```scss
// Sombra más intensa necesaria en fondo oscuro
box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
```

---

## 7. Componentes — Patrones y Estilos

### 7.1 Product Card (original)

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

### 7.2 Product Card V2 (horizontal)

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

### 7.3 Product Card Mini

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

### 7.4 Brand Card

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

### 7.5 Category Card

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

### 7.6 Hero Slider

**Características**:
- Altura: `clamp(260px, 38vw, 680px)`
- Items activos: 75% width, scale(1)
- Items prev/next: 70% width, opacity 0.5, blur
- Animaciones: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Dots: 10px circle, activo se expande a 26px pill

### 7.7 Product Section (Especial Ecommerce)

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
- `grid`: Grid responsive con auto-fill y espaciado clamp.
- `carousel`: Flex horizontal interactivo con drag scroll.
- `original`: Grid compacto de 3 o 4 columnas tradicionales (minmax 250px).

### 7.8 Featured Product Grid (Especial Ecommerce)
- Fondo de sección: `--afer-surface`
- Border-radius inferior de la sección completa: `0 0 30px 30px`
- Utiliza tarjetas `product-card-v2` internamente.
- Grid estructurado a dos columnas en desktop: `minmax(350px, 1fr)`

### 7.9 Brand Carousel Section (Especial Ecommerce)
- Todas las tarjetas de marcas en carrusel poseen tamaño fijo rígido: `170x140px` en desktop, y `140x115px` en mobile.
- Logotipo de marca con `aspect-ratio: 1.5 / 1`, truncado estricto a 1 sola línea del título y descripción del fabricante.
- Header con patrón accent line sólida al igual que el listado de productos.

---

## 8. Sistema de Badges y Tags

### 8.1 Badge de Marca / Categoría

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

### 8.2 Labels de estado (sobre imagen)

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

## 9. Botones

### 9.1 Botón Agregar (primario)

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

### 9.2 Modo oscuro — Botón Glass

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

### 9.3 Botón Favorito

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

### 9.4 Botón Quick-Add (mini card - Especial Ecommerce)

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

## 10. Auth — Inputs y Botones

### 10.1 Auth Input

```scss
// Input
&__input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(138, 144, 153, 0.2);
  border-radius: clamp(10px, 1.5vw, 14px) 0;
  font-size: 0.9rem;
  background: #ffffff;
  color: var(--afer-text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--afer-primary);
    box-shadow: 0 4px 12px rgba(239, 126, 38, 0.2);
  }

  &::placeholder {
    color: #8a9099;
  }
}
```

**Dark mode**:
```scss
:host-context([data-theme='dark']) & {
  background: #2a2f36;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;

  &:focus {
    border-color: var(--afer-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
```

### 10.2 Auth Submit Button

```scss
padding: 0.9rem 1.5rem;
background: var(--afer-primary-absolute);
color: #ffffff;
border: 1px solid transparent;
border-radius: 10px 0; /* top-left y bottom-right redondeados */
font-size: 0.95rem;
font-weight: 700;
letter-spacing: 0.3px;
box-shadow: 0 4px 12px color-mix(in srgb, var(--afer-primary-absolute), transparent 70%);
transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

&:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--afer-primary-absolute), transparent 65%);
  filter: brightness(1.08);
}

&:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}
```

**Dark mode (glass effect)**:
```scss
:host-context([data-theme='dark']) & {
  background: color-mix(in srgb, var(--afer-primary-absolute), transparent 88%);
  color: var(--afer-primary-absolute);
  border: 1px solid color-mix(in srgb, var(--afer-primary-absolute), transparent 72%);
  box-shadow: none;

  &:hover:not(:disabled) {
    background: var(--afer-primary-absolute);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--afer-primary-absolute), transparent 60%);
  }
}
```

### 10.3 Auth Google Button

```scss
padding: 0.8rem 1.25rem;
background: var(--afer-surface);
border: 1px solid color-mix(in srgb, var(--afer-text-muted), transparent 75%);
border-radius: 10px;
font-size: 0.9rem;
font-weight: 600;
box-shadow: 0 2px 4px color-mix(in srgb, var(--afer-shadow), transparent 70%);
transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

&:hover {
  border-color: var(--afer-text-muted);
  background: var(--afer-hover);
  box-shadow: 0 4px 8px color-mix(in srgb, var(--afer-shadow), transparent 60%);
}
```

---

## 11. Dark Mode — Reglas y Patrones

### 11.1 Principio fundamental

**NO hay transiciones al cambiar de tema**. Los cambios de color son instantáneos. Solo se animan interacciones de usuario (hover, click, etc.).

```scss
// CORRECTO: Solo animar interacciones
transition: transform 0.3s ease, box-shadow 0.3s ease;

// INCORRECTO: No animar cambio de tema
transition: all 0.3s ease; // Esto animaría el cambio de tema
```

### 11.2 Patrón de implementación

```scss
:host-context([data-theme='dark']) .element {
  // Estilos específicos para modo oscuro
}
```

### 11.3 Patrón de Adaptación en Superficies, Bordes y Sombras
- **Superficies**: En modo claro usa `var(--afer-surface)`. En modo oscuro incrementa el contraste sutilmente usando `color-mix(in srgb, var(--afer-surface), #000 15%)`.
- **Bordes**: Reemplaza el borde gris sutil del modo claro por `color-mix(in srgb, var(--afer-hover), transparent 30%)` en modo oscuro.
- **Sombras**: Las sombras en modo oscuro requieren mayor intensidad y profundidad física: `box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3)`.

### 11.4 Filtros de Imagen (Especial Ecommerce)
- **Modo Claro**: `filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.1))`
- **Modo Oscuro**: `filter: drop-shadow(0 8px 26px rgb(0 0 0 / 0.5))` para realzar productos transparentes o flotantes sobre el fondo.

---

## 12. Responsive Design

### 12.1 Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| Mobile | `480px` | Ajustes finos de móvil |
| Mobile large | `600px` | Galería, lightbox |
| Tablet | `768px` | Cambio de layout principal |
| Tablet large | `900px` | Product detail grid |
| Desktop small | `992px` | Grid de 3 columnas |
| Desktop | `1100px` | Grid de 2 columnas |
| Desktop large | `1200px` | Ajustes de cards horizontales |

### 12.2 Patrones responsive

#### Mobile-first approach
```scss
// Estilos base (mobile)
.product-card { padding: 8px; }

// Progressive enhancement
@media (min-width: 768px) {
  .product-card { padding: 16px; }
}
```

#### Clamp para valores fluidos
```scss
font-size: clamp(0.9rem, 2vw, 1rem);
border-radius: clamp(12px, 1.5vw, 16px);
padding: clamp(8px, 1.5vw, 10px) 16px;
```

### 12.3 Patrón Mobile para Tarjetas (Especial Ecommerce)
En pantallas ultra-pequeñas (móvil `<480px`), la estructura interna debe compactarse para maximizar el área visible de venta:
```scss
@media (max-width: 480px) {
  &__header { padding: 8px 12px 4px; }
  &__info { padding: 10px 12px; }
  &__actions { padding: 4px 12px 10px; }
  
  font-size: 0.7rem; // Escala tipográfica adaptada
  svg { width: 14px; height: 14px; } // Iconos ajustados a 14px
}
```

---

## 13. Transiciones y Animaciones

### 13.1 Easing functions
```scss
cubic-bezier(0.4, 0, 0.2, 1) // Estándar para micro-interacciones
cubic-bezier(0.2, 0.8, 0.2, 1) // Slider (curva elástica de desaceleración)
```

### 13.2 Duraciones

| Duración | Uso |
|----------|-----|
| `0.15s - 0.2s` | Micro-interacciones, focus states |
| `0.2s - 0.3s` | Hover states, border changes |
| `0.3s` | Transformaciones estándar (elevación) |
| `0.4s - 0.5s` | Image zoom, transformaciones grandes |
| `0.7s` | Slider transitions |

### 13.3 Patrones de hover
- **Card Hover**: `border-color: var(--afer-secondary)`. **NO** agregar sombras adicionales que incrementen ruido en grillas densas.
- **Imagen Hover**: `transform: scale(1.08)` de zoom sutil.
- **Icono Hover (Especial Ecommerce)**: `transform: rotate(-10deg) scale(1.1)` para aportar dinamismo y juego físico al usuario.

### 13.4 Active states
```scss
&:active {
  transform: translateY(0) scale(0.98);
}
```

### 13.5 Animaciones prohibidas en cambio de tema
```scss
// NO HACER: Esto anima el cambio de tema de forma lenta
transition: all 0.3s ease;
transition: background 0.3s ease, color 0.3s ease;

// HACER: Solo animar interacciones específicas
transition: transform 0.3s ease, box-shadow 0.3s ease;
```

---

## 14. Accesibilidad

### 14.1 Focus states
```scss
&:focus-visible {
  outline: 2px solid var(--afer-primary);
  outline-offset: 2px;
}
```

### 14.2 Touch targets
- **Mínimo físico**: `44px` en móviles para botones interactivos.
- **Estándar general**: `52px` en escritorios.
- **Botones de control de cantidad (Especial Ecommerce)**: `40px` en desktop y un mínimo de `32px` en mobile.

### 14.3 Aria labels
```html
<button aria-label="Agregar a favoritos">...</button>
<button aria-label="Añadir al carrito">...</button>
```

### 14.4 Safe areas
```scss
padding: max(1rem, env(safe-area-inset-left)) 
         max(1rem, env(safe-area-inset-top))
         max(1rem, env(safe-area-inset-bottom))
         max(1rem, env(safe-area-inset-right));
```

---

## 15. Home Page — Estructura y Flujo (Especial Ecommerce)

### 15.1 Orden Canónico de Secciones
El layout de la Home Page principal debe respetar estrictamente la jerarquía visual de ventas para optimizar la conversión:
1. **Hero Slider** (`app-hero-slider`): Banners principales interactivos.
2. **Category Carousel** (`app-category-carousel`): Iconos circulares de acceso rápido.
3. **Featured Product Grid** (`app-featured-product-grid`): Ofertas de muy alta relevancia (tarjetas V2).
4. **Productos Destacados** (`app-product-section`): Carrusel horizontal fluido de tarjetas mini.
5. **Tendencias** (`app-product-section`): Grilla interactiva de 8 tarjetas V2 horizontales.
6. **Novedades** (`app-product-section`): Grilla compacta de 8 tarjetas verticales clásicas.
7. **Brands Section** (`app-brand-section`): Carrusel con logos homologados de fabricantes.

### 15.2 Espaciado de Sección a Sección
Para evitar saltos visuales incómodos, la separación entre bloques es totalmente limpia:
- El contenedor principal de la home (`home-main-container`) posee un `gap: 0` estricto.
- Cada sección independiente añade un padding interno estándar de `2.5rem 1rem` vertical para manejar los espacios homogéneamente.

### 15.3 Card style por sección
| Sección | Layout | Card Style | Cantidad recomendada |
|---------|--------|------------|----------------------|
| Featured Grid | Grid | v2 (horizontal) | 6 |
| Destacados | Carousel | mini | 20 |
| Tendencias | Grid | v2 (horizontal) | 8 |
| Novedades | Grid | original | 8 |

---

## 16. Product Detail — Layout (Especial Ecommerce)

### 16.1 Estructura Visual
```
.product-detail
├── .product-detail__top (grid responsive 2 columnas en desktop)
│   ├── .product-gallery (Columna Izquierda - Galería)
│   │   ├── .product-gallery__main (Visualizador principal)
│   │   └── .product-gallery__thumbnails (Miniaturas alineadas abajo)
│   └── .product-info (Columna Derecha - Información)
│       ├── .product-info__header (Categorías, badges de marca)
│       ├── .product-title (Nombre del producto)
│       ├── .product-pricing (Precios con peso tipográfico 900)
│       └── .product-actions (Selector cantidad, agregar carrito, favoritos)
└── .product-detail__bottom
    └── .product-detail__tabs (Tabs navegables: Descripción, Especificaciones Técnicas)
```

### 16.2 Galería
- Miniaturas posicionadas horizontalmente debajo del visor principal.
- Visor con flechas circulares de navegación superpuestas.
- Lightbox a pantalla completa con centrado y safe-area paddings activos en mobile.

### 16.3 Acciones
- **Controles interactivos**: Selector de cantidad interactivo + botón de agregar al carrito + botón de favoritos en una sola fila.
- **Patrón responsive**: En móviles, la fila se comporta de forma elástica (`flex-wrap nowrap` con gap reducido y `overflow-x hidden`) para evitar desbordes y colisiones.

---

## 17. Skeleton / Loading States

### 17.1 Patrón de uso
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

## 18. Z-index — Escala

| Valor | Uso |
|-------|-----|
| `1` | Elementos base |
| `2-3` | Labels, overlays, decoraciones |
| `4-6` | Elementos de Slider prev/next tapados |
| `10` | Badges interactivos destacados, corazones activos, overlays flotantes |
| `10500` | Modales principales, Lightbox a pantalla completa |

---

## 19. Anti-patrones (NO HACER)

- ❌ **Colores**: No utilizar colores hardcodeados (excepto blanco/negro puro de contraste). Toda superficie y texto debe heredar de `--afer-*`.
- ❌ **Transiciones**: Prohibido usar `transition: all` o animar propiedades de color en cambio de tema (provoca parpadeos).
- ❌ **Pseudo-elementos**: No emplear `::before` o `::after` con fines meramente decorativos abstractos (líneas de adorno flotantes, círculos difuminados de fondo).
- ❌ **Diseño Visual**: Mantener el diseño limpio y profesional, sin degradados exagerados en fondos ni elementos flotantes de relleno. Debe sentirse hecho a mano y premium.
- ❌ **Layout**: No usar anchos fijos sin responsive. No utilizar `!important` a menos que sea una clase utilitaria estrictamente global (como `.hide-mobile`).
- ❌ **Componentes**: No mezclar o duplicar estilos de diferentes cards (ej: intentar forzar estilos de `product-card-mini` en una `product-card` normal).

---

## 20. Referencia Rápida — Valores Comunes

| Propiedad | Valor | Contexto |
|-----------|-------|----------|
| Border card | `1px solid rgba(128, 128, 128, 0.15)` | Todas las cards |
| Hover border | `var(--afer-secondary)` | Cards interactivas |
| Card radius | `clamp(12px, 1.5vw, 16px)` | Product, brand cards |
| Badge radius | `12px` | Pills de marca/categoría |
| Button radius | `clamp(10px, 1.5vw, 14px) 0` | Agregar al carrito |
| Auth input radius | `10px 0` (asimétrico) | Inputs de login, register, forgot-password |
| Auth button radius | `10px 0` (asimétrico) | Botones submit de auth |
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

## 21. Checklist de Implementación

### Antes de crear un nuevo componente visual:
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

## 22. Naming Conventions — CSS & BEM

### 22.1 BEM modificado
- **Bloque (Block)**: Representa el contenedor principal del componente. Se escribe en kebab-case.
  ```scss
  .product-card { }
  ```
- **Elemento (Element)**: Representa una parte del bloque. Se concatena con doble guion bajo (`__`).
  ```scss
  .product-card__header { }
  .product-card__image { }
  ```
- **Modificador (Modifier)**: Representa un estado o variación del bloque o elemento. Se concatena con doble guion medio (`--`).
  ```scss
  .product-card__favorite--active { }
  .label--new { }
  ```

### 22.2 Reglas de Nombrado y Estructura
- **Host Context**: Para adaptar estilos en modo oscuro sin transiciones globales del body, usar siempre:
  ```scss
  :host-context([data-theme='dark']) .mi-elemento { }
  ```
- **Clases utilitarias**: Escribir siempre en kebab-case (`.hide-mobile`, `.text-clamp`).
- **Estructura de archivos**: Cada componente visual debe seguir la jerarquía estricta:
  ```
  component-name/
  ├── component-name.ts
  ├── component-name.html
  ├── component-name.scss
  └── component-name.spec.ts
  ```

---

*Última actualización: Mayo 2026*
*Este documento es vivo y debe actualizarse con cada cambio significativo al sistema de diseño.*
