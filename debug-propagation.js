// Quick debug script to understand the issue
const { createMachine, defineStates, submachine } = require('./dist/index.js');
const { createHierarchicalMachine } = require('./dist/nesting/index.js');

function createCheckout() {
  const states = defineStates({
    Cart: undefined,
    Shipping: undefined,
  });
  const transitions = {
    Cart: { proceed: states.Shipping },
    Shipping: { back: states.Cart },
  };
  return createMachine(states, transitions, "Cart");
}

function createRoot() {
  const checkout = createCheckout();
  const states = defineStates({
    Idle: undefined,
    Checkout: submachine(() => checkout, { id: "checkout" }),
  });
  const transitions = {
    Idle: { start: states.Checkout },
  };
  const m = createMachine(states, transitions, "Idle");
  return Object.assign(m, { checkout });
}

const root = createHierarchicalMachine(createRoot());
const checkout = root.checkout;

console.log("Initial state:");
console.log("Root:", root.getState().key);
console.log("Checkout:", checkout.getState().key);

root.send("start");
console.log("\nAfter start:");
console.log("Root:", root.getState().key);
console.log("Checkout:", checkout.getState().key);

console.log("\nTrying proceed...");
root.send("proceed");
console.log("After proceed:");
console.log("Root:", root.getState().key);
console.log("Checkout:", checkout.getState().key);

// Try direct send to checkout
console.log("\nTrying direct checkout.send('proceed')...");
checkout.send("proceed");
console.log("After direct proceed:");
console.log("Root:", root.getState().key);
console.log("Checkout:", checkout.getState().key);
