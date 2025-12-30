import { effect } from "matchina";

export function createComboboxStoreHook(store: any) {
  return effect((ev: any) => {
    // Handle store updates based on events and params
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('setInput', ev.params[0]);
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
          store.dispatch('resetForInactive');
          break;
        case 'highlightNext':
          store.dispatch('highlightNext');
          break;
        case 'highlightPrev':
          store.dispatch('highlightPrev');
          break;
        case 'selectHighlighted':
          // Special case: get current state to find highlighted item
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
