import { Middleware } from "../../../types";
import { composeMiddleware } from "./middleware";

export const conditionware = <E>(
  test: (event: E) => boolean,
  ...middlewares: Middleware<E>[]
) => {
  const composed = composeMiddleware(...middlewares);
  return (event: E, next: (event: E) => void) => {
    if (test(event)) {
      composed(event, next);
    } else {
      next(event);
    }
  };
};
