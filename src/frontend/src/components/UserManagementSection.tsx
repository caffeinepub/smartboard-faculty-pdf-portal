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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import {
  type Department,
  type Faculty,
  getAdminCredentialsFull,
  setAdminCredentialsLocal,
  useAllDepartments,
  useAllFacultyAdmin,
  useLogAuditEvent,
  useUpdateFacultyCredentials,
} from "../hooks/useQueries";

function maskPassword(pw: string): string {
  return "•".repeat(Math.max(pw.length, 6));
}

// ─── Inline credential editor ──────────────────────────────────────────────

interface InlineCredEditProps {
  currentUsername: string;
  currentPassword: string;
  onSave: (username: string, password: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function InlineCredEdit({
  currentUsername,
  currentPassword,
  onSave,
  onCancel,
  isSaving,
}: InlineCredEditProps) {
  const [username, setUsername] = useState(currentUsername);
  const [password, setPassword] = useState(currentPassword);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError("");
    await onSave(username.trim(), password);
  };

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          placeholder="Username"
          className="h-8 text-sm w-36"
          disabled={isSaving}
        />
        <div className="relative">
          <Input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            className="h-8 text-sm w-36 pr-8"
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-green-600 hover:bg-green-50"
          onClick={handleSave}
          disabled={isSaving}
          data-ocid="user-mgmt.save_button"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-secondary"
          onClick={onCancel}
          disabled={isSaving}
          data-ocid="user-mgmt.cancel_button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function UserManagementSection() {
  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const { data: departments = [] } = useAllDepartments();
  const updateFacultyCreds = useUpdateFacultyCredentials();
  const logAuditEvent = useLogAuditEvent();

  // Admin section state
  const [adminCreds, setAdminCreds] = useState(() => getAdminCredentialsFull());
  const [adminEditing, setAdminEditing] = useState(false);
  const [adminRevealPw, setAdminRevealPw] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);

  // Faculty section state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [editingFacultyId, setEditingFacultyId] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [savingFacultyId, setSavingFacultyId] = useState<number | null>(null);
  const [savedFacultyId, setSavedFacultyId] = useState<number | null>(null);

  const deptMap = new Map(
    (departments as Department[]).map((d) => [d.id, d.name]),
  );

