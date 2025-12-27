import { produce } from "immer";
import { effect, setup } from "matchina";
import {
  addStoreApi,
  createStoreMachine,
  storeApi,
} from "matchina";

// #region lib

// Simple localStorage polyfill for Node.js environment
const localStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() {
      return store.size;
    },
  };
})();

// Create a generic localStorage persistence setup
const createLocalStoragePersistence = <T extends object>(options: {
  key: string;
  getSlice?: (state: T) => any;
  setState?: (state: T, saved: any) => void;
  shouldPersist?: (ev: any) => boolean;
}) => {
  const {
    key,
    getSlice = (state: any) => state,
    setState = (state: any, saved: any) => Object.assign(state, saved),
    shouldPersist = () => true,
  } = options;

  return (machine: { getState: () => T }) => {
    // Load data from localStorage on setup
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(machine.getState(), parsed);
        console.log(`Loaded from localStorage: ${key}`);
      }
    } catch (error) {
      console.error(`Failed to load from localStorage: ${key}`, error);
    }

    // Set up the persistence effect
    const dispose = setup(machine as any)(
      effect((ev: any) => {
        // Don't persist on initialization
        if (ev.type === "__initialize") return;

        // Check if this event should trigger persistence
        if (!shouldPersist(ev)) return;

        const slice = getSlice(ev.to);
        localStorage.setItem(key, JSON.stringify(slice));
        console.log(`Saved to localStorage: ${key} after ${ev.type}`);
      })
    );

    // Return cleanup function
    return () => {
      dispose();
      console.log(`Persistence teardown for ${key}`);
      localStorage.removeItem(key);
    };
  };
};

/**
 * A simple, elegant todo store using Matchina's store machine with Immer integration
 * Demonstrates:
 * - Clean state transitions with Immer
 * - Side effects using hooks
 * - Persistence with localStorage
 * - Computed properties
 */

// Helper for using Immer with store machine transitions
// The key insight is that transitions need to work with the store's change object
function mutate<T>(updater: (draft: T) => void) {
  return (change: { from: T }) => {
    return produce(change.from, updater);
  };
}

// #endregion

// Todo type definition
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

// Store state definition
type TodoStore = {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  lastUpdated: number | null;
};

// Initial state
const initialState: TodoStore = {
  todos: [],
  filter: "all",
  lastUpdated: null,
};

// Create the todo store
const todoStore = createStoreMachine(initialState, {
  // Core mutations - focused only on state changes
  addTodo: (text: string) =>
    mutate((draft) => {
      draft.todos.push({
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: Date.now(),
      });
      draft.lastUpdated = Date.now();
    }),

  toggleTodo: (id: string) =>
    mutate((draft) => {
      const todo = draft.todos.find((todo) => todo.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        draft.lastUpdated = Date.now();
      }
    }),

  removeTodo: (id: string) =>
    mutate((draft) => {
      const index = draft.todos.findIndex((todo) => todo.id === id);
      if (index !== -1) {
        draft.todos.splice(index, 1);
        draft.lastUpdated = Date.now();
      }
    }),

  updateTodoText: (id: string, text: string) =>
    mutate((draft) => {
      const todo = draft.todos.find((todo) => todo.id === id);
      if (todo) {
        todo.text = text;
        draft.lastUpdated = Date.now();
      }
    }),

  setFilter: (filter: TodoStore["filter"]) =>
    mutate((draft) => {
      draft.filter = filter;
    }),

  clearCompleted: () =>
    mutate((draft) => {
      draft.todos = draft.todos.filter((todo) => !todo.completed);
      draft.lastUpdated = Date.now();
    }),
});

// Simple helper to get current todos
const getTodos = () => todoStore.getState().todos;

// Apply the persistence setup for todos
const disposeTodosPersistence = setup(todoStore)(
  createLocalStoragePersistence({
    key: "todos",
    getSlice: (state) => state.todos,
    setState: (state, saved) => {
      state.todos = saved;
    },
    shouldPersist: (ev) =>
      [
        "addTodo",
        "toggleTodo",
        "removeTodo",
        "updateTodoText",
        "clearCompleted",
      ].includes(ev.type),
  })
);

// Apply the persistence setup for filter
const disposeFilterPersistence = setup(todoStore)(
  createLocalStoragePersistence({
    key: "filter",
    getSlice: (state) => state.filter,
    setState: (state, saved) => {
      state.filter = saved;
    },
    shouldPersist: (ev) => ev.type === "setFilter",
  })
);

// Create an API for the todo store

const todoApi = storeApi(todoStore);

// Method 2: Enhance the store with an API property
const enhancedTodoStore = addStoreApi(todoStore);

// Example usage
console.log("Initial state:", todoStore.getState());

// Add some todos using the standalone API
todoApi.addTodo("Learn Matchina");
todoApi.addTodo("Build a todo app");

// Add a todo using the enhanced store's API
enhancedTodoStore.api.addTodo("Integrate with Immer");

// Toggle a todo
const todos = getTodos();
enhancedTodoStore.api.toggleTodo(todos[1].id);

// Update a todo
todoApi.updateTodoText(todos[2].id, "Integrate with Immer and persist state");

// Set filter
todoApi.setFilter("active");

// Show current state
console.log("Current state:", todoStore.getState());
console.log(
  "Active todos:",
  todoStore.getState().todos.filter((todo) => !todo.completed)
);

// Clean up persistence
disposeTodosPersistence();
disposeFilterPersistence();
