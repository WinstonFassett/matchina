import { defineStates } from "@lib/src";
import type {
  CartData,
  ShippingForm,
  PaymentForm,
  ProcessingData,
  SuccessData,
  FailedData,
} from "./types";

export const states = defineStates({
  Cart: (data: CartData) => data,
  Shipping: ({
    shipping = { address: "", city: "", zipCode: "", error: null },
    ...rest
  }: {
    shipping?: ShippingForm;
    cart: CartData;
  }) => ({ shipping, ...rest }),
  Payment: ({
    payment = { cardNumber: "", expiryDate: "", cvv: "", error: null },
    ...rest
  }: {
    payment?: PaymentForm;
    cart: CartData;
    shipping: ShippingForm;
  }) => ({
    payment,
    ...rest,
  }),
  Processing: (data: ProcessingData) => data,
  Success: (data: SuccessData) => data,
  Failed: (data: FailedData) => data,
});
