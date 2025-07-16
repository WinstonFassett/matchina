import { defineStates, createMachine, zen, delay } from "@lib/src";
import { useMachine } from "@lib/src/integrations/react";

const pairs = [
  ["${", "}"],
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["```", "```"],
  ["<", ">"],
  ["'", "'"],
  ['"', '"'],
] as const;
type Pair = (typeof pairs)[number];
const pairsByOpen = Object.fromEntries(pairs.map((pair) => [pair[0], pair]));
const pairsByClose = Object.fromEntries(pairs.map((pair) => [pair[1], pair]));
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
const tokenRegex = new RegExp(
  `[${Object.keys(pairsByOpen).map(escapeRegExp).join("")}|${Object.keys(pairsByClose).map(escapeRegExp).join("")}]`
);
console.log({ tokenRegex });
function matchNextPair(str: string) {
  const nextMatch = str.match(tokenRegex);
  console.log("match next pair", str, nextMatch);
  if (!nextMatch) return undefined;
  const nextMatchIndex = nextMatch.index!;
  const nextMatchValue = nextMatch[0];
  const closedPair = pairsByClose[nextMatchValue];
  if (closedPair) {
    console.log("closing", closedPair[1]);
    return [nextMatchIndex, closedPair, 1] as const;
  }
  const openPair = pairsByOpen[nextMatchValue];
  console.log("opening", openPair[0]);
  return [nextMatchIndex, openPair, 0] as const;
}
type OpenState = {
  key: "Open";
  data: {
    pair: Pair;
    parent?: OpenState;
  };
};
export const balancedParenthesesChecker = (initialText?: string) => {
  const states = defineStates({
    Valid: undefined,
    Open: (pair: Pair, parent?: OpenState) => ({ pair, parent }),
    Invalid: undefined,
  });
  const machine = createMachine(
    states,
    {
      Valid: {
        open: "Open",
        invalidClose: "Invalid",
      },
      Open: {
        open: "Open",
        close: "Open",
        invalidClose: "Invalid",
        valid: "Valid",
      },
      Invalid: {},
    },
    "Valid"
  );
  const controller = new AbortController();
  const logic = Object.assign(zen(machine), {
    text: "",
    controller,
    processing: undefined as undefined | Promise<void>,
    async append(text: string, delayMs = 0): Promise<void> {
      console.log("append", logic.text, text);
      logic.text = logic.text + text;
      if (logic.processing) {
        await logic.processing;
        return;
      }
      const promiseToProcess = (async () => {
        console.log("processing", text);
        loop: while (logic.text.length > 0) {
          if (logic.controller.signal.aborted) {
            console.log("ABORTING!");
            break loop;
          }
          console.log("matching", logic.text);
          await delay(delayMs);
          const nextMatch = matchNextPair(logic.text);
          if (!nextMatch) {
            logic.text = ""; // nothing left to do
            console.log("done");
            break loop;
          } // nothing left to do
          console.log("next match", nextMatch);
          const [nextTokenIndex, nextTokenPair, nextTokenType] = nextMatch;
          logic.text = logic.text.slice(
            nextTokenIndex + nextTokenPair[nextTokenType].length
          );
          const isOpen = nextTokenType === 0;
          const state = machine.getState();
          switch (state.key) {
            case "Invalid":
              break loop;
            case "Valid":
              if (isOpen) logic.open(nextTokenPair);
              else logic.invalidClose();
              break;
            case "Open":
              if (isOpen) {
                logic.open(nextTokenPair, state);
              } else {
                if (state.data.pair[1] !== nextTokenPair[1]) {
                  logic.invalidClose();
                  // logic.text = ''
                  break loop;
                }
                const { parent } = state.data;
                if (parent) {
                  logic.close(parent.data.pair, parent.data.parent);
                } else {
                  logic.valid();
                  if (logic.text.length === 0) {
                    // logic.text = ''
                    break loop; // shouldn't be necessary
                  }
                }
              }
              break;
            default:
              break;
          }
        }
      })();
      logic.processing = promiseToProcess;
      await promiseToProcess;
      logic.processing = undefined;
    },
  });
  if (initialText) logic.append(initialText);
  // const view = Object.assign(logic, { use: () => useMachine(machine) });
  return logic;
};
