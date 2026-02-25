import React, { useState, useEffect } from 'react';
import { Plus, Loader2, UserPlus, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAddFaculty } from '@/hooks/useQueries';

interface CreateFacultyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseBackendError(err: unknown): { message: string; isAdminError: boolean } {
  const raw = err instanceof Error ? err.message : String(err);

  // Handle the structured LIMIT_REACHED error thrown by useAddFaculty
  if (raw.startsWith('LIMIT_REACHED:')) {
    const limit = raw.split(':')[1];
    return {
      message: `Faculty limit of ${limit} reached for your current plan. Please upgrade to add more faculty members.`,
      isAdminError: false,
    };
  }

  // Handle backend error variant (prefixed with BACKEND_ERROR:)
  if (raw.startsWith('BACKEND_ERROR:')) {
    const backendMsg = raw.slice('BACKEND_ERROR:'.length);
    const lower = backendMsg.toLowerCase();

    if (lower.includes('admin') || lower.includes('unauthorized')) {
      return {
        message: 'Admin access is required to create faculty members. Please ensure you are logged in as an admin.',
        isAdminError: true,
      };
    }

    if (lower.includes('already exists')) {
      return {
        message: `A faculty member with this name already exists. Please use a different name.`,
        isAdminError: false,
      };
    }

    if (lower.includes('name cannot be empty') || lower.includes('empty or whitespace')) {
      return {
        message: 'Faculty name cannot be empty or contain only whitespace.',
        isAdminError: false,
      };
    }

    // Return the raw backend message for other backend errors
    return { message: backendMsg, isAdminError: false };
  }

  // Handle call errors (network / canister unreachable)
  if (raw.startsWith('CALL_ERROR:')) {
    return {
      message: 'Connection error. Please check your network and try again.',
      isAdminError: false,
    };
  }

  const lower = raw.toLowerCase();

  if (lower.includes('already exists')) {
    return {
      message: `A faculty member with this name already exists. Please use a different name.`,
      isAdminError: false,
    };
  }

  if (lower.includes('name cannot be empty') || lower.includes('empty or whitespace')) {
    return {
      message: 'Faculty name cannot be empty or contain only whitespace.',
      isAdminError: false,
    };
  }

  if (lower.includes('unauthorized') || lower.includes('only admins') || lower.includes('admin-only')) {
    return {
      message: 'Admin access is required to create faculty members. Please ensure you are logged in as an admin.',
      isAdminError: true,
    };
  }

  if (lower.includes('actor not initialized')) {
    return {
      message: 'Connection not ready. Please wait a moment and try again.',
      isAdminError: false,
    };
  }

  return { message: 'Failed to create faculty member. Please try again.', isAdminError: false };
}

export default function CreateFacultyModal({
  open,
  onOpenChange,
}: CreateFacultyModalProps) {
  const [name, setName] = useState('');
  const [errorInfo, setErrorInfo] = useState<{ message: string; isAdminError: boolean } | null>(null);
  const addFaculty = useAddFaculty();

  // Reset ALL state every time the modal opens (open transitions to true)
  useEffect(() => {
    if (open) {
      setName('');
      setErrorInfo(null);
      addFaculty.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    setName('');
    setErrorInfo(null);
    addFaculty.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorInfo({ message: 'Faculty name cannot be empty.', isAdminError: false });
      return;
    }

    try {
      await addFaculty.mutateAsync(trimmed);
      // Success — close the modal and clear state
      handleClose();
    } catch (err: unknown) {
      // Parse the backend error and display it; do NOT close the modal
      setErrorInfo(parseBackendError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5 text-accent" />
            Create Faculty Member
          </DialogTitle>
          <DialogDescription>
            Enter the name of the new faculty member to add them to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="create-faculty-name" className="font-semibold">
              Faculty Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-faculty-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorInfo) setErrorInfo(null);
              }}
              placeholder="e.g., Dr. Sarah Johnson"
              className="h-11"
              disabled={addFaculty.isPending}
              autoFocus
            />
          </div>

          {errorInfo && (
            <Alert variant="destructive">
              {errorInfo.isAdminError ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{errorInfo.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addFaculty.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addFaculty.isPending}
              className="gap-2"
            >
              {addFaculty.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Faculty
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
