import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock, FileText, FolderOpen, Users } from "lucide-react";
import React from "react";
import type {
  AcademicFolder,
  AcademicYear,
  Faculty,
  PDF,
} from "../hooks/useQueries";
import { useAllFolders, useAllYears } from "../hooks/useQueries";

interface PDFListTableProps {
  pdfs: PDF[];
  facultyList: Faculty[];
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "Just uploaded";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PDFListTable({ pdfs, facultyList }: PDFListTableProps) {
  const { data: years = [] } = useAllYears();
  const { data: folders = [] } = useAllFolders();

  const getFacultyNames = (facultyIds: number[]): string => {
    if (facultyIds.length === 0) return "Unassigned";
    return facultyIds
      .map(
        (id) => facultyList.find((f) => f.id === id)?.name ?? `Faculty #${id}`,
      )
      .join(", ");
  };

  const getFolderLabel = (folderId?: number): string => {
    if (!folderId) return "—";
    const folder = (folders as AcademicFolder[]).find((f) => f.id === folderId);
    if (!folder) return "—";
    const year = (years as AcademicYear[]).find((y) => y.id === folder.yearId);
    return year ? `${year.year} / ${folder.name}` : folder.name;
  };

  if (pdfs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        data-ocid="pdf.empty_state"
      >
        <FileText className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No PDFs uploaded yet</p>
        <p className="text-sm mt-1">
          Upload a PDF using the form above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" data-ocid="pdf.table">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead className="font-bold text-foreground text-base py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Title
              </div>
            </TableHead>
            <TableHead className="font-bold text-foreground text-base py-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Folder
              </div>
            </TableHead>
            <TableHead className="font-bold text-foreground text-base py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Faculty
              </div>
            </TableHead>
            <TableHead className="font-bold text-foreground text-base py-4">
              Upload Date
            </TableHead>
            <TableHead className="font-bold text-foreground text-base py-4">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pdfs.map((pdf) => (
            <TableRow
              key={pdf.id}
              className="hover:bg-secondary/20 transition-colors"
            >
              <TableCell className="font-semibold text-base py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                  {pdf.title}
                </div>
              </TableCell>
              <TableCell className="text-sm py-4">
                {pdf.folderId ? (
                  <div className="flex items-center gap-1.5 text-primary">
                    <FolderOpen className="h-4 w-4" />
                    <span className="font-medium">
                      {getFolderLabel(pdf.folderId)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-base py-4 text-muted-foreground">
                {getFacultyNames(pdf.facultyIds)}
              </TableCell>
              <TableCell className="text-base py-4 text-muted-foreground">
                {formatDate(pdf.uploadDate)}
              </TableCell>
              <TableCell className="py-4">
                {pdf.taught ? (
                  <span className="taught-badge">
                    <CheckCircle2 className="h-4 w-4" />
                    Taught
                  </span>
                ) : (
                  <span className="untaught-badge">
                    <Clock className="h-4 w-4" />
                    Not Taught
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
