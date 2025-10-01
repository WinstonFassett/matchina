
export type BindableMachine = {
  notify: (ev: any) => void;
  getState: () => any;
};
