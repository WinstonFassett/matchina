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
        case 'removeTag':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('removeTag', ev.params[0]);
          }
          break;
        case 'addTag':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('addTag', ev.params[0]);
          }
          break;
        case 'deactivate':
        case 'clear':
          store.dispatch('deactivate');
          break;
        case 'highlightNext':
          store.dispatch('highlightNext');
          break;
        case 'highlightPrev':
          store.dispatch('highlightPrev');
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
