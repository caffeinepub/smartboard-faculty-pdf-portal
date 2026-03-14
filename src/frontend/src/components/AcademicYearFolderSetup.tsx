import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddFolder,
  useAddYear,
  useAllFolders,
  useAllYears,
  useDeleteFolder,
  useDeleteYear,
} from "@/hooks/useQueries";
import { CalendarDays, FolderOpen, Loader2, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

export default function AcademicYearFolderSetup() {
  const [newYearInput, setNewYearInput] = useState("");
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [newFolderInput, setNewFolderInput] = useState("");

  const { data: years = [] } = useAllYears();
  const { data: allFolders = [] } = useAllFolders();
  const addYear = useAddYear();
  const deleteYear = useDeleteYear();
  const addFolder = useAddFolder();
  const deleteFolder = useDeleteFolder();

  const selectedYear = years.find((y) => String(y.id) === selectedYearId);
  const foldersForSelectedYear = selectedYearId
    ? allFolders.filter((f) => f.yearId === Number(selectedYearId))
    : [];

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newYearInput.trim();
    if (!val) return;
    if (years.some((y) => y.year === val)) {
      toast.error(`Year "${val}" already exists.`);
      return;
    }
    try {
      await addYear.mutateAsync({ year: val });
      setNewYearInput("");
      toast.success(`Academic year "${val}" created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add year.");
    }
  };

  const handleDeleteYear = async (yearId: number, yearLabel: string) => {
    try {
      await deleteYear.mutateAsync(yearId);
      if (String(yearId) === selectedYearId) setSelectedYearId("");
      toast.success(`Year "${yearLabel}" deleted.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete year.",
      );
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) return;
    const val = newFolderInput.trim();
    if (!val) return;
    try {
      await addFolder.mutateAsync({
        yearId: Number(selectedYearId),
        name: val,
      });
      setNewFolderInput("");
      toast.success(`Folder "${val}" created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add folder.");
    }
  };

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    try {
      await deleteFolder.mutateAsync(folderId);
      toast.success(`Folder "${folderName}" deleted.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete folder.",
      );
    }
  };

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          Academic Year & Folder Setup
        </CardTitle>
        <CardDescription>
          Organise PDFs by year and up to 3 folders per year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Add year */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Add Academic Year</Label>
          <form onSubmit={handleAddYear} className="flex gap-2">
            <Input
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="e.g. 2024-25"
              className="h-9 flex-1"
              disabled={addYear.isPending}
              data-ocid="year.input"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newYearInput.trim() || addYear.isPending}
              className="h-9 px-3"
              data-ocid="year.primary_button"
            >
              {addYear.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Years list */}
          {years.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {years.map((year) => {
                const fCount = allFolders.filter(
                  (f) => f.yearId === year.id,
                ).length;
                return (
                  <div
                    key={year.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30"
                    data-ocid="year.row"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{year.year}</span>
                      <Badge variant="secondary" className="text-xs">
                        {fCount}/3 folders
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteYear(year.id, year.year)}
                      disabled={deleteYear.isPending}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      data-ocid="year.delete_button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {years.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No academic years yet. Add one above.
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Folder management */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Manage Folders</Label>

          {/* Year selector */}
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="h-9" data-ocid="year.select">
              <SelectValue placeholder="Select a year to manage folders..." />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedYear && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Folders for {selectedYear.year}
                </span>
                <Badge
                  variant={
                    foldersForSelectedYear.length >= 3
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {foldersForSelectedYear.length}/3 folders
                </Badge>
              </div>

              {foldersForSelectedYear.length < 3 && (
                <form onSubmit={handleAddFolder} className="flex gap-2">
                  <Input
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    placeholder="e.g. Term 1, Semester 1"
                    className="h-9 flex-1"
                    disabled={addFolder.isPending}
                    data-ocid="folder.input"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newFolderInput.trim() || addFolder.isPending}
                    className="h-9 px-3"
                    data-ocid="folder.primary_button"
                  >
                    {addFolder.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              )}

              {foldersForSelectedYear.length >= 3 && (
                <p className="text-xs text-destructive font-medium">
                  Maximum 3 folders reached for this year.
                </p>
              )}

              {/* Folder list */}
              {foldersForSelectedYear.length > 0 ? (
                <div className="space-y-1.5">
                  {foldersForSelectedYear.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30"
                      data-ocid="folder.row"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm">{folder.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteFolder(folder.id, folder.name)
                        }
                        disabled={deleteFolder.isPending}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        data-ocid="folder.delete_button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No folders yet. Add up to 3 folders.
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
