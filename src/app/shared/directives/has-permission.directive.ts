import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';

/**
 * Directiva estructural RBAC.
 * @example
 * <button *hasPermission="PERMISSIONS.USERS.CREATE">Crear</button>
 * <div *hasPermission="['a', 'b']; mode: 'all'">...</div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  hasPermission = input.required<string | string[]>({ alias: 'hasPermission' });
  hasPermissionMode = input<'any' | 'all'>('any', { alias: 'hasPermissionMode' });

  private hasView = false;

  constructor() {
    effect(() => {
      const requiredPerms = this.hasPermission();
      const mode = this.hasPermissionMode();
      let hasAccess = false;

      if (Array.isArray(requiredPerms)) {
        hasAccess =
          mode === 'all'
            ? this.authStore.hasAllPermissions(requiredPerms)
            : this.authStore.hasAnyPermission(requiredPerms);
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
