import { matchboxFactory } from "matchina";

const shapes = matchboxFactory(
  {
    Circle: (radius: number) => ({ radius }),
    Square: (side: number) => ({ side }),
    Rectangle: (width: number, height: number) => ({ width, height }),
  },
  "type"
);

type Shape = ReturnType<(typeof shapes)[keyof typeof shapes]>;

const someShape: Shape = shapes.Circle(5);

// ---cut---
export const cornerCount = someShape.match({
  Circle: () => 0,
  _: () => 4, // Default case for Square and Rectangle
});
