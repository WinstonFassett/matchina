import { createMachine, defineStates, onLifecycle, withApi } from "matchina";
import { produce } from "immer";

// Create a helper function to use Immer with transitions
const withImmer = <T>(fn: (draft: T) => void) => (data: T): T => {
  return produce(data, fn);
};

// Example 1: Simple counter with nested state
type CounterState = {
  count: number;
  history: number[];
  metadata: {
    lastUpdated: Date;
    operations: {
      increments: number;
      decrements: number;
    };
  };
};

const counterStates = defineStates({
  Active: (data: CounterState) => data,
});

// Create a machine with proper transitions
const counterMachine = withApi(createMachine(
  counterStates,
  {
    Active: {
      increment: "Active",
      decrement: "Active",
      reset: "Active"
    },
  },
  counterStates.Active({
    count: 0,
    history: [],
    metadata: {
      lastUpdated: new Date(),
      operations: {
        increments: 0,
        decrements: 0
      }
    }
  })
));

// Add lifecycle hooks with Immer for state updates
onLifecycle(counterMachine, {
  Active: {
    on: {
      // Using Immer directly
      increment: {
        effect: (ev, amount = 1) => {
          // Use Immer to update the state
          ev.to.data = produce(ev.from.data, (draft) => {
            draft.count += amount;
            draft.history.push(draft.count);
            draft.metadata.lastUpdated = new Date();
            draft.metadata.operations.increments += 1;
          });
        },
      },
      
      // Using the withImmer helper
      decrement: {
        effect: (ev, amount = 1) => {
          // Use the withImmer helper
          ev.to.data = withImmer<CounterState>((draft) => {
            draft.count -= amount;
            draft.history.push(draft.count);
            draft.metadata.lastUpdated = new Date();
            draft.metadata.operations.decrements += 1;
          })(ev.from.data);
        },
      },
      
      // Reset with Immer
      reset: {
        effect: (ev) => {
          ev.to.data = withImmer<CounterState>((draft) => {
            draft.count = 0;
            draft.history.push(0);
            draft.metadata.lastUpdated = new Date();
            draft.metadata.operations.increments = 0;
            draft.metadata.operations.decrements = 0;
          })(ev.from.data);
        },
      },
    },
  },
});

// Example 2: Todo list with Immer
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
};

type TodoState = {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  stats: {
    total: number;
    completed: number;
    active: number;
  };
};

const todoStates = defineStates({
  List: (data: TodoState) => data,
});

const todoMachine = withApi(createMachine(
  todoStates,
  {
    List: {
      addTodo: "List",
      toggleTodo: "List",
      addTag: "List",
      setFilter: "List",
      clearCompleted: "List"
    },
  },
  todoStates.List({
    todos: [],
    filter: "all",
    stats: {
      total: 0,
      completed: 0,
      active: 0
    }
  })
));

// Add lifecycle hooks with Immer for todo state updates
onLifecycle(todoMachine, {
  List: {
    on: {
      // Add todo with Immer
      addTodo: {
        effect: (ev, text: string) => {
          ev.to.data = withImmer<TodoState>((draft) => {
            const newTodo: Todo = {
              id: Date.now().toString(),
              text,
              completed: false,
              tags: [],
              createdAt: new Date()
            };
            
            draft.todos.push(newTodo);
            draft.stats.total += 1;
            draft.stats.active += 1;
          })(ev.from.data);
        },
      },
      
      // Toggle todo completion
      toggleTodo: {
        effect: (ev, id: string) => {
          ev.to.data = withImmer<TodoState>((draft) => {
            const todo = draft.todos.find((t) => t.id === id);
            if (todo) {
              todo.completed = !todo.completed;
              todo.updatedAt = new Date();
              
              // Update stats
              if (todo.completed) {
                draft.stats.completed += 1;
                draft.stats.active -= 1;
              } else {
                draft.stats.completed -= 1;
                draft.stats.active += 1;
              }
            }
          })(ev.from.data);
        },
      },
      
      // Add tag to todo
      addTag: {
        effect: (ev, params: { id: string, tag: string }) => {
          ev.to.data = withImmer<TodoState>((draft) => {
            const todo = draft.todos.find((t) => t.id === params.id);
            if (todo && !todo.tags.includes(params.tag)) {
              todo.tags.push(params.tag);
              todo.updatedAt = new Date();
            }
          })(ev.from.data);
        },
      },
      
      // Change filter
      setFilter: {
        effect: (ev, filter: "all" | "active" | "completed") => {
          ev.to.data = withImmer<TodoState>((draft) => {
            draft.filter = filter;
          })(ev.from.data);
        },
      },
      
      // Clear completed todos
      clearCompleted: {
        effect: (ev) => {
          ev.to.data = withImmer<TodoState>((draft) => {
            draft.todos = draft.todos.filter((t) => !t.completed);
            draft.stats.total = draft.todos.length;
            draft.stats.completed = 0;
            draft.stats.active = draft.todos.length;
          })(ev.from.data);
        },
      },
    },
  },
});

// Run the examples
console.log("Initial counter state:", counterMachine.current);
console.log("Incrementing counter...");
counterMachine.increment(2);
console.log("Counter after increment:", counterMachine.current);
console.log("Counter history:", counterMachine.current.data.history);
console.log("Decrementing counter...");
counterMachine.decrement();
console.log("Counter after decrement:", counterMachine.current);
console.log("Resetting counter...");
counterMachine.reset();
console.log("Counter after reset:", counterMachine.current);

console.log("\n--- Todo List Example ---\n");
console.log("Initial todo state:", todoMachine.current);
console.log("Adding todos...");
todoMachine.addTodo("Learn matchina");
todoMachine.addTodo("Integrate with Immer");
todoMachine.addTodo("Write tests");
console.log("Todos after adding:", todoMachine.current.data.todos);
console.log("Todo stats:", todoMachine.current.data.stats);

console.log("Toggling todo completion...");
const todoId = todoMachine.current.data.todos[0].id;
todoMachine.toggleTodo(todoId);
console.log("Todos after toggle:", todoMachine.current.data.todos);
console.log("Todo stats after toggle:", todoMachine.current.data.stats);

console.log("Adding tags...");
todoMachine.addTag({ id: todoId, tag: "important" });
console.log("Todos after adding tag:", todoMachine.current.data.todos);

console.log("Setting filter to 'completed'...");
todoMachine.setFilter("completed");
console.log("Current filter:", todoMachine.current.data.filter);

console.log("Clearing completed todos...");
todoMachine.clearCompleted();
console.log("Todos after clearing completed:", todoMachine.current.data.todos);
console.log("Todo stats after clearing:", todoMachine.current.data.stats);
