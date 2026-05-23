# Afer Bolivia â€” UI/UX & Design System Agent

> **PropÃ³sito**: GuÃ­a completa unificada de diseÃ±o UI/UX, sistema de estilos, componentes visuales y patrones de interfaz para todo el proyecto frontend de Afer Bolivia. Todo agente o desarrollador debe seguir estas reglas para mantener la consistencia visual y mÃ¡xima calidad de la interfaz.

---

## 1. Rol y Alcance

Este agente rige **todo el cÃ³digo CSS/SCSS/HTML visual** del proyecto frontend. Aplica a:
- Variables CSS y sistema de colores
- TipografÃ­a y escala tipogrÃ¡fica
- Espaciado, layout y grid
- Componentes visuales (cards, botones, badges, etc.)
- Dark mode y transiciones
- Responsive design y breakpoints
- Animaciones y micro-interacciones
- Accesibilidad visual

**No cubre**: LÃ³gica TypeScript, arquitectura Angular, gestiÃ³n de estado (ver `AGENTS.md`). PatrÃ³n de listados admin: ver `AGENTS-DATA-LIST.md`.

---

## 1.1 Tokens â€” Tabla y toolbar admin

| Ãrea | Variables / clases |
|------|-------------------|
| Tabla | `--dt-surface`, `--dt-accent`, `--dt-border`, `--dt-row-hover` en `data-table.scss` |
| BÃºsqueda | Focus: `border-color: var(--afer-secondary-absolute)` + ring + `padding-left >= 46px` en `search-input.scss` |
| Toolbar | `admin-list-toolbar` con 3 zonas: `__search`, `__filters`, `__clear-slot` |
| Filtros | `table-filter-select` con estado activo visible (label + dot + borde/fondo) |
| Botones cabecera | `admin-btn`, `admin-btn--primary`, `admin-btn--secondary` definidos en cada `scss` local (sin `@use` compartido) |


## 1.2 Reglas obligatorias â€” Toolbar admin

- Layout desktop: 3 columnas centradas (`search | filtros | quitar filtros`).
- Layout tablet/mobile: apilar en 1 columna sin huecos cuando no existan filtros activos.
- Placeholder de bÃºsqueda del toolbar admin: `Buscar por nombre`.
- El icono de lupa no puede solaparse con el texto del input.
- En dark mode, el estado activo de filtros debe reforzar contraste con:
  - dot visible,
  - label activo,
  - borde/fondo activo del select,
  - borde del toolbar cuando `hasActiveFilters` es true.

---

## 2. Sistema de Colores

### 2.1 Variables CSS â€” Modo Claro (`[data-theme='light']`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--afer-primary` | `#ef7e26` | Botones principales, enlaces, elementos destacados |
| `--afer-secondary` | `#006e9e` | Botones secundarios, badges de categorÃ­a, acentos |
| `--afer-corporate` | `#d43b00` | Identidad corporativa, logos, detalles institucionales |
| `--afer-accent` | `#f5d020` | Alertas, insignias, llamadas de atenciÃ³n |
| `--afer-background` | `#f2f2f2` | Fondo principal de la pÃ¡gina |
| `--afer-surface` | `#ffffff` | Tarjetas, modales, menÃºs desplegables |
| `--afer-text-primary` | `#2a2e35` | TÃ­tulos, cuerpo de texto |
| `--afer-text-secondary` | `#5a6169` | SubtÃ­tulos, descripciones, metadatos |
| `--afer-text-muted` | `#8a9099` | Placeholders, estados deshabilitados |
| `--afer-shadow` | `rgba(0, 0, 0, 0.08)` | Sombras base para superficies |
| `--afer-hover` | `rgba(0, 0, 0, 0.08)` | Efectos hover |

