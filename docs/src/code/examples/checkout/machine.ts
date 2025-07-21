import { matchina, defineStates } from "matchina";

// --- Types for each step ---
export type CartData = {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
};
export type ShippingData = {
  cart: CartData;
  address: string;
  city: string;
  zipCode: string;
  error?: string | null;
};
export type PaymentData = {
  shipping: ShippingData;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  error?: string | null;
};
export type ProcessingData = {
  payment: PaymentData;
};
export type SuccessData = {
  processing: ProcessingData;
  orderId: string;
};
export type FailedData = {
  processing: ProcessingData;
  error: string;
};

export const createCheckoutMachine = () => {
  const states = defineStates({
    Cart: ({
      items = [
        { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
        { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
      ],
      total = 199.97,
    }: Partial<CartData> = {}) => ({ items, total }),

    Shipping: ({
      cart,
      address = "",
      city = "",
      zipCode = "",
      error = null,
    }: Partial<ShippingData> & { cart: CartData }) => ({
      cart,
      address,
      city,
      zipCode,
      error,
    }),

    Payment: ({
      shipping,
      cardNumber = "",
      expiryDate = "",
      cvv = "",
      error = null,
    }: Partial<PaymentData> & { shipping: ShippingData }) => ({
      shipping,
      cardNumber,
      expiryDate,
      cvv,
      error,
    }),

    Processing: ({ payment }: { payment: PaymentData }) => ({ payment }),

    Success: ({ processing, orderId }: SuccessData) => ({
      processing,
      orderId,
    }),

    Failed: ({ processing, error }: FailedData) => ({ processing, error }),
  });

  const machine = matchina(
    states,
    {
      Cart: {
        proceedToShipping: "Shipping",
      },
      Shipping: {
        proceedToPayment: "Payment",
        backToCart: "Cart",
      },
      Payment: {
        placeOrder: "Processing",
        backToShipping: "Shipping",
      },
      Processing: {
        success: "Success",
        failure: "Failed",
      },
      Success: {
        newOrder: "Cart",
      },
      Failed: {
        retry: "Payment",
        backToCart: "Cart",
      },
    },
    states.Cart(),
  );

  return machine;
};

export type CheckoutMachine = ReturnType<typeof createCheckoutMachine>;
