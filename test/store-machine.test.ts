import { describe, it, expect, vi } from "vitest";
import { createStoreMachine, StoreChange } from "../src/store-machine";
import { produce } from "immer";

import { effect } from "../src";

describe("createStoreMachine", () => {
  it("does not dispatch unknown types", () => {
    const store = createStoreMachine(42, {
      increment:
        (amount = 1) =>
        (change) =>
          change.from + amount,
    });
    expect(() => store.dispatch("unknown" as any)).not.toThrow();
    expect(store.getState()).toBe(42);
    expect(store.getChange()).toEqual({
      type: "__initialize",
      params: [],
      from: 42,
      to: 42,
    });
  });

  it("should initialize with the provided state", () => {
    const store = createStoreMachine(42, {
      // No transitions needed for this test
      noop: () => 42,
    });
    expect(store.getState()).toBe(42);
  });

  it("should update state with simple transitions", () => {
    const store = createStoreMachine(0, {
      increment:
        (amount = 1) =>
        (change) =>
          change.from + amount,
      set: (value: number) => value,
    });

    store.dispatch("increment");
    expect(store.getState()).toBe(1);

    store.dispatch("increment", 5);
    expect(store.getState()).toBe(6);

    store.dispatch("set", 42);
    expect(store.getState()).toBe(42);
  });

  it("should support complex state updates", () => {
    interface User {
      name: string;
      age: number;
    }

    const store = createStoreMachine<User>(
      { name: "Alice", age: 30 },
      {
        // Update user with a function that receives current state
        updateUser: (updater: (user: User) => User) => (change) =>
          updater(change.from),

        // Simple increment
        birthday: () => (change) => ({
          ...change.from,
          age: change.from.age + 1,
        }),

        doNothing: (msg: string) => (change) => {
          console.log(msg);
          return undefined as unknown as typeof change.from;
        },
      }
    );

    // Update using a function
    store.dispatch("updateUser", (user: User) => ({
      ...user,
      name: "Bob",
      age: user.age + 1,
    }));

    expect(store.getState()).toEqual({ name: "Bob", age: 31 });

    // Use a simple transition
    store.dispatch("birthday");
    expect(store.getState()).toEqual({ name: "Bob", age: 32 });

    const stateBefore = store.getState();
    store.dispatch("doNothing", "hello");
    expect(store.getState()).toEqual(stateBefore);
  });

  it("should provide change information in transitions", () => {
    const store = createStoreMachine(0, {
      // Transition that uses the change object
      add: (amount: number) => (change) => {
        expect(change).toMatchObject({
          type: "add",
          from: 0,
          params: [5],
        });
        return change.from + amount;
      },

      // Another transition
      subtract: (amount: number) => (change) => {
        expect(change.type).toBe("subtract");
        expect(change.params).toEqual([3]);
        return change.from - amount;
      },
    });

    store.dispatch("add", 5);
    expect(store.getState()).toBe(5);

    store.dispatch("subtract", 3);
    expect(store.getState()).toBe(2);
  });

  it("should work with Immer for immutable updates", () => {
    interface AppState {
      user: {
        name: string;
        preferences: {
          notifications: boolean;
        };
      };
    }

    const store = createStoreMachine<AppState>(
      {
        user: {
          name: "Alice",
          preferences: {
            notifications: false,
          },
        },
      },
      {
        // Update using Immer
        update: (updater: (draft: AppState) => void) => (change) =>
          produce(change.from, updater),

        // Specific update
        updateName: (name: string) => (change) =>
          produce(change.from, (draft) => {
            draft.user.name = name;
          }),
      }
    );

    // Test update with Immer
    store.dispatch("update", (draft: AppState) => {
      draft.user.name = "Bob";
      draft.user.preferences.notifications = true;
    });

    expect(store.getState().user.name).toBe("Bob");
    expect(store.getState().user.preferences.notifications).toBe(true);

    // Test specific transition with Immer
    store.dispatch("updateName", "Charlie");
    expect(store.getState().user.name).toBe("Charlie");
  });

  it("should handle complex nested state updates", () => {
    interface Todo {
      id: number;
      text: string;
      completed: boolean;
    }

    interface TodoState {
      todos: Todo[];
      filter: "all" | "active" | "completed";
    }

    const store = createStoreMachine<TodoState>(
      {
        todos: [],
        filter: "all",
      },
      {
        addTodo: (text: string) => (change) =>
          produce(change.from, (draft) => {
            draft.todos.push({
              id: Date.now(),
              text,
              completed: false,
            });
          }),

        toggleTodo: (id: number) => (change) =>
          produce(change.from, (draft) => {
            const todo = draft.todos.find((t) => t.id === id);
            if (todo) {
              todo.completed = !todo.completed;
            }
          }),

        setFilter: (filter: "all" | "active" | "completed") => (change) => ({
          ...change.from,
          filter,
        }),
      }
    );

    // Add some todos
    store.dispatch("addTodo", "Learn TypeScript");
    store.dispatch("addTodo", "Learn State Machines");

    const todos = store.getState().todos;
    expect(todos).toHaveLength(2);
    expect(todos[0].text).toBe("Learn TypeScript");
    expect(todos[0].completed).toBe(false);

    // Toggle a todo
    const todoId = todos[0].id;
    store.dispatch("toggleTodo", todoId);
    expect(store.getState().todos[0].completed).toBe(true);

    // Set filter
    store.dispatch("setFilter", "completed");
    expect(store.getState().filter).toBe("completed");
  });
});
