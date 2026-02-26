import React from 'react';
import { useActiveFaculty } from '@/hooks/useQueries';
import FacultySelector from '../components/FacultySelector';
import FacultyPDFList from '../components/FacultyPDFList';
import { useFacultyContext } from '../context/FacultyContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function FacultyPortal() {
  const { selectedFacultyId, selectedFacultyName, setSelectedFaculty, clearSelectedFaculty } =
    useFacultyContext();
  const { data: facultyList = [], isLoading } = useActiveFaculty();

  const handleSelect = (id: number, name: string) => {
    setSelectedFaculty(id, name);
  };

  const handleBack = () => {
    clearSelectedFaculty();
  };

  if (!selectedFacultyId) {
    return (
      <div className="min-h-screen bg-background">
        <FacultySelector
          facultyList={facultyList}
          isLoading={isLoading}
          onSelect={handleSelect}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {selectedFacultyName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{selectedFacultyName}</p>
            <p className="text-xs text-muted-foreground">Faculty Portal</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          Switch Faculty
        </Button>
      </div>

      {/* PDF List */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <FacultyPDFList
          facultyId={selectedFacultyId}
          facultyName={selectedFacultyName ?? ''}
        />
      </div>
    </div>
  );
}
