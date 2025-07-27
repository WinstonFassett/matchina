import { defineStates } from "matchina";

// ---cut-before---
const states = defineStates({
  Fee: undefined,
  Fi: () => ({}),
  Fo: (name: string) => ({ name }),
  Fum: (name: string, age: number) => ({ name, age }),
});

const fo = states.Fo("John");
//                 ^|

fo.key; // "Fo"
fo.is("Fo"); // true
fo.data; // { name: "John" }

export const { name } = fo.data; // { name: "John" }
export const { age } = states.Fum("Jane", 30).data; // { name: "Jane", age: 30 }
// ---cut-after---

const { Fee, Fi, Fo, Fum } = states;
export { Fee, Fi, Fo, Fum };
