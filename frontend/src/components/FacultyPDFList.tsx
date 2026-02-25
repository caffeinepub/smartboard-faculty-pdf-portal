import React from 'react';
import { FileText, CheckCircle2, Clock, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { usePDFsByFaculty } from '@/hooks/useQueries';

interface FacultyPDFListProps {
  facultyId: bigint;
  facultyName: string;
}

export default function FacultyPDFList({ facultyId, facultyName }: FacultyPDFListProps) {
  const navigate = useNavigate();
  const { data: pdfs, isLoading, error } = usePDFsByFaculty(facultyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p className="font-medium">Failed to load PDFs. Please try again.</p>
      </div>
    );
  }

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BookOpen className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No PDFs assigned yet</p>
        <p className="text-sm mt-1">
          Ask your administrator to assign teaching materials to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm font-medium">
        {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} assigned to you
      </p>
      {pdfs.map((pdf) => (
        <Card
          key={pdf.id.toString()}
          className="cursor-pointer hover:shadow-elevated transition-all duration-200 hover:border-primary/30 group"
          onClick={() =>
            navigate({
              to: '/teach/$pdfId/$facultyId',
              params: {
                pdfId: pdf.id.toString(),
                facultyId: facultyId.toString(),
              },
            })
          }
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {pdf.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {pdf.taught ? (
                  <span className="taught-badge text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Taught
                  </span>
                ) : (
                  <span className="untaught-badge text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    Not Taught
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
