import { describe, expect, it } from "vitest";
import {
  asChangeTypeToFrom,
  hasKeyValue,
  isChangeTypeToFrom,
  isKeyedChangeEvent,
} from "../src/extras/typeguards";

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

    it("returns false if event does not match to", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", "c", "a")).toBe(false);
    });

    it("returns false if event does not match from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", "b", "c")).toBe(false);
    });

    it("returns true if only type matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change")).toBe(true);
    });

    it("returns true if only to matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, undefined, "b")).toBe(true);
    });

    it("returns true if only from matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, undefined, undefined, "a")).toBe(true);
    });

    it("returns false if none of the parameters match", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "other", "c", "d")).toBe(false);
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

    it("throws an error if event does not match to", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(() => asChangeTypeToFrom(event, "change", "c", "a")).toThrow();
    });

    it("throws an error if event does not match from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(() => asChangeTypeToFrom(event, "change", "b", "c")).toThrow();
    });

    it("returns the event if only type matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, "change")).toBe(event);
    });

    it("returns the event if only to matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, undefined, "b")).toBe(event);
    });

    it("returns the event if only from matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, undefined, undefined, "a")).toBe(event);
    });

    it("throws an error if none of the parameters match", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(() => asChangeTypeToFrom(event, "other", "c", "d")).toThrow();
    });
  });
});

describe("typeguards", () => {
  describe("hasKeyValue", () => {
    it("returns true if object has key with single value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", 1)).toBe(true);
    });

    it("returns false if object does not have key with single value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", 2)).toBe(false);
    });

    it("returns true if object has key with one of multiple values", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", ["one", "two"])).toBe(true);
    });

    it("returns false if object does not have key with any of multiple values", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", ["one", "three"])).toBe(false);
    });

    it("returns true if object has key with undefined value", () => {
      const obj = { a: 1, b: undefined };
      expect(hasKeyValue(obj, "b", undefined)).toBe(true);
    });

    it("returns false if object does not have key with undefined value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", undefined)).toBe(false);
    });

    it("returns true if object has key with null value", () => {
      const obj = { a: 1, b: undefined };
      expect(hasKeyValue(obj, "b", undefined)).toBe(true);
    });

    it("returns false if object does not have key with null value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", undefined)).toBe(false);
    });

    it("returns true if object has key with falsy value", () => {
      const obj = { a: 1, b: false };
      expect(hasKeyValue(obj, "b", false)).toBe(true);
    });

    it("returns false if object does not have key with falsy value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", false)).toBe(false);
    });

    it("returns true if object has key with truthy value", () => {
      const obj = { a: 1, b: true };
      expect(hasKeyValue(obj, "b", true)).toBe(true);
    });

    it("returns false if object does not have key with truthy value", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "b", true)).toBe(false);
    });
  });
});

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
          to: ["b", "a"],
          from: "a",
        }),
      ).toBe(true);
    });

    it("returns false if event does not match type", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "other", to: "b", from: "a" }),
      ).toBe(false);
    });

    it("returns false if event does not match to", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "c", from: "a" }),
      ).toBe(false);
    });

    it("returns false if event does not match from", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "c" }),
      ).toBe(false);
    });

    it("returns true if only type matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { type: "change" })).toBe(true);
    });

    it("returns true if only to matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { to: "b" })).toBe(true);
    });

    it("returns true if only from matches", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { from: "a" })).toBe(true);
    });

    it("returns false if none of the parameters match", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "other", to: "c", from: "d" }),
      ).toBe(false);
    });

    it("returns true if to is undefined and filter.to is undefined", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: undefined, from: "a" }),
      ).toBe(true);
    });

    it("returns false if to is undefined and filter.to is not undefined", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns true if from is undefined and filter.from is undefined", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: undefined }),
      ).toBe(true);
    });

    it("returns false if from is undefined and filter.from is not undefined", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns true if to is null and filter.to is null", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { type: "change", from: "a" })).toBe(
        true,
      );
    });

    it("returns false if to is null and filter.to is not null", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns true if from is null and filter.from is null", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { type: "change", to: "b" })).toBe(true);
    });

    it("returns false if from is null and filter.from is not null", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns true if to is falsy and filter.to is falsy", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { type: "change", from: "a" })).toBe(
        true,
      );
    });

    it("returns false if to is falsy and filter.to is not falsy", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns true if from is falsy and filter.from is falsy", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isKeyedChangeEvent(event, { type: "change", to: "b" })).toBe(true);
    });

    it("returns false if from is falsy and filter.from is not falsy", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });

    it("returns false if to is truthy and filter.to is not truthy", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(event, { type: "change", to: "b", from: "a" }),
      ).toBe(true);
    });
  });
});
