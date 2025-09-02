import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";

// Demo: Checkout with Shipping -> Payment using exit-as-output.
// - Shipping exits in 'Quoted' (has no nested machine), parent gets 'child.exit' and transitions to PaymentStep.
// - Parent then sends 'authorize' to Payment child via hierarchical routing.

describe("child.exit: checkout shipping -> payment", () => {
  function createShipping() {
    const states = defineStates({
      Quoting: undefined,
      Quoted: () => ({ quoteId: "Q1", total: 123 }), // exit (no nested machine)
    });
    const transitions = {
      Quoting: { quoteReady: "Quoted" },
      Quoted: {},
    } as const;
    const m = createMachine(states, transitions, "Quoting");
    setup(m)(propagateSubmachines);
    return m;
  }

  function createPayment() {
    const states = defineStates({
      Idle: undefined,
      Authorized: () => ({ authId: "A1" }), // exit
    });
    const transitions = {
      Idle: { authorize: "Authorized" },
      Authorized: {},
    } as const;
    const m = createMachine(states, transitions, "Idle");
    setup(m)(propagateSubmachines);
    return m;
  }

  function createCheckout() {
    const states = defineStates({
      ShippingStep: submachine(() => createShipping(), { id: "shipping" }),
      PaymentStep: submachine(() => createPayment(), { id: "payment" }),
      Done: undefined,
    });

    const transitions = {
      ShippingStep: {
        // When shipping exits in any exit state, go to PaymentStep
        "child.exit": (ev: any) => states.PaymentStep(),
      },
      PaymentStep: {
        // When payment exits (Authorized), finish checkout
        "child.exit": (ev: any) => states.Done(),
      },
      Done: {},
    } as const;

    const m = createMachine(states, transitions, "ShippingStep");
    setup(m)(propagateSubmachines);
    return m;
  }

  it("routes child.exit to parent and allows parent to continue flow", () => {
    const checkout = createCheckout();
    // checkout already has propagateSubmachines applied, so just use it directly
    const r = checkout;

    // In ShippingStep, child is Quoting
    expect((checkout as any).getState().key).toBe("ShippingStep");
    const shipping = (checkout as any).getState().as("ShippingStep").data.machine;
    expect(shipping.getState().key).toBe("Quoting");

    // Complete quoting -> Quoted (exit); parent should transition to PaymentStep via child.exit
    shipping.send("quoteReady");
    expect((checkout as any).getState().key).toBe("PaymentStep");

    // Now parent can send a child-only event to Payment
    (r as any).send("authorize");
    expect((checkout as any).getState().key).toBe("Done");
  });
});
