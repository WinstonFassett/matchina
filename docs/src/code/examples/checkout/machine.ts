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

  // Add ergonomic methods that handle store updates
  const enhancedMachine = Object.assign(machine, {
    store,
    
    success: (data: { orderId?: string; error?: string }) => {
      if (data.orderId) {
        store.dispatch("setOrderId", data.orderId);
      }
      if (data.error) {
        store.dispatch("setError", data.error);
      }
      machine.send("success");
    },
    
    failure: (error: string) => {
      store.dispatch("setError", error);
      machine.send("failure");
    },
    
    placeOrder: (data: { cart: any; shipping?: any; payment?: any }) => {
      // Store the current cart/shipping/payment data
      if (data.cart) store.dispatch("setCart", data.cart);
      if (data.shipping) store.dispatch("setShipping", data.shipping);
      if (data.payment) store.dispatch("setPayment", data.payment);
      machine.send("placeOrder");
    },
    
    proceedToShipping: (data: { cart: any }) => {
      if (data.cart) store.dispatch("setCart", data.cart);
      machine.send("proceedToShipping");
    },
    
    proceedToPayment: (data: { cart: any; shipping: any }) => {
      if (data.cart) store.dispatch("setCart", data.cart);
      if (data.shipping) store.dispatch("setShipping", data.shipping);
      machine.send("proceedToPayment");
    },
    
    backToCart: (data?: { cart?: any }) => {
      if (data?.cart) store.dispatch("setCart", data.cart);
      machine.send("backToCart");
    },
    
    retry: (data?: { cart?: any; shipping?: any; payment?: any }) => {
      if (data?.cart) store.dispatch("setCart", data.cart);
      if (data?.shipping) store.dispatch("setShipping", data.shipping);
      if (data?.payment) store.dispatch("setPayment", data.payment);
      machine.send("retry");
    }
  });

  return enhancedMachine;
};

export type CheckoutMachine = ReturnType<typeof createCheckoutMachine>;
