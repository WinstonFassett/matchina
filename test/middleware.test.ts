import { describe, expect, it } from "vitest";
import { composeMiddleware } from "../src/extras/middleware/compose-middleware";

// Define a mock middleware for testing
function mockMiddleware<E>(event: E, next: (nextEvent: E) => void) {
  // You can perform some actions or assertions here if needed
  next(event);
}

// Define the test suite using describe
describe("Middleware Suite", () => {
  // Define individual test cases using it
  it("should execute middleware chain", () => {
    const middlewareChain = composeMiddleware(
      mockMiddleware,
      mockMiddleware,
      mockMiddleware,
    );

    // Create a mock callback function for finalNext
    const finalNextMock = (event: any) => {
      // Assert that the finalNextMock is called with the expected event
      expect(event).toBe(initialEvent);
    };

    // Initialize the initialEvent
    const initialEvent = { data: "test" };

    // Call the middleware chain with the initialEvent and finalNextMock
    middlewareChain(initialEvent, finalNextMock);
  });
});
