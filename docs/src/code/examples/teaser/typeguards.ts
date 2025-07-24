import { defineStates, matchina } from "matchina";

const { Fee, Fi, Fo, Fum } = defineStates({
  Fee: undefined,
  Fi: () => ({}),
  Fo: (name: string) => ({ name }),
  Fum: (name: string, age: number) => ({ name, age }),
});
const giant = matchina(
  { Fee, Fi, Fo, Fum },
  {
    Fee: { toFi: "Fi" },
    Fi: { toFo: "Fo" },
    Fo: { toFum: "Fum" },
    Fum: { toFee: "Fee" },
  },
  "Fee",
);
// ---cut-before---
const state = giant.getState();
if (state.is("Fum")) {
  const { name, age } = state.data;
  console.log(`Fum state with name ${name} and age ${age}`);
}
// ---cut-after---
