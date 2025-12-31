import { matchina, defineStates, setup, transitionHooks, createStoreMachine, addStoreApi, withSubscribe } from "matchina";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  error: string | null;
  user: User | null;
}

const createAuthStore = (initialState: AuthState) => {
  const store = createStoreMachine<AuthState>(initialState, {
    setUser: (user: User) => (change) => ({ ...change.from, user, error: null }),
    setError: (error: string | null) => (change) => ({ ...change.from, error }),
    clearError: () => (change) => ({ ...change.from, error: null }),
    reset: () => () => initialState,
  });
  return addStoreApi(withSubscribe(store));
};

const states = defineStates({
  LoggedOut: undefined,
  LoginForm: undefined,
  RegisterForm: undefined,
  PasswordResetForm: undefined,
  PasswordResetSent: undefined,
  LoggingIn: undefined,
  Registering: undefined,
  RequestingPasswordReset: undefined,
  LoggedIn: undefined,
});

export const createAuthMachine = () => {
  const initialState: AuthState = {
    error: null,
    user: null,
  };

  const store = createAuthStore(initialState);

  const machine = matchina(
    states,
    {
      LoggedOut: {
        showLogin: "LoginForm",
        showRegister: "RegisterForm",
      },
      LoginForm: {
        login: "LoggingIn",
        goToRegister: "RegisterForm",
        goToPasswordReset: "PasswordResetForm",
        cancel: "LoggedOut",
      },
      RegisterForm: {
        register: "Registering",
        goToLogin: "LoginForm",
        cancel: "LoggedOut",
      },
      PasswordResetForm: {
        requestReset: "RequestingPasswordReset",
        goToLogin: "LoginForm",
        cancel: "LoggedOut",
      },
      LoggingIn: {
        success: "LoggedIn",
        failure: "LoginForm",
      },
      Registering: {
        success: "LoggedIn",
        failure: "RegisterForm",
      },
      RequestingPasswordReset: {
        success: "PasswordResetSent",
        failure: "PasswordResetForm",
      },
      PasswordResetSent: {
        goToLogin: "LoginForm",
      },
      LoggedIn: {
        logout: "LoggedOut",
      },
    },
    "LoggedOut"
  );

  setup(machine)(
    transitionHooks(
      { type: "failure", effect: (ev) => store.api.setError(ev.params[0] as string) },
      { from: "LoggingIn", to: "LoggedIn", effect: (ev) => store.api.setUser(ev.params[0] as User) },
      { from: "Registering", to: "LoggedIn", effect: (ev) => store.api.setUser(ev.params[0] as User) },
      { to: "LoginForm", effect: () => store.api.clearError() },
      { to: "RegisterForm", effect: () => store.api.clearError() },
      { type: "logout", effect: () => store.api.reset() },
    )
  );

  return Object.assign(machine, { store });
};

export type AuthMachine = ReturnType<typeof createAuthMachine>;
