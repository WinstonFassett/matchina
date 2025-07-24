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
const nickname = giant.getState().match({
  Fee: () => "Fee state",
  Fi: () => "Fi state",
  Fo: (data) => `Fo state with name ${data.name}`,
  Fum: (data) => `Fum state with name ${data.name} and age ${data.age}`,
});
// ---cut-after---
console.log(nickname); // Output: Fo state with name John
