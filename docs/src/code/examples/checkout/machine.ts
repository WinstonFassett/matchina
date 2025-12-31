import { matchina, createStoreMachine, setup, effect } from "matchina";
import { states } from "./states";
import type { CartData, ShippingForm, PaymentForm } from "./types";

interface CheckoutState {
  cart: CartData;
  shipping: ShippingForm;
  payment: PaymentForm;
  orderId: string | null;
  error: string | null;
}

const defaultCart: CartData = {
  items: [
    { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
    { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
  ],
  total: 199.97,
};

export const createCheckoutMachine = () => {
  const initialState: CheckoutState = {
    cart: defaultCart,
    shipping: { address: "", city: "", zipCode: "" },
    payment: { cardNumber: "", expiryDate: "", cvv: "" },
    orderId: null,
    error: null,
  };

  const store = createStoreMachine<CheckoutState>(initialState, {
    updateCart: (cart: CartData) => (change) => ({ ...change.from, cart }),
    updateShipping: (shipping: ShippingForm) => (change) => ({ ...change.from, shipping }),
    updatePayment: (payment: PaymentForm) => (change) => ({ ...change.from, payment }),
    setOrderId: (orderId: string) => (change) => ({ ...change.from, orderId, error: null }),
    setError: (error: string) => (change) => ({ ...change.from, error }),
    reset: () => () => initialState,
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
    "Cart"
  );

  setup(machine)(
    effect((ev) => {
      if (ev.type === "success" && ev.params[0]) {
        store.dispatch("setOrderId", ev.params[0] as string);
      }
      if (ev.type === "failure" && ev.params[0]) {
        store.dispatch("setError", ev.params[0] as string);
      }
      if (ev.type === "newOrder") {
        store.dispatch("reset");
      }
    })
  );

  return Object.assign(machine, { store });
};

export type CheckoutMachine = ReturnType<typeof createCheckoutMachine>;
