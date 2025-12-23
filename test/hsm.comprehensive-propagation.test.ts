import { describe, it, expect, vi } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { propagateSubmachines } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";
import { withSubscribe } from "../src/extras/with-subscribe";
import { inspect, getFullKey, getDepth } from "../src/nesting/inspect";

describe("comprehensive hierarchical propagation", () => {
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
    return createMachine(states, transitions, "MethodEntry");
  }

  function createCheckout() {
    const payment = createPayment();
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
    return Object.assign(m, { payment });
  }

  function createRoot() {
    const checkout = createCheckout();
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
    const subscribed = withSubscribe(base);
    return Object.assign(subscribed, { checkout });
  }

  it("multilevel machine: top/middle/bottom sends with correct fullKey propagation", () => {
    const root = createRoot();
    propagateSubmachines(root);
    
    const rootCalls = vi.fn();
    const unsub = root.subscribe(rootCalls);

    // Initial state: Root.Checkout.Cart
    expect(root.getState().key).toBe("Checkout");
    const checkout = root.getState().as("Checkout").data.machine;
    expect(checkout.getState().key).toBe("Cart");

    // Verify initial inspection data
    expect(getDepth(root, root.getState())).toBe(0);
    expect(getFullKey(root)).toBe("Checkout.Cart");
    expect(inspect(root).machine).toBe(root);
    expect(getDepth(root, checkout.getState())).toBe(1);
    expect(getFullKey(checkout)).toBe("Cart");

    // 1. TOP LEVEL SEND: root.send("proceed") -> Checkout.Shipping
    const beforeTopSend = rootCalls.mock.calls.length;
    (root as any).send("proceed");
    
    expect(checkout.getState().key).toBe("Shipping");
    expect(getFullKey(root)).toBe("Checkout.Shipping");
    expect(getFullKey(checkout)).toBe("Shipping");
    expect(rootCalls.mock.calls.length).toBe(beforeTopSend + 1);

    // 2. MIDDLE LEVEL SEND: checkout.send("proceed") -> Checkout.Payment.MethodEntry
    const beforeMiddleSend = rootCalls.mock.calls.length;
    checkout.send("proceed");
    
    expect(checkout.getState().key).toBe("Payment");
    const payment = checkout.getState().as("Payment").data.machine;
    expect(payment.getState().key).toBe("MethodEntry");
    
    // Verify 3-level inspection
    expect(getDepth(root, root.getState())).toBe(0);
    expect(getDepth(root, checkout.getState())).toBe(1);
    expect(getDepth(root, payment.getState())).toBe(2);
    expect(getFullKey(root)).toBe("Checkout.Payment.MethodEntry");
    expect(getFullKey(checkout)).toBe("Payment.MethodEntry");
    expect(getFullKey(payment)).toBe("MethodEntry");
    // Root subscriber called (middle send goes through root)
    expect(rootCalls.mock.calls.length).toBe(beforeMiddleSend + 1);

    // 3. BOTTOM LEVEL SEND: payment.send("authorize") -> Checkout.Payment.Authorizing
    const beforeBottomSend = rootCalls.mock.calls.length;
    payment.send("authorize");
    
    expect(payment.getState().key).toBe("Authorizing");
    expect(getFullKey(root)).toBe("Checkout.Payment.Authorizing");
    expect(getFullKey(checkout)).toBe("Payment.Authorizing");
    expect(getFullKey(payment)).toBe("Authorizing");
    // Root subscriber called (bottom send goes through root)
    expect(rootCalls.mock.calls.length).toBe(beforeBottomSend + 1);

    // 4. Verify stack contains all active states
    const snapshot = inspect(root);
    expect(snapshot.stack).toHaveLength(3);
    expect(snapshot.stack[0].key).toBe("Checkout");
    expect(snapshot.stack[1].key).toBe("Payment");
    expect(snapshot.stack[2].key).toBe("Authorizing");

    // 5. Test child.exit propagation: payment.send("authSucceeded") -> final -> child.exit
    const beforeExit = rootCalls.mock.calls.length;
    payment.send("authSucceeded");
    
    expect(payment.getState().key).toBe("Authorized");
    expect(payment.getState().data.final).toBe(true);
    expect(checkout.getState().key).toBe("Review"); // child.exit handled
    expect(getFullKey(root)).toBe("Checkout.Review");
    expect(rootCalls.mock.calls.length).toBe(beforeExit + 1);

    unsub();
  });
});
