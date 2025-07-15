import { facade } from "@lib/src";

// ---cut---

export const createTrafficLight = () => facade(
  {
    Red: () => "means stop",
    Yellow: () => "means caution",
    Green: () => "means go",
  },
  {
    Red: { next: "Green" },
    Yellow: { next: "Red" },
    Green: { next: "Yellow" },
  },
  "Red"
);