  const filtered = (allFaculty as Faculty[]).filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.username ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDept =
      deptFilter === "all" ||
      (deptFilter === "none"
        ? !f.departmentId
        : String(f.departmentId) === deptFilter);
    return matchSearch && matchDept;
  });

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isPasswordVisible = (id: number) =>
    showAllPasswords || revealedIds.has(id);

  // Admin credential save
  const handleAdminSave = async (username: string, password: string) => {
    setAdminSaving(true);
    try {
      setAdminCredentialsLocal(username, password);
      setAdminCreds({ username, password });
      setAdminEditing(false);
      setAdminSaveSuccess(true);
      logAuditEvent.mutate({
        actorType: "admin",
        actorName: "Admin",
        action: "CREDENTIALS_CHANGED",
        description: "Admin credentials were updated",
      });
      setTimeout(() => setAdminSaveSuccess(false), 3000);
    } finally {
      setAdminSaving(false);
    }
  };

  // Faculty credential save
  const handleFacultySave = async (
    facultyId: number,
    username: string,
    password: string,
  ) => {
    setSavingFacultyId(facultyId);
    try {
      await updateFacultyCreds.mutateAsync({ facultyId, username, password });
      setEditingFacultyId(null);
      setSavedFacultyId(facultyId);
      const faculty = (allFaculty as Faculty[]).find((f) => f.id === facultyId);
      logAuditEvent.mutate({
        actorType: "admin",
        actorName: "Admin",
        action: "CREDENTIALS_CHANGED",
        description: `Credentials updated for faculty "${faculty?.name ?? facultyId}"`,
      });
      setTimeout(() => setSavedFacultyId(null), 2500);
    } finally {
      setSavingFacultyId(null);
    }
  };

  const totalUsers = (allFaculty as Faculty[]).length + 1; // +1 for admin
  const withCredentials = (allFaculty as Faculty[]).filter(
    (f) => f.username,
  ).length;

  return (
    <div className="space-y-6" data-ocid="user-mgmt.section">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Admin Account</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <KeyRound className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {withCredentials}
              </p>
              <p className="text-xs text-muted-foreground">
                Faculty with Login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin credentials card */}
      <Card className="shadow-card border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Admin Account
          </CardTitle>
          <CardDescription>
            Only admin can view and change these credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminCreds ? (
            <div className="space-y-3">
              {adminEditing ? (
                <InlineCredEdit
                  currentUsername={adminCreds.username}
                  currentPassword={adminCreds.password}
                  onSave={handleAdminSave}
                  onCancel={() => setAdminEditing(false)}
                  isSaving={adminSaving}
                />
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-20">
                      Username
                    </Label>
                    <span className="font-mono text-sm bg-secondary px-2.5 py-1 rounded">
                      {adminCreds.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-20">
                      Password
                    </Label>
                    <span className="font-mono text-sm bg-secondary px-2.5 py-1 rounded">
                      {adminRevealPw
                        ? adminCreds.password
                        : maskPassword(adminCreds.password)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAdminRevealPw((v) => !v)}
                      data-ocid="user-mgmt.admin_toggle"
                    >
                      {adminRevealPw ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 ml-auto"
                    onClick={() => setAdminEditing(true)}
                    data-ocid="user-mgmt.admin_edit_button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change Password
                  </Button>
                  {adminSaveSuccess && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No admin credentials set yet. Create an admin account from the
                login screen.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Faculty credentials card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-accent" />
                Faculty Login Credentials
              </CardTitle>
              <CardDescription>
                View and change faculty usernames and passwords. Only admin has
                access to this section.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAllPasswords((v) => !v);
                setRevealedIds(new Set());
              }}
              className="gap-1.5"
              data-ocid="user-mgmt.show_all_toggle"
            >
              {showAllPasswords ? (
                <>
                  <EyeOff className="h-4 w-4" /> Hide Passwords
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Show All Passwords
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
                data-ocid="user-mgmt.search_input"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger
                className="h-9 w-44"
                data-ocid="user-mgmt.dept_select"
              >
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="none">No Department</SelectItem>
                {(departments as Department[]).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div
              className="rounded-lg border border-border p-10 text-center text-muted-foreground"
              data-ocid="user-mgmt.empty_state"
            >
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No faculty members found.</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
              <Table data-ocid="user-mgmt.table">
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-bold text-foreground w-8">
                      #
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Department
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Username
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Password
                    </TableHead>
                    <TableHead className="font-bold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-foreground text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((faculty, index) => (
                    <TableRow
                      key={faculty.id}
                      className={!faculty.active ? "opacity-60" : ""}
                      data-ocid={`user-mgmt.row.${index + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {faculty.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {faculty.departmentId
                          ? (deptMap.get(faculty.departmentId) ?? "—")
                          : "—"}
                      </TableCell>

                      {editingFacultyId === faculty.id ? (
                        <TableCell colSpan={3}>
                          <InlineCredEdit
                            currentUsername={faculty.username ?? ""}
                            currentPassword={faculty.password ?? ""}
                            onSave={(u, p) =>
                              handleFacultySave(faculty.id, u, p)
                            }
                            onCancel={() => setEditingFacultyId(null)}
                            isSaving={savingFacultyId === faculty.id}
                          />
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>
                            {faculty.username ? (
                              <span className="font-mono text-sm bg-secondary px-2 py-0.5 rounded">
                                {faculty.username}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                Not set
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {faculty.password ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm bg-secondary px-2 py-0.5 rounded">
                                  {isPasswordVisible(faculty.id)
                                    ? faculty.password
                                    : maskPassword(faculty.password)}
                                </span>
                                {!showAllPasswords && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleReveal(faculty.id)}
                                    data-ocid={`user-mgmt.reveal.${index + 1}`}
                                  >
                                    {revealedIds.has(faculty.id) ? (
                                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                Not set
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                faculty.active
                                  ? "bg-success/15 text-success border-success/30 text-xs"
                                  : "text-muted-foreground text-xs"
                              }
                              variant={faculty.active ? "outline" : "outline"}
                            >
                              {faculty.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-right">
                        {editingFacultyId !== faculty.id &&
                          (savedFacultyId === faculty.id ? (
                            <span className="flex items-center justify-end gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-7 text-xs"
                              onClick={() => setEditingFacultyId(faculty.id)}
                              data-ocid={`user-mgmt.edit_button.${index + 1}`}
                            >
                              <Pencil className="h-3 w-3" />
                              Change
                            </Button>
                          ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {(allFaculty as Faculty[]).length}{" "}
            faculty members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
