import { matchina } from "matchina";
import { states } from "./states";

export const createCheckoutMachine = () =>
  matchina(
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
        newOrder: () =>
          states.Cart({
            items: [
              {
                id: "1",
                name: "Wireless Headphones",
                price: 99.99,
                quantity: 0,
              },
              { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 0 },
            ],
            total: 0,
          }),
      },
      Failed: {
        retry: "Payment",
        backToCart: "Cart",
      },
    },
    states.Cart({
      items: [
        { id: "1", name: "Wireless Headphones", price: 99.99, quantity: 1 },
        { id: "2", name: "Bluetooth Speaker", price: 49.99, quantity: 2 },
      ],
      total: 199.97,
    })
  );

export type CheckoutMachine = ReturnType<typeof createCheckoutMachine>;
