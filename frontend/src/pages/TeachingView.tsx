import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  useAnnotationsByPDF,
  useSaveAnnotation,
  useMarkAsTaught,
  usePDFsByFaculty,
} from '@/hooks/useQueries';
import AnnotationToolbar, { type AnnotationTool } from '../components/AnnotationToolbar';
import AnnotationCanvas, { type DrawingStroke } from '../components/AnnotationCanvas';
import { Loader2 } from 'lucide-react';

export default function TeachingView() {
  const { pdfId, facultyId } = useParams({ from: '/teach/$pdfId/$facultyId' });
  const navigate = useNavigate();

  const pdfIdNum = Number(pdfId);
  const facultyIdNum = Number(facultyId);

  const { data: annotations = [], isLoading: annotationsLoading } = useAnnotationsByPDF(pdfIdNum);
  const { data: pdfs = [] } = usePDFsByFaculty(facultyIdNum);
  const saveAnnotation = useSaveAnnotation();
  const markAsTaught = useMarkAsTaught();

  const pdf = pdfs.find((p) => p.id === pdfIdNum);

  const [activeTool, setActiveTool] = useState<AnnotationTool>('draw');
  const [strokeColor, setStrokeColor] = useState('#1a2744');
  const [fillColor, setFillColor] = useState('#fef08a');
  const [strokeSize, setStrokeSize] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingTaught, setIsMarkingTaught] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = 1;

  const handleAnnotationComplete = useCallback(
    (stroke: DrawingStroke) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const coordinates = JSON.stringify({
            points: stroke.points,
            color: stroke.color,
            size: stroke.size,
            text: stroke.text,
          });
          await saveAnnotation.mutateAsync({
            pdfId: pdfIdNum,
            pageNumber: currentPage,
            annotationType: stroke.tool,
            coordinates,
            endX: stroke.endX ?? null,
            endY: stroke.endY ?? null,
            imageData: stroke.imageData ?? null,
            shapeType: stroke.tool,
            fillColor: stroke.fillColor ?? null,
          });
        } catch {
          // silently ignore save errors to not interrupt teaching flow
        } finally {
          setIsSaving(false);
        }
      }, 300);
    },
    [pdfIdNum, currentPage, saveAnnotation],
  );

  const handleMarkAsTaught = async () => {
    setIsMarkingTaught(true);
    try {
      await markAsTaught.mutateAsync(pdfIdNum);
    } catch {
      // silently ignore
    } finally {
      setIsMarkingTaught(false);
    }
  };

  const handleBack = () => {
    navigate({ to: '/faculty' });
  };

  const pageAnnotations = annotations.filter(
    (a) => a.pageNumber === currentPage,
  );

  if (annotationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <AnnotationToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onMarkAsTaught={handleMarkAsTaught}
        onBack={handleBack}
        isMarkingTaught={isMarkingTaught}
        isTaught={pdf?.taught ?? false}
        strokeSize={strokeSize}
        onStrokeSizeChange={setStrokeSize}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        fillColor={fillColor}
        onFillColorChange={setFillColor}
        onImageSelected={(dataUrl) => setPendingImageData(dataUrl)}
      />

      {isSaving && (
        <div className="absolute top-16 right-4 z-50 flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-md px-2 py-1 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <AnnotationCanvas
          activeTool={activeTool}
          strokeColor={strokeColor}
          strokeSize={strokeSize}
          fillColor={fillColor}
          currentPage={currentPage}
          savedAnnotations={pageAnnotations}
          onAnnotationComplete={handleAnnotationComplete}
          pendingImageData={pendingImageData}
          onImagePlaced={() => setPendingImageData(null)}
          width={0}
          height={0}
        />
      </div>
    </div>
  );
}
