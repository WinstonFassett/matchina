import { describe, expect, it } from "vitest";
import { matchChange } from "../src/match-change";

describe("typeguards", () => {
  describe("matchChange", () => {
    describe("(filter object)", () => {
      it("matches on single values", () => {
        const event = {
          type: "change",
          from: { key: "a" },
          to: { key: "b" },
        };
        expect(
          matchChange(event, {
            type: "change",
            to: "b",
            from: "a",
          })
        ).toBe(true);
      });
      it("matches on multiple values", () => {
        const event = {
          type: "change",
          from: { key: "a" as "a" | "d" },
          to: { key: "b" as "a" | "b" | "c" },
        } as const;
        expect(
          matchChange(event, {
            type: "change",
            from: ["a", "z"],
            to: ["b", "c"],
          } as any)
        ).toBe(true);
      });
      it("matches on undefined values", () => {
        const event = {
          type: "change",
          from: { key: "a" },
          to: { key: "b" },
        };
        expect(
          matchChange(event, {
            type: "change",
            to: undefined,
            from: undefined,
          })
        ).toBe(true);
      });
    });
    describe("(type?, from?, to?)", () => {
      it("matches on single values", () => {
        const event = {
          type: "change",
          from: { key: "a" },
          to: { key: "b" },
        };
        expect(matchChange(event, "change", "a", "b")).toBe(true);
      });
      it("matches on multiple values", () => {
        const event = {
          type: "change",
          from: { key: "a" as "a" | "d" },
          to: { key: "b" as "a" | "b" | "c" },
        } as const;
        expect(matchChange(event, "change", ["a", "d"], ["b", "c"])).toBe(true);
      });
      it("matches on undefined values", () => {
        const event = {
          type: "change",
          from: { key: "a" },
          to: { key: "b" },
        };
        expect(matchChange(event, "change", undefined, undefined)).toBe(true);
      });
    });
  });
});
