import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import FacultyAIAssistant from "../components/FacultyAIAssistant";
import FacultyPDFList from "../components/FacultyPDFList";
import { useFacultyAuth } from "../context/FacultyAuthContext";
import {
  useAllDepartments,
  useFacultyLogin,
  useLogAuditEvent,
} from "../hooks/useQueries";

function FacultyLoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginFaculty } = useFacultyAuth();
  const loginMutation = useFacultyLogin();
  const logAuditEvent = useLogAuditEvent();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    const faculty = await loginMutation.mutateAsync({
      username: username.trim(),
      password,
    });
    if (faculty) {
      loginFaculty(faculty);
      logAuditEvent.mutate({
        actorType: "faculty",
        actorName: faculty.name,
        action: "LOGIN",
        description: `Faculty ${faculty.name} logged in`,
      });
    } else {
      setError(
        "Invalid username or password. Contact your admin for login credentials.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Faculty Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access your teaching materials
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Faculty Login</CardTitle>
            <CardDescription>
              Enter your credentials to view your assigned PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fp-username">Username</Label>
                <Input
                  id="fp-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loginMutation.isPending}
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fp-password">Password</Label>
                <div className="relative">
                  <Input
                    id="fp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Contact your admin for login credentials.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function FacultyDashboard() {
  const { loggedInFaculty, logoutFaculty } = useFacultyAuth();
  const { data: departments = [] } = useAllDepartments();

  if (!loggedInFaculty) return null;

  const department = loggedInFaculty.departmentId
    ? departments.find((d) => d.id === loggedInFaculty.departmentId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {loggedInFaculty.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground leading-tight">
                {loggedInFaculty.name}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {department && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {department.name}
                  </span>
                )}
                {loggedInFaculty.subject && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {loggedInFaculty.subject}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs hidden sm:flex items-center gap-1"
            >
              <User className="h-3 w-3" />
              Faculty
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={logoutFaculty}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="container mx-auto px-4 py-5 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="font-display text-2xl font-bold text-foreground">
              Welcome back, {loggedInFaculty.name.split(" ")[0]}!
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {department
                ? `${department.name} Department`
                : "Your assigned teaching materials are listed below."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* PDF List */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <FacultyPDFList
          facultyId={loggedInFaculty.id}
          facultyName={loggedInFaculty.name}
        />
      </div>

      {/* AI Assistant */}
      <FacultyAIAssistant />
    </div>
  );
}

export default function FacultyPortal() {
  const { loggedInFaculty } = useFacultyAuth();

  if (!loggedInFaculty) {
    return <FacultyLoginScreen />;
  }

  return <FacultyDashboard />;
}
