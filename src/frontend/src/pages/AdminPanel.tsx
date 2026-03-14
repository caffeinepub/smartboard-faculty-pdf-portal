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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertCircle,
  BarChart2,
  Building2,
  FileText,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import AcademicYearFolderSetup from "../components/AcademicYearFolderSetup";
import AdminPasscodeGate, { LOCK_EVENT } from "../components/AdminPasscodeGate";
import AuditReportSection from "../components/AuditReportSection";
import ChangeAdminCredentialsForm from "../components/ChangeAdminCredentialsForm";
import CreateFacultyModal from "../components/CreateFacultyModal";
import DepartmentManagementSection from "../components/DepartmentManagementSection";
import FacultyManagementTable from "../components/FacultyManagementTable";
import PDFListTable from "../components/PDFListTable";
import PDFUploadForm from "../components/PDFUploadForm";
import UsageReportSection from "../components/UsageReportSection";
import UserManagementReport from "../components/UserManagementReport";
import {
  type Faculty,
  useAddFaculty,
  useAllDepartments,
  useAllFacultyAdmin,
  useAllPDFs,
  useLogAuditEvent,
} from "../hooks/useQueries";

function parseInlineError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes("limit reached") || lower.includes("faculty limit")) {
    return "Faculty limit reached for your current plan. Please upgrade.";
  }
  if (
    lower.includes("unauthorized") ||
    lower.includes("only admins") ||
    lower.includes("admin-only")
  ) {
    return "Admin access required to add faculty members.";
  }
  if (
    lower.includes("name cannot be empty") ||
    lower.includes("empty or whitespace")
  ) {
    return "Faculty name cannot be empty.";
  }
  if (lower.includes("already exists") || lower.includes("duplicate")) {
    return "A faculty member with this name already exists.";
  }
  return raw || "Failed to add faculty. Please try again.";
}

