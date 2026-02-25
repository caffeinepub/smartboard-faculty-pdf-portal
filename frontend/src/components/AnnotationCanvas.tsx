import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { AnnotationTool } from './AnnotationToolbar';
import type { Annotation } from '../backend';

interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  tool: AnnotationTool;
  points: Point[];
  color: string;
  size: number;
  text?: string;
  page: number;
  endX?: number;
  endY?: number;
  imageData?: string;
  fillColor?: string;
}

interface AnnotationCanvasProps {
  width: number;
  height: number;
  activeTool: AnnotationTool;
  strokeColor: string;
  strokeSize: number;
  fillColor: string;
  currentPage: number;
  savedAnnotations: Annotation[];
  onAnnotationComplete: (stroke: DrawingStroke) => void;
  pendingImageData?: string | null;
  onImagePlaced?: () => void;
}

export interface AnnotationCanvasRef {
  clearPage: () => void;
}

function parseAnnotationCoordinates(annotation: Annotation): DrawingStroke | null {
  try {
    const data = JSON.parse(annotation.coordinates);
    return {
      tool: annotation.annotationType as AnnotationTool,
      points: data.points ?? [],
      color: data.color ?? '#1a2744',
      size: data.size ?? 3,
      text: data.text,
      page: Number(annotation.pageNumber),
      endX: annotation.endX ?? data.endX,
      endY: annotation.endY ?? data.endY,
      imageData: annotation.imageData ?? data.imageData,
      fillColor: annotation.fillColor ?? data.fillColor,
    };
  } catch {
    return null;
  }
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = Math.max(12, size * 4);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke) {
  if (stroke.points.length === 0) return;

  ctx.save();

  const startPt = stroke.points[0];
  const endX = stroke.endX ?? (stroke.points[stroke.points.length - 1]?.x ?? startPt.x);
  const endY = stroke.endY ?? (stroke.points[stroke.points.length - 1]?.y ?? startPt.y);

  switch (stroke.tool) {
    case 'highlight': {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 4;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case 'draw': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case 'text': {
      ctx.globalAlpha = 1;
      ctx.fillStyle = stroke.color;
      ctx.font = `${stroke.size * 4 + 12}px Inter, sans-serif`;
      if (stroke.text && stroke.points[0]) {
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }
      break;
    }

    case 'eraser': {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.size * 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case 'rectangle': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      const rx = Math.min(startPt.x, endX);
      const ry = Math.min(startPt.y, endY);
      const rw = Math.abs(endX - startPt.x);
      const rh = Math.abs(endY - startPt.y);
      ctx.strokeRect(rx, ry, rw, rh);
      break;
    }

    case 'circle': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      const cx = (startPt.x + endX) / 2;
      const cy = (startPt.y + endY) / 2;
      const rx2 = Math.abs(endX - startPt.x) / 2;
      const ry2 = Math.abs(endY - startPt.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'triangle': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const midX = (startPt.x + endX) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.lineTo(startPt.x, endY);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'arrow': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      drawArrowhead(ctx, startPt.x, startPt.y, endX, endY, stroke.size);
      break;
    }

    case 'line': {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      break;
    }

    case 'backgroundHighlight': {
      const bgColor = stroke.fillColor ?? '#fef08a';
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = bgColor;
      const bx = Math.min(startPt.x, endX);
      const by = Math.min(startPt.y, endY);
      const bw = Math.abs(endX - startPt.x);
      const bh = Math.abs(endY - startPt.y);
      ctx.fillRect(bx, by, bw, bh);
      break;
    }

    case 'image': {
      if (stroke.imageData) {
        const img = new Image();
        img.onload = () => {
          // Draw image at start point, scaled to reasonable size
          const maxW = 300;
          const maxH = 300;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          ctx.drawImage(img, startPt.x, startPt.y, img.width * scale, img.height * scale);
        };
        img.src = stroke.imageData;
      }
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

const AnnotationCanvas = forwardRef<AnnotationCanvasRef, AnnotationCanvasProps>(
  (
    {
      width,
      height,
      activeTool,
      strokeColor,
      strokeSize,
      fillColor,
      currentPage,
      savedAnnotations,
      onAnnotationComplete,
      pendingImageData,
      onImagePlaced,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentStrokeRef = useRef<Point[]>([]);
    const dragStartRef = useRef<Point | null>(null);
    const [pageStrokes, setPageStrokes] = useState<Map<number, DrawingStroke[]>>(new Map());
    const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
    const [textInput, setTextInput] = useState('');

    // Expose clearPage method
    useImperativeHandle(ref, () => ({
      clearPage: () => {
        setPageStrokes((prev) => {
          const next = new Map(prev);
          next.delete(currentPage);
          return next;
        });
      },
    }));

    // Load saved annotations into page strokes
    useEffect(() => {
      const newMap = new Map<number, DrawingStroke[]>();
      for (const annotation of savedAnnotations) {
        const stroke = parseAnnotationCoordinates(annotation);
        if (stroke) {
          const page = stroke.page;
          const existing = newMap.get(page) ?? [];
          newMap.set(page, [...existing, stroke]);
        }
      }
      setPageStrokes(newMap);
    }, [savedAnnotations]);

    // Redraw canvas when page or strokes change
    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const strokes = pageStrokes.get(currentPage) ?? [];
      for (const stroke of strokes) {
        drawStroke(ctx, stroke);
      }
    }, [pageStrokes, currentPage]);

    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas]);

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      } else {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
    };

    // Shape tools that use start/end drag
    const isShapeTool = (tool: AnnotationTool) =>
      ['rectangle', 'circle', 'triangle', 'arrow', 'line', 'backgroundHighlight'].includes(tool);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getCanvasPoint(e);

      if (activeTool === 'text') {
        setPendingText(point);
        setTextInput('');
        return;
      }

      // Image tool: place image at click point
      if (activeTool === 'image' && pendingImageData) {
        const stroke: DrawingStroke = {
          tool: 'image',
          points: [point],
          color: strokeColor,
          size: strokeSize,
          page: currentPage,
          imageData: pendingImageData,
        };
        setPageStrokes((prev) => {
          const next = new Map(prev);
          const existing = next.get(currentPage) ?? [];
          next.set(currentPage, [...existing, stroke]);
          return next;
        });
        onAnnotationComplete(stroke);
        onImagePlaced?.();
        return;
      }

      setIsDrawing(true);
      dragStartRef.current = point;
      currentStrokeRef.current = [point];

      if (!isShapeTool(activeTool)) {
        // Draw initial dot for freehand tools
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (activeTool !== 'eraser') {
          ctx.save();
          if (activeTool === 'highlight') {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(point.x, point.y, (strokeSize * 4) / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(point.x, point.y, strokeSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    };

    const continueDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const point = getCanvasPoint(e);

      if (isShapeTool(activeTool)) {
        // For shape tools, redraw canvas + preview shape
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Redraw existing strokes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const strokes = pageStrokes.get(currentPage) ?? [];
        for (const stroke of strokes) {
          drawStroke(ctx, stroke);
        }

        // Draw preview
        if (dragStartRef.current) {
          const previewStroke: DrawingStroke = {
            tool: activeTool,
            points: [dragStartRef.current],
            color: strokeColor,
            size: strokeSize,
            page: currentPage,
            endX: point.x,
            endY: point.y,
            fillColor: fillColor,
          };
          drawStroke(ctx, previewStroke);
        }
        return;
      }

      currentStrokeRef.current.push(point);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const points = currentStrokeRef.current;
      if (points.length < 2) return;

      const tempStroke: DrawingStroke = {
        tool: activeTool,
        points: [points[points.length - 2], points[points.length - 1]],
        color: strokeColor,
        size: strokeSize,
        page: currentPage,
      };
      drawStroke(ctx, tempStroke);
    };

    const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      setIsDrawing(false);

      const endPoint = getCanvasPoint(e);

      if (isShapeTool(activeTool) && dragStartRef.current) {
        const stroke: DrawingStroke = {
          tool: activeTool,
          points: [dragStartRef.current],
          color: strokeColor,
          size: strokeSize,
          page: currentPage,
          endX: endPoint.x,
          endY: endPoint.y,
          fillColor: fillColor,
        };

        setPageStrokes((prev) => {
          const next = new Map(prev);
          const existing = next.get(currentPage) ?? [];
          next.set(currentPage, [...existing, stroke]);
          return next;
        });

        onAnnotationComplete(stroke);
        dragStartRef.current = null;
        currentStrokeRef.current = [];
        return;
      }

      const points = [...currentStrokeRef.current];
      currentStrokeRef.current = [];
      dragStartRef.current = null;

      if (points.length === 0) return;

      const stroke: DrawingStroke = {
        tool: activeTool,
        points,
        color: strokeColor,
        size: strokeSize,
        page: currentPage,
      };

      setPageStrokes((prev) => {
        const next = new Map(prev);
        const existing = next.get(currentPage) ?? [];
        next.set(currentPage, [...existing, stroke]);
        return next;
      });

      onAnnotationComplete(stroke);
    };

    const handleTextSubmit = () => {
      if (!pendingText || !textInput.trim()) {
        setPendingText(null);
        return;
      }

      const stroke: DrawingStroke = {
        tool: 'text',
        points: [pendingText],
        color: strokeColor,
        size: strokeSize,
        text: textInput.trim(),
        page: currentPage,
      };

      setPageStrokes((prev) => {
        const next = new Map(prev);
        const existing = next.get(currentPage) ?? [];
        next.set(currentPage, [...existing, stroke]);
        return next;
      });

      onAnnotationComplete(stroke);
      setPendingText(null);
      setTextInput('');
    };

    // Cursor style based on active tool
    const getCursor = () => {
      if (activeTool === 'eraser') return 'cell';
      if (activeTool === 'text') return 'text';
      if (activeTool === 'image') return pendingImageData ? 'copy' : 'default';
      return 'crosshair';
    };

    return (
      <div className="relative" style={{ width, height }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="annotation-canvas absolute inset-0"
          style={{ width: '100%', height: '100%', cursor: getCursor() }}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={endDrawing}
        />

        {/* Text input overlay */}
        {pendingText && (
          <div
            className="absolute z-10"
            style={{
              left: (pendingText.x / width) * 100 + '%',
              top: (pendingText.y / height) * 100 + '%',
              transform: 'translate(0, -50%)',
            }}
          >
            <div className="flex items-center gap-2 bg-card border shadow-elevated rounded-lg p-2">
              <input
                autoFocus
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSubmit();
                  if (e.key === 'Escape') setPendingText(null);
                }}
                placeholder="Type annotation..."
                className="border rounded px-2 py-1 text-sm min-w-[200px] bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleTextSubmit}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
              >
                Add
              </button>
              <button
                onClick={() => setPendingText(null)}
                className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Image placement hint */}
        {activeTool === 'image' && pendingImageData && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none">
            Click anywhere to place the image
          </div>
        )}
      </div>
    );
  }
);

AnnotationCanvas.displayName = 'AnnotationCanvas';

export default AnnotationCanvas;