### 2.2 Variables CSS â€” Modo Oscuro (`[data-theme='dark']`)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--afer-primary` | `#ffffff` | MÃ¡ximo contraste sobre fondo oscuro |
| `--afer-secondary` | `#ef7e26` | Color secundario (toma el naranja principal) |
| `--afer-corporate` | `#d43b00` | Se mantiene para identidad corporativa |
| `--afer-accent` | `#f5d020` | Acento brillante sobre fondo oscuro |
| `--afer-background` | `#1a1f26` | Fondo oscuro principal |
| `--afer-surface` | `#242a31` | Superficies de tarjetas (ligeramente mÃ¡s claro) |
| `--afer-text-primary` | `#e8eaed` | Texto principal claro |
| `--afer-text-secondary` | `#b8bdc3` | Texto secundario gris claro |
| `--afer-text-muted` | `#878d95` | Texto silenciado |
| `--afer-shadow` | `rgba(0, 0, 0, 0.3)` | Sombras mÃ¡s intensas en modo oscuro |
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
> Usa las variables `-absolute` cuando necesites un color que NO cambie con el tema. Por ejemplo, el botÃ³n de agregar al carrito siempre debe mantener su tono azul de marca en modo claro u oscuro.

### 2.4 Color mix para transparencias

```scss
// Badge con fondo sutil
background: color-mix(in srgb, var(--afer-secondary), transparent 90%);
border: 1px solid color-mix(in srgb, var(--afer-secondary), transparent 80%);

// Sombras con color de marca
box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);
```

---

## 3. TipografÃ­a

### 3.1 Familia
- **Fuente principal**: `Inter` (Google Fonts)
- **Monospace**: Para SKU y datos tÃ©cnicos

### 3.2 Escala tipogrÃ¡fica

| Elemento | TamaÃ±o | Peso | Uso |
|----------|--------|------|-----|
| H1 / Hero | `clamp(1.5rem, 4vw, 2.5rem)` | 900 | TÃ­tulos principales |
| H2 / Section | `clamp(1.25rem, 4vw, 1.75rem)` | 900 | TÃ­tulos de secciÃ³n |
| H3 / Card title | `clamp(0.9rem, 2vw, 1rem)` | 800 | TÃ­tulos de tarjeta |
| Body | `0.95rem - 1rem` | 400-600 | Texto cuerpo |
| Small / Meta | `0.75rem - 0.85rem` | 600-700 | Metadatos, badges |
| Micro | `0.55rem - 0.7rem` | 700-800 | SKU, tags pequeÃ±os |

### 3.3 Reglas tipogrÃ¡ficas
- **TÃ­tulos de secciÃ³n**: `text-transform: uppercase`, `letter-spacing: -1px`
- **Badges y tags**: `text-transform: uppercase`, `letter-spacing: 0.5px - 1px`, `font-weight: 800`
- **Precios**: `font-weight: 900`, `letter-spacing: -0.5px`
- **Body text**: `line-height: 1.4 - 1.6`
- **TÃ­tulos compactos**: `line-height: 1.2`

### 3.4 Truncamiento de texto

```scss
// Truncamiento multi-lÃ­nea estÃ¡ndar
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
| xs | `4px` | Gap mÃ­nimo, padding micro |
| sm | `6px - 8px` | Gap entre elementos pequeÃ±os |
| md | `12px - 16px` | Padding de tarjetas, gap estÃ¡ndar |
| lg | `20px - 24px` | Gap entre secciones |
| xl | `40px` | Padding de pÃ¡gina |
| 2xl | `60px+` | SeparaciÃ³n de bloques principales |

### 4.2 Contenedores

```scss
// Contenedor principal de pÃ¡gina
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
// Grid responsive automÃ¡tico
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
| Botones | `clamp(10px, 1.5vw, 14px) 0` | BotÃ³n agregar (asimÃ©trico) |
| Auth inputs/buttons | `10px 0` | Inputs y botones de auth (asimÃ©trico) |
| Badges / Pills | `12px` | Badges de marca, categorÃ­a |
| Iconos circulares | `50%` | Avatares, iconos de categorÃ­a |
| Inputs / Contenedores | `8px - 12px` | Elementos de formulario |
| Secciones | `0 0 30px 30px` | Bordes inferiores redondeados |

