import { CartItem } from '../pages/mi-carrito/interfaces/mi-carrito.interface';

/** Construye el enlace de WhatsApp con el resumen del pedido. */
export function buildWhatsAppCheckoutUrl(
  items: readonly CartItem[],
  subtotal: number,
  whatsappBaseUrl: string,
): string {
  const header = 'NUEVO PEDIDO — Afer Bolivia';
  const separator = '─────────────────────';
  
  const productLines = items.map((item, i) => {
    const code = item.product.sku;
    const title = item.product.title;
    const qty = item.quantity;
    const lineTotal = Number(item.lineTotal).toFixed(2);
    return `${i + 1}. ${title}\n   Cod: ${code} | Cant: ${qty} | Bs. ${lineTotal}`;
  });

  const total = Number(subtotal).toFixed(2);

  const message = [
    header,
    separator,
    'PRODUCTOS',
    '',
    ...productLines,
    '',
    `TOTAL: Bs. ${total}`,
    separator,
    '',
    'Por favor confirmen disponibilidad y coordinemos la entrega.',
  ].join('\n');

  const base = whatsappBaseUrl.split('?')[0];
  return `${base}?text=${encodeURIComponent(message)}`;
}
