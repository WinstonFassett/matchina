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
      cart,
      address = "",
      city = "",
      zipCode = "",
      error = null,
    }: {
      cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number };
      address?: string;
      city?: string;
      zipCode?: string;
      error?: string | null;
    }) => ({ cart, address, city, zipCode, error }),

    Payment: ({
      shipping,
      cardNumber = "",
      expiryDate = "",
      cvv = "",
      error = null,
    }: {
      shipping: {
        cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number };
        address: string;
        city: string;
        zipCode: string;
        error?: string | null;
      };
      cardNumber?: string;
      expiryDate?: string;
      cvv?: string;
      error?: string | null;
    }) => ({ shipping, cardNumber, expiryDate, cvv, error }),

    Processing: ({
      payment,
    }: {
      payment: {
        shipping: {
          cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number };
          address: string;
          city: string;
          zipCode: string;
          error?: string | null;
        };
        cardNumber: string;
        expiryDate: string;
        cvv: string;
        error?: string | null;
      };
    }) => ({ payment }),

    Success: ({
      processing,
      orderId,
    }: {
      processing: {
        payment: {
          shipping: {
            cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number };
            address: string;
            city: string;
            zipCode: string;
            error?: string | null;
          };
          cardNumber: string;
          expiryDate: string;
          cvv: string;
          error?: string | null;
        };
      };
      orderId: string;
    }) => ({ processing, orderId }),

    Failed: ({
      processing,
      error,
    }: {
      processing: {
        payment: {
          shipping: {
            cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number };
            address: string;
            city: string;
            zipCode: string;
            error?: string | null;
          };
          cardNumber: string;
          expiryDate: string;
          cvv: string;
          error?: string | null;
        };
      };
      error: string;
    }) => ({ processing, error }),
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
