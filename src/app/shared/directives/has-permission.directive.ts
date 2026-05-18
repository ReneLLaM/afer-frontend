import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';

/**
 * HasPermissionDirective — Directiva estructural para mostrar/ocultar elementos
 * basados en los permisos del usuario (RBAC).
 *
 * Uso en templates:
 *   @if (...) es preferible en Angular 17+, pero para permisos una directiva
 *   suele ser más limpia visualmente:
 *   <button *hasPermission="'products.create'">Crear Producto</button>
 *
 *   También soporta múltiples permisos (hasAnyPermission):
 *   <div *hasPermission="['products.create', 'products.update']">...</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  // Recibe un string (un permiso) o un array de strings (varios permisos)
  hasPermission = input.required<string | string[]>();

  private hasView = false;

  constructor() {
    // Usamos un effect para reaccionar a cambios en los permisos del AuthStore
    // o cambios en el input de la directiva.
    effect(() => {
      const requiredPerms = this.hasPermission();
      let hasAccess = false;

      if (Array.isArray(requiredPerms)) {
        hasAccess = this.authStore.hasAnyPermission(requiredPerms);
      } else {
        hasAccess = this.authStore.hasPermission(requiredPerms);
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
