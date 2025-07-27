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
const optionalNickname = someShape.match(
  {
    Circle: ({ radius }) => `Circle with radius ${radius}`,
    Square: ({ side }) => `Square with side ${side}`,
  },
  false
);
