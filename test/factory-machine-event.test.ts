import { describe, it, expect, vi } from "vitest";
import { FactoryMachineEventImpl } from "../src/factory-machine-event";
import { StateMachine } from "../src/state-machine";

// Define a minimal state type for testing
type TestState = { key: string; data: any };

// Define a minimal event type that matches TransitionEvent requirements
interface TestEvent {
  type: string;
  from: TestState;
  to: TestState;
  params: any[];
  machine: StateMachine<any>;
}

// Create a minimal implementation of StateMachine with required methods
const createMockMachine = (): StateMachine<any> => {
  return {
    getState: vi.fn(),
    getChange: vi.fn(),
    send: vi.fn(),
    resolveExit: vi.fn(),
    transition: vi.fn(),
    guard: vi.fn(),
    handle: vi.fn(),
    before: vi.fn(),
    update: vi.fn(),
    effect: vi.fn(),
    leave: vi.fn(),
    enter: vi.fn(),
    notify: vi.fn(),
    after: vi.fn(),
    // Add any additional required methods here
  } as unknown as StateMachine<any>; // Cast to avoid implementing all methods
};

// Helper function to create a test event with proper typing
const createTestEvent = (
  type: string,
  params: any[] = []
): TestEvent & { match: any } => {
  const event = new FactoryMachineEventImpl(
    type,
    { key: "from", data: {} },
    { key: "to", data: {} },
    params
  ) as any;

  event.machine = createMockMachine();
  return event as any;
};

describe("FactoryMachineEventImpl", () => {
  it("should create an event with the correct properties", () => {
    const from = { key: "from", data: { value: 1 } };
    const to = { key: "to", data: { value: 2 } };
    const params = [42];

    const event = createTestEvent("test", params);

    expect(event.type).toBe("test");
    expect(event.params).toBe(params);
    expect(event.from).toBeDefined();
    expect(event.to).toBeDefined();
    expect(event.machine).toBeDefined();
  });

  it("should match event types and execute the correct handler", () => {
    const event = createTestEvent("test", [42]);

    const result = event.match(
      {
        test: (value: any) => `Handled test with ${value}`,
        _: () => "fallback",
      },
      false
    );

    expect(result).toBe("Handled test with 42");
  });

  it("should use fallback handler when no match is found", () => {
    const event = createTestEvent("unknown", [42]);

    const result = event.match(
      {
        test: () => "test handler",
        _: () => "fallback",
      },
      false
    );

    expect(result).toBe("fallback");
  });

  it("should throw when no match is found and exhaustive is true", () => {
    const event = createTestEvent("unknown", [42]);

    expect(() => {
      event.match(
        {
          test: () => "test handler",
        },
        true
      );
    }).toThrow("Match did not handle key: 'unknown'");
  });

  it("should handle multiple parameters", () => {
    const event = createTestEvent("multi", ["test", 42, true]);

    const result = event.match(
      {
        multi: (...args: any[]) => {
          const [str, num, bool] = args;
          return { str, num, bool };
        },
      },
      true
    );

    expect(result).toEqual({
      str: "test",
      num: 42,
      bool: true,
    });
  });
});
