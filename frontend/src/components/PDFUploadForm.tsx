import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUploadPDF } from '@/hooks/useQueries';
import type { FacultyRecord } from '@/hooks/useQueries';

interface PDFUploadFormProps {
  facultyList: FacultyRecord[];
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function PDFUploadForm({ facultyList, onSuccess, disabled = false }: PDFUploadFormProps) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<bigint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPDF = useUploadPDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a valid PDF file.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    }
  };

  const toggleFaculty = (id: bigint) => {
    setSelectedFacultyIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (disabled) {
      setError('PDF upload limit reached for your current plan. Please upgrade.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for the PDF.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (selectedFacultyIds.length === 0) {
      setError('Please assign this PDF to at least one faculty member.');
      return;
    }

    try {
      const content = await readFileAsBase64(selectedFile);
      await uploadPDF.mutateAsync({
        title: title.trim(),
        content,
        facultyIds: selectedFacultyIds,
      });

      setTitle('');
      setSelectedFile(null);
      setSelectedFacultyIds([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Subscription limit')) {
        setError('PDF upload limit reached for your current plan. Please upgrade.');
      } else {
        setError('Failed to upload PDF. Please try again.');
      }
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="pdf-title" className="text-base font-semibold">
            PDF Title
          </Label>
          <Input
            id="pdf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to Calculus - Chapter 1"
            className="h-12 text-base"
            disabled={disabled}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">PDF File</Label>
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-150
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${selectedFile
                ? 'border-accent bg-accent/5'
                : disabled
                ? 'border-border bg-muted/30'
                : 'border-border hover:border-primary/40 hover:bg-primary/5'
              }
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-accent" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="ml-auto p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-10 w-10" />
                <p className="font-medium">
                  {disabled ? 'Upload limit reached' : 'Click to select a PDF file'}
                </p>
                {!disabled && <p className="text-sm">or drag and drop here</p>}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Faculty Assignment */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Assign to Faculty
            <span className="text-muted-foreground font-normal ml-2 text-sm">
              (select one or more)
            </span>
          </Label>
          {facultyList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              No active faculty members. Add faculty members first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-secondary/30 min-h-[52px]">
              {facultyList.map((faculty) => {
                const isSelected = selectedFacultyIds.includes(faculty.id);
                return (
                  <button
                    key={faculty.id.toString()}
                    type="button"
                    onClick={() => !disabled && toggleFaculty(faculty.id)}
                    disabled={disabled}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background border border-border text-foreground hover:border-primary/50'
                      }
                    `}
                  >
                    {faculty.name}
                  </button>
                );
              })}
            </div>
          )}
          {selectedFacultyIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedFacultyIds.length} faculty member{selectedFacultyIds.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {/* Submit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Button
                type="submit"
                disabled={uploadPDF.isPending || disabled}
                className="w-full h-12 text-base font-semibold"
              >
                {uploadPDF.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading PDF...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload PDF
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {disabled && (
            <TooltipContent>
              PDF upload limit reached for current plan. Upgrade to upload more.
            </TooltipContent>
          )}
        </Tooltip>
      </form>
    </TooltipProvider>
  );
}