---

## 6. Sombras

### 6.1 Sombras estÃ¡ndar

```scss
// Sombra sutil (hover cards)
box-shadow: 0 6px 15px rgba(0, 0, 0, 0.06);

// Sombra media (botones)
box-shadow: 0 4px 10px color-mix(in srgb, var(--afer-secondary), transparent 80%);

// Sombra elevada (hover botones)
box-shadow: 0 8px 20px color-mix(in srgb, var(--afer-secondary-absolute), transparent 80%);

// Sombra de secciÃ³n
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
```

### 6.2 Sombras en modo oscuro

```scss
// Sombra mÃ¡s intensa necesaria en fondo oscuro
box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
```

---

## 7. Componentes â€” Patrones y Estilos

### 7.1 Product Card (original)

**Estructura**:
```
article.product-card
â”œâ”€â”€ .product-card__header (brand + SKU)
â”œâ”€â”€ a.product-card__link
â”‚   â”œâ”€â”€ .product-card__visual
â”‚   â”‚   â”œâ”€â”€ img.product-card__image
â”‚   â”‚   â””â”€â”€ .product-card__labels
â”‚   â””â”€â”€ .product-card__info
â”‚       â”œâ”€â”€ .product-card__tags
â”‚       â”œâ”€â”€ h3.product-card__title
â”‚       â””â”€â”€ .product-card__price
â””â”€â”€ .product-card__actions
    â”œâ”€â”€ button.product-card__add
    â””â”€â”€ button.product-card__favorite
```

**CaracterÃ­sticas clave**:
- Layout vertical (flex-column)
- Aspect ratio de imagen: `1.2 / 1`
- Labels en la parte inferior de la imagen (NUEVO, TENDENCIA, DESTACADO)
- BotÃ³n agregar sÃ³lido en modo claro, glass en modo oscuro
- Hover: `border-color: var(--afer-secondary)`, sin shadow en la card

### 7.2 Product Card V2 (horizontal)

**Estructura**:
```
article.product-card
â”œâ”€â”€ .product-card__left (imagen)
â”‚   â”œâ”€â”€ .product-card__badges-top (brand + SKU)
â”‚   â””â”€â”€ .product-card__img-container
â””â”€â”€ .product-card__right (info)
    â”œâ”€â”€ .product-card__info-top
    â”‚   â”œâ”€â”€ .product-card__status-row (badges)
    â”‚   â”œâ”€â”€ .product-card__category
    â”‚   â””â”€â”€ h3.product-card__title
    â””â”€â”€ .product-card__bottom
        â”œâ”€â”€ .product-card__price-wrapper
        â””â”€â”€ .product-card__actions
```

**CaracterÃ­sticas clave**:
- Layout horizontal (220px height)
- Imagen a la izquierda (160px width)
- Badges de estado arriba de la imagen
- Altura fija en desktop, auto en responsive
- Mismo patrÃ³n de botÃ³n glass en modo oscuro

### 7.3 Product Card Mini

**Estructura**:
```
article.product-mini
â”œâ”€â”€ .product-mini__img-container
â”œâ”€â”€ .product-mini__info
â”‚   â”œâ”€â”€ h3.product-mini__title
â”‚   â””â”€â”€ .product-mini__price
â””â”€â”€ button.btn-quick-add (posicionado absolute)
```

**CaracterÃ­sticas clave**:
- Layout vertical compacto
- Aspect ratio de imagen: `1 / 1`
- BotÃ³n quick-add flotante (bottom-right)
- Min-width: `120px`
- Usado en carruseles

### 7.4 Brand Card

**Estructura**:
```
.brand-card
â”œâ”€â”€ a.brand-card__link
â”‚   â”œâ”€â”€ .brand-card__visual (logo)
â”‚   â”‚   â”œâ”€â”€ img.brand-card__image
â”‚   â”‚   â””â”€â”€ .brand-card__badge
â”‚   â””â”€â”€ .brand-card__info
â”‚       â”œâ”€â”€ h3.brand-card__name
â”‚       â””â”€â”€ p.brand-card__description
```

