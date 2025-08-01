import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  transitionHook,
  transitionHooks,
  whenFromState,
  whenState,
  whenEventType,
} from "../src/factory-machine-hooks";
import { createMachine } from "../src/factory-machine";
import { defineStates } from "../src/define-states";
import { setup } from "../src/ext/setup";
import { DisposeFunc } from "../src/function-types";
import { effect } from "../src/state-machine-hooks";
import { when } from "../src/extras/when";

describe("factory-machine-hooks", () => {
  describe("transitionHook", () => {
    it("should register a hook for a specific transition", () => {
      const mockEffect = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: {},
        },
        states.idle()
      );

      const dispose = setup(machine)(
        transitionHooks({
          from: "idle",
          to: "active",
          type: "start",
          effect: mockEffect,
        })
      );

      // Trigger the transition
      machine.send("start");

      expect(mockEffect).toHaveBeenCalledTimes(1);

      // Cleanup
      dispose();

      // Shouldn't be called after dispose
      machine.send("start");
      expect(mockEffect).toHaveBeenCalledTimes(1);
    });
  });

  describe("transitionHooks", () => {
    it("should register multiple hooks", () => {
      const mockEffect1 = vi.fn();
      const mockEffect2 = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: { stop: "idle" },
        },
        states.idle()
      );

      const dispose = setup(machine)(
        transitionHooks(
          { from: "idle", to: "active", type: "start", effect: mockEffect1 },
          { from: "active", to: "idle", type: "stop", effect: mockEffect2 }
        )
      );

      // Trigger transitions
      machine.send("start");
      machine.send("stop");

      expect(mockEffect1).toHaveBeenCalledTimes(1);
      expect(mockEffect2).toHaveBeenCalledTimes(1);

      // Cleanup
      dispose();

      // Shouldn't be called after dispose
      machine.send("start");
      machine.send("stop");
      expect(mockEffect1).toHaveBeenCalledTimes(1);
      expect(mockEffect2).toHaveBeenCalledTimes(1);
    });
  });

  describe("when", () => {
    it("should call the entryListener when the test function returns true", () => {
      const mockHandler = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: {},
        },
        states.idle()
      );

      const dispose = setup(machine)(
        effect(when((ev) => ev.type === "start", mockHandler))
      );

      // Trigger the transition
      machine.send("start");

      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Cleanup
      dispose();

      // Shouldn't be called after dispose
      machine.send("start");
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
    it("should call the exitListener when the test function returns false", () => {
      const mockHandler = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: { stop: "idle" },
        },
        states.idle()
      );

      const dispose = setup(machine)(
        effect(
          when(
            (ev) => ev.type === "start",
            (ev) => {
              return () => {
                mockHandler(ev);
              };
            }
          )
        )
      );
      machine.send("start");
      expect(mockHandler).toHaveBeenCalledTimes(0);

      machine.send("stop");
      expect(mockHandler).toHaveBeenCalledTimes(1);

      machine.send("start");
      expect(mockHandler).toHaveBeenCalledTimes(1);

      machine.send("stop");
      expect(mockHandler).toHaveBeenCalledTimes(2);

      dispose();
      machine.send("start");
      expect(mockHandler).toHaveBeenCalledTimes(2);

      machine.send("stop");
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("whenFromState", () => {
    it("should call the handler when transitioning from the specified state", () => {
      const mockHandler = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: {},
        },
        states.idle()
      );

      const dispose = setup(machine)(
        effect(whenFromState("idle", mockHandler))
      );

      // Trigger the transition
      machine.send("start");

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("whenState", () => {
    it("should call the handler when entering the specified state", () => {
      const mockHandler = vi.fn();

      const states = defineStates({
        idle: () => ({}),
        active: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { start: "active" },
          active: {},
        },
        states.idle()
      );

      const dispose = setup(machine)(effect(whenState("active", mockHandler)));

      // Trigger the transition
      machine.send("start");

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("whenEventType", () => {
    it("should call the handler when an event of the specified type occurs", () => {
      const mockHandler = vi.fn();

      const states = defineStates({
        idle: () => ({}),
      } as const);

      const machine = createMachine(
        states,
        {
          idle: { custom: "idle" },
        },
        states.idle()
      );

      const dispose = setup(machine)(
        effect(whenEventType("custom", mockHandler))
      );

      // Trigger the event
      machine.send("custom");

      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Cleanup
      dispose();
    });
  });
});
