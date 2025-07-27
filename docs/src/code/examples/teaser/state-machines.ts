import { defineStates, matchina } from "matchina";

const states = defineStates({
  Fee: undefined,
  Fi: () => ({}),
  Fo: (name: string) => ({ name }),
  Fum: (name: string, age: number) => ({ name, age }),
});

// ---cut-before---
const giant = matchina(
  states,
  {
    Fee: { toFi: "Fi" },
    Fi: { toFo: "Fo" },
    Fo: { toFum: "Fum" },
    Fum: { toFee: "Fee" },
  },
  "Fee"
);

giant.getState().is("Fee"); // true
giant.toFi();
giant.toFo("John");
giant.toFum("John", 30);
// ---cut-after---