**CaracterÃ­sticas clave**:
- Aspect ratio de visual: `1.5 / 1`
- Fondo siempre blanco para logos (`#ffffff`)
- Mismo border-radius que product-card

### 7.5 Category Card

**Estructura**:
```
.category-card
â”œâ”€â”€ .category-card__icon-wrapper
â”‚   â””â”€â”€ img.category-card__icon
â”œâ”€â”€ span.category-card__name
â””â”€â”€ .category-card__indicator (oculto)
```

**CaracterÃ­sticas clave**:
- Icono circular de 64px
- Border-bottom de 4px para estado activo
- Padding: `16px 20px`
- Border-radius: `20px 20px 0 0`

### 7.6 Hero Slider

**CaracterÃ­sticas**:
- Altura: `clamp(260px, 38vw, 680px)`
- Items activos: 75% width, scale(1)
- Items prev/next: 70% width, opacity 0.5, blur
- Animaciones: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Dots: 10px circle, activo se expande a 26px pill

### 7.7 Product Section (Especial Ecommerce)

**Estructura**:
```
section.product-section
â”œâ”€â”€ .product-section__header
â”‚   â”œâ”€â”€ h2.product-section__title
â”‚   â”œâ”€â”€ .product-section__accent
â”‚   â””â”€â”€ a.product-section__link
â”œâ”€â”€ .product-section__container
â”‚   â””â”€â”€ .product-section__content (--grid | --carousel | --original)
â””â”€â”€ .product-section__footer
```

**Layouts soportados**:
- `grid`: Grid responsive con auto-fill y espaciado clamp.
- `carousel`: Flex horizontal interactivo con drag scroll.
- `original`: Grid compacto de 3 o 4 columnas tradicionales (minmax 250px).

### 7.8 Featured Product Grid (Especial Ecommerce)
- Fondo de secciÃ³n: `--afer-surface`
- Border-radius inferior de la secciÃ³n completa: `0 0 30px 30px`
- Utiliza tarjetas `product-card-v2` internamente.
- Grid estructurado a dos columnas en desktop: `minmax(350px, 1fr)`

### 7.9 Brand Carousel Section (Especial Ecommerce)
- Todas las tarjetas de marcas en carrusel poseen tamaÃ±o fijo rÃ­gido: `170x140px` en desktop, y `140x115px` en mobile.
- Logotipo de marca con `aspect-ratio: 1.5 / 1`, truncado estricto a 1 sola lÃ­nea del tÃ­tulo y descripciÃ³n del fabricante.
- Header con patrÃ³n accent line sÃ³lida al igual que el listado de productos.

---

## 8. Sistema de Badges y Tags

### 8.1 Badge de Marca / CategorÃ­a

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

### 9.1 BotÃ³n Agregar (primario)

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

### 9.2 Modo oscuro â€” BotÃ³n Glass

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

### 9.3 BotÃ³n Favorito

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

### 9.4 BotÃ³n Quick-Add (mini card - Especial Ecommerce)

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

## 10. Auth â€” Inputs y Botones

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

## 11. Dark Mode â€” Reglas y Patrones

### 11.1 Principio fundamental

**NO hay transiciones al cambiar de tema**. Los cambios de color son instantÃ¡neos. Solo se animan interacciones de usuario (hover, click, etc.).

```scss
// CORRECTO: Solo animar interacciones
transition: transform 0.3s ease, box-shadow 0.3s ease;

// INCORRECTO: No animar cambio de tema
transition: all 0.3s ease; // Esto animarÃ­a el cambio de tema
```

### 11.2 PatrÃ³n de implementaciÃ³n

```scss
:host-context([data-theme='dark']) .element {
  // Estilos especÃ­ficos para modo oscuro
}
```

