import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createStoreMachine, StoreChange } from "../src/store-machine";
import { storeApi, addStoreApi } from "../src/store-machine-api";

// Disable console.log during tests
const originalLog = console.log;
beforeAll(() => {
  console.log = vi.fn();
});

afterAll(() => {
  console.log = originalLog;
});

describe("store-machine-api", () => {
  describe("storeApi", () => {
    it("should create an API object with methods for each transition", () => {
      // Create a store machine with various transition types
      const counter = createStoreMachine(0, {
        increment:
          (amount = 1) =>
          (change) =>
            change.from + amount,
        decrement:
          (amount = 1) =>
          (change) =>
            change.from - amount,
        set: (next) => () => next,
        reset: () => () => 0,
        // Test curried transition
        multiply: (factor) => (change) => change.from * factor,
      });

      // Create API from the store machine
      const api = storeApi(counter);

      // Check that API methods exist
      expect(typeof api.increment).toBe("function");
      expect(typeof api.decrement).toBe("function");
      expect(typeof api.set).toBe("function");
      expect(typeof api.reset).toBe("function");
      expect(typeof api.multiply).toBe("function");

      // Test API methods
      api.increment(5);
      expect(counter.getState()).toBe(5);

      api.decrement(2);
      expect(counter.getState()).toBe(3);

      api.set(10);
      expect(counter.getState()).toBe(10);

      api.multiply(3);
      expect(counter.getState()).toBe(30);

      api.reset();
      expect(counter.getState()).toBe(0);
    });
  });

  describe("addStoreApi", () => {
    it("should enhance a store machine with an api property", () => {
      // Create a store machine
      const todoStore = createStoreMachine<string[]>([], {
        add: (todo) => (change) => [...change.from, todo],
        remove: (index) => (change) =>
          change.from.filter((_: string, i: number) => i !== index),
        clear: () => () => [],
      });

      // Enhance the store machine with an API
      const enhanced = addStoreApi(todoStore);

      // Check that the api property exists
      expect(enhanced.api).toBeDefined();
      expect(typeof enhanced.api.add).toBe("function");
      expect(typeof enhanced.api.remove).toBe("function");
      expect(typeof enhanced.api.clear).toBe("function");

      // Test API methods
      enhanced.api.add("Buy milk");
      expect(enhanced.getState()).toEqual(["Buy milk"]);

      enhanced.api.add("Walk dog");
      expect(enhanced.getState()).toEqual(["Buy milk", "Walk dog"]);

      enhanced.api.remove(0);
      expect(enhanced.getState()).toEqual(["Walk dog"]);

      enhanced.api.clear();
      expect(enhanced.getState()).toEqual([]);
    });

    it("should return the same enhanced object if already enhanced", () => {
      // Create a store machine
      const counter = createStoreMachine(0, {
        increment: () => (change) => change.from + 1,
      });

      // Enhance the store machine
      const enhanced1 = addStoreApi(counter);

      // Try to enhance again
      const enhanced2 = addStoreApi(enhanced1);

      // Check that enhanced2 is the same object as enhanced1
      expect(enhanced2).toBe(enhanced1);
    });
  });

  describe("integration", () => {
    it("should work with complex store state and transitions", () => {
      // Define user type
      interface User {
        name: string;
        age: number;
        preferences: {
          darkMode: boolean;
          notifications: boolean;
        };
      }

      // Initial user state
      const initialUser: User = {
        name: "John",
        age: 25,
        preferences: {
          darkMode: false,
          notifications: true,
        },
      };

      const userStore = createStoreMachine<User>(initialUser, {
        updateName: (name) => (change) => ({ ...change.from, name }),
        updateAge: (age) => (change) => ({ ...change.from, age }),
        toggleDarkMode: () => (change) => ({
          ...change.from,
          preferences: {
            ...change.from.preferences,
            darkMode: !change.from.preferences.darkMode,
          },
        }),
        toggleNotifications: () => (change) => ({
          ...change.from,
          preferences: {
            ...change.from.preferences,
            notifications: !change.from.preferences.notifications,
          },
        }),
        reset: () => () => initialUser,
      });

      // Enhance with API
      const enhanced = addStoreApi(userStore);

      // Test API methods with complex state
      enhanced.api.updateName("Alice");
      expect(enhanced.getState().name).toBe("Alice");

      enhanced.api.updateAge(30);
      expect(enhanced.getState().age).toBe(30);

      enhanced.api.toggleDarkMode();
      expect(enhanced.getState().preferences.darkMode).toBe(true);

      enhanced.api.toggleNotifications();
      expect(enhanced.getState().preferences.notifications).toBe(false);

      enhanced.api.reset();
      expect(enhanced.getState()).toEqual(initialUser);
    });
  });
});
