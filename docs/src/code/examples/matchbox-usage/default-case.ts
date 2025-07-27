import { matchboxFactory } from "matchina";

const HttpStatus = matchboxFactory({
  OK: () => ({}),
  NotFound: () => ({}),
  ServerError: () => ({}),
  BadRequest: () => ({}),
});

const status = HttpStatus.NotFound();

// Using a default case
const message = status.match({
  OK: () => "Everything is fine",
  NotFound: () => "Resource not found",
  _: () => "An error occurred", // Handles all other cases
});
