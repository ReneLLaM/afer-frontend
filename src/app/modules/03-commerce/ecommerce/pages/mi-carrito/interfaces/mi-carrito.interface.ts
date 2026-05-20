import { Datum } from '../../products-page/interfaces/products-response.interface';

export interface CartMeta {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: Datum;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  meta: CartMeta;
}