import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Faculty } from "../hooks/useQueries";

const SESSION_KEY = "eduboard_faculty_session";
const PERSIST_KEY = "eduboard_faculty_persist";

interface FacultyAuthContextType {
  loggedInFaculty: Faculty | null;
  loginFaculty: (faculty: Faculty) => void;
  logoutFaculty: () => void;
}

const FacultyAuthContext = createContext<FacultyAuthContextType | undefined>(
  undefined,
);

export function FacultyAuthProvider({ children }: { children: ReactNode }) {
  const [loggedInFaculty, setLoggedInFaculty] = useState<Faculty | null>(null);

  // On mount: restore session from sessionStorage or localStorage (persistent)
  useEffect(() => {
    try {
      // Check sessionStorage first, then fall back to localStorage persist
      const raw =
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Faculty;
        // Re-validate against current localStorage data
        const facultyList: Faculty[] = JSON.parse(
          localStorage.getItem("eduboard_faculty") || "[]",
        );
        const current = facultyList.find((f) => f.id === stored.id && f.active);
        if (current) {
          setLoggedInFaculty(current);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(PERSIST_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PERSIST_KEY);
    }
  }, []);

  const loginFaculty = (faculty: Faculty) => {
    const serialized = JSON.stringify(faculty);
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.setItem(PERSIST_KEY, serialized);
    setLoggedInFaculty(faculty);
  };

  const logoutFaculty = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    setLoggedInFaculty(null);
  };

  return (
    <FacultyAuthContext.Provider
      value={{ loggedInFaculty, loginFaculty, logoutFaculty }}
    >
      {children}
    </FacultyAuthContext.Provider>
  );
}

export function useFacultyAuth() {
  const ctx = useContext(FacultyAuthContext);
  if (!ctx) {
    throw new Error("useFacultyAuth must be used within FacultyAuthProvider");
  }
  return ctx;
}
