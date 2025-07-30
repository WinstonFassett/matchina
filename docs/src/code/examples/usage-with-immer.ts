import { createMachine, defineStates, eventApi } from "matchina";
import { produce } from "immer";

// Simple example of using Immer with matchina transitions

// Create a helper function to use Immer with transitions
const withImmer =
  <T>(fn: (draft: T) => void) =>
  (data: T): T => {
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

// Create a machine with transitions using Immer
const counterMachine = createMachine(
  counterStates,
  {
    Active: {
      // Using Immer directly
      increment:
        (amount = 1) =>
        (ev) => {
          console.log("Incrementing counter...", ev, amount);
          return counterStates.Active(
            produce<CounterState>(ev.from.data, (draft) => {
              draft.count += amount;
              draft.history.push(draft.count);
              draft.metadata.lastUpdated = new Date();
              draft.metadata.operations.increments += 1;
            })
          );
        },

      // Using the withImmer helper
      decrement:
        (amount = 1) =>
        (ev) => {
          return counterStates.Active(
            withImmer<CounterState>((draft) => {
              draft.count -= amount;
              draft.history.push(draft.count);
              draft.metadata.lastUpdated = new Date();
              draft.metadata.operations.decrements += 1;
            })(ev.from.data)
          );
        },

      // Reset with Immer
      reset: () => (ev) => {
        return counterStates.Active(
          withImmer<CounterState>((draft) => {
            draft.count = 0;
            draft.history.push(0);
            draft.metadata.lastUpdated = new Date();
            draft.metadata.operations.increments = 0;
            draft.metadata.operations.decrements = 0;
          })(ev.from.data)
        );
      },
    },
  },
  counterStates.Active({
    count: 0,
    history: [],
    metadata: {
      lastUpdated: new Date(),
      operations: {
        increments: 0,
        decrements: 0,
      },
    },
  })
);

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

const todoMachine = createMachine(
  todoStates,
  {
    List: {
      addTodo: (text) => (ev) => {
        return todoStates.List(
          produce<TodoState>(ev.from.data, (draft) => {
            const newTodo = {
              id: Date.now().toString(),
              text,
              completed: false,
              tags: [],
              createdAt: new Date(),
            };
            draft.todos.push(newTodo);
            draft.stats.total += 1;
            draft.stats.active += 1;
          })
        );
      },

      toggleTodo: (id) => (ev) => {
        return todoStates.List(
          produce<TodoState>(ev.from.data, (draft) => {
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
          })
        );
      },

      addTag: (id, tag) => (ev) => {
        return todoStates.List(
          produce<TodoState>(ev.from.data, (draft) => {
            const todo = draft.todos.find((t) => t.id === id);
            if (todo && !todo.tags.includes(tag)) {
              todo.tags.push(tag);
              todo.updatedAt = new Date();
            }
          })
        );
      },

      setFilter: (filter) => (ev) => {
        return todoStates.List(
          produce<TodoState>(ev.from.data, (draft) => {
            draft.filter = filter;
          })
        );
      },

      clearCompleted: () => (ev) => {
        return todoStates.List(
          produce<TodoState>(ev.from.data, (draft) => {
            draft.todos = draft.todos.filter((t) => !t.completed);
            draft.stats.completed = 0;
            draft.stats.total = draft.stats.active;
          })
        );
      },
    },
  },
  todoStates.List({
    todos: [],
    filter: "all",
    stats: {
      total: 0,
      completed: 0,
      active: 0,
    },
  })
);

// Create APIs
const counterApi = eventApi(counterMachine);
const todoApi = eventApi(todoMachine);

// Example usage
console.log("Initial counter state:", counterMachine.getState());

// Debug machine structure
console.log(
  "Machine transitions:",
  JSON.stringify(counterMachine.transitions, null, 2)
);
console.log("Machine API:", Object.keys(counterApi));

try {
  // Increment counter
  console.log("Calling increment...");
  counterApi.increment(5);
  console.log("After incrementing:", counterMachine.getState());

  // Decrement counter
  counterApi.decrement(2);
  console.log("After decrementing:", counterMachine.getState());
} catch (error) {
  console.error("Error during counter operations:", error);
}

// Todo list example
console.log("\nInitial todo state:", todoMachine.getState());

// Add todos
todoApi.addTodo("Learn Immer");
todoApi.addTodo("Use with matchina");
console.log("After adding todos:", todoMachine.getState());

// Toggle todo completion
todoApi.toggleTodo(todoMachine.getState().data.todos[0].id);
console.log("After toggling todo:", todoMachine.getState());

// Add tag to todo
todoApi.addTag(todoMachine.getState().data.todos[1].id, "important");
console.log("After adding tag:", todoMachine.getState());

// Change filter
todoApi.setFilter("completed");
console.log("After changing filter:", todoMachine.getState());
