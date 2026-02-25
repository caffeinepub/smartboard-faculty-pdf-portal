import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GraduationCap, LogOut, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FacultySelector from '@/components/FacultySelector';
import FacultyPDFList from '@/components/FacultyPDFList';
import { useFacultyContext } from '@/context/FacultyContext';
import { useActiveFaculty, useIsAdmin } from '@/hooks/useQueries';

export default function FacultyPortal() {
  const navigate = useNavigate();
  const { selectedFacultyId, selectedFacultyName, setSelectedFaculty, clearSelectedFaculty } =
    useFacultyContext();
  const { data: facultyList = [], isLoading } = useActiveFaculty();
  const { data: isAdmin } = useIsAdmin();

  if (!selectedFacultyId || !selectedFacultyName) {
    return (
      <div className="animate-fade-in">
        <FacultySelector
          facultyList={facultyList}
          isLoading={isLoading}
          onSelect={setSelectedFaculty}
        />
        {/* Hidden admin shortcut at the bottom of the selector */}
        {isAdmin && (
          <div className="flex justify-center pb-6">
            <button
              onClick={() => navigate({ to: '/dev-portal' })}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-amber-600 transition-colors"
              title="Open Developer Portal"
            >
              <Terminal className="h-3 w-3" />
              Developer Access
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome, {selectedFacultyName}
            </h1>
            <p className="text-muted-foreground">Your assigned teaching materials</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/dev-portal' })}
              className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              title="Developer Portal"
            >
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Dev Portal</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={clearSelectedFaculty}
            className="gap-2 h-11"
          >
            <LogOut className="h-4 w-4" />
            Switch Faculty
          </Button>
        </div>
      </div>

      {/* PDF List */}
      <FacultyPDFList facultyId={selectedFacultyId} facultyName={selectedFacultyName} />
    </div>
  );
}
