import React, { useState } from 'react';
import { GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Faculty } from '../hooks/useQueries';

interface FacultySelectorProps {
  facultyList: Faculty[];
  isLoading: boolean;
  onSelect: (id: number, name: string) => void;
}

export default function FacultySelector({ facultyList, isLoading, onSelect }: FacultySelectorProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const handleContinue = () => {
    if (!selectedId) return;
    const faculty = facultyList.find((f) => f.id.toString() === selectedId);
    if (faculty) {
      onSelect(faculty.id, faculty.name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated border p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Faculty Portal</h2>
          <p className="text-muted-foreground">
            Select your name to access your assigned teaching materials.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : facultyList.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="font-medium">No faculty members found.</p>
            <p className="text-sm mt-1">Please ask your administrator to add faculty members.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Select Your Name</label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Choose your name..." />
                </SelectTrigger>
                <SelectContent>
                  {facultyList.map((faculty) => (
                    <SelectItem
                      key={faculty.id}
                      value={faculty.id.toString()}
                      className="text-base py-3"
                    >
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!selectedId}
              className="w-full h-12 text-base font-semibold"
            >
              Continue to My PDFs
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
