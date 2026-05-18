import {
  matchina,
  defineStates,
  createStoreMachine,
  setup,
  effect,
} from "matchina";

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

  const store = createStoreMachine<AuthFormState>(initialState, {
    setEmail: (email: string) => (change) => ({ ...change.from, email }),
    setPassword: (password: string) => (change) => ({
      ...change.from,
      password,
    }),
    setName: (name: string) => (change) => ({ ...change.from, name }),
    setError: (error: string | null) => (change) => ({ ...change.from, error }),
    setUser: (user: User) => (change) => ({
      ...change.from,
      user,
      error: null,
    }),
    clearError: () => (change) => ({ ...change.from, error: null }),
    reset: () => () => initialState,
  });

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
    effect((ev) => {
      if (ev.type === "failure" && ev.params[0]) {
        store.dispatch("setError", ev.params[0] as string);
      }
      if (ev.type === "success" && ev.from.is("LoggingIn")) {
        store.dispatch("setUser", ev.params[0] as User);
      }
      if (ev.type === "success" && ev.from.is("Registering")) {
        store.dispatch("setUser", ev.params[0] as User);
      }
      if (ev.type === "success" && ev.from.is("RequestingPasswordReset")) {
        // Password reset success doesn't set user, just confirms email sent
      }
      if (ev.type === "showLogin" || ev.type === "showRegister") {
        store.dispatch("clearError");
      }
      if (ev.type === "logout") {
        store.dispatch("reset");
      }
    })
  );

  // Add ergonomic methods that handle store updates
  const enhancedMachine = Object.assign(machine, {
    store,

    success: (data: { user?: User; email?: string }) => {
      if (data.user) {
        store.dispatch("setUser", data.user);
      }
      machine.send("success");
    },

    failure: (error: string) => {
      store.dispatch("setError", error);
      machine.send("failure");
    },
  });

  return enhancedMachine;
};

export type AuthMachine = ReturnType<typeof createAuthMachine>;
