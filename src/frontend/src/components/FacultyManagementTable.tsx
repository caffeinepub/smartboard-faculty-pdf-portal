import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2, Check, X, UserCheck, UserX, Loader2 } from 'lucide-react';
import type { Faculty, PDF } from '../hooks/useQueries';
import {
  useDeleteFaculty,
  useUpdateFacultyName,
  useDeactivateFaculty,
  useReactivateFaculty,
} from '../hooks/useQueries';

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

  const handleToggleActive = async () => {
    try {
      if (faculty.active) {
        await deactivate.mutateAsync(faculty.id);
      } else {
        await reactivate.mutateAsync(faculty.id);
      }
    } catch {
      // silently ignore
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFaculty.mutateAsync(faculty.id);
    } catch {
      // silently ignore
    }
  };

  const isBusy =
    updateName.isPending ||
    deactivate.isPending ||
    reactivate.isPending ||
    deleteFaculty.isPending;

  return (
    <TableRow className={!faculty.active ? 'opacity-60' : ''}>
      <TableCell className="font-medium">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 w-48"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditName(faculty.name);
              }
            }}
          />
        ) : (
          <span>{faculty.name}</span>
        )}
      </TableCell>
      <TableCell>
        {faculty.active ? (
          <Badge className="bg-success/15 text-success border-success/30 text-xs">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">{pdfCount}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-success hover:text-success"
                onClick={handleSaveName}
                disabled={isBusy}
              >
                {updateName.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(faculty.name);
                }}
                disabled={isBusy}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                      disabled={isBusy}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit name</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleToggleActive}
                      disabled={isBusy}
                    >
                      {deactivate.isPending || reactivate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : faculty.active ? (
                        <UserX className="h-4 w-4 text-warning" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-success" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{faculty.active ? 'Deactivate' : 'Reactivate'}</TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={isBusy}
                        >
                          {deleteFaculty.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
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
                        Are you sure you want to delete <strong>{faculty.name}</strong>? This action
                        cannot be undone and will remove them from all assigned PDFs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipProvider>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function FacultyManagementTable({ facultyList, allPdfs }: FacultyManagementTableProps) {
  if (facultyList.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        <p className="font-medium">No faculty members yet.</p>
        <p className="text-sm mt-1">Add faculty members using the form on the left.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-bold text-foreground">Name</TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground text-center">PDFs</TableHead>
            <TableHead className="font-bold text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facultyList.map((faculty) => (
            <FacultyRow
              key={faculty.id}
              faculty={faculty}
              pdfCount={allPdfs.filter((p) => p.facultyIds.includes(faculty.id)).length}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
