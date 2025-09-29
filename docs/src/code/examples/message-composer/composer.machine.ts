import { createStoreMachine, storeApi } from "matchina";


export type ComposerState = {
  input: string;
  attachments: string[];
};


export function createComposerMachine(initialState?: Partial<ComposerState>) {
  const defaultState: ComposerState = {
    input: "",
    attachments: [],
    ...initialState,
  };

  const machine = createStoreMachine(defaultState, {
    updateInput: (value: string) => (change) => ({
      ...change.from,
      input: value,
    }),

    addAttachment: (file: string) => (change) => ({
      ...change.from,
      attachments: [...change.from.attachments, file],
    }),

    removeAttachment: (index: number) => (change) => ({
      ...change.from,
      attachments: change.from.attachments.filter((_, i) => i !== index),
    }),

    clearInput: () => (change) => ({
      ...change.from,
      input: "",
    }),

    clear: () => (change) => ({
      ...change.from,
      input: "",
      attachments: [],
    }),

    submit: () => (change) => {
      console.log("Submitting:", change.from);
      // In real app, this would dispatch to external systems
      return {
        ...change.from,
        input: "",
        attachments: [],
      };
    },
  });

  return Object.assign(machine, { actions: storeApi(machine) });
}

export type ComposerMachine = ReturnType<typeof createComposerMachine>;