import { describe, it, expect, beforeEach } from "vitest";
import { defineStates, createMachine, matchina } from "../src";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

// Test the core requirements for hierarchical machine viz:
// 1. 3-level machine: Root -> Search -> Fetch (ephemeral)
// 2. Context propagation: stack, depth, fullkey
// 3. Chain reaction propagation
// 4. Move toward { to: key, handle: fn } format

interface SearchState {
  query: string;
  results?: string[];
}

interface FetchState {
  url: string;
  loading: boolean;
  data?: any;
}

// Level 3: Ephemeral fetch machine (created dynamically)
function createFetchMachine(query: string) {
  const states = defineStates({
    Pending: () => ({ url: `/api/search?q=${query}`, loading: true }),
    Success: (data: any) => ({ url: `/api/search?q=${query}`, loading: false, data, final: true }),
    Error: (error: string) => ({ url: `/api/search?q=${query}`, loading: false, error, final: true }),
  });

  return createMachine(states, {
    Pending: { 
      resolve: (data: any) => states.Success(data),
      reject: (error: string) => states.Error(error),
    },
    Success: {},
    Error: { retry: "Pending" },
  }, "Pending");
}

// Level 2: Search machine (permanent)
function createSearchMachine() {
  const states = defineStates({
    Idle: () => ({ query: "" }),
    Typing: (query: string) => ({ query }),
    Fetching: (query: string) => ({ 
      query, 
      machine: createFetchMachine(query) 
    }),
    Results: (query: string, results: string[]) => ({ query, results }),
    Error: (query: string, error: string) => ({ query, error }),
  });

  const machine = createMachine(states, {
    Idle: { 
      type: (query: string) => states.Typing(query),
    },
    Typing: {
      submit: () => (ev) => states.Fetching(ev.from.data.query),
      clear: "Idle",
    },
    Fetching: {
      "child.exit": ({ data }) => {
        if (data.final && data.data) {
          return states.Results(data.url.split('=')[1], data.data);
        }
        if (data.final && data.error) {
          return states.Error(data.url.split('=')[1], data.error);
        }
        return null;
      },
      cancel: "Idle",
    },
    Results: {
      clear: "Idle",
      refine: (query: string) => states.Typing(query),
    },
    Error: {
      retry: () => (ev) => states.Fetching(ev.from.data.query),
      clear: "Idle",
    },
  }, "Idle");

  return createHierarchicalMachine(machine);
}

// Level 1: Root app machine (permanent) 
function createRootMachine() {
  const states = defineStates({
    Inactive: undefined,
    Active: () => ({ machine: createSearchMachine() }),
  });

  const machine = createMachine(states, {
    Inactive: {
      focus: "Active",
    },
    Active: {
      blur: "Inactive",
      "child.exit": "Inactive", // if search completes, go back to inactive
    },
  }, "Inactive");

  return createHierarchicalMachine(machine);
}

