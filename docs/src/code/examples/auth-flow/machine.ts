import { matchina, defineStates, setup, transitionHooks, atom } from "matchina";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthFormState {
  email: string;
  password: string;
  name: string;
  error: string | null;
  user: User | null;
}

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
  const initialState: AuthFormState = {
    email: "demo@example.com",
    password: "password123",
    name: "Demo User",
    error: null,
    user: null,
  };

  const store = atom(initialState);

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
      { type: "failure", effect: (ev) => store.update(s => ({ ...s, error: ev.params[0] as string })) },
      { from: "LoggingIn", to: "LoggedIn", effect: (ev) => store.update(s => ({ ...s, user: ev.params[0] as User, error: null })) },
      { from: "Registering", to: "LoggedIn", effect: (ev) => store.update(s => ({ ...s, user: ev.params[0] as User, error: null })) },
      { to: "LoginForm", effect: () => store.update(s => ({ ...s, error: null })) },
      { to: "RegisterForm", effect: () => store.update(s => ({ ...s, error: null })) },
      { type: "logout", effect: () => store.set(initialState) },
    )
  );

  return Object.assign(machine, { store });
};

export type AuthMachine = ReturnType<typeof createAuthMachine>;
