import { effect, guard, setup, when } from "matchina"
import { produce } from "immer";
import { createStoreMachine } from "../../../../src/store-machine";

// Helper for using Immer with store machine transitions
// Usage: setTheme: (theme) => mutate((draft, change) => { draft.user.preferences.theme = theme; })
function mutate<T, P extends any[]>(
  updater: (draft: T, change: { from: T; to: T; type: string; params: P }) => void
) {
  return (change: { from: T; to: T; type: string; params: P }) => {
    return produce(change.from, (draft: T) => {
      updater(draft, change);
      return draft;
    });
  };
}

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
const store = createStoreMachine(initialState, {
  // User-related transitions
  updateUserName: (name: string) => mutate((draft, _ev) => {
    draft.user.name = name;
  }),
  
  setTheme: (theme: "light" | "dark") => mutate((draft, _ev) => {
    draft.user.preferences.theme = theme;
    draft.user.history.push(`Changed theme to ${theme}`);
  }),
  
  toggleNotifications: () => mutate((draft, _ev) => {
    draft.user.preferences.notifications = !draft.user.preferences.notifications;
    draft.user.history.push(
      `${draft.user.preferences.notifications ? "Enabled" : "Disabled"} notifications`
    );
  }),
  
  // Todo-related transitions
  addTodo: (text: string) => mutate((draft, _ev) => {
    const newTodo = {
      id: Date.now().toString(),
      text,
      completed: false,
      tags: [],
    };
    draft.todos.items.push(newTodo);
    draft.todos.stats.total += 1;
    draft.todos.stats.active += 1;
  }),
  
  toggleTodo: (id: string) => mutate((draft, _ev) => {
    const todo = draft.todos.items.find((item: any) => item.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      
      // Update stats
      if (todo.completed) {
        draft.todos.stats.completed += 1;
        draft.todos.stats.active -= 1;
      } else {
        draft.todos.stats.completed -= 1;
        draft.todos.stats.active += 1;
      }
    }
  }),
  
  addTodoTag: (id: string, tag: string) => mutate((draft, _ev) => {
    const todo = draft.todos.items.find((item: any) => item.id === id);
    if (todo && !todo.tags.includes(tag)) {
      todo.tags.push(tag);
    }
  }),
  
  // UI-related transitions
  toggleSidebar: () => mutate((draft, _ev) => {
    draft.ui.sidebar.open = !draft.ui.sidebar.open;
  }),
  
  resizeSidebar: (width: number) => mutate((draft, _ev) => {
    draft.ui.sidebar.width = width;
  }),
  
  openModal: (type: string, data: any = null) => mutate((draft, _ev) => {
    draft.ui.modal.open = true;
    draft.ui.modal.type = type;
    draft.ui.modal.data = data;
  }),
  
  closeModal: () => mutate((draft, _ev) => {
    draft.ui.modal.open = false;
    draft.ui.modal.type = null;
    draft.ui.modal.data = null;
  }),
});

// Example usage
console.log("Initial state:", JSON.stringify(store.getState(), null, 2));

// Update user name
store.send("updateUserName", "John Doe");
console.log("After updating user name:", store.getState().user.name);

// Change theme
store.send("setTheme", "dark");
console.log("After changing theme:", store.getState().user.preferences.theme);
console.log("User history:", store.getState().user.history);

// Add todos
store.send("addTodo", "Learn Immer");
store.send("addTodo", "Use with matchina");
console.log("After adding todos:", store.getState().todos.stats);

// Toggle todo completion
const firstTodoId = store.getState().todos.items[0].id;
store.send("toggleTodo", firstTodoId);
console.log("After toggling todo:", store.getState().todos.stats);

// Add tag to todo
store.send("addTodoTag", firstTodoId, "important");
console.log("Todo with tag:", store.getState().todos.items[0]);

// UI operations
store.send("toggleSidebar");
console.log("Sidebar state:", store.getState().ui.sidebar);

store.send("openModal", "settings", { section: "account" });
console.log("Modal state:", store.getState().ui.modal);


setup(store)(
  store => {
    return ()=> {}
  },
  effect(
    when((ev) => ev.type === 'setTheme', () => {
      console.log('set theme')
      return () => {
        console.log('set theme done')
      }
    })
  ),
  effect(ev => {
    const data = ev.to
    console.log("Effect triggered:", data)
  })

)
