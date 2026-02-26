import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import AnnotationCanvas, { type DrawingStroke } from '../components/AnnotationCanvas';
import AnnotationToolbar, { type AnnotationTool } from '../components/AnnotationToolbar';
import {
  usePDFsByFaculty,
  useAnnotationsByPDF,
  useSaveAnnotation,
  useMarkAsTaught,
} from '../hooks/useQueries';
import { AlertCircle, Loader2 } from 'lucide-react';

// Decode base64 PDF content to a Uint8Array for PDF.js
function base64ToUint8Array(base64: string): Uint8Array {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export default function TeachingView() {
  const { pdfId, facultyId } = useParams({ from: '/teach/$pdfId/$facultyId' });
  const navigate = useNavigate();

  const pdfIdNum = Number(pdfId);
  const facultyIdNum = Number(facultyId);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('draw');
  const [strokeColor, setStrokeColor] = useState('#1a2744');
  const [fillColor, setFillColor] = useState('#fef08a');
  const [strokeSize, setStrokeSize] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingTaught, setIsMarkingTaught] = useState(false);
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: pdfs = [], isLoading: pdfsLoading } = usePDFsByFaculty(facultyIdNum);
  const { data: annotations = [], isLoading: annotationsLoading } = useAnnotationsByPDF(pdfIdNum);
  const saveAnnotation = useSaveAnnotation();
  const markAsTaught = useMarkAsTaught();

  const pdf = pdfs.find((p) => p.id === pdfIdNum);

  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // Load PDF.js from CDN dynamically
  const loadPdfJs = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('PDF.js failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js script'));
      document.head.appendChild(script);
    });
  }, []);

  // Initialize PDF document when PDF data is available
  useEffect(() => {
    if (!pdf?.content) return;

    let cancelled = false;
    setPdfError(null);
    setPdfRendering(true);
    setPdfDoc(null);

    (async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        const bytes = base64ToUint8Array(pdf.content);
        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const doc = await loadingTask.promise;

        if (cancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setPdfError('Failed to load PDF. The file may be corrupted or in an unsupported format.');
        }
      } finally {
        if (!cancelled) setPdfRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf?.content, loadPdfJs]);

  // Render current page whenever pdfDoc or currentPage changes
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch {}
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const container = containerRef.current;
        const containerWidth = container ? container.clientWidth : window.innerWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.max(containerWidth / viewport.width, 1.2);
        const scaledViewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        setCanvasSize({ width: scaledViewport.width, height: scaledViewport.height });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderTask = page.render({ canvasContext: ctx, viewport: scaledViewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('PDF render error:', err);
          setPdfError('Failed to render PDF page.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage]);

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

  const isLoading = pdfsLoading || annotationsLoading || pdfRendering;
  const pdfNotFound = !pdfsLoading && pdfs.length >= 0 && !pdf;
  const hasError = !isLoading && (pdfError || pdfNotFound);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
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

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="absolute top-16 right-4 z-50 flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-md px-2 py-1 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}

      {/* Main content area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-muted/30 flex items-start justify-center"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground text-sm">
              {pdfsLoading || annotationsLoading ? 'Loading PDF data…' : 'Rendering PDF page…'}
            </p>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background px-6">
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 max-w-md text-center">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h3 className="text-foreground font-semibold text-lg mb-2">PDF Could Not Be Loaded</h3>
              <p className="text-muted-foreground text-sm">
                {pdfError ||
                  'This PDF could not be found. It may have been deleted or the link is invalid.'}
              </p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* PDF Canvas + Annotation Overlay */}
        {!hasError && (
          <div
            className="relative"
            style={{
              width: canvasSize.width > 0 ? canvasSize.width : '100%',
              minHeight: canvasSize.height > 0 ? canvasSize.height : '100vh',
            }}
          >
            {/* PDF rendered canvas */}
            <canvas
              ref={pdfCanvasRef}
              className="block"
              style={{
                display: pdfDoc ? 'block' : 'none',
                background: '#ffffff',
              }}
            />

            {/* Annotation overlay — positioned absolutely on top of the PDF canvas */}
            {pdfDoc && canvasSize.width > 0 && (
              <div
                className="absolute inset-0"
                style={{ width: canvasSize.width, height: canvasSize.height }}
              >
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
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
