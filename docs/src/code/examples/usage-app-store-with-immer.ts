import { type Draft, produce } from "immer";
import { effect, setup, when } from "matchina";
import { createStoreMachine } from "../../../../src/store-machine";

// Helper for using a produce function with store machine transitions
// Use a simplified type for produce that matches your usage
function createMutate(
  produceFn: <T>(base: T, recipe: (draft: Draft<T>) => void) => T
) {
  return function <T>(updater: (draft: Draft<T>) => void) {
    return (change: { from: T }) => {
      return produceFn(change.from, updater);
    };
  };
}

const mutate = createMutate(produce);

// Example with nested state and Immer
type AppState = {
  user: {
    name: string;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
      language: string;
    };
    history: string[];
  };
  todos: {
    items: Array<{
      id: string;
      text: string;
      completed: boolean;
      tags: string[];
    }>;
    filter: "all" | "active" | "completed";
    stats: {
      total: number;
      active: number;
      completed: number;
    };
  };
  ui: {
    sidebar: {
      open: boolean;
      width: number;
    };
    modal: {
      open: boolean;
      type: string | null;
      data: any;
    };
  };
};

// Initial state
const initialState: AppState = {
  user: {
    name: "Guest",
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    history: [],
  },
  todos: {
    items: [],
    filter: "all",
    stats: {
      total: 0,
      active: 0,
      completed: 0,
    },
  },
  ui: {
    sidebar: {
      open: false,
      width: 240,
    },
    modal: {
      open: false,
      type: null,
      data: null,
    },
  },
};

// Create store with Immer-powered transitions
// Notice how transitions only contain core state actions/mutations
// Side effects like history tracking and stats updates are handled by hooks
const store = createStoreMachine(initialState, {
  // User-related transitions
  updateUserName: (name: string) =>
    mutate((draft) => {
      draft.user.name = name;
    }),

  setTheme: (theme: "light" | "dark") =>
    mutate((draft) => {
      draft.user.preferences.theme = theme;
    }),

  toggleNotifications: () =>
    mutate((draft) => {
      draft.user.preferences.notifications =
        !draft.user.preferences.notifications;
    }),

  // Todo-related transitions
  addTodo: (text: string) =>
    mutate((draft) => {
      const newTodo = {
        id: Date.now().toString(),
        text,
        completed: false,
        tags: [],
      };
      draft.todos.items.push(newTodo);
      // Stats are updated in effects
    }),

  toggleTodo: (id: string) =>
    mutate((draft) => {
      const todo = draft.todos.items.find((item) => item.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        // Stats are updated in effects
      }
    }),

  addTodoTag: (id: string, tag: string) =>
    mutate((draft) => {
      const todo = draft.todos.items.find((item) => item.id === id);
      if (todo && !todo.tags.includes(tag)) {
        todo.tags.push(tag);
      }
    }),

  // UI-related transitions
  toggleSidebar: () =>
    mutate((draft) => {
      draft.ui.sidebar.open = !draft.ui.sidebar.open;
    }),

  resizeSidebar: (width: number) =>
    mutate((draft) => {
      draft.ui.sidebar.width = width;
    }),

  openModal: (type: string, data: any = null) =>
    mutate((draft) => {
      draft.ui.modal.open = true;
      draft.ui.modal.type = type;
      draft.ui.modal.data = data;
    }),

  closeModal: () =>
    mutate((draft) => {
      draft.ui.modal.open = false;
      draft.ui.modal.type = null;
      draft.ui.modal.data = null;
    }),
});

// Set up hooks and effects for side effects
setup(store)(
  // User history tracking effects
  effect(
    when(
      (ev) => ev.type === "setTheme",
      (ev) => {
        const theme = ev.to.user.preferences.theme;
        console.log(`Theme changed to ${theme}`);
        // Direct mutation of the state in the effect
        ev.to.user.history.push(`Changed theme to ${theme}`);
      }
    )
  ),

  effect(
    when(
      (ev) => ev.type === "toggleNotifications",
      (ev) => {
        const enabled = ev.to.user.preferences.notifications;
        console.log(`Notifications ${enabled ? "enabled" : "disabled"}`);
        // Direct mutation of the state in the effect
        ev.to.user.history.push(
          `${enabled ? "Enabled" : "Disabled"} notifications`
        );
      }
    )
  ),

  // Todo stats tracking effects
  effect(
    when(
      (ev) => ev.type === "addTodo",
      (ev) => {
        // Direct mutation of stats in the effect
        ev.to.todos.stats.total += 1;
        ev.to.todos.stats.active += 1;
      }
    )
  ),

  effect(
    when(
      (ev) => ev.type === "toggleTodo",
      (ev) => {
        const todoId = ev.params[0];
        const todo = ev.to.todos.items.find((item) => item.id === todoId);

        if (todo && todo.completed) {
          // Direct mutation of stats in the effect
          ev.to.todos.stats.completed += 1;
          ev.to.todos.stats.active -= 1;
        } else if (todo && !todo.completed) {
          ev.to.todos.stats.completed -= 1;
          ev.to.todos.stats.active += 1;
        }
      }
    )
  ),

  // Logging effect
  effect((ev) => {
    console.log(`Event: ${ev.type}`, {
      from: ev.from,
      to: ev.to,
      params: ev.params,
    });
  })
);

// Example usage
console.log("Initial state:", JSON.stringify(store.getState(), null, 2));

// Update user name
store.dispatch("updateUserName", "John Doe");
console.log("After updating user name:", store.getState().user.name);

// Change theme (history updated via effect)
store.dispatch("setTheme", "dark");
console.log("After changing theme:", store.getState().user.preferences.theme);
console.log("User history:", store.getState().user.history);

// Add todos (stats updated via effect)
store.dispatch("addTodo", "Learn Immer");
store.dispatch("addTodo", "Use with matchina");
console.log("After adding todos:", store.getState().todos.stats);

// Toggle todo completion (stats updated via effect)
const firstTodoId = store.getState().todos.items[0].id;
store.dispatch("toggleTodo", firstTodoId);
console.log("After toggling todo:", store.getState().todos.stats);

// Add tag to todo
store.dispatch("addTodoTag", firstTodoId, "important");
console.log("Todo with tag:", store.getState().todos.items[0]);

// UI operations
store.dispatch("toggleSidebar");
console.log("Sidebar state:", store.getState().ui.sidebar);

store.dispatch("openModal", "settings", { section: "account" });
console.log("Modal state:", store.getState().ui.modal);

setup(store)(
  effect(
    when(
      (ev) => ev.type === "setTheme",
      () => {
        console.log("set theme");
        return () => {
          console.log("set theme done");
        };
      }
    )
  ),
  effect((ev) => {
    const data = ev.to;
    console.log("Effect triggered:", data);
  })
);