function AdminPanelContent() {
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyDeptId, setNewFacultyDeptId] = useState<string>("");
  const [newFacultyUsername, setNewFacultyUsername] = useState("");
  const [newFacultyPassword, setNewFacultyPassword] = useState("");
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false);

  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const { data: pdfs = [] } = useAllPDFs();
  const { data: departments = [] } = useAllDepartments();
  const addFaculty = useAddFaculty();
  const logAuditEvent = useLogAuditEvent();

  const activeFacultyCount = (allFaculty as Faculty[]).filter(
    (f) => f.active,
  ).length;
  const handleLockSignOut = () => {
    window.dispatchEvent(new Event(LOCK_EVENT));
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyError(null);
    const name = newFacultyName.trim();
    if (!name) {
      setFacultyError("Please enter a faculty name.");
      return;
    }
    try {
      const result = await addFaculty.mutateAsync({
        name,
        departmentId: newFacultyDeptId
          ? Number.parseInt(newFacultyDeptId, 10)
          : undefined,
        username: newFacultyUsername.trim() || undefined,
        password: newFacultyPassword || undefined,
      });
      if (result.__kind__ === "success") {
        setNewFacultyName("");
        setNewFacultyDeptId("");
        setNewFacultyUsername("");
        setNewFacultyPassword("");
        setFacultyError(null);
        logAuditEvent.mutate({
          actorType: "admin",
          actorName: "Admin",
          action: "FACULTY_CREATED",
          description: `Faculty member "${name}" created`,
        });
      } else if (result.__kind__ === "error") {
        setFacultyError(
          result.message || "Failed to add faculty. Please try again.",
        );
      }
    } catch (err: unknown) {
      setFacultyError(parseInlineError(err));
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Manage departments, faculty members, and upload teaching
                materials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <Users className="h-4 w-4 mr-1.5" />
              {activeFacultyCount} Faculty
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <FileText className="h-4 w-4 mr-1.5" />
              {pdfs.length} PDFs
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockSignOut}
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            >
              <LogOut className="h-4 w-4" />
              Lock / Sign Out
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger
              value="faculty"
              className="gap-1.5"
              data-ocid="admin.faculty.tab"
            >
              <Users className="h-4 w-4" />
              Faculty
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="gap-1.5"
              data-ocid="admin.departments.tab"
            >
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger
              value="pdfs"
              className="gap-1.5"
              data-ocid="admin.pdfs.tab"
            >
              <FileText className="h-4 w-4" />
              PDFs
            </TabsTrigger>
            <TabsTrigger
              value="usage-report"
              className="gap-1.5"
              data-ocid="admin.usage-report.tab"
            >
              <BarChart2 className="h-4 w-4" />
              Usage Report
            </TabsTrigger>
            <TabsTrigger
              value="audit-report"
              className="gap-1.5"
              data-ocid="admin.audit-report.tab"
            >
              <Shield className="h-4 w-4" />
              Audit Report
            </TabsTrigger>
            <TabsTrigger
              value="user-report"
              className="gap-1.5"
              data-ocid="admin.user-report.tab"
            >
              <ShieldCheck className="h-4 w-4" />
              User Report
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-1.5"
              data-ocid="admin.settings.tab"
            >
              <KeyRound className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Faculty Tab */}
          <TabsContent value="faculty" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Add Faculty */}
              <div className="lg:col-span-1">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-5 w-5 text-accent" />
                      Add Faculty Member
                    </CardTitle>
                    <CardDescription>
                      Add a new faculty member to the system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddFaculty} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="faculty-name" className="font-semibold">
                          Faculty Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="faculty-name"
                          data-ocid="faculty.input"
                          value={newFacultyName}
                          onChange={(e) => {
                            setNewFacultyName(e.target.value);
                            if (facultyError) setFacultyError(null);
                          }}
                          placeholder="e.g., Dr. Sarah Johnson"
                          className="h-11"
                          disabled={addFaculty.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="faculty-dept">Department</Label>
                        <Select
                          value={newFacultyDeptId}
                          onValueChange={setNewFacultyDeptId}
                          disabled={addFaculty.isPending}
                        >
                          <SelectTrigger id="faculty-dept" className="h-11">
                            <SelectValue placeholder="Select department (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No department</SelectItem>
                            {(
                              departments as { id: number; name: string }[]
                            ).map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="faculty-username">Username</Label>
                        <Input
                          id="faculty-username"
                          value={newFacultyUsername}
                          onChange={(e) =>
                            setNewFacultyUsername(e.target.value)
                          }
                          placeholder="For faculty login"
                          className="h-11"
                          disabled={addFaculty.isPending}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="faculty-password">Password</Label>
                        <Input
                          id="faculty-password"
                          type="password"
                          value={newFacultyPassword}
                          onChange={(e) =>
                            setNewFacultyPassword(e.target.value)
                          }
                          placeholder="Set login password"
                          className="h-11"
                          disabled={addFaculty.isPending}
                        />
                      </div>

                      {facultyError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {facultyError}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        data-ocid="faculty.submit_button"
                        disabled={addFaculty.isPending}
                        className="w-full"
                      >
                        {addFaculty.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Faculty
                      </Button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsCreateFacultyOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Advanced Add (with credentials)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Faculty Table */}
              <div className="lg:col-span-2">
                <FacultyManagementTable
                  facultyList={allFaculty}
                  allPdfs={pdfs}
                />
              </div>
            </div>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="mt-6">
            <DepartmentManagementSection />
          </TabsContent>

          {/* PDFs Tab */}
          <TabsContent value="pdfs" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                {/* Year & Folder Setup — above upload form */}
                <AcademicYearFolderSetup />

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-accent" />
                      Upload PDF
                    </CardTitle>
                    <CardDescription>
                      Upload a PDF and assign it to faculty members or a whole
                      department.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PDFUploadForm />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <PDFListTable pdfs={pdfs} facultyList={allFaculty} />
              </div>
            </div>
          </TabsContent>

          {/* Usage Report Tab */}
          <TabsContent value="usage-report" className="mt-6">
            <UsageReportSection />
          </TabsContent>

          {/* Audit Report Tab */}
          <TabsContent value="audit-report" className="mt-6">
            <AuditReportSection />
          </TabsContent>

          {/* User Management Report Tab */}
          <TabsContent value="user-report" className="mt-6">
            <UserManagementReport />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Separator className="mb-6" />
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-semibold text-foreground">
                Admin Credentials
              </h2>
            </div>
            <Card className="shadow-card max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <KeyRound className="h-5 w-5 text-accent" />
                  Change Admin Credentials
                </CardTitle>
                <CardDescription>
                  Update the admin username and password used to access this
                  panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangeAdminCredentialsForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateFacultyModal
        open={isCreateFacultyOpen}
        onOpenChange={setIsCreateFacultyOpen}
      />
    </TooltipProvider>
  );
}

export default function AdminPanel() {
  return (
    <AdminPasscodeGate>
      <AdminPanelContent />
    </AdminPasscodeGate>
  );
}
