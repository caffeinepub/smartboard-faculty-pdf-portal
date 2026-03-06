import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  hasAdminCredentialsSet,
  setAdminCredentialsLocal,
  useLogAuditEvent,
  verifyAdminCredentials,
} from "../hooks/useQueries";

export const LOCK_EVENT = "admin-lock";

const SESSION_KEY = "admin_authenticated";
const PERSIST_KEY = "admin_session_persist";

type GateView = "landing" | "login" | "create";

interface AdminPasscodeGateProps {
  children: React.ReactNode;
}

// ─── First-time Setup Form ────────────────────────────────────────────────────

function FirstTimeSetup({
  onComplete,
  onBack,
}: { onComplete: () => void; onBack?: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      setAdminCredentialsLocal(username.trim(), password);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Set Up Admin Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your admin credentials to secure the portal. You will use
            these to log in going forward.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-username">Username</Label>
            <Input
              id="setup-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Choose a username"
              disabled={isSaving}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-password">Password</Label>
            <div className="relative">
              <Input
                id="setup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Minimum 6 characters"
                disabled={isSaving}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          <div className="space-y-2">
            <Label htmlFor="setup-confirm">Confirm Password</Label>
            <Input
              id="setup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Re-enter your password"
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <Lock className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSaving || !username || !password || !confirmPassword}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Create Admin Account
              </>
            )}
          </Button>
        </form>

        {onBack && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onBack}
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Landing Screen (always shown first) ─────────────────────────────────────

function AdminLandingScreen({
  onLogin,
  onCreate,
}: { onLogin: () => void; onCreate: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose an option to continue.
          </p>
        </div>

        {/* Two Options */}
        <div className="space-y-3">
          <Button className="w-full h-14 text-base gap-3" onClick={onLogin}>
            <LogIn className="h-5 w-5" />
            Login as Admin
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base gap-3"
            onClick={onCreate}
          >
            <UserPlus className="h-5 w-5" />
            Create New Admin
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({
  onSuccess,
  onBack,
}: {
  onSuccess: (username: string) => void;
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
      const isValid = verifyAdminCredentials(username, password);
      if (isValid) {
        onSuccess(username);
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Admin Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your admin credentials to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter username"
              disabled={isVerifying}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                disabled={isVerifying}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <Lock className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
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
          className="w-full text-muted-foreground"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  );
}

// ─── Main Gate ────────────────────────────────────────────────────────────────

export default function AdminPasscodeGate({
  children,
}: AdminPasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialsExist, setCredentialsExist] = useState<boolean | null>(
    null,
  );
  const [view, setView] = useState<GateView>("landing");
  const logAuditEvent = useLogAuditEvent();

  // Check session and credential existence on mount
  // Check both sessionStorage (tab-level) and localStorage (persistent across tabs/restarts)
  useEffect(() => {
    const sessionStored = sessionStorage.getItem(SESSION_KEY);
    const persistStored = localStorage.getItem(PERSIST_KEY);
    if (sessionStored === "true" || persistStored === "true") {
      setIsAuthenticated(true);
    }
    setCredentialsExist(hasAdminCredentialsSet());
  }, []);

  // Listen for lock event
  const handleLock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    setIsAuthenticated(false);
    setView("landing");
  }, []);

  useEffect(() => {
    window.addEventListener(LOCK_EVENT, handleLock);
    return () => window.removeEventListener(LOCK_EVENT, handleLock);
  }, [handleLock]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Still loading credential state
  if (credentialsExist === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Always show landing screen with two options
  if (view === "landing") {
    return (
      <AdminLandingScreen
        onLogin={() => setView("login")}
        onCreate={() => setView("create")}
      />
    );
  }

  if (view === "login") {
    return (
      <LoginForm
        onSuccess={(username) => {
          sessionStorage.setItem(SESSION_KEY, "true");
          localStorage.setItem(PERSIST_KEY, "true");
          setIsAuthenticated(true);
          logAuditEvent.mutate({
            actorType: "admin",
            actorName: username || "Admin",
            action: "LOGIN",
            description: "Admin logged in to the portal",
          });
        }}
        onBack={() => setView("landing")}
      />
    );
  }

  // view === 'create'
  return (
    <FirstTimeSetup
      onComplete={() => {
        setCredentialsExist(true);
        sessionStorage.setItem(SESSION_KEY, "true");
        localStorage.setItem(PERSIST_KEY, "true");
        setIsAuthenticated(true);
      }}
      onBack={() => setView("landing")}
    />
  );
}
