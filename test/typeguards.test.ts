import { describe, expect, it } from "vitest";
import {
  asChangeTypeToFrom,
  hasKeyValue,
  isChangeTypeToFrom,
  isKeyedChangeEvent,
} from "../src/typeguards";

describe("typeguards", () => {
  describe("isKeyedChangeEvent", () => {
    it("matches on single values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(
          event,
          {
            type: "change",
            to: "b",
            from: "a",
          },
        ),
      ).toBe(true);
    });
    it("matches on multiple values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(
          event,
          {
            type: "change",
            to: ["b", "c"],
            from: ["a", "d"],
          },
        ),
      ).toBe(true);
    });
    it("matches on undefined values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(
        isKeyedChangeEvent(
          event,
          {
            type: "change",
            to: undefined,
            from: undefined,
          },
        ),
      ).toBe(true);
    });
  });
  describe("isChangeTypeToFrom", () => {
    it("matches on single values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", "b", "a")).toBe(true);
    });
    it("matches on multiple values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", ["b", "c"], ["a", "d"])).toBe(
        true,
      );
    });
    it("matches on undefined values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "change", undefined, undefined)).toBe(
        true,
      );
    });
    it("returns false if event does not match", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(isChangeTypeToFrom(event, "other", "b", "a")).toBe(false);
    });
  });
  describe("asChangeTypeToFrom", () => {
    it("matches on single values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, "change", "b", "a")).toBe(event);
    });
    it("matches on multiple values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, "change", ["b", "c"], ["a", "d"])).toBe(
        event,
      );
    });
    it("matches on undefined values", () => {
      const event = {
        type: "change",
        from: { key: "a" },
        to: { key: "b" },
      };
      expect(asChangeTypeToFrom(event, "change", undefined, undefined)).toBe(
        event,
      );
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
  describe("hasKeyValue", () => {
    it("matches on single values", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", 1)).toBe(true);
    });
    it("matches on multiple values", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", [1, 2])).toBe(true);
    });
    it("returns false if no parameters", () => {
      const obj = { a: 1, b: "two" };
      expect(hasKeyValue(obj, "a", undefined)).toBe(false);
    });
  });
});
