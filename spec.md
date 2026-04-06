# EduBoards

## Current State
The PDF annotation system in TeachingView/AnnotationCanvas has several bugs:
- Eraser: drawn with `destination-out` segment-by-segment in `continueDrawing`, but if `redrawCanvas` fires mid-stroke (due to `savedAnnotations` update), the in-progress erase path is lost and erasure appears to have no effect.
- Images placed on canvas cannot be moved or deleted.
- Shapes (rectangles, circles, triangles, arrows, lines) cannot be moved or deleted after placement.
- Color swatches in the toolbar are small (20px) — hard to tap reliably on smart boards; custom color input uses `opacity-0` overlay which may not work on all browsers/devices.
- Background highlight colors suffer the same small-size issue.

## Requested Changes (Diff)

### Add
- **Select/Move/Delete tool** in AnnotationToolbar (new `"select"` AnnotationTool type using MousePointer icon): allows user to tap a placed image, shape, text, or drawing to select it, then drag to reposition or press a floating Delete button overlay to remove it from the canvas.
- **In-progress stroke tracking**: add `inProgressStrokeRef` in AnnotationCanvas; `continueDrawing` updates this ref for ALL tools; `redrawCanvas` also draws this ref so mid-stroke redraws don't lose work.
- **Proper eraser full-redraw path**: when `activeTool === "eraser"`, `continueDrawing` does a full redraw (clear + replay strokes + draw in-progress eraser path) instead of incremental segment drawing, ensuring erasure is always accurate and survives any React re-render.
- **Selection indicator**: draw a dashed blue border around the selected stroke's bounding box when select tool is active.
- **Floating delete overlay**: when a stroke is selected (select tool), show an absolutely-positioned red trash button near the bounding box top-right corner.
- **Undo button** in toolbar (Undo2 icon): removes the last stroke on the current page.

### Modify
- **AnnotationToolbar**: prepend Select tool to DRAW_TOOLS. Increase color swatch size from `w-5 h-5` (20px) to `w-7 h-7` (28px) for better touch targets. Move color label above the row to save horizontal space.
- **AnnotationCanvas startDrawing**: when `activeTool === "select"`, hit-test all strokes on the page (last = topmost), select the hit stroke; if none hit, deselect. Do not start a drawing stroke.
- **AnnotationCanvas continueDrawing**: when `activeTool === "select"` and dragging, perform live preview redraw showing stroke in translated position.
- **AnnotationCanvas endDrawing**: when `activeTool === "select"` and dragging, commit the move by updating `pageStrokes` (translate all points + endX/endY by delta). When `activeTool === "eraser"`, clear `inProgressStrokeRef` and call `onAnnotationComplete` normally.
- **AnnotationCanvas clearPage**: also clear selected index.
- **AnnotationCanvasRef**: expose new `deleteSelectedStroke()` and `undo()` methods (internally used by floating overlay and toolbar).
- **TeachingView**: pass `onUndo` and handle it; wire the undo button.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `AnnotationTool` type in `AnnotationToolbar.tsx` to include `"select"`.
2. Add Select tool entry to `DRAW_TOOLS` array with `MousePointer` icon.
3. Add Undo button to toolbar; pass `onUndo` prop.
4. Increase color swatch sizes in toolbar to `w-7 h-7`.
5. In `AnnotationCanvas.tsx`:
   a. Add `inProgressStrokeRef` (useRef) tracking current in-progress stroke.
   b. Update `redrawCanvas` to also draw `inProgressStrokeRef.current` at end.
   c. Add `selectedIndexRef` / `selectedIndex` state.
   d. Add `isDragging`, `dragStart`, `dragStrokeOriginal` refs.
   e. Add `getBoundingBox(stroke)` helper and `hitTest(stroke, pt)` helper.
   f. Add `drawSelectionIndicator(ctx, stroke)` helper (dashed blue rect).
   g. In `startDrawing`: handle `"select"` tool (hit test, set selected, init drag).
   h. In `continueDrawing`: handle `"select"` drag (live translate preview); handle `"eraser"` full-redraw path.
   i. In `endDrawing`: commit move for `"select"`; clear `inProgressStrokeRef` for all.
   j. Expose `undo()` via `useImperativeHandle` (pops last stroke from current page).
   k. Render floating delete overlay (absolutely positioned) when a stroke is selected.
6. Update `TeachingView.tsx`: add undo handler; connect undo button via ref; pass `onUndo` to toolbar.
