import { matchina, defineStates } from "matchina";

// --- Types for each step ---
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
      shipping = { address: "", city: "", zipCode: "", error: null },
    }: {
      cart: CartData;
      shipping?: Partial<ShippingForm>;
    }) => ({
      cart,
      shipping: {
        address: shipping.address ?? "",
        city: shipping.city ?? "",
        zipCode: shipping.zipCode ?? "",
        error: shipping.error ?? null,
      },
    }),

    Payment: ({
      cart,
      shipping,
      payment = { cardNumber: "", expiryDate: "", cvv: "", error: null },
    }: {
      cart: CartData;
      shipping: ShippingForm;
      payment?: Partial<PaymentForm>;
    }) => ({
      cart,
      shipping,
      payment: {
        cardNumber: payment.cardNumber ?? "",
        expiryDate: payment.expiryDate ?? "",
        cvv: payment.cvv ?? "",
        error: payment.error ?? null,
      },
    }),

    Processing: ({ cart, shipping, payment }: ProcessingData) => ({
      cart,
      shipping,
      payment,
    }),

    Success: ({ cart, shipping, payment, orderId }: SuccessData) => ({
      cart,
      shipping,
      payment,
      orderId,
    }),

    Failed: ({ cart, shipping, payment, error }: FailedData) => ({
      cart,
      shipping,
      payment,
      error,
    }),
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
