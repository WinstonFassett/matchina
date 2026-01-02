import { useMachine } from "matchina/react";
import { type AuthMachine } from "./machine";
import React, { useState } from "react";

function LoginFormView({ machine, handleAutoSuccess }: any) {
  const storeData = machine.store.getState();
  const [email, setEmail] = useState(storeData.email || "");
  const [password, setPassword] = useState(storeData.password || "");
  React.useEffect(() => {
    setEmail(storeData.email || "");
    setPassword(storeData.password || "");
  }, [storeData.email, storeData.password]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Log In</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Show error if exists */}
        {storeData.error && (
          <div className="text-red-500 mb-4">
            <p className="text-sm">{storeData.error}</p>
          </div>
        )}
        <button
          onClick={() =>
            handleAutoSuccess(() => machine.login({ email, password }))
          }
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Log In
        </button>
        <div className="text-center space-y-2">
          <button
            onClick={() => machine.goToPasswordReset()}
            className="text-blue-500 hover:underline text-sm"
          >
            Forgot Password?
          </button>
          <div>
            <span className="text-sm opacity-70">Don't have an account? </span>
            <button
              onClick={() => machine.goToRegister()}
              className="text-blue-500 hover:underline text-sm"
            >
              Register
            </button>
          </div>
          <button
            onClick={() => machine.cancel()}
            className="text-current/50 hover:underline text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterFormView({ machine, handleAutoSuccess }: any) {
  const storeData = machine.store.getState();
  const [name, setName] = useState(storeData.name || "");
  const [email, setEmail] = useState(storeData.email || "");
  React.useEffect(() => {
    setName(storeData.name || "");
    setEmail(storeData.email || "");
  }, [storeData.name, storeData.email]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {/* Show error if exists */}
        {storeData.error && (
          <div className="text-red-500 mb-4">
            <p className="text-sm">{storeData.error}</p>
          </div>
        )}
        <button
          onClick={() =>
            handleAutoSuccess(() => machine.register({ name, email }))
          }
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Register
        </button>
        <div className="text-center space-y-2">
          <div>
            <span className="text-sm opacity-70">
              Already have an account?{" "}
            </span>
            <button
              onClick={() => machine.goToLogin()}
              className="text-blue-500 hover:underline text-sm"
            >
              Log In
            </button>
          </div>
          <button
            onClick={() => machine.cancel()}
            className="text-current/50 hover:underline text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordResetFormView({ machine, handleAutoSuccess }: any) {
  const storeData = machine.store.getState();
  const [email, setEmail] = useState(storeData.email || "");
  React.useEffect(() => {
    setEmail(storeData.email || "");
  }, [storeData.email]);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-current/20 rounded bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Show error if exists */}
        {storeData.error && (
          <div className="text-red-500 mb-4">
            <p className="text-sm">{storeData.error}</p>
          </div>
        )}
        <button
          onClick={() =>
            handleAutoSuccess(() => machine.requestReset({ email }))
          }
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Reset Link
        </button>
        <div className="text-center space-y-2">
          <button
            onClick={() => machine.goToLogin()}
            className="text-blue-500 hover:underline text-sm"
          >
            Back to Log In
          </button>
          <br />
          <button
            onClick={() => machine.cancel()}
            className="text-current/50 hover:underline text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export const AuthFlowView = ({ machine }: { machine: AuthMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  const handleAutoSuccess = async (action: () => void) => {
    action();

    // Auto-success after short delay
    setTimeout(() => {
      const state = machine.getState();
      if (state.is("LoggingIn")) {
        const storeData = machine.store.getState();
        machine.success({
          user: {
            id: "user-123",
            name: "Demo User",
            email: storeData.email,
            avatar: "https://i.pravatar.cc/150?u=demo",
          },
        });
      } else if (state.is("Registering")) {
        const storeData = machine.store.getState();
        machine.success({
          user: {
            id: "user-123",
            name: storeData.name,
            email: storeData.email,
            avatar: "https://i.pravatar.cc/150?u=" + storeData.email,
          },
        });
      } else if (state.is("RequestingPasswordReset")) {
        const storeData = machine.store.getState();
        machine.success({ email: storeData.email });
      }
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-transparent rounded-lg border border-current/20 p-6">
      {currentState.match({
        LoggedOut: () => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Welcome</h2>
            <div className="space-y-3">
              <button
                onClick={() => machine.showLogin()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Log In
              </button>
              <button
                onClick={() => machine.showRegister()}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Register
              </button>
            </div>
          </div>
        ),

        LoginForm: (data) => (
          <LoginFormView
            data={data}
            machine={machine}
            handleAutoSuccess={handleAutoSuccess}
          />
        ),

        RegisterForm: (data) => (
          <RegisterFormView
            data={data}
            machine={machine}
            handleAutoSuccess={handleAutoSuccess}
          />
        ),

        PasswordResetForm: (data) => (
          <PasswordResetFormView
            data={data}
            machine={machine}
            handleAutoSuccess={handleAutoSuccess}
          />
        ),

        LoggingIn: () => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Logging In...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="mb-6 opacity-70">Authenticating {machine.store.getState().email}</p>

            {/* Manual Controls */}
            <div className="space-y-2">
              <p className="text-sm opacity-50 mb-3">Manual Controls:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    machine.success({
                      user: {
                        id: "user-123",
                        name: machine.store.getState().name,
                        email: machine.store.getState().email,
                        avatar: "https://i.pravatar.cc/150?u=demo",
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Login Success
                </button>
                <button
                  onClick={() => machine.failure("Invalid credentials")}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Login Failed
                </button>
              </div>
            </div>
          </div>
        ),

        Registering: () => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Creating Account...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="mb-6 opacity-70">Registering {machine.store.getState().email}</p>

            {/* Manual Controls */}
            <div className="space-y-2">
              <p className="text-sm opacity-50 mb-3">Manual Controls:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    machine.success({
                      user: {
                        id: "user-123",
                        name: machine.store.getState().name,
                        email: machine.store.getState().email,
                        avatar: "https://i.pravatar.cc/150?u=" + machine.store.getState().email,
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Register Success
                </button>
                <button
                  onClick={() => machine.failure("Email already taken")}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Register Failed
                </button>
              </div>
            </div>
          </div>
        ),

        RequestingPasswordReset: () => (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Sending Reset Link...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="mb-6 opacity-70">Sending to {machine.store.getState().email}</p>

            {/* Manual Controls */}
            <div className="space-y-2">
              <p className="text-sm opacity-50 mb-3">Manual Controls:</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => machine.success({ email: machine.store.getState().email })}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Reset Success
                </button>
                <button
                  onClick={() => machine.failure("Email not found")}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Reset Failed
                </button>
              </div>
            </div>
          </div>
        ),

        PasswordResetSent: () => {
          const storeData = machine.store.getState();
          return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              Reset Link Sent!
            </h2>
            <p className="mb-6 opacity-70">
              We've sent a password reset link to {storeData.email}.
            </p>
            <button
              onClick={() => machine.goToLogin()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Log In
            </button>
            </div>
          );
        },

        LoggedIn: () => {
          const storeData = machine.store.getState();
          return (
          <div className="text-center">
            <div className="mb-4">
              {storeData.user?.avatar && (
                <img
                  src={storeData.user.avatar}
                  alt={storeData.user.name || "User"}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
              )}
              <h2 className="text-2xl font-bold text-green-600">
                Welcome, {storeData.user?.name || "User"}!
              </h2>
              <p className="opacity-70">{storeData.user?.email}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-4 mb-4">
              <p className="text-green-600">You are successfully logged in!</p>
            </div>
            <button
              onClick={() => machine.logout()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Log Out
            </button>
            </div>
          );
        },
      })}
    </div>
  );
};
