import { createFactoryMachine, defineStates, enter, effect, setup, guard, createApi, resolve, enhanceMethod, methodEnhancer, transition, handle } from "../src";
import { whenEventType, whenState } from "../src/factory-machine-hooks";
import { useMachine } from "../src/integrations/react";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { autotransition } from "./autotransition";
import StateMachineMermaidDiagram from "./MachineViz";
import { getXStateDefinition } from "./StopwatchCommon";
import { delay } from "../src/extras/delay";
import { zen } from "../src/dev/zen";

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
type Pair = typeof pairs[number]

const pairsByOpen = Object.fromEntries(pairs.map((pair) => [pair[0], pair]));
const pairsByClose = Object.fromEntries(pairs.map((pair) => [pair[1], pair]));

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const tokenRegex = new RegExp(`[${Object.keys(pairsByOpen).map(escapeRegExp).join('')}|${Object.keys(pairsByClose).map(escapeRegExp).join('')}]`);
console.log({ tokenRegex })
function matchNextPair(str: string) {
  const nextMatch = str.match(tokenRegex);
  console.log('match next pair', str, nextMatch)
  if (!nextMatch) return undefined;
  const nextMatchIndex = nextMatch.index!;
  const nextMatchValue = nextMatch[0];
  const closedPair = pairsByClose[nextMatchValue];
  if (closedPair) {
    console.log('closing', closedPair[1])
    return [nextMatchIndex, closedPair, 1] as const;
  }
  const openPair = pairsByOpen[nextMatchValue];
  console.log('opening', openPair[0])
  return [nextMatchIndex, openPair, 0] as const;  
}

type GroupState = {
  key: "Group"
  data: {
    pair: Pair,
    parent?: GroupState
  }
}

const balancedParenthesesChecker = ((initialText?: string) => {
  const states = defineStates({
    Valid: undefined,
    Group:  (pair: Pair, parent?: GroupState) => ({ pair, parent }),
    Invalid: undefined,
  });
  const machine = createFactoryMachine(
    states,
    {
      Valid: {
        open: "Group",
        invalidClose: "Invalid",
      },
      Group: {
        open: "Group",
        close: "Group",
        invalidClose: "Invalid",
        valid: "Valid",
      },
      Invalid: {}
    },
    "Valid",
  );
  const controller = new AbortController();
  const logic = Object.assign(zen(machine), {
    text: "",
    controller,
    processing: undefined as undefined | Promise<void>,
    async append(text: string, delayMs = 1000): Promise<void> {
      console.log('append', logic.text, text)
      logic.text = logic.text + text
      if (logic.processing) {
        await logic.processing
        return
      }
      const promiseToProcess = (async () => {
        console.log('processing', text)
        loop: while (logic.text.length > 0) {
          if (logic.controller.signal.aborted) { console.log('ABORTING!'); break loop; }
          console.log('matching', logic.text)
          await delay(delayMs)
          const nextMatch = matchNextPair(logic.text);
          if (!nextMatch) {
            logic.text = ""; // nothing left to do
            console.log('done')
            break loop;
          }; // nothing left to do
          console.log('next match', nextMatch)
          const [nextTokenIndex, nextTokenPair, nextTokenType] = nextMatch;
          logic.text = logic.text.slice(nextTokenIndex + nextTokenPair[nextTokenType].length);
          const isOpen = nextTokenType === 0;
          const state = machine.getState()
          switch (state.key) {
            case 'Invalid':
              break loop;
            case 'Valid':
              if (isOpen) logic.open(nextTokenPair);
              else logic.invalidClose();
              break;            
            case 'Group':
              if (isOpen) {
                logic.open(nextTokenPair, state)
              } else {
                if (state.data.pair[1] !== nextTokenPair[1]) {
                  logic.invalidClose();
                  // logic.text = ''
                  break loop;
                }               
                const { parent } = state.data
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
      })()
      logic.processing = promiseToProcess
      await promiseToProcess
      logic.processing = undefined
      
    },
        
  });
  if (initialText) logic.append(initialText);
  const view = Object.assign(logic, { use: () => useMachine(machine) })
  return view;
});



export function BalancedParenthesesDemo() {
    const [input, setInput] = useState("");   
    const inputDebounced = useDebounce(input, 500)
    const prevInputDebounced = usePrevious(inputDebounced);
    const [checkerVersion, setCheckerVersion] = useState({})
    const checker = useMemo(() => balancedParenthesesChecker(), [checkerVersion])
    checker.use()
    useEffect(() => {
      checker.append(input)
      return () => {
        checker.controller.abort()
      }
    }, [checker])
    useEffect(() => {
      const isAppend = !prevInputDebounced || input.startsWith(prevInputDebounced );
      if (isAppend) {
        console.log('isAppend', prevInputDebounced, input)
        checker.append(input.slice(prevInputDebounced ? prevInputDebounced.length : 0))
      }
      else {
        console.log('restarting checker')
        setCheckerVersion({})
      }
    }, [inputDebounced])
    const actions = useMemo(() => createApi(checker.machine, checker.state.key), [checker.state])
    return (
        <div>
            <textarea value={input} onChange={(ev) => setInput(ev.target.value) } />
            <p>Current State: {checker.state.key}</p>
            {checker.text && <pre>Pending validation:{checker.text}</pre>}
            { checker.state.is('Group') && <pre>Expecting {checker.state.data.pair[1]}</pre>}
            <StateMachineMermaidDiagram config={getXStateDefinition(checker.machine)} stateKey={checker.state.key} actions={actions} />
        </div>
    );
}


function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
