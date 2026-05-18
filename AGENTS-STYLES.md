# Afer Bolivia — UI/UX & Design System Agent

> **Propósito**: Guía completa de diseño UI/UX, sistema de estilos, componentes visuales y patrones de interfaz para el frontend de Afer Bolivia. Todo agente o desarrollador debe seguir estas reglas para mantener consistencia visual y calidad en la interfaz.

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

**No cubre**: Lógica TypeScript, arquitectura Angular, gestión de estado (ver `AGENTS.md`).

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

**Regla**: Usa las variables `-absolute` cuando necesites un color que NO cambie con el tema.

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

**Características clave**:
- Aspect ratio de visual: `1.5 / 1`
- Fondo siempre blanco para logos (`#ffffff`)
- Mismo border-radius que product-card

### 7.5 Category Card

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

---

## 9.4 Auth — Inputs y Botones

### Auth Input

```scss
width: 100%;
padding: 0.8rem 1rem;
border: 1px solid color-mix(in srgb, var(--afer-text-muted), transparent 80%);
border-radius: 10px 0; /* top-left y bottom-right redondeados */
font-size: 0.9rem;
background: var(--afer-surface);
color: var(--afer-text-primary);
box-shadow: 0 2px 4px color-mix(in srgb, var(--afer-shadow), transparent 70%);
transition: border-color 0.2s ease, box-shadow 0.2s ease;

&:focus {
  outline: none;
  border-color: var(--afer-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--afer-primary-absolute), transparent 80%);
}
```

**Dark mode**:
```scss
:host-context([data-theme='dark']) & {
  background: color-mix(in srgb, var(--afer-surface), #000 15%);
  border-color: color-mix(in srgb, var(--afer-hover), transparent 50%);
  box-shadow: none;

  &:focus {
    border-color: var(--afer-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
```

### Auth Submit Button

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

### Auth Google Button

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

## 10. Dark Mode — Reglas y Patrones

### 10.1 Principio fundamental

**NO hay transiciones al cambiar de tema**. Los cambios de color son instantáneos. Solo se animan interacciones de usuario (hover, click, etc.).

```scss
// CORRECTO: Solo animar interacciones
transition: transform 0.3s ease, box-shadow 0.3s ease;

// INCORRECTO: No animar cambio de tema
transition: all 0.3s ease; // Esto animaría el cambio de tema
```

### 10.2 Patrón de implementación

```scss
:host-context([data-theme='dark']) .element {
  // Estilos específicos para modo oscuro
}
```

### 10.3 Patrones de adaptación

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

### 10.4 Elementos que NO cambian
- `--afer-corporate`: Siempre `#d43b00`
- `--afer-accent-absolute`: Siempre `#f5d020`
- Imágenes de logos: Fondo siempre blanco
- Badges de estado sobre imagen: Colores fijos con transparencia

---

## 11. Responsive Design

### 11.1 Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| Mobile | `480px` | Ajustes finos de móvil |
| Mobile large | `600px` | Galería, lightbox |
| Tablet | `768px` | Cambio de layout principal |
| Tablet large | `900px` | Product detail grid |
| Desktop small | `992px` | Grid de 3 columnas |
| Desktop | `1100px` | Grid de 2 columnas |
| Desktop large | `1200px` | Ajustes de cards horizontales |

### 11.2 Patrones responsive

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
font-size: clamp(0.9rem, 2vw, 1rem);
border-radius: clamp(12px, 1.5vw, 16px);
padding: clamp(8px, 1.5vw, 10px) 16px;
```

#### Grid adaptativo

```scss
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 650px) { grid-template-columns: 1fr; }
```

### 11.3 Safe areas

```scss
padding: max(1rem, env(safe-area-inset-left))
         max(1rem, env(safe-area-inset-top))
         max(1rem, env(safe-area-inset-bottom))
         max(1rem, env(safe-area-inset-right));
```

---

## 12. Transiciones y Animaciones

### 12.1 Easing functions

```scss
// Estándar (la mayoría de interacciones)
cubic-bezier(0.4, 0, 0.2, 1)

// Slider (más elástica)
cubic-bezier(0.2, 0.8, 0.2, 1)

// Simple
ease
```

### 12.2 Duraciones

| Duración | Uso |
|----------|-----|
| `0.15s - 0.2s` | Micro-interacciones, focus states |
| `0.2s - 0.3s` | Hover states, border changes |
| `0.3s` | Transformaciones estándar (elevación) |
| `0.4s - 0.5s` | Image zoom, transformaciones grandes |
| `0.7s` | Slider transitions |

### 12.3 Patrones de hover

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
```

### 12.4 Active states

```scss
&:active {
  transform: translateY(0) scale(0.98);
}
```

---

## 13. Accesibilidad

### 13.1 Focus states

```scss
&:focus-visible {
  outline: 2px solid var(--afer-primary);
  outline-offset: 2px;
}
```

### 13.2 Touch targets
- Mínimo: `44px` en mobile
- Estándar: `52px` en desktop

