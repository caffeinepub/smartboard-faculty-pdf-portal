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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Loader2,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { Department, Faculty, PDF } from "../hooks/useQueries";
import {
  useAllDepartments,
  useDeactivateFaculty,
  useDeleteFaculty,
  useReactivateFaculty,
  useUpdateFacultyDepartment,
  useUpdateFacultyName,
} from "../hooks/useQueries";

interface FacultyManagementTableProps {
  facultyList: Faculty[];
  allPdfs: PDF[];
}

function FacultyRow({
  faculty,
  pdfCount,
  departments,
}: {
  faculty: Faculty;
  pdfCount: number;
  departments: Department[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(faculty.name);
  const [editDeptId, setEditDeptId] = useState<string>(
    faculty.departmentId ? String(faculty.departmentId) : "none",
  );

  const updateName = useUpdateFacultyName();
  const deactivate = useDeactivateFaculty();
  const reactivate = useReactivateFaculty();
  const deleteFaculty = useDeleteFaculty();
  const updateDept = useUpdateFacultyDepartment();

  const departmentName = faculty.departmentId
    ? (departments.find((d) => d.id === faculty.departmentId)?.name ?? "—")
    : "—";

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setIsEditing(false);
      setEditName(faculty.name);
      return;
    }

    await Promise.all([
      trimmed !== faculty.name
        ? updateName.mutateAsync({ facultyId: faculty.id, name: trimmed })
        : Promise.resolve(),
      updateDept.mutateAsync({
        facultyId: faculty.id,
        departmentId:
          editDeptId !== "none" ? Number.parseInt(editDeptId, 10) : undefined,
      }),
    ]).catch(() => {
      setEditName(faculty.name);
    });

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(faculty.name);
    setEditDeptId(faculty.departmentId ? String(faculty.departmentId) : "none");
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
    deleteFaculty.isPending ||
    updateDept.isPending;

  return (
    <TableRow className={!faculty.active ? "opacity-60" : ""}>
      <TableCell className="font-medium">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 w-40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancelEdit();
            }}
          />
        ) : (
          <div>
            <span>{faculty.name}</span>
            {faculty.subject && (
              <p className="text-xs text-muted-foreground">{faculty.subject}</p>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Select value={editDeptId} onValueChange={setEditDeptId}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="No dept" />
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
        ) : (
          <span className="text-sm text-muted-foreground">
            {departmentName}
          </span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground font-mono">
          {faculty.username ?? "—"}
        </span>
      </TableCell>
      <TableCell>
        {faculty.active ? (
          <Badge className="bg-success/15 text-success border-success/30 text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Inactive
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {pdfCount}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-success hover:text-success"
                onClick={handleSave}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCancelEdit}
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
                  <TooltipContent>Edit faculty</TooltipContent>
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
                  <TooltipContent>
                    {faculty.active ? "Deactivate" : "Reactivate"}
                  </TooltipContent>
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
                        Are you sure you want to delete{" "}
                        <strong>{faculty.name}</strong>? This action cannot be
                        undone and will remove them from all assigned PDFs.
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

export default function FacultyManagementTable({
  facultyList,
  allPdfs,
}: FacultyManagementTableProps) {
  const { data: departments = [] } = useAllDepartments();

  if (facultyList.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        <p className="font-medium">No faculty members yet.</p>
        <p className="text-sm mt-1">
          Add faculty members using the form on the left.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-bold text-foreground">Name</TableHead>
            <TableHead className="font-bold text-foreground">
              Department
            </TableHead>
            <TableHead className="font-bold text-foreground">
              Username
            </TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground text-center">
              PDFs
            </TableHead>
            <TableHead className="font-bold text-foreground text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facultyList.map((faculty) => (
            <FacultyRow
              key={faculty.id}
              faculty={faculty}
              departments={departments as Department[]}
              pdfCount={
                allPdfs.filter((p) => p.facultyIds.includes(faculty.id)).length
              }
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
