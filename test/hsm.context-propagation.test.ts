import { describe, it, expect, beforeEach } from "vitest";
import { defineStates, createMachine } from "../src";
import { createHierarchicalMachine, resetGlobalHierarchyStack } from "../src/nesting/propagateSubmachines";

// Level 3: Fetch machine (ephemeral, created when entering Fetching state)
function createFetchMachine() {
  const states = defineStates({
    Pending: () => ({ loading: true }),
    Success: (data: any) => ({ loading: false, data, final: true }),
    Error: (error: string) => ({ loading: false, error, final: true }),
  });
  
  return createMachine(states, {
    Pending: { 
      resolve: (data: any) => states.Success(data),
      reject: (error: string) => states.Error(error),
    },
    Success: {},
    Error: {},
  }, "Pending");
}

// Level 2: Search machine (permanent)
function createSearchMachine() {
  const states = defineStates({
    Idle: () => ({ query: "" }),
    Typing: (query: string) => ({ query }),
    Fetching: (query: string) => ({ 
      query, 
      machine: createFetchMachine() 
    }),
  });
  
  const machine = createMachine(states, {
    Idle: { 
      type: (query: string) => states.Typing(query),
    },
    Typing: {
      submit: () => (ev) => states.Fetching(ev.from.data.query),
    },
    Fetching: {},
  }, "Idle");
  
  return createHierarchicalMachine(machine);
}

// Level 1: Root machine (permanent)
function createRootMachine() {
  const states = defineStates({
    Inactive: undefined,
    Active: () => ({ machine: createSearchMachine() }),
  });
  
  const machine = createMachine(states, {
    Inactive: { focus: "Active" },
    Active: { blur: "Inactive" },
  }, "Inactive");
  
  return createHierarchicalMachine(machine);
}

describe("HSM: Context Propagation (stack, depth, fullKey)", () => {
  beforeEach(() => {
    resetGlobalHierarchyStack();
  });

  it("adds context properties to states at all hierarchy levels", () => {
    const root = createRootMachine();
    
    // Level 1: Root state should have context
    let rootState = root.getState();
    expect(rootState.key).toBe("Inactive");
    // At root level, these should be minimal
    expect(rootState.stack).toBeDefined();
    expect(rootState.depth).toBeDefined();
    expect(rootState.fullKey).toBeDefined();
    
    // Focus to activate search
    root.send("focus");
    rootState = root.getState();
    expect(rootState.key).toBe("Active");
    
    // Check root level context
    expect(rootState.stack).toEqual([rootState]);
    expect(rootState.depth).toBe(0);
    expect(rootState.fullKey).toBe("Active");
    
    // Level 2: Search machine state should have context
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    expect(searchMachine).toBeDefined();
    let searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Idle");
    
    // Check search level context
    expect(searchState?.stack).toEqual([rootState, searchState]);
    expect(searchState?.depth).toBe(1);
    expect(searchState?.fullKey).toBe("Active.Idle");
    
    // Type to start search
    root.send("type", "test query");
    searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Typing");
    
    // Check context after transition
    expect(searchState?.stack).toBeDefined();
    expect(searchState?.depth).toBe(1);
    expect(searchState?.fullKey).toBe("Active.Typing");
    
    // Submit to start fetching (creates level 3 machine)
    root.send("submit");
    searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Fetching");
    
    // Check search level context after creating child
    expect(searchState?.stack).toBeDefined();
    expect(searchState?.depth).toBe(1);
    expect(searchState?.fullKey).toBe("Active.Fetching");
    
    // Level 3: Fetch machine state should have deepest context
    const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
    expect(fetchMachine).toBeDefined();
    const fetchState = fetchMachine?.getState();
    expect(fetchState?.key).toBe("Pending");
    
    // Check fetch level context (deepest level)
    expect(fetchState?.stack).toBeDefined();
    expect(fetchState?.depth).toBe(2);
    expect(fetchState?.fullKey).toBe("Active.Fetching.Pending");
    
    // Verify the full stack contains all ancestor states
    expect(fetchState?.stack).toHaveLength(3);
    expect(fetchState?.stack[0].key).toBe("Active");
    expect(fetchState?.stack[1].key).toBe("Fetching");
    expect(fetchState?.stack[2].key).toBe("Pending");
  });

  it("updates context when transitioning between states", () => {
    const root = createRootMachine();
    
    // Setup: get to 3-level state
    root.send("focus");
    root.send("type", "test");
    root.send("submit");
    
    // Get references to all levels
    const rootState = root.getState();
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    let searchState = searchMachine?.getState();
    const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
    
    // Initially at Pending
    let fetchState = fetchMachine?.getState();
    expect(fetchState?.key).toBe("Pending");
    expect(fetchState?.fullKey).toBe("Active.Fetching.Pending");
    
    // Resolve to Success
    root.send("resolve", "test data");
    fetchState = fetchMachine?.getState();
    expect(fetchState?.key).toBe("Success");
    
    // Context should update to reflect new state
    expect(fetchState?.fullKey).toBe("Active.Fetching.Success");
    expect(fetchState?.depth).toBe(2);
    expect(fetchState?.stack).toHaveLength(3);
    expect(fetchState?.stack[2].key).toBe("Success");
  });

  it("maintains context consistency across hierarchy levels", () => {
    const root = createRootMachine();
    
    // Setup: get to 3-level state
    root.send("focus");
    root.send("type", "hierarchy test");
    root.send("submit");
    
    // Get all states
    const rootState = root.getState();
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    const searchState = searchMachine?.getState();
    const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
    const fetchState = fetchMachine?.getState();
    
    // Verify consistent depth progression
    expect(rootState.depth).toBe(0);
    expect(searchState?.depth).toBe(1);
    expect(fetchState?.depth).toBe(2);
    
    // Verify fullKey builds correctly
    expect(rootState.fullKey).toBe("Active");
    expect(searchState?.fullKey).toBe("Active.Fetching");
    expect(fetchState?.fullKey).toBe("Active.Fetching.Pending");
    
    // Verify stack lengths follow shallow model per level
    expect(rootState.stack).toHaveLength(1); // Root-only
    expect(searchState?.stack).toHaveLength(2); // Root + Search
    expect(fetchState?.stack).toHaveLength(3); // Root + Search + Fetch
    
    // Verify stack contents match expectations
    expect(rootState.stack[0].key).toBe("Active");
    expect(searchState?.stack[0].key).toBe("Active");
    expect(searchState?.stack[1].key).toBe("Fetching");
    expect(fetchState?.stack[0].key).toBe("Active");
    expect(fetchState?.stack[1].key).toBe("Fetching"); 
    expect(fetchState?.stack[2].key).toBe("Pending");
  });
});