import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { CartStore } from '../../../../../core/stores/cart.store';
import { AuthStore } from '../../../../01-identity/auth/store/auth.store';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { CartLineItem } from '../../components/cart-line-item/cart-line-item';
import { SkeletonCard } from '../../../../../shared/components/skeleton-card/skeleton-card';
import { SOCIAL_LINKS } from '../../../../../core/constants/social-links.constants';
import { buildWhatsAppCheckoutUrl } from '../../utils/cart-checkout.utils';

type CheckoutStep = 'closed' | 'auth-choice' | 'whatsapp';

@Component({
  selector: 'app-mi-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule, CartLineItem, SkeletonCard],
  templateUrl: './mi-carrito.html',
  styleUrl: './mi-carrito.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiCarritoPage {
  readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  readonly checkoutStep = signal<CheckoutStep>('closed');

  readonly isAuthenticated = this.authStore.isAuthenticated;

  onQuantityChange(itemId: string, quantity: number): void {
    this.cartStore.updateQuantity(itemId, quantity);
  }

  onRemove(itemId: string): void {
    this.cartStore.removeItem(itemId);
  }

  async onClearCart(): Promise<void> {
    const confirm = await this.dialogService.confirm({
      title: 'Limpiar Carrito',
      message: '¿Estás seguro de que deseas eliminar todos los productos de tu carrito?',
      confirmText: 'Sí, limpiar',
      cancelText: 'Cancelar',
      type: 'warning'
    });

    if (confirm) {
      this.cartStore.clear();
    }
  }

  onComprar(): void {
    if (this.cartStore.isEmpty()) return;

    if (this.authStore.isAuthenticated()) {
      this.checkoutStep.set('whatsapp');
      return;
    }

    this.checkoutStep.set('auth-choice');
  }

  onContinueAsGuest(): void {
    this.checkoutStep.set('whatsapp');
  }

  onGoToLogin(): void {
    this.checkoutStep.set('closed');
    this.router.navigate(['/iniciar-sesion'], {
      queryParams: { returnUrl: '/mi-carrito' },
    });
  }

  onCheckoutViaWhatsApp(): void {
    const url = buildWhatsAppCheckoutUrl(
      this.cartStore.items(),
      this.cartStore.subtotal(),
      SOCIAL_LINKS.whatsapp,
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    this.closeCheckout();
  }

  closeCheckout(): void {
    this.checkoutStep.set('closed');
  }
}
