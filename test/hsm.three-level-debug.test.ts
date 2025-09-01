import { describe, it, expect, beforeEach } from "vitest";
import { defineStates, createMachine, matchina } from "../src";
import { propagateSubmachines, createHierarchicalMachine } from "../src/nesting/propagateSubmachines";

// Debug version to understand what's happening
describe("HSM Debug: Understanding Current Behavior", () => {
  it("debugs the basic 3-level structure", () => {
    console.log("=== DEBUGGING 3-LEVEL STRUCTURE ===");
    
    // Level 3: Fetch machine
    const fetchStates = defineStates({
      Pending: () => ({ loading: true }),
      Success: (data: any) => ({ loading: false, data, final: true }),
    });
    
    function createFetchMachine() {
      return createMachine(fetchStates, {
        Pending: { resolve: (data: any) => fetchStates.Success(data) },
        Success: {},
      }, "Pending");
    }

    // Level 2: Search machine  
    const searchStates = defineStates({
      Idle: () => ({}),
      Typing: (query: string) => ({ query }),
      Fetching: (query: string) => ({ query, machine: createFetchMachine() }),
    });

    function createSearchMachine() {
      const machine = createMachine(searchStates, {
        Idle: { type: (query: string) => searchStates.Typing(query) },
        Typing: { 
          submit: () => (ev) => {
            console.log("TYPING->SUBMIT transition, ev.from:", ev?.from?.key, ev?.from?.data);
            return searchStates.Fetching(ev.from.data.query);
          }
        },
        Fetching: {},
      }, "Idle");
      return createHierarchicalMachine(machine);
    }

    // Level 1: Root machine
    const rootStates = defineStates({
      Inactive: undefined,
      Active: () => ({ machine: createSearchMachine() }),
    });

    const rootMachine = createHierarchicalMachine(createMachine(rootStates, {
      Inactive: { focus: "Active" },
      Active: { blur: "Inactive" },
    }, "Inactive"));

    // Debug step by step
    console.log("1. Initial state:", rootMachine.getState().key);
    
    rootMachine.send("focus");
    console.log("2. After focus:", rootMachine.getState().key);
    
    const activeState = rootMachine.getState();
    const searchMachine = activeState.is("Active") ? activeState.data.machine : null;
    console.log("3. Search machine exists?", !!searchMachine);
    console.log("4. Search machine state:", searchMachine?.getState().key);
    
    // Try sending type event
    console.log("5. Sending 'type' event...");
    rootMachine.send("type", "test query");
    console.log("6. After type, search state:", searchMachine?.getState().key);
    console.log("7. Search state data:", searchMachine?.getState().data);
    
    // Try sending submit event
    console.log("8. Sending 'submit' event...");
    try {
      rootMachine.send("submit");
      console.log("9. After submit, search state:", searchMachine?.getState().key);
      console.log("10. Search state data:", searchMachine?.getState().data);
      
      const fetchingState = searchMachine?.getState();
      if (fetchingState?.is("Fetching")) {
        const fetchMachine = fetchingState.data.machine;
        console.log("11. Fetch machine exists?", !!fetchMachine);
        console.log("12. Fetch machine state:", fetchMachine?.getState()?.key);
      }
    } catch (e) {
      console.log("9. Submit failed:", e);
    }
  });

  it("debugs transition function behavior", () => {
    console.log("=== DEBUGGING TRANSITION FUNCTIONS ===");
    
    const states = defineStates({
      A: (data: any) => ({ data }),
      B: (data: any) => ({ data }),
    });

    const machine = createMachine(states, {
      A: { 
        go: (newData: any) => (ev) => {
          console.log("Transition function called with:", { newData, ev });
          console.log("ev.from:", ev?.from);
          return states.B(newData);
        }
      },
      B: {},
    }, states.A("initial"));

    console.log("Initial:", machine.getState().key, machine.getState().data);
    
    try {
      machine.send("go", "new data");
      console.log("After transition:", machine.getState().key, machine.getState().data);
    } catch (e) {
      console.log("Transition failed:", e);
    }
  });
});