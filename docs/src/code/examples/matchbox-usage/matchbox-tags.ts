import { matchboxFactory } from "matchina";
// ---cut---
const states = matchboxFactory(
  {
    Idle: () => ({}),
    Done: (x: number) => ({ result: x }),
  },
  "key",
);

const events = matchboxFactory(
  {
    add: (x: number, y: number) => ({ x, y }),
    square: (x: number) => x,
  },
  "type",
);

states.Idle().key; // "Idle"
events.add(1, 2).type; // "add"