describe("HSM: 3-Level Search Bar with Context Propagation", () => {
  let rootMachine: ReturnType<typeof createRootMachine>;

  beforeEach(() => {
    rootMachine = createRootMachine();
  });

  describe("Structure and Hierarchy", () => {
    it("creates 3-level hierarchy: Root -> Search -> Fetch", () => {
      // Start inactive
      expect(rootMachine.getState().key).toBe("Inactive");

      // Focus to activate search
      rootMachine.send("focus");
      const activeState = rootMachine.getState();
      expect(activeState.key).toBe("Active");
      expect(activeState.is("Active")).toBe(true);

      // Get search machine (level 2)
      const searchMachine = activeState.is("Active") ? activeState.data.machine : null;
      expect(searchMachine).toBeDefined();
      expect(searchMachine?.getState().key).toBe("Idle");

      // Start typing to enter search flow
      rootMachine.send("type", "test query");
      let searchState = searchMachine?.getState();
      expect(searchState?.key).toBe("Typing");

      // Submit to create fetch machine (level 3 - ephemeral)
      rootMachine.send("submit");
      searchState = searchMachine?.getState();
      expect(searchState?.key).toBe("Fetching");
      
      // Verify fetch machine exists (ephemeral level 3)
      const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
      expect(fetchMachine).toBeDefined();
      expect(fetchMachine?.getState().key).toBe("Pending");
    });
  });

  describe("Chain Reaction Propagation", () => {
    it("propagates events through hierarchy with child-first routing", () => {
      // Setup: get to 3-level state
      rootMachine.send("focus"); // Root: Inactive -> Active  
      rootMachine.send("type", "test"); // Search: Idle -> Typing
      rootMachine.send("submit"); // Search: Typing -> Fetching (creates fetch machine)

      let activeState = rootMachine.getState();
      let searchMachine = activeState.is("Active") ? activeState.data.machine : null;
      let searchState = searchMachine?.getState();
      const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;

      expect(fetchMachine?.getState().key).toBe("Pending");

      // Test child-first routing: resolve should go to level 3 fetch machine first
      rootMachine.send("resolve", ["result1", "result2", "result3"]);
      
      // Fetch machine should handle it and transition to Success
      expect(fetchMachine?.getState().key).toBe("Success");
      expect(fetchMachine?.getState().data).toEqual(["result1", "result2", "result3"]);
    });

    it("bubbles unhandled events up the hierarchy", () => {
      // Setup: get to 3-level state
      rootMachine.send("focus");
      rootMachine.send("type", "test");
      rootMachine.send("submit");

      // Send event that fetch machine can't handle - should bubble to search
      rootMachine.send("clear");
      
      // Should have bubbled up to search machine and cleared to Idle
      let activeState = rootMachine.getState();
      let searchMachine = activeState.is("Active") ? activeState.data.machine : null;
      expect(searchMachine?.getState().key).toBe("Idle");
    });

    it("handles child.exit transitions through chain reaction", () => {
      // Setup: get to fetching state
      rootMachine.send("focus");
      rootMachine.send("type", "test");
      rootMachine.send("submit");

      let activeState = rootMachine.getState();
      let searchMachine = activeState.is("Active") ? activeState.data.machine : null;
      
      // Resolve the fetch - should trigger child.exit chain reaction
      rootMachine.send("resolve", ["result1", "result2"]);
      
      // Chain reaction: fetch transitions to Success (final), triggers child.exit on search
      const finalSearchState = searchMachine?.getState();
      expect(finalSearchState?.key).toBe("Results");
      expect(finalSearchState?.data.results).toEqual(["result1", "result2"]);
    });
  });

  describe("Context Propagation (Future Enhancement)", () => {
    it.todo("should provide stack context for each level", () => {
      // TODO: When propagateSubmachines is enhanced:
      // Each state should have:
      // - stack: [rootState, searchState, fetchState]
      // - depth: 0, 1, 2 respectively  
      // - fullkey: "Active.Fetching.Pending"
      
      /*
      rootMachine.send("focus");
      rootMachine.send("type", "test");
      rootMachine.send("submit");

      const rootState = rootMachine.getState();
      expect(rootState.stack).toEqual([rootState]);
      expect(rootState.depth).toBe(0);
      expect(rootState.fullkey).toBe("Active");

      const searchMachine = rootState.data.machine;
      const searchState = searchMachine.getState();
      expect(searchState.stack).toEqual([rootState, searchState]);
      expect(searchState.depth).toBe(1);
      expect(searchState.fullkey).toBe("Active.Fetching");

      const fetchMachine = searchState.data.machine;
      const fetchState = fetchMachine.getState();
      expect(fetchState.stack).toEqual([rootState, searchState, fetchState]);
      expect(fetchState.depth).toBe(2);  
      expect(fetchState.fullkey).toBe("Active.Fetching.Pending");
      */
    });
  });

  describe("Inspectable Transitions (Future Enhancement)", () => {
    it.todo("should support { to: key, handle: fn } transition format", () => {
      // TODO: When transition format is enhanced:
      // Instead of: submit: (ev) => states.Fetching(ev.from.data.query)
      // Use: submit: { to: "Fetching", handle: (ev) => states.Fetching(ev.from.data.query) }
      
      // This enables:
      // 1. Static analysis of state transitions
      // 2. Better visualization/debugging
      // 3. Separation of intent (to) from logic (handle)
    });
  });

  describe("Infinite Depth Support", () => {
    it.todo("should support arbitrarily deep nesting", () => {
      // TODO: Test creating deeply nested machines
      // Each level should maintain proper context propagation
      // Chain reactions should work at any depth
    });
  });
});