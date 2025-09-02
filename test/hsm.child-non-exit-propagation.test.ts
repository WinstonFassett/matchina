import { describe, it, expect, vi } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { setup } from "../src/ext/setup";
import { propagateSubmachines, createHierarchicalMachine } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { withSubscribe } from "../src/extras/with-subscribe";

// Multilevel hierarchy: Root -> Checkout -> Payment
describe("hierarchical checkout rerouting: [proceed, proceed, authorize]", () => {
  function createPayment() {
    const states = defineStates({
      MethodEntry: undefined,
      Authorizing: undefined,
      Authorized: () => ({ final: true }),
    });
    const transitions = {
      MethodEntry: { authorize: states.Authorizing },
      Authorizing: { authSucceeded: states.Authorized },
      Authorized: {},
    } as const;
    const m = createMachine(states, transitions, "MethodEntry");
    return createHierarchicalMachine(m);
  }

  function createCheckout(paymentFactory: () => ReturnType<typeof createPayment>) {
    const payment = paymentFactory();
    const states = defineStates({
      Cart: undefined,
      Shipping: undefined,
      Payment: submachine(() => payment, { id: "payment" }),
      Review: undefined,
    });
    const transitions = {
      Cart: { proceed: states.Shipping },
      Shipping: { proceed: states.Payment, back: states.Cart },
      Payment: { "child.exit": states.Review, back: states.Shipping },
      Review: { back: states.Shipping },
    } as const;
    const m = createMachine(states, transitions, "Cart");
    return Object.assign(createHierarchicalMachine(m), { payment });
  }

  function createRoot() {
    const checkout = createCheckout(createPayment);
    const states = defineStates({
      Idle: undefined,
      Checkout: submachine(() => checkout, { id: "checkout" }),
      Done: undefined,
    });
    const transitions = {
      Idle: { start: states.Checkout },
      Checkout: { finish: states.Done },
      Done: {},
    } as const;
    const base = createMachine(states, transitions, "Checkout");
    const hierarchical = createHierarchicalMachine(base);
    const subscribed = withSubscribe(hierarchical);
    return Object.assign(subscribed, { checkout });
  }

  it("routes events via root; authorize reaches payment and notifies parent subscribers", () => {
    const root = createRoot();
    const calls = vi.fn();
    const unsub = root.subscribe(calls);

    // Initial
    expect(root.getState().key).toBe("Checkout");
    const checkout = root.getState().as("Checkout").data.machine as any;
    expect(checkout.getState().key).toBe("Cart");

    // proceed -> Shipping (parent transition)
    root.send("proceed");
    expect(checkout.getState().key).toBe("Shipping");

    // proceed -> Payment (parent transition)
    root.send("proceed");
    expect(checkout.getState().key).toBe("Payment");

    const paymentMachine = (checkout.getState().as("Payment").data as any).machine;
    expect(paymentMachine.getState().key).toBe("MethodEntry");

    // authorize -> Authorizing (child-only transition)
    const beforeCount = (calls as any).mock.calls.length;
    root.send("authorize");
    expect(paymentMachine.getState().key).toBe("Authorizing");

    // EXPECTATION: parent should notify subscribers even on child-only transition
    // If this fails, non-exit child changes are not propagated to parent
    expect((calls as any).mock.calls.length).toBe(beforeCount + 1);

    unsub();
  });

  it("authorize sent directly to payment child also updates and notifies parent", () => {
    const root = createRoot();
    const calls = vi.fn();
    const unsub = root.subscribe(calls);

    const checkout = root.getState().as("Checkout").data.machine;
    // reach Payment
    root.send("proceed"); // Cart -> Shipping
    root.send("proceed"); // Shipping -> Payment

    const paymentMachine = checkout.getState().as("Payment").data.machine;
    expect(paymentMachine.getState().key).toBe("MethodEntry");

    // Send authorize directly to payment child
    const beforeDirect = (calls as any).mock.calls.length;
    paymentMachine.send("authorize");
    expect(paymentMachine.getState().key).toBe("Authorizing");

    // Parent should still notify subscribers (at least +1)
    expect((calls as any).mock.calls.length).toBeGreaterThanOrEqual(beforeDirect + 1);

    unsub();
  });
});
