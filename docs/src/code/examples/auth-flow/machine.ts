import { matchina, defineStates } from "matchina";

const states = defineStates({
  LoggedOut: () => ({}),

  LoginForm: ({
    email = "demo@example.com",
    password = "password123",
    error = undefined,
  }: {
    email?: string;
    password?: string;
    error?: string | null;
  } = {}) => ({ email, password, error }),

  RegisterForm: ({
    name = "Demo User",
    email = "demo@example.com",
    error = undefined,
  }: {
    name?: string;
    email?: string;
    error?: string | null;
  } = {}) => ({ name, email, error }),

  PasswordResetForm: ({
    email = "demo@example.com",
    error = undefined,
  }: {
    email?: string;
    error?: string | null;
  } = {}) => ({ email, error }),

  PasswordResetSent: ({ email }: { email: string }) => ({ email }),

  LoggingIn: ({ email, password }: { email: string; password: string }) => ({
    email,
    password,
  }),
  Registering: ({ name, email }: { name: string; email: string }) => ({
    name,
    email,
  }),
  RequestingPasswordReset: ({ email }: { email: string }) => ({ email }),

  LoggedIn: ({
    user,
  }: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }) => ({ user }),
});

export const createAuthMachine = () => {
  return matchina(
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
        failure:
          (error: string) =>
          ({ from }) => {
            return states.LoginForm({
              email: from.data.email,
              password: from.data.password,
              error,
            });
          },
      },

      Registering: {
        success: "LoggedIn",
        failure:
          (error: string) =>
          ({ from }) =>
            states.RegisterForm({
              name: from.data.name,
              email: from.data.email,
              error,
            }),
      },
      RequestingPasswordReset: {
        success: "PasswordResetSent",
        failure:
          (error: string) =>
          ({ from }) =>
            states.PasswordResetForm({
              email: from.data.email,
              error,
            }),
      },

      PasswordResetSent: {
        goToLogin: "LoginForm",
      },

      LoggedIn: {
        logout: "LoggedOut",
      },
    },
    states.LoggedOut()
  );
};

export type AuthMachine = ReturnType<typeof createAuthMachine>;
