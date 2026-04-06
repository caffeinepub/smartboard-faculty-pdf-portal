import { Trash2 } from "lucide-react";
import type React from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LocalAnnotation } from "../hooks/useQueries";
import type { AnnotationTool } from "./AnnotationToolbar";

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
  savedAnnotations: LocalAnnotation[];
  onAnnotationComplete: (stroke: DrawingStroke) => void;
  pendingImageData?: string | null;
  onImagePlaced?: () => void;
}

export interface AnnotationCanvasRef {
  clearPage: () => void;
  undo: () => void;
  deleteSelected: () => void;
}

function parseAnnotationCoordinates(
  annotation: LocalAnnotation,
): DrawingStroke | null {
  try {
    const data = JSON.parse(annotation.coordinates);
    return {
      tool: annotation.annotationType as AnnotationTool,
      points: data.points ?? [],
      color: data.color ?? "#1a2744",
      size: data.size ?? 3,
      text: data.text,
      page: annotation.pageNumber,
      endX: annotation.endX ?? data.endX,
      endY: annotation.endY ?? data.endY,
      imageData: annotation.imageData ?? data.imageData,
      fillColor: annotation.fillColor ?? data.fillColor,
    };
  } catch {
    return null;
  }
}

function getBoundingBox(stroke: DrawingStroke): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const xs = stroke.points.map((p) => p.x);
  const ys = stroke.points.map((p) => p.y);
  if (stroke.endX != null) xs.push(stroke.endX);
  if (stroke.endY != null) ys.push(stroke.endY);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const imgSize = stroke.tool === "image" ? 300 : 0;
  return {
    x: minX - 8,
    y: minY - 8,
    w: Math.max(maxX - minX + 16, imgSize),
    h: Math.max(maxY - minY + 16, imgSize),
  };
}

