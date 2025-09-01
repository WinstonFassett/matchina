import { describe, it, expect } from "vitest";
import { defineStates, createMachine } from "../src";
import { 
  resolveExitStateEnhanced, 
  isInspectableTransition, 
  createTransition, 
  getTransitionTargets 
} from "../src/inspectable-transitions";

describe("Inspectable Transitions", () => {
  const states = defineStates({
    Idle: (count: number = 0) => ({ count }),
    Loading: (message: string = "Loading...") => ({ message }),
    Success: (data: any) => ({ data }),
    Error: (error: string) => ({ error }),
  });

  describe("Type guards and utilities", () => {
    it("correctly identifies inspectable transitions", () => {
      expect(isInspectableTransition("Loading")).toBe(false);
      expect(isInspectableTransition(() => "Loading")).toBe(false);
      expect(isInspectableTransition({ to: "Loading" })).toBe(true);
      expect(isInspectableTransition({ to: "Loading", handle: () => {} })).toBe(true);
    });

    it("creates inspectable transitions", () => {
      const simpleTransition = createTransition("Loading");
      expect(simpleTransition).toEqual({ to: "Loading" });

      const handlerTransition = createTransition("Success", (data) => data);
      expect(handlerTransition.to).toBe("Success");
      expect(typeof handlerTransition.handle).toBe("function");
    });
  });

  describe("Enhanced transition resolution", () => {
    it("resolves simple inspectable transitions", () => {
      const transition = { to: "Loading" as const };
      const ev = { 
        type: "start", 
        params: ["Starting..."], 
        from: states.Idle() 
      };

      const result = resolveExitStateEnhanced(transition, ev, states);
      expect(result?.key).toBe("Loading");
      expect(result?.data.message).toBe("Starting...");
    });

    it("resolves inspectable transitions with handlers", () => {
      const transition = { 
        to: "Success" as const,
        handle: (data: any) => ({ processed: data })
      };
      const ev = { 
        type: "complete", 
        params: ["raw data"], 
        from: states.Loading() 
      };

      const result = resolveExitStateEnhanced(transition, ev, states);
      expect(result?.key).toBe("Success");
      expect(result?.data.data).toEqual({ processed: "raw data" });
    });

    it("resolves inspectable transitions with array-returning handlers", () => {
      const transition = { 
        to: "Error" as const,
        handle: (...params: any[]) => [`Error: ${params.join(" ")}`]
      };
      const ev = { 
        type: "fail", 
        params: ["Network", "timeout"], 
        from: states.Loading() 
      };

      const result = resolveExitStateEnhanced(transition, ev, states);
      expect(result?.key).toBe("Error");
      expect(result?.data.error).toBe("Error: Network timeout");
    });

    it("falls back to original behavior for legacy transitions", () => {
      const stringTransition = "Loading";
      const ev = { 
        type: "start", 
        params: ["Loading message"], 
        from: states.Idle() 
      };

      const result = resolveExitStateEnhanced(stringTransition, ev, states);
      expect(result?.key).toBe("Loading");
      expect(result?.data.message).toBe("Loading message");

      // Function transition
      const funcTransition = (message: string) => states.Success(message);
      const result2 = resolveExitStateEnhanced(funcTransition, ev, states);
      expect(result2?.key).toBe("Success");
      expect(result2?.data.data).toBe("Loading message");
    });
  });

  describe("Static analysis helpers", () => {
    it("extracts transition targets for visualization", () => {
      const transitions = {
        Idle: {
          start: { to: "Loading" },
          skip: "Success", // legacy string format
          process: (data: any) => states.Success(data), // legacy function format
        },
        Loading: {
          complete: { to: "Success", handle: (data: any) => data },
          fail: { to: "Error" },
        },
        Success: {},
        Error: {
          retry: { to: "Loading" },
        },
      };

      const targets = getTransitionTargets(transitions);
      
      expect(targets.Idle.start).toBe("Loading");
      expect(targets.Idle.skip).toBe("Success");
      expect(targets.Idle.process).toBe("?"); // Function - can't analyze statically
      expect(targets.Loading.complete).toBe("Success");
      expect(targets.Loading.fail).toBe("Error");
      expect(targets.Error.retry).toBe("Loading");
    });
  });

  describe("Integration with createMachine", () => {
    it("works with createMachine using mixed transition formats", () => {
      // Now createMachine supports inspectable transitions directly!
      const machine = createMachine(states, {
        Idle: {
          start: { to: "Loading", handle: (msg: string) => [msg] },
          skip: "Success", // legacy string format still works
        },
        Loading: {
          complete: { to: "Success" },
          fail: { to: "Error", handle: (err: string) => [err] },
          // Legacy function format still works
          cancel: () => states.Idle(1),
        },
        Success: {
          reset: { to: "Idle", handle: () => [0] },
        },
        Error: {
          retry: { to: "Loading", handle: () => ["Retrying..."] },
        },
      }, "Idle");

      // Test the machine works with all formats
      expect(machine.getState().key).toBe("Idle");
      
      // Test inspectable transition with handler
      machine.send("start", "Custom loading message");
      expect(machine.getState().key).toBe("Loading");
      expect(machine.getState().data.message).toBe("Custom loading message");
      
      // Test simple inspectable transition (no handler)
      machine.send("complete");
      expect(machine.getState().key).toBe("Success");
      
      // Test inspectable transition with handler that returns array
      machine.send("reset");
      expect(machine.getState().key).toBe("Idle");
      expect(machine.getState().data.count).toBe(0);
      
      // Test legacy string transition
      machine.send("skip");
      expect(machine.getState().key).toBe("Success");
      
      // Go back to test error path
      machine.send("reset");
      machine.send("start", "Test");
      machine.send("fail", "Network error");
      expect(machine.getState().key).toBe("Error");
      expect(machine.getState().data.error).toBe("Network error");
      
      // Test retry with handler
      machine.send("retry");
      expect(machine.getState().key).toBe("Loading");
      expect(machine.getState().data.message).toBe("Retrying...");
      
      // Test legacy function transition
      machine.send("cancel");
      expect(machine.getState().key).toBe("Idle");
      expect(machine.getState().data.count).toBe(1);
    });
  });
});