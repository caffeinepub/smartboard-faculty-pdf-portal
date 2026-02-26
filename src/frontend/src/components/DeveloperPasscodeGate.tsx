import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, Terminal, Loader2, KeyRound, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  verifyDeveloperCredentials,
  hasDeveloperCredentialsSet,
  setDeveloperCredentialsLocal,
  initDefaultDeveloperCredentials,
} from '../hooks/useQueries';

export const DEVELOPER_LOCK_EVENT = 'developer-lock';

const SESSION_KEY = 'dev_authenticated';

type GateView = 'landing' | 'login' | 'create';

interface DeveloperPasscodeGateProps {
  children: React.ReactNode;
}

// ─── First-time Setup Form ────────────────────────────────────────────────────

function FirstTimeSetup({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      setDeveloperCredentialsLocal(username.trim(), password);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <KeyRound className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Set Up Developer Access</h1>
          <p className="text-sm text-slate-400">
            Create your developer credentials. You'll use these to access the Developer Portal.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-setup-username" className="text-slate-300">Username</Label>
            <Input
              id="dev-setup-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
              placeholder="Choose a username"
              disabled={isSaving}
              autoComplete="username"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dev-setup-password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="dev-setup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                placeholder="Minimum 6 characters"
                disabled={isSaving}
                autoComplete="new-password"
                className="pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dev-setup-confirm" className="text-slate-300">Confirm Password</Label>
            <Input
              id="dev-setup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(null); }}
              placeholder="Re-enter your password"
              disabled={isSaving}
              autoComplete="new-password"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
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
                Create Developer Account
              </>
            )}
          </Button>
        </form>

        {onBack && (
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={onBack}
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

function DeveloperLandingScreen({ onLogin, onCreate }: { onLogin: () => void; onCreate: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
            <Terminal className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Developer Portal</h1>
          <p className="text-sm text-slate-400">
            Full system access — licenses, admin management, and platform controls.
          </p>
        </div>

        {/* Two Options */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 text-base gap-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            onClick={onLogin}
          >
            <LogIn className="h-5 w-5" />
            Login as Developer
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
            onClick={onCreate}
          >
            <UserPlus className="h-5 w-5" />
            Create New Developer Account
          </Button>
        </div>

        <p className="text-center text-xs text-slate-600">
          Default credentials: developer / dev1234
        </p>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        sessionStorage.setItem(SESSION_KEY, 'true');
        onSuccess();
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
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
          <h1 className="text-2xl font-bold font-display text-white">Developer Login</h1>
          <p className="text-sm text-slate-400">Enter your developer credentials to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-username" className="text-slate-300">Username</Label>
            <Input
              id="dev-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
              placeholder="Enter username"
              disabled={isVerifying}
              autoComplete="username"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="dev-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
            ) : (
              <><Lock className="mr-2 h-4 w-4" />Sign In</>
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

export default function DeveloperPasscodeGate({ children }: DeveloperPasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialsExist, setCredentialsExist] = useState<boolean | null>(null);
  const [view, setView] = useState<GateView>('landing');

  // Seed default developer credentials on first load
  useEffect(() => {
    initDefaultDeveloperCredentials();
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setCredentialsExist(hasDeveloperCredentialsSet());
  }, []);

  // Listen for lock event
  const handleLock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setView('landing');
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

  // Always show landing screen with two options
  if (view === 'landing') {
    return (
      <DeveloperLandingScreen
        onLogin={() => setView('login')}
        onCreate={() => setView('create')}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginForm
        onSuccess={() => setIsAuthenticated(true)}
        onBack={() => setView('landing')}
      />
    );
  }

  // view === 'create'
  return (
    <FirstTimeSetup
      onComplete={() => {
        setCredentialsExist(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
        setIsAuthenticated(true);
      }}
      onBack={() => setView('landing')}
    />
  );
}
