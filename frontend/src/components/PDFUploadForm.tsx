import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText, Users, AlertCircle } from 'lucide-react';
import { useUploadPDF, useAllFacultyAdmin, type Faculty } from '../hooks/useQueries';

interface PDFUploadFormProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function PDFUploadForm({ onSuccess, disabled = false }: PDFUploadFormProps) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: facultyList = [], isLoading: facultyLoading } = useAllFacultyAdmin();
  const activeFaculty = facultyList.filter((f: Faculty) => f.active);

  const uploadMutation = useUploadPDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setFormError(null);
    if (file && !title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ''));
    }
  };

  const toggleFaculty = (id: number) => {
    setSelectedFacultyIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
    setFormError(null);
  };

  const handleSelectAll = () => {
    if (selectedFacultyIds.length === activeFaculty.length) {
      setSelectedFacultyIds([]);
    } else {
      setSelectedFacultyIds(activeFaculty.map((f: Faculty) => f.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (disabled) {
      setFormError('PDF upload limit reached for your current plan. Please upgrade.');
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a title for the PDF.');
      return;
    }
    if (!selectedFile) {
      setFormError('Please select a PDF file to upload.');
      return;
    }
    if (selectedFacultyIds.length === 0) {
      setFormError('Please select at least one faculty member to assign this PDF to.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Content = (event.target?.result as string) || '';

      try {
        const result = await uploadMutation.mutateAsync({
          title: title.trim(),
          base64Content,
          selectedFacultyIds,
        });

        if (result.success) {
          setTitle('');
          setSelectedFile(null);
          setSelectedFacultyIds([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
          onSuccess?.();
        } else {
          setFormError(result.error || 'Upload failed. Please try again.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setFormError(msg);
      }
    };
    reader.onerror = () => {
      setFormError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const isSubmitting = uploadMutation.isPending;
  const allSelected = activeFaculty.length > 0 && selectedFacultyIds.length === activeFaculty.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="pdf-title" className="text-sm font-medium">
          PDF Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="pdf-title"
          type="text"
          placeholder="Enter a descriptive title..."
          value={title}
          onChange={(e) => { setTitle(e.target.value); setFormError(null); }}
          disabled={isSubmitting || disabled}
          className="w-full"
        />
      </div>

      {/* File picker */}
      <div className="space-y-1.5">
        <Label htmlFor="pdf-file" className="text-sm font-medium">
          PDF File <span className="text-destructive">*</span>
        </Label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            disabled || isSubmitting
              ? 'opacity-50 cursor-not-allowed border-border'
              : 'cursor-pointer hover:border-primary/60 hover:bg-primary/5 border-border'
          }`}
          onClick={() => !isSubmitting && !disabled && fileInputRef.current?.click()}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">{selectedFile.name}</span>
              <span className="text-muted-foreground">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-8 w-8 mb-1 opacity-50" />
              <p className="text-sm font-medium">
                {disabled ? 'Upload limit reached' : 'Click to select a PDF file'}
              </p>
              {!disabled && <p className="text-xs">PDF files only</p>}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="pdf-file"
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isSubmitting || disabled}
        />
      </div>

      {/* Faculty assignment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Assign to Faculty <span className="text-destructive">*</span>
          </Label>
          {activeFaculty.length > 1 && (
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isSubmitting || disabled}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {facultyLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading faculty members...
          </div>
        ) : activeFaculty.length === 0 ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            No active faculty members found. Please add faculty members first.
          </div>
        ) : (
          <div className="rounded-md border border-border divide-y divide-border max-h-48 overflow-y-auto">
            {activeFaculty.map((faculty: Faculty) => (
              <label
                key={faculty.id}
                className={`flex items-center gap-3 px-3 py-2.5 select-none transition-colors ${
                  isSubmitting || disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={selectedFacultyIds.includes(faculty.id)}
                  onCheckedChange={() => !isSubmitting && !disabled && toggleFaculty(faculty.id)}
                  disabled={isSubmitting || disabled}
                  id={`faculty-${faculty.id}`}
                />
                <span className="text-sm font-medium">{faculty.name}</span>
              </label>
            ))}
          </div>
        )}

        {selectedFacultyIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedFacultyIds.length} faculty member{selectedFacultyIds.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Error display */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || disabled || activeFaculty.length === 0}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading PDF...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload & Assign PDF
          </>
        )}
      </Button>
    </form>
  );
}
