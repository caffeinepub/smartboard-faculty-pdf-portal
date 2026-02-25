import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Loader2, AlertCircle } from 'lucide-react';
import AnnotationToolbar, { type AnnotationTool } from '@/components/AnnotationToolbar';
import AnnotationCanvas, { type AnnotationCanvasRef, type DrawingStroke } from '@/components/AnnotationCanvas';
import { useAnnotationsByPDF, useSaveAnnotation, useMarkAsTaught, usePDFsByFaculty } from '@/hooks/useQueries';
import type { PDF } from '../backend';

// Debounce helper
function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

export default function TeachingView() {
  const params = useParams({ from: '/teach/$pdfId/$facultyId' });
  const navigate = useNavigate();

  const pdfId = BigInt(params.pdfId);
  const facultyId = BigInt(params.facultyId);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('draw');
  const [strokeColor, setStrokeColor] = useState('#1a2744');
  const [fillColor, setFillColor] = useState('#fef08a');
  const [strokeSize, setStrokeSize] = useState(3);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 });
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  const canvasRef = useRef<AnnotationCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch PDFs assigned to this faculty from the backend
  const { data: facultyPDFs = [], isLoading: pdfsLoading } = usePDFsByFaculty(facultyId);
  const pdf: PDF | undefined = facultyPDFs.find((p) => p.id === pdfId);

  const { data: annotations = [] } = useAnnotationsByPDF(pdfId);
  const saveAnnotation = useSaveAnnotation();
  const markAsTaught = useMarkAsTaught();

  // Convert base64 to blob URL for PDF display
  useEffect(() => {
    if (!pdf?.content) return;

    try {
      setPdfLoading(true);
      setPdfError(null);

      const base64 = pdf.content;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfLoading(false);

      return () => URL.revokeObjectURL(url);
    } catch {
      setPdfError('Failed to load PDF content.');
      setPdfLoading(false);
    }
  }, [pdf?.content]);

  // Update canvas size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Debounced save annotation
  const debouncedSave = useDebounce(
    useCallback(
      (stroke: DrawingStroke) => {
        const coordinates = JSON.stringify({
          points: stroke.points,
          color: stroke.color,
          size: stroke.size,
          text: stroke.text,
        });
        saveAnnotation.mutate({
          pdfId,
          pageNumber: BigInt(stroke.page),
          annotationType: stroke.tool,
          coordinates,
          endX: stroke.endX ?? null,
          endY: stroke.endY ?? null,
          imageData: stroke.imageData ?? null,
          shapeType: stroke.tool,
          fillColor: stroke.fillColor ?? null,
        });
      },
      [pdfId, saveAnnotation]
    ),
    2000
  );

  const handleAnnotationComplete = useCallback(
    (stroke: DrawingStroke) => {
      debouncedSave(stroke);
    },
    [debouncedSave]
  );

  const handleMarkAsTaught = async () => {
    await markAsTaught.mutateAsync(pdfId);
    navigate({ to: '/faculty' });
  };

  const handleBack = () => {
    navigate({ to: '/faculty' });
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1));
  };

  const handleImageSelected = (dataUrl: string) => {
    setPendingImageData(dataUrl);
  };

  const handleImagePlaced = () => {
    setPendingImageData(null);
  };

  // Show loading while fetching PDFs from backend
  if (pdfsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  // PDF not found after loading completed
  if (!pdf && !pdfsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">PDF not found.</p>
        <button onClick={handleBack} className="text-primary underline">
          Go back to portal
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <AnnotationToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onMarkAsTaught={handleMarkAsTaught}
        onBack={handleBack}
        isMarkingTaught={markAsTaught.isPending}
        isTaught={pdf?.taught ?? false}
        strokeSize={strokeSize}
        onStrokeSizeChange={setStrokeSize}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        fillColor={fillColor}
        onFillColorChange={setFillColor}
        onImageSelected={handleImageSelected}
      />

      {/* PDF Title Bar */}
      <div className="bg-secondary/50 border-b px-4 py-2 flex items-center justify-between">
        <h2 className="font-semibold text-foreground truncate">
          {pdf?.title ?? 'Loading...'}
        </h2>
        {saveAnnotation.isPending && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveAnnotation.isSuccess && !saveAnnotation.isPending && (
          <span className="text-xs text-success">✓ Saved</span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>
        {pdfLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}

        {pdfError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-3 text-destructive">
              <AlertCircle className="h-10 w-10" />
              <p className="font-medium">{pdfError}</p>
            </div>
          </div>
        )}

        {pdfUrl && !pdfLoading && (
          <>
            {/* PDF iframe */}
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
              className="absolute inset-0 w-full h-full border-0"
              title={pdf?.title ?? 'PDF Document'}
              onLoad={() => {
                setPdfLoading(false);
              }}
            />

            {/* Annotation Canvas Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="relative w-full h-full pointer-events-auto"
                style={{ mixBlendMode: 'multiply' }}
              >
                <AnnotationCanvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  activeTool={activeTool}
                  strokeColor={strokeColor}
                  strokeSize={strokeSize}
                  fillColor={fillColor}
                  currentPage={currentPage}
                  savedAnnotations={annotations}
                  onAnnotationComplete={handleAnnotationComplete}
                  pendingImageData={pendingImageData}
                  onImagePlaced={handleImagePlaced}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
