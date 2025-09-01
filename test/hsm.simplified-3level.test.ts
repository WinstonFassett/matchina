import { describe, it, expect } from "vitest";
import { defineStates, createMachine } from "../src";
import { createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

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
      machine: createFetchMachine() // Child machine created on entry
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

describe("HSM: Simplified 3-Level Test", () => {
  it("creates the 3-level hierarchy correctly", () => {
    const root = createRootMachine();
    
    // Start inactive
    expect(root.getState().key).toBe("Inactive");
    
    // Focus to activate
    root.send("focus");
    let rootState = root.getState();
    expect(rootState.key).toBe("Active");
    
    // Get search machine (level 2)
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    expect(searchMachine).toBeDefined();
    expect(searchMachine?.getState().key).toBe("Idle");
    
    // Type to start search
    root.send("type", "test query");
    let searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Typing");
    expect(searchState?.data.query).toBe("test query");
    
    // Submit to start fetching (creates level 3 machine)
    root.send("submit");
    searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Fetching");
    
    // Check fetch machine exists (level 3)
    const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
    expect(fetchMachine).toBeDefined();
    expect(fetchMachine?.getState().key).toBe("Pending");
  });
  
  it("routes events to deepest child first", () => {
    const root = createRootMachine();
    
    // Setup 3-level state
    root.send("focus");
    root.send("type", "test");
    root.send("submit");
    
    // Get references to all levels
    const rootState = root.getState();
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    const searchState = searchMachine?.getState();
    const fetchMachine = searchState?.is("Fetching") ? searchState.data.machine : null;
    
    expect(fetchMachine?.getState().key).toBe("Pending");
    
    // Send resolve - should go to fetch machine first
    root.send("resolve", "test data");
    
    // Check that fetch machine handled it
    expect(fetchMachine?.getState().key).toBe("Success");
    expect(fetchMachine?.getState().data.data).toBe("test data");
  });

  it("handles child.exit transitions for chain reactions", () => {
    // First we need to modify the search machine to handle child.exit
    function createSearchMachineWithChildExit() {
      const states = defineStates({
        Idle: () => ({ query: "" }),
        Typing: (query: string) => ({ query }),
        Fetching: (query: string) => ({ 
          query, 
          machine: createFetchMachine()
        }),
        Results: (query: string, data: any) => ({ query, results: data }),
        Error: (query: string, error: string) => ({ query, error }),
      });
      
      const machine = createMachine(states, {
        Idle: { 
          type: (query: string) => states.Typing(query),
        },
        Typing: {
          submit: () => (ev) => states.Fetching(ev.from.data.query),
        },
        Fetching: {
          "child.exit": ({ data }) => {
            // When child machine exits with final state, handle the result
            if (data.final && data.data) {
              return states.Results(data.query || "unknown", data.data);
            }
            if (data.final && data.error) {
              return states.Error(data.query || "unknown", data.error);
            }
            return null;
          },
        },
        Results: {},
        Error: {},
      }, "Idle");
      
      return createHierarchicalMachine(machine);
    }

    // Create root with enhanced search machine
    function createRootWithChildExit() {
      const states = defineStates({
        Inactive: undefined,
        Active: () => ({ machine: createSearchMachineWithChildExit() }),
      });
      
      const machine = createMachine(states, {
        Inactive: { focus: "Active" },
        Active: { blur: "Inactive" },
      }, "Inactive");
      
      return createHierarchicalMachine(machine);
    }

    const root = createRootWithChildExit();
    
    // Setup 3-level state
    root.send("focus");
    root.send("type", "test query");
    root.send("submit");
    
    // Verify we're in fetching state
    const rootState = root.getState();
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    let searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Fetching");
    
    // Resolve the fetch - this should trigger child.exit chain reaction
    root.send("resolve", "search results");
    
    // Check that chain reaction propagated up: fetch->Success->child.exit->search->Results
    searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Results");
    expect(searchState?.data.results).toBe("search results");
  });

  it("bubbles unhandled events up the hierarchy", () => {
    const root = createRootMachine();
    
    // Setup 3-level state
    root.send("focus");
    root.send("type", "test");
    root.send("submit");
    
    // Send an event that the fetch machine can't handle - should bubble up
    // Let's add a "cancel" transition to the search machine
    function createSearchMachineWithCancel() {
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
        Fetching: {
          cancel: "Idle", // This should handle cancel when it bubbles up from fetch
        },
      }, "Idle");
      
      return createHierarchicalMachine(machine);
    }

    // We need to create a fresh machine with cancel support
    function createRootWithCancel() {
      const states = defineStates({
        Inactive: undefined,
        Active: () => ({ machine: createSearchMachineWithCancel() }),
      });
      
      const machine = createMachine(states, {
        Inactive: { focus: "Active" },
        Active: { blur: "Inactive" },
      }, "Inactive");
      
      return createHierarchicalMachine(machine);
    }

    const rootWithCancel = createRootWithCancel();
    rootWithCancel.send("focus");
    rootWithCancel.send("type", "test");
    rootWithCancel.send("submit");

    // Send cancel - fetch machine can't handle it, should bubble to search
    rootWithCancel.send("cancel");
    
    const rootState = rootWithCancel.getState();
    const searchMachine = rootState.is("Active") ? rootState.data.machine : null;
    const searchState = searchMachine?.getState();
    expect(searchState?.key).toBe("Idle");
  });
});