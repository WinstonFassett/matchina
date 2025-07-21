import { matchina, defineStates } from "matchina";

export const createCheckoutMachine = () => {
  const states = defineStates({
    Cart: ({
      items = [
        { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
        { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
      ],
      total = 199.97,
    }: {
      items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      total?: number;
    } = {}) => ({ items, total }),

    Shipping: ({
      items,
      total,
      address = "",
      city = "",
      zipCode = "",
      error = null,
    }: {
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      total: number;
      address?: string;
      city?: string;
      zipCode?: string;
      error?: string | null;
    }) => ({ items, total, address, city, zipCode, error }),

    Payment: ({
      items,
      total,
      shippingAddress,
      cardNumber = "",
      expiryDate = "",
      cvv = "",
      error = null,
    }: {
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      total: number;
      shippingAddress: { address: string; city: string; zipCode: string };
      cardNumber?: string;
      expiryDate?: string;
      cvv?: string;
      error?: string | null;
    }) => ({ items, total, shippingAddress, cardNumber, expiryDate, cvv, error }),

    Processing: ({
      items,
      total,
      shippingAddress,
    }: {
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      total: number;
      shippingAddress: { address: string; city: string; zipCode: string };
    }) => ({ items, total, shippingAddress }),

    Success: ({
      orderId,
      items,
      total,
    }: {
      orderId: string;
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      total: number;
    }) => ({ orderId, items, total }),

    Failed: ({
      error,
      items,
      total,
    }: {
      error: string;
      items: Array<{ id: string; name: string; price: number; quantity: number }>;
      total: number;
    }) => ({ error, items, total }),
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
