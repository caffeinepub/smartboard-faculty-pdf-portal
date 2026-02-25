import React, { useRef } from 'react';
import {
  Pen,
  Highlighter,
  Type,
  Eraser,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Minus,
  Plus,
  Square,
  Circle,
  Triangle,
  ArrowUpRight,
  Minus as LineIcon,
  Image as ImageIcon,
  PaintBucket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export type AnnotationTool =
  | 'draw'
  | 'highlight'
  | 'text'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'arrow'
  | 'line'
  | 'image'
  | 'backgroundHighlight';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onMarkAsTaught: () => void;
  onBack: () => void;
  isMarkingTaught: boolean;
  isTaught: boolean;
  strokeSize: number;
  onStrokeSizeChange: (size: number) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  onImageSelected: (dataUrl: string) => void;
}

const DRAW_TOOLS: { id: AnnotationTool; icon: React.ElementType; label: string }[] = [
  { id: 'draw', icon: Pen, label: 'Freehand Draw' },
  { id: 'highlight', icon: Highlighter, label: 'Highlighter' },
  { id: 'text', icon: Type, label: 'Text Note' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const SHAPE_TOOLS: { id: AnnotationTool; icon: React.ElementType; label: string }[] = [
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'line', icon: LineIcon, label: 'Straight Line' },
  { id: 'backgroundHighlight', icon: PaintBucket, label: 'Background Highlight' },
  { id: 'image', icon: ImageIcon, label: 'Insert Image' },
];

const STROKE_COLORS = [
  '#1a2744',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#000000',
  '#ffffff',
];

const BG_COLORS = [
  '#fef08a', // yellow
  '#bbf7d0', // green
  '#bfdbfe', // blue
  '#fecaca', // red
  '#e9d5ff', // purple
  '#fed7aa', // orange
  '#f0fdf4', // light green
];

export default function AnnotationToolbar({
  activeTool,
  onToolChange,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onMarkAsTaught,
  onBack,
  isMarkingTaught,
  isTaught,
  strokeSize,
  onStrokeSizeChange,
  strokeColor,
  onStrokeColorChange,
  fillColor,
  onFillColorChange,
  onImageSelected,
}: AnnotationToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: AnnotationTool) => {
    if (tool === 'image') {
      fileInputRef.current?.click();
    } else {
      onToolChange(tool);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onImageSelected(dataUrl);
        onToolChange('image');
      }
    };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const isColorDisabled = activeTool === 'eraser';
  const showFillColor = activeTool === 'backgroundHighlight';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-b shadow-xs flex-wrap">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onBack} className="touch-target">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Portal</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8" />

        {/* Basic Drawing Tools */}
        <div className="flex items-center gap-0.5">
          {DRAW_TOOLS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === id ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => handleToolClick(id)}
                  className="touch-target"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Shape & Special Tools */}
        <div className="flex items-center gap-0.5">
          {SHAPE_TOOLS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === id ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => handleToolClick(id)}
                  className="touch-target"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Hidden file input for image insertion */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Separator orientation="vertical" className="h-8" />

        {/* Stroke Size */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStrokeSizeChange(Math.max(1, strokeSize - 2))}
                className="touch-target"
                disabled={activeTool === 'eraser' || activeTool === 'text'}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decrease size</TooltipContent>
          </Tooltip>
          <span className="text-sm font-mono w-6 text-center">{strokeSize}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStrokeSizeChange(Math.min(40, strokeSize + 2))}
                className="touch-target"
                disabled={activeTool === 'eraser' || activeTool === 'text'}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Increase size</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Stroke Color Picker */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-0.5 hidden sm:inline">Color:</span>
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onStrokeColorChange(color)}
              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0 ${
                strokeColor === color ? 'border-foreground scale-110' : 'border-muted'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              disabled={isColorDisabled}
            />
          ))}
          {/* Custom color input */}
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className={`w-5 h-5 rounded-full border-2 cursor-pointer overflow-hidden flex-shrink-0 transition-transform hover:scale-110 ${
                  isColorDisabled ? 'opacity-40 pointer-events-none' : ''
                } border-muted`}
                title="Custom color"
              >
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer opacity-0 absolute"
                  disabled={isColorDisabled}
                />
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                  }}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Custom stroke color</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Background / Fill Color Picker */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-0.5 hidden sm:inline">BG:</span>
          {BG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onFillColorChange(color)}
              className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 flex-shrink-0 ${
                fillColor === color ? 'border-foreground scale-110' : 'border-muted'
              }`}
              style={{ backgroundColor: color }}
              title={`Background: ${color}`}
            />
          ))}
          {/* Custom fill color input */}
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className="w-5 h-5 rounded border-2 cursor-pointer overflow-hidden flex-shrink-0 transition-transform hover:scale-110 border-muted"
                title="Custom background color"
              >
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer opacity-0 absolute"
                />
                <div
                  className="w-full h-full rounded"
                  style={{
                    background: 'conic-gradient(#fef08a, #bbf7d0, #bfdbfe, #fecaca, #e9d5ff, #fef08a)',
                  }}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Custom background color</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                className="touch-target"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous Page</TooltipContent>
          </Tooltip>
          <span className="text-sm font-semibold min-w-[70px] text-center">
            {currentPage} / {totalPages || '?'}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNextPage}
                disabled={totalPages > 0 && currentPage >= totalPages}
                className="touch-target"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next Page</TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto">
          <Button
            onClick={onMarkAsTaught}
            disabled={isMarkingTaught || isTaught}
            variant={isTaught ? 'secondary' : 'default'}
            className="h-11 px-4 font-semibold text-base"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isTaught ? 'Taught' : isMarkingTaught ? 'Saving...' : 'Mark as Taught'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
