import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FacultyContextType {
  selectedFacultyId: number | null;
  selectedFacultyName: string | null;
  setSelectedFaculty: (id: number, name: string) => void;
  clearSelectedFaculty: () => void;
}

const FacultyContext = createContext<FacultyContextType | undefined>(undefined);

export function FacultyProvider({ children }: { children: ReactNode }) {
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState<string | null>(null);

  const setSelectedFaculty = (id: number, name: string) => {
    setSelectedFacultyId(id);
    setSelectedFacultyName(name);
  };

  const clearSelectedFaculty = () => {
    setSelectedFacultyId(null);
    setSelectedFacultyName(null);
  };

  return (
    <FacultyContext.Provider
      value={{ selectedFacultyId, selectedFacultyName, setSelectedFaculty, clearSelectedFaculty }}
    >
      {children}
    </FacultyContext.Provider>
  );
}

export function useFacultyContext() {
  const context = useContext(FacultyContext);
  if (!context) {
    throw new Error('useFacultyContext must be used within a FacultyProvider');
  }
  return context;
}
