import { createStateMachine } from "matchina";
import { storeApi } from "matchina";

export type ComposerState = {
  input: string;
  attachments: string[];
  metadata: Record<string, any>;
};

export type ComposerActions = {
  updateInput: (value: string) => void;
  addAttachment: (file: string) => void;
  removeAttachment: (index: number) => void;
  clearInput: () => void;
  clear: () => void;
  submit: () => void;
};

export function createComposerMachine(initialState?: Partial<ComposerState>) {
  const machine = createStateMachine<ComposerState>({
    input: "",
    attachments: [],
    metadata: {},
    ...initialState,
  });

  const api: ComposerActions = {
    updateInput: (value: string) => {
      machine.setState(draft => {
        draft.input = value;
      });
    },

    addAttachment: (file: string) => {
      machine.setState(draft => {
        draft.attachments.push(file);
      });
    },

    removeAttachment: (index: number) => {
      machine.setState(draft => {
        draft.attachments.splice(index, 1);
      });
    },

    clearInput: () => {
      machine.setState(draft => {
        draft.input = "";
      });
    },

    clear: () => {
      machine.setState(draft => {
        draft.input = "";
        draft.attachments = [];
      });
    },

    submit: () => {
      console.log("Submitting:", machine.getState());
      // In real app, this would dispatch to external systems
      machine.setState(draft => {
        draft.input = "";
        draft.attachments = [];
      });
    },
  };

  return Object.assign(machine, { api });
}

export type ComposerMachine = ReturnType<typeof createComposerMachine>;