function hitTest(stroke: DrawingStroke, pt: Point): boolean {
  if (stroke.points.length === 0) return false;
  const bb = getBoundingBox(stroke);
  return (
    pt.x >= bb.x && pt.x <= bb.x + bb.w && pt.y >= bb.y && pt.y <= bb.y + bb.h
  );
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = Math.max(12, size * 4);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke) {
  if (stroke.points.length === 0) return;

  ctx.save();

  const startPt = stroke.points[0];
  const endX =
    stroke.endX ?? stroke.points[stroke.points.length - 1]?.x ?? startPt.x;
  const endY =
    stroke.endY ?? stroke.points[stroke.points.length - 1]?.y ?? startPt.y;

  switch (stroke.tool) {
    case "highlight": {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 4;
      ctx.lineCap = "square";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case "draw": {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case "text": {
      ctx.globalAlpha = 1;
      ctx.fillStyle = stroke.color;
      ctx.font = `${stroke.size * 4 + 12}px Inter, sans-serif`;
      if (stroke.text && stroke.points[0]) {
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }
      break;
    }

    case "eraser": {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = stroke.size * 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case "rectangle": {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      const rx = Math.min(startPt.x, endX);
      const ry = Math.min(startPt.y, endY);
      const rw = Math.abs(endX - startPt.x);
      const rh = Math.abs(endY - startPt.y);
      ctx.strokeRect(rx, ry, rw, rh);
      break;
    }

    case "circle": {
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

    case "triangle": {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const midX = (startPt.x + endX) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.lineTo(startPt.x, endY);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "arrow": {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      drawArrowhead(ctx, startPt.x, startPt.y, endX, endY, stroke.size);
      break;
    }

    case "line": {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      break;
    }

    case "backgroundHighlight": {
      const bgColor = stroke.fillColor ?? "#fef08a";
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = bgColor;
      const bx = Math.min(startPt.x, endX);
      const by = Math.min(startPt.y, endY);
      const bw = Math.abs(endX - startPt.x);
      const bh = Math.abs(endY - startPt.y);
      ctx.fillRect(bx, by, bw, bh);
      break;
    }

    case "image": {
      if (stroke.imageData) {
        const img = new Image();
        img.onload = () => {
          const maxW = 300;
          const maxH = 300;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          ctx.drawImage(
            img,
            startPt.x,
            startPt.y,
            img.width * scale,
            img.height * scale,
          );
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

function drawSelectionIndicator(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
) {
  const bb = getBoundingBox(stroke);
  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);
  ctx.restore();
}

type CanvasEvent =
  | React.PointerEvent<HTMLCanvasElement>
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

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
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentStrokeRef = useRef<Point[]>([]);
    const dragStartRef = useRef<Point | null>(null);
    const [pageStrokes, setPageStrokes] = useState<
      Map<number, DrawingStroke[]>
    >(new Map());
    const [pendingText, setPendingText] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [textInput, setTextInput] = useState("");

    // Track in-progress stroke to fix eraser mid-render
    const inProgressStrokeRef = useRef<DrawingStroke | null>(null);

    // Selection state
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const isDraggingSelectRef = useRef(false);
    const dragSelectStartRef = useRef<Point | null>(null);
    const dragStrokeOriginalRef = useRef<DrawingStroke | null>(null);

    // Expose methods
    useImperativeHandle(ref, () => ({
      clearPage: () => {
        setPageStrokes((prev) => {
          const next = new Map(prev);
          next.delete(currentPage);
          return next;
        });
      },
      undo: () => {
        setPageStrokes((prev) => {
          const next = new Map(prev);
          const strokes = next.get(currentPage) ?? [];
          if (strokes.length === 0) return prev;
          next.set(currentPage, strokes.slice(0, -1));
          return next;
        });
        setSelectedIndex(null);
      },
      deleteSelected: () => {
        if (selectedIndex === null) return;
        setPageStrokes((prev) => {
          const next = new Map(prev);
          const strokes = next.get(currentPage) ?? [];
          const updated = strokes.filter((_, i) => i !== selectedIndex);
          next.set(currentPage, updated);
          return next;
        });
        setSelectedIndex(null);
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
    const redrawCanvas = useCallback(
      (overrideStrokes?: DrawingStroke[], highlightIndex?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const strokes = overrideStrokes ?? pageStrokes.get(currentPage) ?? [];
        for (const stroke of strokes) {
          drawStroke(ctx, stroke);
        }

        // Draw in-progress stroke on top (fixes eraser mid-render)
        if (inProgressStrokeRef.current) {
          drawStroke(ctx, inProgressStrokeRef.current);
        }

        // Draw selection indicator
        const idxToHighlight =
          highlightIndex !== undefined ? highlightIndex : selectedIndex;
        if (
          idxToHighlight !== null &&
          idxToHighlight !== undefined &&
          !isDraggingSelectRef.current
        ) {
          const s = strokes[idxToHighlight];
          if (s) drawSelectionIndicator(ctx, s);
        }
      },
      [pageStrokes, currentPage, selectedIndex],
    );

    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas]);

    const getCanvasPoint = (e: CanvasEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e && e.touches.length > 0) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      const me = e as
        | React.PointerEvent<HTMLCanvasElement>
        | React.MouseEvent<HTMLCanvasElement>;
      return {
        x: (me.clientX - rect.left) * scaleX,
        y: (me.clientY - rect.top) * scaleY,
      };
    };

    const isShapeTool = (tool: AnnotationTool) =>
      [
        "rectangle",
        "circle",
        "triangle",
        "arrow",
        "line",
        "backgroundHighlight",
      ].includes(tool);

    const startDrawing = (e: CanvasEvent) => {
      e.preventDefault();

      if ("pointerId" in e && canvasRef.current) {
        try {
          canvasRef.current.setPointerCapture(
            (e as React.PointerEvent<HTMLCanvasElement>).pointerId,
          );
        } catch {}
      }

      const point = getCanvasPoint(e);

      // Select tool: hit test strokes
      if (activeTool === "select") {
        const strokes = pageStrokes.get(currentPage) ?? [];
        let hitIdx: number | null = null;
        for (let i = strokes.length - 1; i >= 0; i--) {
          if (hitTest(strokes[i], point)) {
            hitIdx = i;
            break;
          }
        }
        if (hitIdx !== null) {
          setSelectedIndex(hitIdx);
          isDraggingSelectRef.current = true;
          dragSelectStartRef.current = point;
          dragStrokeOriginalRef.current = { ...strokes[hitIdx] };
        } else {
          setSelectedIndex(null);
        }
        return;
      }

      if (activeTool === "text") {
        setPendingText(point);
        setTextInput("");
        return;
      }

      if (activeTool === "image" && pendingImageData) {
        const stroke: DrawingStroke = {
          tool: "image",
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (activeTool !== "eraser") {
          ctx.save();
          if (activeTool === "highlight") {
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

    const continueDrawing = (e: CanvasEvent) => {
      // Handle select/drag
      if (activeTool === "select") {
        if (!isDraggingSelectRef.current || selectedIndex === null) return;
        e.preventDefault();
        const point = getCanvasPoint(e);
        const origin = dragSelectStartRef.current;
        const original = dragStrokeOriginalRef.current;
        if (!origin || !original) return;

        const dx = point.x - origin.x;
        const dy = point.y - origin.y;

        const movedStroke: DrawingStroke = {
          ...original,
          points: original.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          endX: original.endX != null ? original.endX + dx : undefined,
          endY: original.endY != null ? original.endY + dy : undefined,
        };

        const strokes = pageStrokes.get(currentPage) ?? [];
        const previewStrokes = strokes.map((s, i) =>
          i === selectedIndex ? movedStroke : s,
        );

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const s of previewStrokes) {
          drawStroke(ctx, s);
        }
        drawSelectionIndicator(ctx, movedStroke);
        return;
      }

      if (!isDrawing) return;
      e.preventDefault();
      const point = getCanvasPoint(e);

      if (isShapeTool(activeTool)) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const strokes = pageStrokes.get(currentPage) ?? [];
        for (const stroke of strokes) {
          drawStroke(ctx, stroke);
        }

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

      // Update in-progress stroke ref for consistent redraws
      inProgressStrokeRef.current = {
        tool: activeTool,
        points: [...currentStrokeRef.current],
        color: strokeColor,
        size: strokeSize,
        page: currentPage,
      };

      // For eraser: do a full redraw on every move for accuracy
      if (activeTool === "eraser") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const strokes = pageStrokes.get(currentPage) ?? [];
        for (const stroke of strokes) {
          drawStroke(ctx, stroke);
        }
        // Draw the eraser stroke on top
        drawStroke(ctx, inProgressStrokeRef.current);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
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

    const endDrawing = (e: CanvasEvent) => {
      // Handle select drag end
      if (activeTool === "select") {
        if (!isDraggingSelectRef.current || selectedIndex === null) return;
        e.preventDefault();
        const point = getCanvasPoint(e);
        const origin = dragSelectStartRef.current;
        const original = dragStrokeOriginalRef.current;
        if (origin && original) {
          const dx = point.x - origin.x;
          const dy = point.y - origin.y;
          const movedStroke: DrawingStroke = {
            ...original,
            points: original.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            endX: original.endX != null ? original.endX + dx : undefined,
            endY: original.endY != null ? original.endY + dy : undefined,
          };
          setPageStrokes((prev) => {
            const next = new Map(prev);
            const strokes = next.get(currentPage) ?? [];
            const updated = strokes.map((s, i) =>
              i === selectedIndex ? movedStroke : s,
            );
            next.set(currentPage, updated);
            return next;
          });
        }
        isDraggingSelectRef.current = false;
        return;
      }

      if (!isDrawing) return;
      e.preventDefault();

      if ("pointerId" in e && canvasRef.current) {
        try {
          canvasRef.current.releasePointerCapture(
            (e as React.PointerEvent<HTMLCanvasElement>).pointerId,
          );
        } catch {}
      }

      setIsDrawing(false);
      inProgressStrokeRef.current = null;

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
        tool: "text",
        points: [pendingText],
        color: strokeColor,
        size: strokeSize,
        text: textInput.trim(),
        page: currentPage,
      };

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawStroke(ctx, stroke);
      }

      setPageStrokes((prev) => {
        const next = new Map(prev);
        const existing = next.get(currentPage) ?? [];
        next.set(currentPage, [...existing, stroke]);
        return next;
      });

      onAnnotationComplete(stroke);
      setPendingText(null);
      setTextInput("");
    };

    // Resize canvas to fill container
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const resizeObserver = new ResizeObserver(() => {
        const { width: w, height: h } = parent.getBoundingClientRect();
        if (canvas.width !== Math.floor(w) || canvas.height !== Math.floor(h)) {
          canvas.width = Math.floor(w);
          canvas.height = Math.floor(h);
          redrawCanvas();
        }
      });

      resizeObserver.observe(parent);
      return () => resizeObserver.disconnect();
    }, [redrawCanvas]);

    const cursorStyle = (): string => {
      switch (activeTool) {
        case "select":
          return "cursor-default";
        case "eraser":
          return "cursor-cell";
        case "text":
          return "cursor-text";
        case "image":
          return pendingImageData ? "cursor-crosshair" : "cursor-default";
        default:
          return "cursor-crosshair";
      }
    };

    // Compute delete button position for selected stroke
    const selectedStroke =
      selectedIndex !== null
        ? (pageStrokes.get(currentPage) ?? [])[selectedIndex]
        : null;
    const selectionBB = selectedStroke ? getBoundingBox(selectedStroke) : null;

    return (
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          width={width || 800}
          height={height || 600}
          className={`absolute inset-0 w-full h-full touch-none ${cursorStyle()}`}
          style={{ touchAction: "none" }}
          onPointerDown={startDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          onPointerCancel={endDrawing}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={endDrawing}
        />

        {/* Floating delete button for selected stroke */}
        {activeTool === "select" &&
          selectedIndex !== null &&
          !isDraggingSelectRef.current &&
          selectionBB && (
            <button
              type="button"
              data-ocid="annotation.delete_button"
              onClick={() => {
                setPageStrokes((prev) => {
                  const next = new Map(prev);
                  const strokes = next.get(currentPage) ?? [];
                  next.set(
                    currentPage,
                    strokes.filter((_, i) => i !== selectedIndex),
                  );
                  return next;
                });
                setSelectedIndex(null);
              }}
              className="absolute z-20 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
              style={{
                left: selectionBB.x + selectionBB.w,
                top: selectionBB.y,
                transform: "translate(-50%, -50%)",
              }}
              title="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

        {/* Text input overlay */}
        {pendingText && (
          <div
            className="absolute z-10"
            style={{ left: pendingText.x, top: pendingText.y }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
                if (e.key === "Escape") {
                  setPendingText(null);
                  setTextInput("");
                }
              }}
              onBlur={handleTextSubmit}
              ref={(el) => {
                if (el) el.focus();
              }}
              className="bg-transparent border-b-2 border-primary outline-none text-foreground px-1 min-w-[120px]"
              style={{
                fontSize: `${strokeSize * 4 + 12}px`,
                color: strokeColor,
              }}
              placeholder="Type here..."
            />
          </div>
        )}
      </div>
    );
  },
);

AnnotationCanvas.displayName = "AnnotationCanvas";

export default AnnotationCanvas;
