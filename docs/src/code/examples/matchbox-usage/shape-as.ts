import { matchboxFactory } from "matchina";
// ---cut---
const shapes = matchboxFactory({
  Circle: (radius: number) => ({ radius }),
  Square: (side: number) => ({ side }),
  Rectangle: (width: number, height: number) => ({ width, height }),
});
