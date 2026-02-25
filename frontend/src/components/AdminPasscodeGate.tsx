import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVerifyAdminCredentials } from '@/hooks/useQueries';

export const SESSION_KEY = 'admin_authenticated';
export const LOCK_EVENT = 'admin_lock';

interface AdminPasscodeGateProps {
  children: React.ReactNode;
}

export default function AdminPasscodeGate({ children }: AdminPasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const verifyCredentials = useVerifyAdminCredentials();

  const handleLock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError(null);
  }, []);

  useEffect(() => {
    const onLockEvent = () => handleLock();
    window.addEventListener(LOCK_EVENT, onLockEvent);
    return () => window.removeEventListener(LOCK_EVENT, onLockEvent);
  }, [handleLock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const isValid = await verifyCredentials.mutateAsync({ username: username.trim(), password });
      if (isValid) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError('Invalid username or password.');
        setPassword('');
      }
    } catch {
      setError('Unable to verify credentials. Please try again.');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription className="text-base">
            Enter your admin credentials to access the Admin Panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="font-semibold">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter username"
                  className="h-12 pl-10 text-base"
                  autoFocus
                  autoComplete="username"
                  disabled={verifyCredentials.isPending}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password"
                  className="h-12 pl-10 pr-12 text-base"
                  autoComplete="current-password"
                  disabled={verifyCredentials.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={verifyCredentials.isPending}
            >
              {verifyCredentials.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Login to Admin Panel
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-muted/60 border border-border text-center">
            <p className="text-xs text-muted-foreground">
              Default credentials are shown on the{' '}
              <a href="/" className="text-primary font-semibold hover:underline">
                Home Page
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
