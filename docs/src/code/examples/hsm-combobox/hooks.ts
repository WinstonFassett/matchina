import { effect } from "matchina";

export function createComboboxStoreHook(store: any) {
  let currentMachine: any = null;
  
  return effect((ev: any) => {
    if (ev && ev.machine) currentMachine = ev.machine;
    
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params?.[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
            setTimeout(() => {
              const state = store.getState();
              currentMachine?.send?.(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
            }, 0);
          }
          break;
        case 'highlight':
          if (ev.params?.[0] !== undefined) {
            const direction = ev.params[0];
            store.dispatch(direction === 'next' ? 'highlightNext' : 'highlightPrev');
          }
          break;
        case 'selectHighlighted':
          const state = store.getState();
          const tag = state.suggestions[state.highlightedIndex];
          if (tag) store.dispatch('addTag', tag);
          break;
        case 'deactivate':
          store.dispatch('clear');
          break;
      }
    }
  });
}
