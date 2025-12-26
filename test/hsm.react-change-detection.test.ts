import { describe, it, expect } from "vitest";
import { defineStates } from "../src/define-states";
import { createMachine } from "../src/factory-machine";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";
import { submachine } from "../src/nesting/submachine";

describe("HSM: React Change Detection", () => {
  it("getChange should return different objects when child transitions", () => {
    // This test verifies that React's useSyncExternalStore will detect changes
    // when a child machine transitions, even though the parent state doesn't change
    
    const lightStates = defineStates({ Red: undefined, Green: undefined, Yellow: undefined });

    const states = defineStates({
      Broken: undefined,
      Working: submachine(() =>
        createMachine(
          lightStates,
          {
            Red: { tick: "Green" },
            Green: { tick: "Yellow" },
            Yellow: { tick: "Red" },
          },
          "Red"
        )
      ),
      Maintenance: undefined,
    });

    const ctrl = createMachine(
      states,
      {
        Broken: { repair: "Working", maintenance: "Maintenance" },
        Working: { break: "Broken", maintenance: "Maintenance" },
        Maintenance: { complete: "Working" },
      },
      "Working"
    );

    const hierarchical = createHierarchicalMachine(ctrl);

    // Get initial change - this is what React's useSyncExternalStore uses
    const initialChange = hierarchical.getChange();
    const initialState = hierarchical.getState();
    
    expect(initialState.key).toBe("Working");

    // Send tick - child transitions Red -> Green, parent stays Working
    hierarchical.send("tick" as any);

    // Get change after child transition
    const afterChange = hierarchical.getChange();
    const afterState = hierarchical.getState();

    // Parent state key should still be Working
    expect(afterState.key).toBe("Working");

    // But getChange() MUST return a different object
    // This is critical for React's useSyncExternalStore to detect the change
    expect(afterChange).not.toBe(initialChange);
    
    // Verify the change event has the correct properties
    expect(afterChange.type).toBe("child.change");
    expect(afterChange.from).toBe(afterChange.to); // Self-transition
    expect(afterChange.to.key).toBe("Working");
  });

  it("should trigger React re-renders when child state changes", () => {
    // This test simulates what React's useSyncExternalStore does
    let renderCount = 0;
    let latestSnapshot: any;

    const lightStates = defineStates({ Red: undefined, Green: undefined });
    const states = defineStates({
      Working: submachine(() =>
        createMachine(lightStates, { Red: { tick: "Green" }, Green: {} }, "Red")
      ),
    });
    const ctrl = createMachine(states, { Working: {} }, "Working");
    const hierarchical = createHierarchicalMachine(ctrl);

    // Simulate React's useSyncExternalStore subscribe function
    const subscribe = (onStoreChange: () => void) => {
      const originalNotify = hierarchical.notify;
      hierarchical.notify = (ev: any) => {
        originalNotify.call(hierarchical, ev);
        onStoreChange();
      };
      return () => {
        hierarchical.notify = originalNotify;
      };
    };

    // Simulate React's getSnapshot function
    const getSnapshot = () => hierarchical.getChange();

    // Subscribe and track re-renders
    const unsubscribe = subscribe(() => {
      const newSnapshot = getSnapshot();
      if (newSnapshot !== latestSnapshot) {
        renderCount++;
        latestSnapshot = newSnapshot;
      }
    });

    // Initial render
    latestSnapshot = getSnapshot();
    renderCount = 1;

    // Send tick - should trigger a re-render
    hierarchical.send("tick" as any);

    // Should have re-rendered
    expect(renderCount).toBe(2);

    unsubscribe();
  });
});
