import React, { useState } from 'react';
import { Pencil, Trash2, UserX, UserCheck, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useUpdateFacultyName,
  useDeactivateFaculty,
  useReactivateFaculty,
  useDeleteFaculty,
} from '@/hooks/useQueries';
import type { Faculty, PDF } from '@/backend';

interface FacultyManagementTableProps {
  facultyList: Faculty[];
  allPdfs: PDF[];
}

function FacultyRow({
  faculty,
  pdfCount,
}: {
  faculty: Faculty;
  pdfCount: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(faculty.name);

  const updateName = useUpdateFacultyName();
  const deactivate = useDeactivateFaculty();
  const reactivate = useReactivateFaculty();
  const deleteFaculty = useDeleteFaculty();

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === faculty.name) {
      setIsEditing(false);
      setEditName(faculty.name);
      return;
    }
    try {
      await updateName.mutateAsync({ facultyId: faculty.id, name: trimmed });
      setIsEditing(false);
    } catch {
      setEditName(faculty.name);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(faculty.name);
    setIsEditing(false);
  };

  const handleToggleActive = async () => {
    if (faculty.active) {
      await deactivate.mutateAsync(faculty.id);
    } else {
      await reactivate.mutateAsync(faculty.id);
    }
  };

  const handleDelete = async () => {
    await deleteFaculty.mutateAsync(faculty.id);
  };

  const isTogglePending = deactivate.isPending || reactivate.isPending;
  const isDeletePending = deleteFaculty.isPending;
  const isUpdatePending = updateName.isPending;

  return (
    <TableRow className={!faculty.active ? 'opacity-60' : ''}>
      {/* Name */}
      <TableCell className="font-medium">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="h-8 text-sm w-48"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-success hover:text-success"
              onClick={handleSaveName}
              disabled={isUpdatePending}
            >
              {isUpdatePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleCancelEdit}
              disabled={isUpdatePending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {faculty.name.charAt(0).toUpperCase()}
            </div>
            <span>{faculty.name}</span>
          </div>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          variant={faculty.active ? 'default' : 'secondary'}
          className={
            faculty.active
              ? 'bg-success/15 text-success border-success/20 hover:bg-success/20'
              : 'bg-muted text-muted-foreground'
          }
        >
          {faculty.active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>

      {/* PDF Count */}
      <TableCell className="text-muted-foreground tabular-nums">
        {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Edit */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditName(faculty.name);
                    setIsEditing(true);
                  }}
                  disabled={isEditing || isTogglePending || isDeletePending}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit name</TooltipContent>
            </Tooltip>

            {/* Deactivate / Reactivate */}
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 ${
                        faculty.active
                          ? 'hover:text-warning hover:bg-warning/10'
                          : 'hover:text-success hover:bg-success/10'
                      }`}
                      disabled={isTogglePending || isDeletePending || isEditing}
                    >
                      {isTogglePending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : faculty.active ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {faculty.active ? 'Deactivate faculty' : 'Reactivate faculty'}
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {faculty.active ? 'Deactivate' : 'Reactivate'} Faculty Member
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {faculty.active
                      ? `Are you sure you want to deactivate "${faculty.name}"? They will no longer appear in the faculty portal and won't be able to access their PDFs.`
                      : `Are you sure you want to reactivate "${faculty.name}"? They will appear in the faculty portal again and can access their assigned PDFs.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleToggleActive}
                    className={
                      faculty.active
                        ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                        : 'bg-success text-success-foreground hover:bg-success/90'
                    }
                  >
                    {faculty.active ? 'Deactivate' : 'Reactivate'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete */}
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                      disabled={isTogglePending || isDeletePending || isEditing}
                    >
                      {isDeletePending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Delete faculty</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Faculty Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete <strong>"{faculty.name}"</strong>?
                    This action cannot be undone. Their assigned PDFs will remain but will no longer
                    be linked to this faculty member.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}

export default function FacultyManagementTable({
  facultyList,
  allPdfs,
}: FacultyManagementTableProps) {
  if (facultyList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-6">
        No faculty members yet. Add one using the form above.
      </p>
    );
  }

  const getPdfCount = (facultyId: bigint) =>
    allPdfs.filter((pdf) => pdf.facultyIds.some((id) => id === facultyId)).length;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">PDFs Assigned</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facultyList.map((faculty) => (
            <FacultyRow
              key={faculty.id.toString()}
              faculty={faculty}
              pdfCount={getPdfCount(faculty.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
