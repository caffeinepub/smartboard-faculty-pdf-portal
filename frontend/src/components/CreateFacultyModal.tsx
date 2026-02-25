import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useAddFaculty } from '../hooks/useQueries';

interface CreateFacultyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateFacultyModal({ open, onOpenChange }: CreateFacultyModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addFaculty = useAddFaculty();

  // Reset all state every time the modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
      addFaculty.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Faculty name cannot be empty.');
      return;
    }

    setError(null);

    try {
      // Call mutation with ONLY the faculty name — no admin token or credential
      await addFaculty.mutateAsync(trimmed);
      // On success: close modal immediately
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create faculty member.';
      setError(message);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const displayError = error || (addFaculty.isError && addFaculty.error instanceof Error
    ? addFaculty.error.message
    : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" />
            Create Faculty Member
          </DialogTitle>
          <DialogDescription>
            Enter the name of the new faculty member to add them to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faculty-name">
              Faculty Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="faculty-name"
              type="text"
              placeholder="e.g. Dr. Jane Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={addFaculty.isPending}
              autoFocus
            />
          </div>

          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              type="submit"
              className="w-full"
              disabled={addFaculty.isPending || !name.trim()}
            >
              {addFaculty.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Faculty
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={addFaculty.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
