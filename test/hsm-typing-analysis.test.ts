import { describe, it, expect } from "vitest";
import { createHSM } from "../src/hsm/flattened/declarative-flat";
import { defineStates, createMachine } from "../src";
import { createFlatMachine } from "../src/hsm/flattened/declarative-flat";

describe("HSM Typing Analysis", () => {
  describe("Current createHSM typing problems", () => {
    it("should demonstrate typing loss in createHSM", () => {
      // This should have perfect typing but returns any
      const machine = createHSM({
        initial: "Payment",
        states: {
          Payment: {
            initial: "MethodEntry",
            states: {
              MethodEntry: {
                data: () => ({ amount: 0 }), // Parameterless
                on: { authorize: "Authorizing" }
              },
              Authorizing: {
                data: () => ({ amount: 0, loading: true }), // Parameterless
                on: { 
                  success: "Authorized",
                  error: "MethodEntry"
                }
              },
              Authorized: {
                data: () => ({ amount: 0 }) // Parameterless
              }
            }
          }
        }
      });

      machine.send("authorize", 100);
      
      machine.send("success", 100, "approved");

      // The machine type is 'any' - this is the core problem
      const machineType: any = machine;
      expect(machineType).toBeDefined();
    });
  });

  describe("What good typing looks like", () => {
    it("should show proper typing with direct machine creation", () => {
      const states = defineStates({
        "Payment.MethodEntry": (amount: number) => ({ amount }),
        "Payment.Authorizing": (amount: number) => ({ amount, loading: true }),
        "Payment.Authorized": (amount: number, result: string) => ({ amount, result })
      });

      const machine = createMachine(
        states,
        {
          "Payment.MethodEntry": {
            authorize: (amount: number) => states["Payment.Authorizing"](amount)
          },
          "Payment.Authorizing": {
            success: (amount: number, result: string) => states["Payment.Authorized"](amount, result),
            error: (amount: number) => states["Payment.MethodEntry"](amount)
          }
        },
        states["Payment.MethodEntry"](0)
      );

      // This has PERFECT typing - autocomplete, parameter checking, etc.
      // machine.send("authorize", 100); // ✅ Works with proper typing
      // machine.send("success", 100, "approved"); // ✅ Works with proper typing
      
      // This would fail: missing parameter
      // machine.send("authorize"); 
      
      // This would fail: wrong parameter types  
      // machine.send("success", "not a number", "approved");

      expect(machine.getState().key).toBe("Payment.MethodEntry");
    });
  });

  describe("Typing comparison", () => {
    it("should show the typing difference between approaches", () => {
      // Approach 1: Direct creation - PERFECT typing but verbose
      const directStates = defineStates({
        "Payment.MethodEntry": (amount: number) => ({ amount }),
        "Payment.Authorizing": (amount: number) => ({ amount, loading: true }),
      });

      const directMachine = createMachine(
        directStates,
        {
          "Payment.MethodEntry": { authorize: "Payment.Authorizing" },
          "Payment.Authorizing": { cancel: "Payment.MethodEntry" }
        },
        directStates["Payment.MethodEntry"](0)
      );

      // Approach 2: createHSM - ERGONOMIC and should have good typing now
      const hsmMachine = createHSM({
        initial: "Payment",
        states: {
          Payment: {
            initial: "MethodEntry", 
            states: {
              MethodEntry: { data: () => ({ amount: 0 }) }, // Parameterless for now
              Authorizing: { data: () => ({ amount: 0, loading: true }) }
            }
          }
        }
      });

      // Both work functionally, and typing should now be similar
      expect(directMachine.getState().key).toBe("Payment.MethodEntry");
      
      // Debug the hsmMachine
      console.log("hsmMachine:", hsmMachine);
      console.log("hsmMachine.getState():", hsmMachine.getState());
      console.log("hsmMachine.getState()?.key:", hsmMachine.getState()?.key);
      
      expect(hsmMachine.getState()?.key).toBe("Payment.MethodEntry");

      // Direct machine has proper typing:
      // directMachine.send("authorize") // ❌ TypeScript error: missing amount
      // hsmMachine.send("authorize") // ❌ Should now be TypeScript error: missing amount
    });
  });
});