### 11.3 PatrÃ³n de AdaptaciÃ³n en Superficies, Bordes y Sombras
- **Superficies**: En modo claro usa `var(--afer-surface)`. En modo oscuro incrementa el contraste sutilmente usando `color-mix(in srgb, var(--afer-surface), #000 15%)`.
- **Bordes**: Reemplaza el borde gris sutil del modo claro por `color-mix(in srgb, var(--afer-hover), transparent 30%)` en modo oscuro.
- **Sombras**: Las sombras en modo oscuro requieren mayor intensidad y profundidad fÃ­sica: `box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3)`.

### 11.4 Filtros de Imagen (Especial Ecommerce)
- **Modo Claro**: `filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.1))`
- **Modo Oscuro**: `filter: drop-shadow(0 8px 26px rgb(0 0 0 / 0.5))` para realzar productos transparentes o flotantes sobre el fondo.

---

## 12. Responsive Design

### 12.1 Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| Mobile | `480px` | Ajustes finos de mÃ³vil |
| Mobile large | `600px` | GalerÃ­a, lightbox |
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

### 12.3 PatrÃ³n Mobile para Tarjetas (Especial Ecommerce)
En pantallas ultra-pequeÃ±as (mÃ³vil `<480px`), la estructura interna debe compactarse para maximizar el Ã¡rea visible de venta:
```scss
@media (max-width: 480px) {
  &__header { padding: 8px 12px 4px; }
  &__info { padding: 10px 12px; }
  &__actions { padding: 4px 12px 10px; }
  
  font-size: 0.7rem; // Escala tipogrÃ¡fica adaptada
  svg { width: 14px; height: 14px; } // Iconos ajustados a 14px
}
```

---

## 13. Transiciones y Animaciones

### 13.1 Easing functions
```scss
cubic-bezier(0.4, 0, 0.2, 1) // EstÃ¡ndar para micro-interacciones
cubic-bezier(0.2, 0.8, 0.2, 1) // Slider (curva elÃ¡stica de desaceleraciÃ³n)
```

### 13.2 Duraciones

| DuraciÃ³n | Uso |
|----------|-----|
| `0.15s - 0.2s` | Micro-interacciones, focus states |
| `0.2s - 0.3s` | Hover states, border changes |
| `0.3s` | Transformaciones estÃ¡ndar (elevaciÃ³n) |
| `0.4s - 0.5s` | Image zoom, transformaciones grandes |
| `0.7s` | Slider transitions |

### 13.3 Patrones de hover
- **Card Hover**: `border-color: var(--afer-secondary)`. **NO** agregar sombras adicionales que incrementen ruido en grillas densas.
- **Imagen Hover**: `transform: scale(1.08)` de zoom sutil.
- **Icono Hover (Especial Ecommerce)**: `transform: rotate(-10deg) scale(1.1)` para aportar dinamismo y juego fÃ­sico al usuario.

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

// HACER: Solo animar interacciones especÃ­ficas
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
- **MÃ­nimo fÃ­sico**: `44px` en mÃ³viles para botones interactivos.
- **EstÃ¡ndar general**: `52px` en escritorios.
- **Botones de control de cantidad (Especial Ecommerce)**: `40px` en desktop y un mÃ­nimo de `32px` en mobile.

### 14.3 Aria labels
```html
<button aria-label="Agregar a favoritos">...</button>
<button aria-label="AÃ±adir al carrito">...</button>
```

### 14.4 Safe areas
```scss
padding: max(1rem, env(safe-area-inset-left)) 
         max(1rem, env(safe-area-inset-top))
         max(1rem, env(safe-area-inset-bottom))
         max(1rem, env(safe-area-inset-right));
```

---

## 15. Home Page â€” Estructura y Flujo (Especial Ecommerce)

