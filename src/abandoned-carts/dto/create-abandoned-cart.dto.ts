export class CreateAbandonedCartDto {
  customerName?: string;
  customerPhone: string;
  cartItems: any; // array or serialized JSON string
  totalAmount: number;
}
