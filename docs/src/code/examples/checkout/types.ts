export type CartData = {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
};
export type ShippingForm = {
  address: string;
  city: string;
  zipCode: string;
  error?: string | null;
};
export type PaymentForm = {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  error?: string | null;
};
export type ShippingData = {
  cart: CartData;
  shipping: ShippingForm;
};
export type PaymentData = {
  cart: CartData;
  shipping: ShippingForm;
  payment: PaymentForm;
};
export type ProcessingData = {
  cart: CartData;
  shipping: ShippingForm;
  payment: PaymentForm;
};
export type SuccessData = {
  cart: CartData;
  shipping: ShippingForm;
  payment: PaymentForm;
  orderId: string;
};
export type FailedData = {
  cart: CartData;
  shipping: ShippingForm;
  payment: PaymentForm;
  error: string;
};