### 15.1 Orden CanÃ³nico de Secciones
El layout de la Home Page principal debe respetar estrictamente la jerarquÃ­a visual de ventas para optimizar la conversiÃ³n:
1. **Hero Slider** (`app-hero-slider`): Banners principales interactivos.
2. **Category Carousel** (`app-category-carousel`): Iconos circulares de acceso rÃ¡pido.
3. **Featured Product Grid** (`app-featured-product-grid`): Ofertas de muy alta relevancia (tarjetas V2).
4. **Productos Destacados** (`app-product-section`): Carrusel horizontal fluido de tarjetas mini.
5. **Tendencias** (`app-product-section`): Grilla interactiva de 8 tarjetas V2 horizontales.
6. **Novedades** (`app-product-section`): Grilla compacta de 8 tarjetas verticales clÃ¡sicas.
7. **Brands Section** (`app-brand-section`): Carrusel con logos homologados de fabricantes.

### 15.2 Espaciado de SecciÃ³n a SecciÃ³n
Para evitar saltos visuales incÃ³modos, la separaciÃ³n entre bloques es totalmente limpia:
- El contenedor principal de la home (`home-main-container`) posee un `gap: 0` estricto.
- Cada secciÃ³n independiente aÃ±ade un padding interno estÃ¡ndar de `2.5rem 1rem` vertical para manejar los espacios homogÃ©neamente.

### 15.3 Card style por secciÃ³n
| SecciÃ³n | Layout | Card Style | Cantidad recomendada |
|---------|--------|------------|----------------------|
| Featured Grid | Grid | v2 (horizontal) | 6 |
| Destacados | Carousel | mini | 20 |
| Tendencias | Grid | v2 (horizontal) | 8 |
| Novedades | Grid | original | 8 |

---

## 16. Product Detail â€” Layout (Especial Ecommerce)

### 16.1 Estructura Visual
```
.product-detail
â”œâ”€â”€ .product-detail__top (grid responsive 2 columnas en desktop)
â”‚   â”œâ”€â”€ .product-gallery (Columna Izquierda - GalerÃ­a)
â”‚   â”‚   â”œâ”€â”€ .product-gallery__main (Visualizador principal)
â”‚   â”‚   â””â”€â”€ .product-gallery__thumbnails (Miniaturas alineadas abajo)
â”‚   â””â”€â”€ .product-info (Columna Derecha - InformaciÃ³n)
â”‚       â”œâ”€â”€ .product-info__header (CategorÃ­as, badges de marca)
â”‚       â”œâ”€â”€ .product-title (Nombre del producto)
â”‚       â”œâ”€â”€ .product-pricing (Precios con peso tipogrÃ¡fico 900)
â”‚       â””â”€â”€ .product-actions (Selector cantidad, agregar carrito, favoritos)
â””â”€â”€ .product-detail__bottom
    â””â”€â”€ .product-detail__tabs (Tabs navegables: DescripciÃ³n, Especificaciones TÃ©cnicas)
```

### 16.2 GalerÃ­a
- Miniaturas posicionadas horizontalmente debajo del visor principal.
- Visor con flechas circulares de navegaciÃ³n superpuestas.
- Lightbox a pantalla completa con centrado y safe-area paddings activos en mobile.

### 16.3 Acciones
- **Controles interactivos**: Selector de cantidad interactivo + botÃ³n de agregar al carrito + botÃ³n de favoritos en una sola fila.
- **PatrÃ³n responsive**: En mÃ³viles, la fila se comporta de forma elÃ¡stica (`flex-wrap nowrap` con gap reducido y `overflow-x hidden`) para evitar desbordes y colisiones.

---

## 17. Skeleton / Loading States

### 17.1 PatrÃ³n de uso
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

## 18. Z-index â€” Escala

| Valor | Uso |
|-------|-----|
| `1` | Elementos base |
| `2-3` | Labels, overlays, decoraciones |
| `4-6` | Elementos de Slider prev/next tapados |
| `10` | Badges interactivos destacados, corazones activos, overlays flotantes |
| `10500` | Modales principales, Lightbox a pantalla completa |

---

## 19. Anti-patrones (NO HACER)

