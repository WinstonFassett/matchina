import { describe, expect, it } from "vitest";
import { matchChange } from "../src/match-change";

describe("typeguards", () => {
  describe("matchesChangeEventKeys", () => {
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
          // from: ["a"],
          // to: ["b", "c"] as const,
        } as const)
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
  // describe("isChangeTypeToFrom", () => {
  //   it("matches on single values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(isChangeTypeToFrom(event, "change", "b", "a")).toBe(true);
  //   });
  //   it("matches on multiple values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(isChangeTypeToFrom(event, "change", ["b", "c"], ["a", "d"])).toBe(
  //       true,
  //     );
  //   });
  //   it("matches on undefined values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(isChangeTypeToFrom(event, "change", undefined, undefined)).toBe(
  //       true,
  //     );
  //   });
  //   it("returns false if event does not match", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(isChangeTypeToFrom(event, "other", "b", "a")).toBe(false);
  //   });
  // });
  // describe("asChangeTypeToFrom", () => {
  //   it("matches on single values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(asChangeTypeToFrom(event, "change", "b", "a")).toBe(event);
  //   });
  //   it("matches on multiple values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(asChangeTypeToFrom(event, "change", ["b", "c"], ["a", "d"])).toBe(
  //       event,
  //     );
  //   });
  //   it("matches on undefined values", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(asChangeTypeToFrom(event, "change", undefined, undefined)).toBe(
  //       event,
  //     );
  //   });
  //   it("throws an error if event does not match type", () => {
  //     const event = {
  //       type: "change",
  //       from: { key: "a" },
  //       to: { key: "b" },
  //     };
  //     expect(() => asChangeTypeToFrom(event, "other", "b", "a")).toThrow();
  //   });
  // });
});
