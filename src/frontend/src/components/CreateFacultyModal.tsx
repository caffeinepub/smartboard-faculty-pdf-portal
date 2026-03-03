import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useAddFaculty, useAllDepartments } from "../hooks/useQueries";

interface CreateFacultyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toUsernameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
}

export default function CreateFacultyModal({
  open,
  onOpenChange,
}: CreateFacultyModalProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFaculty = useAddFaculty();
  const { data: departments = [] } = useAllDepartments();

  // Reset state when modal opens
  const resetFaculty = addFaculty.reset;
  useEffect(() => {
    if (open) {
      setName("");
      setSubject("");
      setDepartmentId("");
      setUsername("");
      setUsernameManuallyEdited(false);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setError(null);
      resetFaculty();
    }
  }, [open, resetFaculty]);

  // Auto-suggest username from name unless user has manually edited it
  useEffect(() => {
    if (!usernameManuallyEdited && name) {
      setUsername(toUsernameSlug(name));
    }
  }, [name, usernameManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Faculty name cannot be empty.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required for faculty login.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);

    try {
      const result = await addFaculty.mutateAsync({
        name: trimmedName,
        subject: subject.trim() || undefined,
        departmentId: departmentId
          ? Number.parseInt(departmentId, 10)
          : undefined,
        username: username.trim(),
        password,
      });

      if (result.__kind__ === "success") {
        onOpenChange(false);
      } else if (result.__kind__ === "limitReached") {
        setError(
          `Faculty limit of ${result.limit} reached. Please upgrade your plan.`,
        );
      } else if (result.__kind__ === "error") {
        setError(result.message || "Failed to create faculty member.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create faculty member.";
      setError(message);
    }
  };

  const displayError =
    error ||
    (addFaculty.isError && addFaculty.error instanceof Error
      ? addFaculty.error.message
      : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" />
            Create Faculty Member
          </DialogTitle>
          <DialogDescription>
            Fill in the details to add a new faculty member. Login credentials
            are required so faculty can access their portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cf-name"
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

          {/* Department */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-department">Department</Label>
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={addFaculty.isPending}
            >
              <SelectTrigger id="cf-department">
                <SelectValue placeholder="Select department (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-subject">Subject / Specialization</Label>
            <Input
              id="cf-subject"
              type="text"
              placeholder="e.g. Quantum Mechanics, Organic Chemistry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={addFaculty.isPending}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              Login Credentials
            </p>

            {/* Username */}
            <div className="space-y-1.5 mb-3">
              <Label htmlFor="cf-username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cf-username"
                type="text"
                placeholder="e.g. dr.jane.smith"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameManuallyEdited(true);
                  if (error) setError(null);
                }}
                disabled={addFaculty.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Faculty will use this to log in to their portal.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5 mb-3">
              <Label htmlFor="cf-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cf-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Set a secure password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={addFaculty.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-confirm-password">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cf-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={addFaculty.isPending}
              />
            </div>
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
              onClick={() => onOpenChange(false)}
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
