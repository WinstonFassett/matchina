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
const area = someShape.match({
  Circle: ({ radius }) => Math.PI * radius * radius,
  Square: ({ side }) => side * side,
  Rectangle: ({ width, height }) => width * height,
});
