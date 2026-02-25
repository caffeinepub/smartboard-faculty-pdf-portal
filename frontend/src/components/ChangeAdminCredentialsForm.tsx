import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { useSetAdminCredentials } from '../hooks/useQueries';

export default function ChangeAdminCredentialsForm() {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setCredentialsMutation = useSetAdminCredentials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await setCredentialsMutation.mutateAsync({
        username: newUsername.trim(),
        password: newPassword,
      });

      setSuccess('Credentials updated successfully!');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          Update the admin login credentials used to access this portal.
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-username">New Username</Label>
        <Input
          id="new-username"
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Enter new username"
          autoComplete="username"
          disabled={setCredentialsMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          autoComplete="new-password"
          disabled={setCredentialsMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          autoComplete="new-password"
          disabled={setCredentialsMutation.isPending}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={
          setCredentialsMutation.isPending ||
          !newUsername.trim() ||
          !newPassword ||
          !confirmPassword
        }
        className="w-full"
      >
        {setCredentialsMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Credentials'
        )}
      </Button>
    </form>
  );
}
