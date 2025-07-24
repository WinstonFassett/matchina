import { defineStates } from "matchina";

// ---cut-before---
const { Fee, Fi, Fo, Fum } = defineStates({
  Fee: undefined,
  Fi: () => ({}),
  Fo: (name: string) => ({ name }),
  Fum: (name: string, age: number) => ({ name, age }),
});

const fi = Fi();
fi.key; // "Fi"
const { name } = Fo("John").data;
const { age } = Fum("Jane", 30).data;
// ---cut-after---

export { Fee, Fi, Fo, Fum };
