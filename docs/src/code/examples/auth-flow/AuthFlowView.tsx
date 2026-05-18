import { useMachine } from "matchina/react";
import { type AuthMachine } from "./machine";
import React, { useState } from "react";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

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
      <h2 className="text-xl font-semibold mb-5">Log In</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        {storeData.error && (
          <p className="text-xs text-destructive">{storeData.error}</p>
        )}
        <button
          onClick={() => handleAutoSuccess(() => machine.login({ email, password }))}
          className="btn btn-primary w-full"
        >
          Log In
        </button>
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <button onClick={() => machine.goToPasswordReset()} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            Forgot Password?
          </button>
          <p className="text-xs text-muted-foreground">
            No account?{" "}
            <button onClick={() => machine.goToRegister()} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Register
            </button>
          </p>
          <button onClick={() => machine.cancel()} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
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
      <h2 className="text-xl font-semibold mb-5">Register</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        {storeData.error && (
          <p className="text-xs text-destructive">{storeData.error}</p>
        )}
        <button
          onClick={() => handleAutoSuccess(() => machine.register({ name, email }))}
          className="btn btn-primary w-full"
        >
          Create Account
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Already have an account?{" "}
          <button onClick={() => machine.goToLogin()} className="underline underline-offset-2 hover:text-foreground transition-colors">
            Log In
          </button>
        </p>
        <div className="text-center">
          <button onClick={() => machine.cancel()} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
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
      <h2 className="text-xl font-semibold mb-5">Reset Password</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        {storeData.error && (
          <p className="text-xs text-destructive">{storeData.error}</p>
        )}
        <button
          onClick={() => handleAutoSuccess(() => machine.requestReset({ email }))}
          className="btn btn-primary w-full"
        >
          Send Reset Link
        </button>
        <div className="text-center space-y-1.5">
          <div>
            <button onClick={() => machine.goToLogin()} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
              Back to Log In
            </button>
          </div>
          <div>
            <button onClick={() => machine.cancel()} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-7 w-7 border-2 border-border border-t-primary mx-auto mb-4" />
  );
}

function ManualControls({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 pt-4 border-t border-border">
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-3 text-center">Manual Controls</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export const AuthFlowView = ({ machine }: { machine: AuthMachine }) => {
  useMachine(machine);
  const currentState = machine.getState();

  const handleAutoSuccess = async (action: () => void) => {
    action();
    setTimeout(() => {
      const state = machine.getState();
      if (state.is("LoggingIn")) {
        const storeData = machine.store.getState();
        machine.success({ user: { id: "user-123", name: "Demo User", email: storeData.email, avatar: "https://i.pravatar.cc/150?u=demo" } });
      } else if (state.is("Registering")) {
        const storeData = machine.store.getState();
        machine.success({ user: { id: "user-123", name: storeData.name, email: storeData.email, avatar: "https://i.pravatar.cc/150?u=" + storeData.email } });
      } else if (state.is("RequestingPasswordReset")) {
        const storeData = machine.store.getState();
        machine.success({ email: storeData.email });
      }
    }, 1500);
  };

  return (
    <div className="max-w-sm mx-auto rounded-2xl border border-border bg-card p-6">
      {currentState.match({
        LoggedOut: () => (
          <div className="text-center">
            <p className="text-2xl mb-1">👋</p>
            <h2 className="text-xl font-semibold mb-6">Welcome</h2>
            <div className="space-y-2">
              <button onClick={() => machine.showLogin()} className="btn btn-primary w-full">Log In</button>
              <button onClick={() => machine.showRegister()} className="btn btn-outline w-full">Register</button>
            </div>
          </div>
        ),

        LoginForm: (data) => (
          <LoginFormView data={data} machine={machine} handleAutoSuccess={handleAutoSuccess} />
        ),

        RegisterForm: (data) => (
          <RegisterFormView data={data} machine={machine} handleAutoSuccess={handleAutoSuccess} />
        ),

        PasswordResetForm: (data) => (
          <PasswordResetFormView data={data} machine={machine} handleAutoSuccess={handleAutoSuccess} />
        ),

        LoggingIn: () => (
          <div className="text-center">
            <Spinner />
            <h2 className="text-base font-semibold mb-1">Logging in…</h2>
            <p className="text-xs text-muted-foreground mb-1">{machine.store.getState().email}</p>
            <ManualControls>
              <button
                onClick={() => machine.success({ user: { id: "user-123", name: machine.store.getState().name, email: machine.store.getState().email, avatar: "https://i.pravatar.cc/150?u=demo" } })}
                className="btn btn-secondary btn-sm flex-1"
              >
                Success
              </button>
              <button onClick={() => machine.failure("Invalid credentials")} className="btn btn-destructive btn-sm flex-1">
                Fail
              </button>
            </ManualControls>
          </div>
        ),

        Registering: () => (
          <div className="text-center">
            <Spinner />
            <h2 className="text-base font-semibold mb-1">Creating account…</h2>
            <p className="text-xs text-muted-foreground mb-1">{machine.store.getState().email}</p>
            <ManualControls>
              <button
                onClick={() => machine.success({ user: { id: "user-123", name: machine.store.getState().name, email: machine.store.getState().email, avatar: "https://i.pravatar.cc/150?u=" + machine.store.getState().email } })}
                className="btn btn-secondary btn-sm flex-1"
              >
                Success
              </button>
              <button onClick={() => machine.failure("Email already taken")} className="btn btn-destructive btn-sm flex-1">
                Fail
              </button>
            </ManualControls>
          </div>
        ),

        RequestingPasswordReset: () => (
          <div className="text-center">
            <Spinner />
            <h2 className="text-base font-semibold mb-1">Sending reset link…</h2>
            <p className="text-xs text-muted-foreground mb-1">{machine.store.getState().email}</p>
            <ManualControls>
              <button onClick={() => machine.success({ email: machine.store.getState().email })} className="btn btn-secondary btn-sm flex-1">
                Success
              </button>
              <button onClick={() => machine.failure("Email not found")} className="btn btn-destructive btn-sm flex-1">
                Fail
              </button>
            </ManualControls>
          </div>
        ),

        PasswordResetSent: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              <p className="text-2xl mb-2">📬</p>
              <h2 className="text-base font-semibold mb-1">Link sent!</h2>
              <p className="text-xs text-muted-foreground mb-5">Reset link sent to {storeData.email}.</p>
              <button onClick={() => machine.goToLogin()} className="btn btn-primary btn-sm">Back to Log In</button>
            </div>
          );
        },

        LoggedIn: () => {
          const storeData = machine.store.getState();
          return (
            <div className="text-center">
              {storeData.user?.avatar && (
                <img
                  src={storeData.user.avatar}
                  alt={storeData.user.name || "User"}
                  className="w-14 h-14 rounded-full mx-auto mb-3 ring-2 ring-border"
                />
              )}
              <h2 className="text-base font-semibold">Welcome, {storeData.user?.name || "User"}!</h2>
              <p className="text-xs text-muted-foreground mb-1">{storeData.user?.email}</p>
              <p className="text-xs text-[oklch(0.55_0.16_142)] mb-5">Logged in successfully</p>
              <button onClick={() => machine.logout()} className="btn btn-destructive btn-sm">Log Out</button>
            </div>
          );
        },
      })}
    </div>
  );
};
