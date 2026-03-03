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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  type Department,
  type Faculty,
  useAddDepartment,
  useAllDepartments,
  useAllFacultyAdmin,
  useDeleteDepartment,
  useUpdateDepartment,
} from "../hooks/useQueries";

interface DepartmentRowProps {
  department: Department;
  facultyInDept: Faculty[];
}

function DepartmentRow({ department, facultyInDept }: DepartmentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(department.name);
  const [editDesc, setEditDesc] = useState(department.description ?? "");
  const [expanded, setExpanded] = useState(false);

  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    await updateDept.mutateAsync({
      id: department.id,
      name: trimmed,
      description: editDesc.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(department.name);
    setEditDesc(department.description ?? "");
    setIsEditing(false);
  };

  const isBusy = updateDept.isPending || deleteDept.isPending;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-card">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>

        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Department name"
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {department.name}
            </p>
            {department.description && (
              <p className="text-xs text-muted-foreground truncate">
                {department.description}
              </p>
            )}
          </div>
        )}

        <Badge variant="secondary" className="text-xs shrink-0">
          <Users className="h-3 w-3 mr-1" />
          {facultyInDept.length}
        </Badge>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-success"
              onClick={handleSave}
              disabled={isBusy}
            >
              {updateDept.isPending ? (
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
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={isBusy}
                >
                  {deleteDept.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <strong>{department.name}</strong>? Faculty members in this
                    department will become unassigned. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteDept.mutateAsync(department.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Expandable faculty list */}
      {facultyInDept.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t border-border transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {expanded ? "Hide" : "Show"} faculty in this department
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y divide-border border-t border-border">
              {facultyInDept.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 px-4 py-2 bg-muted/30"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {f.name}
                    </p>
                    {f.subject && (
                      <p className="text-xs text-muted-foreground">
                        {f.subject}
                      </p>
                    )}
                  </div>
                  {f.active ? (
                    <Badge className="ml-auto text-xs bg-success/15 text-success border-success/30">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="ml-auto text-xs text-muted-foreground"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default function DepartmentManagementSection() {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: departments = [] } = useAllDepartments();
  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const addDept = useAddDepartment();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError("Department name is required.");
      return;
    }
    if (
      departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setFormError("A department with this name already exists.");
      return;
    }
    setFormError(null);
    await addDept.mutateAsync({
      name: trimmed,
      description: newDesc.trim() || undefined,
    });
    setNewName("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Add Department Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-accent" />
            Add Department
          </CardTitle>
          <CardDescription>
            Create a department to group faculty members for bulk PDF
            assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. Physics, Computer Science"
                disabled={addDept.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-desc">Description (optional)</Label>
              <Textarea
                id="dept-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of the department..."
                rows={2}
                disabled={addDept.isPending}
                className="resize-none"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <Button
              type="submit"
              disabled={addDept.isPending || !newName.trim()}
              className="w-full"
            >
              {addDept.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Departments List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Departments ({departments.length})
          </h3>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No departments yet</p>
            <p className="text-sm mt-1">
              Create a department to organize faculty members and enable bulk
              PDF assignment.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((dept) => (
              <DepartmentRow
                key={dept.id}
                department={dept}
                facultyInDept={(allFaculty as Faculty[]).filter(
                  (f) => f.departmentId === dept.id,
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
