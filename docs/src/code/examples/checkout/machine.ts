import { createMachine, defineStates, withApi } from "matchina";

export const createCheckoutMachine = () => {
  const states = defineStates({
    Cart: (
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }> = [
        { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
        { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
      ],
      total: number = 199.97,
    ) => ({ items, total }),

    Shipping: (
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      total: number,
      address: string = "",
      city: string = "",
      zipCode: string = "",
      error: string | null = null,
    ) => ({ items, total, address, city, zipCode, error }),

    Payment: (
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      total: number,
      shippingAddress: {
        address: string;
        city: string;
        zipCode: string;
      },
      cardNumber: string = "",
      expiryDate: string = "",
      cvv: string = "",
      error: string | null = null,
    ) => ({
      items,
      total,
      shippingAddress,
      cardNumber,
      expiryDate,
      cvv,
      error,
    }),

    Processing: (
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      total: number,
      shippingAddress: {
        address: string;
        city: string;
        zipCode: string;
      },
    ) => ({ items, total, shippingAddress }),

    Success: (
      orderId: string,
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      total: number,
    ) => ({ orderId, items, total }),

    Failed: (
      error: string,
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      total: number,
    ) => ({ error, items, total }),
  });

  const machine = withApi(
    createMachine(
      states,
      {
        Cart: {
          updateQuantity: "Cart",
          removeItem: "Cart",
          proceedToShipping: "Shipping",
        },

        Shipping: {
          updateAddress: "Shipping",
          updateCity: "Shipping",
          updateZipCode: "Shipping",
          proceedToPayment: "Payment",
          backToCart: "Cart",
        },

        Payment: {
          updateCardNumber: "Payment",
          updateExpiryDate: "Payment",
          updateCvv: "Payment",
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
    ),
  );

  return machine;
};

export type CheckoutMachine = ReturnType<typeof createCheckoutMachine>;
