import { effect, setup, when } from "matchina";
import { produce } from "immer";
import { createStoreMachine } from "../../../../src/store-machine";

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
  lastUpdated: null
};

// Create the todo store
const todoStore = createStoreMachine(initialState, {
  // Core mutations - focused only on state changes
  addTodo: (text: string) => mutate(draft => {
    draft.todos.push({
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now()
    });
    draft.lastUpdated = Date.now();
  }),
  
  toggleTodo: (id: string) => mutate(draft => {
    const todo = draft.todos.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      draft.lastUpdated = Date.now();
    }
  }),
  
  removeTodo: (id: string) => mutate(draft => {
    const index = draft.todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
      draft.todos.splice(index, 1);
      draft.lastUpdated = Date.now();
    }
  }),
  
  updateTodoText: (id: string, text: string) => mutate(draft => {
    const todo = draft.todos.find(todo => todo.id === id);
    if (todo) {
      todo.text = text;
      draft.lastUpdated = Date.now();
    }
  }),
  
  setFilter: (filter: TodoStore["filter"]) => mutate(draft => {
    draft.filter = filter;
  }),
  
  clearCompleted: () => mutate(draft => {
    draft.todos = draft.todos.filter(todo => !todo.completed);
    draft.lastUpdated = Date.now();
  }),
});

// Create helper functions for computed values instead of properties
const getFilteredTodos = () => {
  const state = todoStore.getState();
  switch (state.filter) {
    case "active":
      return state.todos.filter(todo => !todo.completed);
    case "completed":
      return state.todos.filter(todo => todo.completed);
    default:
      return state.todos;
  }
};

const getActiveCount = () => todoStore.getState().todos.filter(todo => !todo.completed).length;
const getCompletedCount = () => todoStore.getState().todos.filter(todo => todo.completed).length;
const getTotalCount = () => todoStore.getState().todos.length;

// Set up hooks for side effects
setup(todoStore)(
  // Persistence effect - save to localStorage on state changes
  effect(ev => {
    // Skip saving when only the filter changes
    if (ev.type !== "setFilter") {
      localStorage.setItem("todos", JSON.stringify(ev.to));
      console.log("Saved todos to localStorage");
    }
  }),
  
  // Logging effect for specific events
  effect(
    when(ev => ev.type === "addTodo", ev => {
      const newTodo = ev.to.todos[ev.to.todos.length - 1];
      console.log(`Added todo: ${newTodo.text}`);
    })
  ),
  
  effect(
    when(ev => ev.type === "toggleTodo", ev => {
      const todoId = ev.params[0];
      const todo = ev.to.todos.find(t => t.id === todoId);
      if (todo) {
        console.log(`Todo '${todo.text}' marked as ${todo.completed ? "completed" : "active"}`);
      }
    })
  ),
  
  effect(
    when(ev => ev.type === "clearCompleted", ev => {
      const removedCount = ev.from.todos.length - ev.to.todos.length;
      console.log(`Cleared ${removedCount} completed todos`);
    })
  )
);

// Initialize from localStorage if available
try {
  const savedTodos = localStorage.getItem("todos");
  if (savedTodos) {
    const parsed = JSON.parse(savedTodos) as TodoStore;
    Object.entries(parsed).forEach(([key, value]) => {
      // Type assertion to make TypeScript happy
      (todoStore.getState() as any)[key] = value;
    });
    console.log("Loaded todos from localStorage");
  }
} catch (error) {
  console.error("Failed to load todos from localStorage", error);
}

// Example usage
console.log("Initial state:", todoStore.getState());

// Add some todos
todoStore.send("addTodo", "Learn Matchina");
todoStore.send("addTodo", "Master Immer integration");
todoStore.send("addTodo", "Build awesome apps");

// Toggle a todo
const firstTodoId = todoStore.getState().todos[0].id;
todoStore.send("toggleTodo", firstTodoId);

// Filter todos
todoStore.send("setFilter", "active");
console.log("Active todos:", getFilteredTodos());

// Show stats
console.log("Stats:", {
  active: getActiveCount(),
  completed: getCompletedCount(),
  total: getTotalCount()
});
