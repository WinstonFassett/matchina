import { describe, expect, it } from "vitest";
import {
  asChangeTypeToFrom,
  hasKeyValue,
  isChangeTypeToFrom,
  isKeyedChangeEvent,
} from "../src/extras/typeguards";

describe("typeguards", () => {
  describe("isKeyedChangeEvent", () => {
    it("returns true if event matches type, to, and from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, {
          type: "change",
          to: "b",
          from: "a",
        }),
      ).toBe(true);
    });

    it("returns false if event does not match type, to, and from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "other", to: "c", from: "d" }),
      ).toBe(false);
    });
  });
});

describe("typeguards", () => {
  describe("isChangeTypeToFrom", () => {
    it("returns true if event matches type, to, and from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", "b", "a")).toBe(true);
    });
  
    it("returns false if event does not match type", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "other", "b", "a")).toBe(false);
    });
  });
});

describe("typeguards", () => {  
  describe("asChangeTypeToFrom", () => {
    it("returns the event if it matches type, to, and from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, "change", "b", "a")).toBe(event);
    });

    it("throws an error if event does not match type", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(() => asChangeTypeToFrom(event, "other", "b", "a")).toThrow();
    });

  });
});

describe("typeguards", () => {
  // returns true if event matches type, to, and from
  // returns false if no parameters
  describe("hasKeyValue", () => {
    it("returns true if object has key with single value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", 1)).toBe(true);
    });

    it("returns false if object does not have key with single value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", 2)).toBe(false);
    });
  });
});


