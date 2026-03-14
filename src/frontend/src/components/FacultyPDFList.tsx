import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useAllFolders,
  useAllYears,
  usePDFsByFaculty,
} from "@/hooks/useQueries";
import { downloadPDFFromBase64, getPDFContent } from "@/utils/pdfStorage";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Loader2,
} from "lucide-react";
import React, { useState } from "react";
import type { AcademicFolder, AcademicYear, PDF } from "../hooks/useQueries";

interface FacultyPDFListProps {
  facultyId: number;
  facultyName: string;
}

function PDFCard({ pdf, facultyId }: { pdf: PDF; facultyId: number }) {
  const navigate = useNavigate();
  return (
    <Card
      key={pdf.id}
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/40 group"
      onClick={() =>
        navigate({
          to: "/teach/$pdfId/$facultyId",
          params: {
            pdfId: pdf.id.toString(),
            facultyId: facultyId.toString(),
          },
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {pdf.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {pdf.taught ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs text-success font-medium">
                      Taught
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Not yet taught
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-ocid="faculty.pdf.button"
              onClick={async (e) => {
                e.stopPropagation();
                const pdfContent = await getPDFContent(pdf.id);
                if (pdfContent) {
                  downloadPDFFromBase64(pdfContent, pdf.title);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FolderSection({
  folder,
  pdfs,
  facultyId,
}: {
  folder: AcademicFolder;
  pdfs: PDF[];
  facultyId: number;
}) {
  const [open, setOpen] = useState(true);
  if (pdfs.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {folder.name}
          </span>
          <Badge variant="secondary" className="text-xs ml-auto mr-1">
            {pdfs.length}
          </Badge>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/20 space-y-2">
          {pdfs.map((pdf) => (
            <PDFCard key={pdf.id} pdf={pdf} facultyId={facultyId} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function YearSection({
  year,
  folders,
  pdfs,
  facultyId,
}: {
  year: AcademicYear;
  folders: AcademicFolder[];
  pdfs: PDF[];
  facultyId: number;
}) {
  const [open, setOpen] = useState(true);

  const pdfsInThisYear = pdfs.filter((p) =>
    p.folderId ? folders.some((f) => f.id === p.folderId) : false,
  );

  if (pdfsInThisYear.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors cursor-pointer border border-primary/20">
          <span className="text-base font-bold text-primary">
            📅 {year.year}
          </span>
          <Badge className="ml-auto mr-1 text-xs bg-primary text-primary-foreground">
            {pdfsInThisYear.length} PDF{pdfsInThisYear.length !== 1 ? "s" : ""}
          </Badge>
          {open ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-primary" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-2 pl-4 border-l-2 border-primary/30 space-y-3">
          {folders.map((folder) => {
            const folderPdfs = pdfs.filter((p) => p.folderId === folder.id);
            return (
              <FolderSection
                key={folder.id}
                folder={folder}
                pdfs={folderPdfs}
                facultyId={facultyId}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function FacultyPDFList({
  facultyId,
  facultyName,
}: FacultyPDFListProps) {
  const navigate = useNavigate();
  const { data: pdfs, isLoading, error } = usePDFsByFaculty(facultyId);
  const { data: years = [] } = useAllYears();
  const { data: allFolders = [] } = useAllFolders();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="faculty.loading_state"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center py-12 text-destructive"
        data-ocid="faculty.error_state"
      >
        <p className="font-medium">Failed to load PDFs. Please try again.</p>
      </div>
    );
  }

  if (!pdfs || pdfs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        data-ocid="faculty.empty_state"
      >
        <BookOpen className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No PDFs assigned yet</p>
        <p className="text-sm mt-1">
          Ask your administrator to assign teaching materials to your account.
        </p>
      </div>
    );
  }

  // Separate organized (has folderId) vs unorganized PDFs
  const organizedPdfs = pdfs.filter((p) => p.folderId != null);
  const unorganizedPdfs = pdfs.filter((p) => p.folderId == null);

  // Sort years newest first (by year string descending)
  const sortedYears = [...(years as AcademicYear[])].sort((a, b) =>
    b.year.localeCompare(a.year),
  );

  // Build year sections — only include years that have PDFs for this faculty
  const yearSections = sortedYears.filter((year) => {
    const yearFolders = (allFolders as AcademicFolder[]).filter(
      (f) => f.yearId === year.id,
    );
    return organizedPdfs.some((p) =>
      yearFolders.some((f) => f.id === p.folderId),
    );
  });

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm font-medium">
        {pdfs.length} PDF{pdfs.length !== 1 ? "s" : ""} assigned to{" "}
        {facultyName}
      </p>

      {/* Year sections */}
      {yearSections.map((year) => {
        const yearFolders = (allFolders as AcademicFolder[]).filter(
          (f) => f.yearId === year.id,
        );
        return (
          <YearSection
            key={year.id}
            year={year}
            folders={yearFolders}
            pdfs={organizedPdfs}
            facultyId={facultyId}
          />
        );
      })}

      {/* Unorganized PDFs */}
      {unorganizedPdfs.length > 0 && (
        <UnorganizedSection
          pdfs={unorganizedPdfs}
          facultyId={facultyId}
          navigate={navigate}
        />
      )}
    </div>
  );
}

function UnorganizedSection({
  pdfs,
  facultyId,
}: {
  pdfs: PDF[];
  facultyId: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer border border-border">
          <span className="text-base font-bold text-muted-foreground">
            📂 Unorganized
          </span>
          <Badge variant="secondary" className="ml-auto mr-1 text-xs">
            {pdfs.length}
          </Badge>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {pdfs.map((pdf) => (
            <PDFCard key={pdf.id} pdf={pdf} facultyId={facultyId} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
