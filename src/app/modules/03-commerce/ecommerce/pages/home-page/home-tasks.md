# Planificación de Tareas: Sección de Categorías y Productos en Home

Este documento detalla los pasos para implementar la nueva sección de "Principales Categorías" con carrusel y el grid de productos reactivo en la página de inicio.

## 1. Exploración y Preparación
- [ ] Verificar disponibilidad de endpoints en el backend:
    - Categorías destacadas: `GET /categories/featured-public` (corresponde a `findFeaturedPublic` en el service).
    - Productos por categoría: `GET /products/public?categoryIds=...` (corresponde a `findAllPublic` en el controller).
- [ ] Crear el servicio `HomeDataService` o extender `ProductsService` para manejar las categorías destacadas si no existe.

## 2. Creación de Componentes
### Categorías
- [ ] `category-carousel`: Contenedor que gestiona el carrusel de categorías.
- [ ] `category-card`: Tarjeta individual para cada categoría (estilo circular/cuadrado con icono/imagen).

### Productos
- [ ] `featured-product-grid`: Contenedor que muestra los productos de la categoría seleccionada.
- [ ] `product-card-v2`: Nuevo estilo de tarjeta de producto basado en la imagen de referencia.

## 3. Lógica de Negocio
- [ ] Implementar señal (`signal`) `selectedCategoryId` en `HomePage`.
- [ ] Al hacer clic en una categoría del carrusel, actualizar `selectedCategoryId`.
- [ ] Cargar automáticamente los productos de la primera categoría destacada al iniciar.
- [ ] Implementar transición suave al cambiar de categoría.

## 4. Estilos y UI/UX
- [ ] Seguir el diseño de la imagen:
    - Título "Principales categorías" con enlace "Ver todas".
    - Carrusel con flechas laterales.
    - Indicador de categoría activa (borde azul, fondo suave).
    - Grid de productos con badges (Samsung, LG, Tendencia, Destacado).
    - Botón "Agregar" y "Favorito" en la tarjeta de producto.

## 5. Integración
- [ ] Insertar componentes en `home-page.html` después de `<app-hero-slider />`.
- [ ] Asegurar que el diseño sea responsivo (TV, Desktop, Mobile).