- âŒ **Colores**: No utilizar colores hardcodeados (excepto blanco/negro puro de contraste). Toda superficie y texto debe heredar de `--afer-*`.
- âŒ **Transiciones**: Prohibido usar `transition: all` o animar propiedades de color en cambio de tema (provoca parpadeos).
- âŒ **Pseudo-elementos**: No emplear `::before` o `::after` con fines meramente decorativos abstractos (lÃ­neas de adorno flotantes, cÃ­rculos difuminados de fondo).
- âŒ **DiseÃ±o Visual**: Mantener el diseÃ±o limpio y profesional, sin degradados exagerados en fondos ni elementos flotantes de relleno. Debe sentirse hecho a mano y premium.
- âŒ **Layout**: No usar anchos fijos sin responsive. No utilizar `!important` a menos que sea una clase utilitaria estrictamente global (como `.hide-mobile`).
- âŒ **Componentes**: No mezclar o duplicar estilos de diferentes cards (ej: intentar forzar estilos de `product-card-mini` en una `product-card` normal).

---

## 20. Referencia RÃ¡pida â€” Valores Comunes

| Propiedad | Valor | Contexto |
|-----------|-------|----------|
| Border card | `1px solid rgba(128, 128, 128, 0.15)` | Todas las cards |
| Hover border | `var(--afer-secondary)` | Cards interactivas |
| Card radius | `clamp(12px, 1.5vw, 16px)` | Product, brand cards |
| Badge radius | `12px` | Pills de marca/categorÃ­a |
| Button radius | `clamp(10px, 1.5vw, 14px) 0` | Agregar al carrito |
| Auth input radius | `10px 0` (asimÃ©trico) | Inputs de login, register, forgot-password |
| Auth button radius | `10px 0` (asimÃ©trico) | Botones submit de auth |
| Font weight bold | `800 - 900` | TÃ­tulos, badges, precios |
| Font weight normal | `400 - 600` | Body text |
| Gap estÃ¡ndar | `12px - 16px` | Entre elementos de card |
| Padding card | `12px 16px` | Info sections de cards |
| Image aspect | `1.2 / 1` | Product card original |
| Image aspect | `1 / 1` | Product card mini |
| Hover transform | `translateY(-3px)` | ElevaciÃ³n estÃ¡ndar |
| Hover scale | `scale(1.08)` | Zoom de imagen |
| Active scale | `scale(0.98)` | Feedback de click |

---

## 21. Checklist de ImplementaciÃ³n

### Antes de crear un nuevo componente visual:
- [ ] Â¿Existe un componente similar que pueda reutilizar?
- [ ] Â¿Estoy usando las variables CSS correctas?
- [ ] Â¿El componente funciona en modo claro y oscuro?
- [ ] Â¿Tiene responsive design para todos los breakpoints?
- [ ] Â¿Los focus states son visibles?
- [ ] Â¿Los touch targets son >= 44px en mobile?
- [ ] Â¿Estoy siguiendo la convenciÃ³n BEM?
- [ ] Â¿Las transiciones NO animan el cambio de tema?
- [ ] Â¿Los colores usan variables, no hardcodeados?
- [ ] Â¿El componente tiene skeleton loading state?

### Antes de modificar un componente existente:
- [ ] Â¿El cambio es consistente con el sistema de diseÃ±o?
- [ ] Â¿Se mantiene la funcionalidad en ambos temas?
- [ ] Â¿Se mantiene el responsive design?
- [ ] Â¿No se rompen los hover/active states existentes?

---

## 22. Naming Conventions â€” CSS & BEM

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
- **Modificador (Modifier)**: Representa un estado o variaciÃ³n del bloque o elemento. Se concatena con doble guion medio (`--`).
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
- **Estructura de archivos**: Cada componente visual debe seguir la jerarquÃ­a estricta:
  ```
  component-name/
  â”œâ”€â”€ component-name.ts
  â”œâ”€â”€ component-name.html
  â”œâ”€â”€ component-name.scss
  â””â”€â”€ component-name.spec.ts
  ```

---

*Ãšltima actualizaciÃ³n: Mayo 2026*
*Este documento es vivo y debe actualizarse con cada cambio significativo al sistema de diseÃ±o.*
