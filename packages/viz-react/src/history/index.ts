import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { TransitionEvent } from "matchina";

interface HistoryEntry {
  id: string;
  timestamp: number;
  event: TransitionEvent;
  stateBefore: string;
  stateAfter: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  isPlaying: boolean;
}

type HistoryAction = 
  | { type: 'ADD_ENTRY'; entry: HistoryEntry }
  | { type: 'JUMP_TO'; index: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'CLEAR' };

const HistoryContext = createContext<{
  state: HistoryState;
  dispatch: React.Dispatch<HistoryAction>;
} | null>(null);

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [...state.entries.slice(0, state.currentIndex + 1), action.entry],
        currentIndex: state.entries.length,
      };
    case 'JUMP_TO':
      return {
        ...state,
        currentIndex: action.index,
      };
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'CLEAR':
      return { entries: [], currentIndex: -1, isPlaying: false };
    default:
      return state;
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, {
    entries: [],
    currentIndex: -1,
    isPlaying: false,
  });

  return React.createElement(
    HistoryContext.Provider,
    { value: { state, dispatch } },
    children
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
}

export function useTimeTravel() {
  const { state, dispatch } = useHistory();
  
  const jumpTo = React.useCallback((index: number) => {
    dispatch({ type: 'JUMP_TO', index });
  }, [dispatch]);
  
  const play = React.useCallback(() => {
    dispatch({ type: 'PLAY' });
  }, [dispatch]);
  
  const pause = React.useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, [dispatch]);
  
  const clear = React.useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, [dispatch]);
  
  return {
    entries: state.entries,
    currentIndex: state.currentIndex,
    isPlaying: state.isPlaying,
    currentEntry: state.entries[state.currentIndex],
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.entries.length - 1,
    jumpTo,
    play,
    pause,
    clear,
  };
}

export type { HistoryEntry, HistoryState, HistoryAction };
