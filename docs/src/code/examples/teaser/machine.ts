import { defineStates, matchina } from "matchina";
// ---cut---
const { Fee, Fi, Fo, Fum } = defineStates({
  Fee: undefined,
  Fi: () => ({}),
  Fo: (name: string) => ({ name }),
  Fum: (name: string, age: number) => ({ name, age }),
});

Fee(); // Fee state with no data
Fi(); // Fi state with no data
Fo("John").data.name === "John"; // Fo state with name "John"
Fum("Jane", 30).data.age === 30; // Fum state with name "Jane" and age

const giant = matchina(
  { Fee, Fi, Fo, Fum },
  {
    Fee: {
      goFi: "Fi",
    },
    Fi: {
      goFo: "Fo",
    },
    Fo: {
      goFum: "Fum",
    },
    Fum: {
      goFee: "Fee",
    },
  },
  "Fee",
);

giant.goFi(); // Fee -> Fi
giant.goFo("Alice"); // Fi -> Fo with name "Alice"
giant.goFum("Alice", 25); // Fo -> Fum with name "Alice" and age 25
giant.goFee(); // Fum -> Fee
