import React from 'react';
import { FileText, CheckCircle2, Clock, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { usePDFsByFaculty } from '@/hooks/useQueries';

interface FacultyPDFListProps {
  facultyId: number;
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
        {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} assigned to {facultyName}
      </p>
      {pdfs.map((pdf) => (
        <Card
          key={pdf.id}
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/40 group"
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
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{pdf.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {pdf.taught ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs text-success font-medium">Taught</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Not yet taught</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
