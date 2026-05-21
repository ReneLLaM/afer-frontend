import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStore } from '../../modules/01-identity/auth/store/auth.store';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authStore = inject(AuthStore);

  hasRole = input.required<string | string[]>();
  mode = input<'any' | 'all'>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      const required = this.hasRole();
      const m = this.mode();
      let hasAccess = false;

      if (Array.isArray(required)) {
        hasAccess = m === 'all'
          ? required.every(r => this.authStore.hasRole(r))
          : required.some(r => this.authStore.hasRole(r));
      } else {
        hasAccess = this.authStore.hasRole(required);
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
