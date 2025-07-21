import { matchina, defineStates } from "matchina";

export const createAuthMachine = () => {
  const states = defineStates({
    LoggedOut: () => ({}),

    LoginForm: (
      email: string = "demo@example.com",
      password: string = "password123",
      error?: string | null,
    ) => ({ email, password, error }),

    RegisterForm: (
      name: string = "Demo User",
      email: string = "demo@example.com",
      error?: string | null,
    ) => ({ name, email, error }),

    PasswordResetForm: (
      email: string = "demo@example.com",
      error?: string | null,
    ) => ({ email, error }),

    PasswordResetSent: (email: string) => ({ email }),

    LoggingIn: (email: string, password: string) => ({ email, password }),
    Registering: (name: string, email: string) => ({ name, email }),
    RequestingPasswordReset: (email: string) => ({ email }),

    LoggedIn: (user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }) => ({ user }),
  });

  const machine = matchina(
    states,
    {
      LoggedOut: {
        showLogin: "LoginForm",
        showRegister: "RegisterForm",
      },

      LoginForm: {
        updateEmail: "LoginForm",
        updatePassword: "LoginForm",
        login: "LoggingIn",
        goToRegister: "RegisterForm",
        goToPasswordReset: "PasswordResetForm",
        cancel: "LoggedOut",
      },

      RegisterForm: {
        updateName: "RegisterForm",
        updateEmail: "RegisterForm",
        register: "Registering",
        goToLogin: "LoginForm",
        cancel: "LoggedOut",
      },

      PasswordResetForm: {
        updateEmail: "PasswordResetForm",
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
    states.LoggedOut(),
  );

  return machine;
};

export type AuthMachine = ReturnType<typeof createAuthMachine>;
