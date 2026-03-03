import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, LogIn } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  hasDeveloperCredentialsSet,
  initDefaultDeveloperCredentials,
  verifyDeveloperCredentials,
} from "../hooks/useQueries";

export const DEVELOPER_LOCK_EVENT = "developer-lock";

const SESSION_KEY = "dev_authenticated";
const PERSIST_KEY = "dev_session_persist";

interface DeveloperPasscodeGateProps {
  children: React.ReactNode;
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    try {
      const isValid = verifyDeveloperCredentials(username, password);
      if (isValid) {
        sessionStorage.setItem(SESSION_KEY, "true");
        localStorage.setItem(PERSIST_KEY, "true");
        onSuccess();
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(`Login error: ${message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <LogIn className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">
            Developer Login
          </h1>
          <p className="text-sm text-slate-400">
            Enter your developer credentials to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-username" className="text-slate-300">
              Username
            </Label>
            <Input
              id="dev-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter username"
              disabled={isVerifying}
              autoComplete="username"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-password" className="text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="dev-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                disabled={isVerifying}
                autoComplete="current-password"
                className="pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <Lock className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            disabled={isVerifying || !username || !password}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
}

// ─── Main Gate ────────────────────────────────────────────────────────────────

export default function DeveloperPasscodeGate({
  children,
}: DeveloperPasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialsExist, setCredentialsExist] = useState<boolean | null>(
    null,
  );

  // Seed default developer credentials on first load
  useEffect(() => {
    initDefaultDeveloperCredentials();
    const sessionStored = sessionStorage.getItem(SESSION_KEY);
    const persistStored = localStorage.getItem(PERSIST_KEY);
    if (sessionStored === "true" || persistStored === "true") {
      setIsAuthenticated(true);
    }
    setCredentialsExist(hasDeveloperCredentialsSet());
  }, []);

  // Listen for lock event
  const handleLock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    window.addEventListener(DEVELOPER_LOCK_EVENT, handleLock);
    return () => window.removeEventListener(DEVELOPER_LOCK_EVENT, handleLock);
  }, [handleLock]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Still loading credential state
  if (credentialsExist === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Always show login form directly — no account creation option
  return (
    <LoginForm
      onSuccess={() => setIsAuthenticated(true)}
      onBack={() => window.history.back()}
    />
  );
}
