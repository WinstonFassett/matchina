import { effect } from "matchina";

export function createComboboxStoreHook(store: any) {
  let currentMachine: any = null;
  
  return effect((ev: any) => {
    if (ev && ev.machine) {
      currentMachine = ev.machine;
    }
    
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
            
            setTimeout(() => {
              const state = store.getState();
              if (state.suggestions.length > 0) {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  currentMachine.send("toSuggesting");
                }
              } else {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  currentMachine.send("toTextEntry");
                }
              }
            }, 0);
          }
          break;
        case 'highlight':
          if (ev.params && ev.params[0] !== undefined) {
            const direction = ev.params[0];
            if (direction === 'next') {
              store.dispatch('highlightNext');
            } else if (direction === 'prev') {
              store.dispatch('highlightPrev');
            }
          }
          break;
        case 'selectHighlighted':
          const currentState = store.getState();
          const tag = currentState.suggestions[currentState.highlightedIndex];
          if (tag) {
            store.dispatch('addTag', tag);
          }
          break;
      }
    }
  });
}
