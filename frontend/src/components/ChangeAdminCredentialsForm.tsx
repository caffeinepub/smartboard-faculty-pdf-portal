import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSetAdminCredentials } from '@/hooks/useQueries';

export default function ChangeAdminCredentialsForm() {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setAdminCredentials = useSetAdminCredentials();

  const clearMessages = () => {
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Client-side validation
    if (!newUsername.trim()) {
      setValidationError('Username cannot be empty.');
      return;
    }
    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      await setAdminCredentials.mutateAsync({
        username: newUsername.trim(),
        password: newPassword,
      });
      setSuccessMessage('Admin credentials updated successfully!');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update credentials.';
      setValidationError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New Username */}
      <div className="space-y-2">
        <Label htmlFor="new-username" className="font-semibold">
          New Username
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-username"
            type="text"
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              clearMessages();
            }}
            placeholder="Enter new username"
            className="h-11 pl-10"
            autoComplete="username"
            disabled={setAdminCredentials.isPending}
          />
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password" className="font-semibold">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              clearMessages();
            }}
            placeholder="Min. 6 characters"
            className="h-11 pl-10 pr-12"
            autoComplete="new-password"
            disabled={setAdminCredentials.isPending}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="font-semibold">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearMessages();
            }}
            placeholder="Re-enter new password"
            className="h-11 pl-10 pr-12"
            autoComplete="new-password"
            disabled={setAdminCredentials.isPending}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert className="py-2 border-green-500/40 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={setAdminCredentials.isPending}
      >
        {setAdminCredentials.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating Credentials...
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4 mr-2" />
            Update Credentials
          </>
        )}
      </Button>
    </form>
  );
}