### 13.3 Aria labels

```html
<button aria-label="Agregar a favoritos">...</button>
<button aria-label="Añadir al carrito">...</button>
```

---

## 14. Naming Conventions — BEM Modificado

### 14.1 Estructura

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

### 14.2 Reglas de nombrado
- **Bloques**: kebab-case, descriptivo (`.product-card`, `.brand-card`)
- **Elementos**: doble guion bajo (`__element`)
- **Modificadores**: doble guion (`--modifier`)
- **Host context**: `:host-context([data-theme='dark'])`
- **Clases utilitarias**: kebab-case (`.hide-mobile`, `.product-item`)

### 14.3 Estructura de archivos

```
component-name/
├── component-name.ts
├── component-name.html
├── component-name.scss
└── component-name.spec.ts
```

---

## 15. Skeleton / Loading States

### 15.1 Patrón de uso

```html
<skeleton-card [count]="6" />
```

### 15.2 Shimmer animation

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

## 16. Z-index — Escala

| Valor | Uso |
|-------|-----|
| `1` | Elementos base |
| `2-3` | Labels, overlays |
| `4-6` | Items de slider prev/next |
| `10` | Elemento activo, badges importantes |
| `10500` | Lightbox |

**Regla**: No usar valores arbitrarios de z-index. Seguir la escala.

---

## 17. Anti-patrones (NO HACER)

### 17.1 Colores
- ❌ No usar colores hardcodeados (excepto blancos/negros puros)
- ❌ No usar `#fff` o `#000` donde existe una variable
- ✅ Usar siempre las variables CSS `--afer-*`

### 17.2 Transiciones
- ❌ No usar `transition: all`
- ❌ No animar `background` o `color` para cambio de tema
- ✅ Especificar solo las propiedades que se animan

### 17.3 Layout
- ❌ No usar anchos fijos sin responsive
- ❌ No usar `!important` excepto en utilitarias como `.hide-mobile`
- ✅ Usar `clamp()`, `minmax()`, y media queries

### 17.4 Componentes
- ❌ No mezclar estilos de product-card, product-card-v2, product-card-mini
- ❌ No duplicar estilos que ya existen en variables
- ✅ Reutilizar patrones existentes

### 17.5 Diseño visual
- ❌ No usar degradados (`linear-gradient`, `radial-gradient`, etc.) salvo en el logo/brand
- ❌ No usar círculos decorativos, formas abstractas o elementos "flotantes" de relleno
- ❌ No usar `backdrop-filter` salvo en labels sobre imágenes
- ❌ No usar sombras con color de marca (`color-mix` en `box-shadow`) salvo en botones de acción
- ❌ No usar pseudo-elementos `::before`/`::after` decorativos (círculos, líneas, etc.)
- ❌ No usar animaciones de entrada elaboradas (fade + scale + translate combinados)
- ✅ Diseño limpio, funcional, con colores sólidos y espaciado consistente
- ✅ Los componentes deben verse profesionales y hechos a mano, no generados por IA

---

## 18. Referencia Rápida — Valores Comunes

| Propiedad | Valor | Contexto |
|-----------|-------|----------|
| Border card | `1px solid rgba(128, 128, 128, 0.15)` | Todas las cards |
| Hover border | `var(--afer-secondary)` | Cards interactivas |
| Card radius | `clamp(12px, 1.5vw, 16px)` | Product, brand cards |
| Badge radius | `12px` | Pills de marca/categoría |
| Button radius | `clamp(10px, 1.5vw, 14px) 0` | Agregar al carrito |
| Auth input radius | `10px 0` (asimétrico) | Inputs de login, register, forgot-password |
| Auth button radius | `10px 0` (asimétrico) | Botones submit de auth |
| Auth input shadow | `0 2px 4px color-mix(var(--afer-shadow), transparent 70%)` | Inputs de auth |
| Auth input focus shadow | `0 4px 12px color-mix(var(--afer-primary-absolute), transparent 80%)` | Focus en inputs auth |
| Auth button shadow | `0 4px 12px color-mix(var(--afer-primary-absolute), transparent 70%)` | Botones submit de auth |
| Font weight bold | `800 - 900` | Títulos, badges, precios |
| Font weight normal | `400 - 600` | Body text |
| Gap estándar | `12px - 16px` | Entre elementos de card |
| Padding card | `12px 16px` | Info sections de cards |
| Image aspect | `1.2 / 1` | Product card original |
| Image aspect | `1 / 1` | Product card mini |
| Hover transform | `translateY(-3px)` | Elevación estándar |
| Auth hover transform | `translateY(-2px)` | Elevación botones auth |
| Hover scale | `scale(1.08)` | Zoom de imagen |
| Active scale | `scale(0.98)` | Feedback de click |

---

## 19. Checklist de Implementación

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

*Última actualización: Mayo 2026*
*Este documento es vivo y debe actualizarse con cada cambio significativo al sistema de diseño.*
