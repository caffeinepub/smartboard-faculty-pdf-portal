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
  Download,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import type { Department, Faculty, PDF } from "../hooks/useQueries";
import {
  useAllDepartments,
  useAllFacultyAdmin,
  useAllPDFs,
} from "../hooks/useQueries";

function maskPassword(pw: string): string {
  return "•".repeat(Math.max(pw.length, 6));
}

function exportCSV(rows: Faculty[], departments: Department[]) {
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const header = [
    "Name",
    "Username",
    "Password",
    "Department",
    "Subject",
    "Status",
  ];
  const lines = rows.map((f) => [
    `"${f.name}"`,
    `"${f.username ?? ""}"`,
    `"${f.password ?? ""}"`,
    `"${f.departmentId ? (deptMap.get(f.departmentId) ?? "") : ""}"`,
    `"${f.subject ?? ""}"`,
    `"${f.active ? "Active" : "Inactive"}"`,
  ]);
  const csv = [header.join(","), ...lines.map((l) => l.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `faculty-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UserManagementReport() {
  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const { data: departments = [] } = useAllDepartments();
  const { data: allPdfs = [] } = useAllPDFs();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [showAllPasswords, setShowAllPasswords] = useState(false);

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
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? f.active : !f.active);
    return matchSearch && matchDept && matchStatus;
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

  const activeCount = (allFaculty as Faculty[]).filter((f) => f.active).length;
  const withCredentials = (allFaculty as Faculty[]).filter(
    (f) => f.username,
  ).length;

  return (
    <div className="space-y-6" data-ocid="user-mgmt-report.section">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {(allFaculty as Faculty[]).length}
              </p>
              <p className="text-xs text-muted-foreground">Total Faculty</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {activeCount}
              </p>
              <p className="text-xs text-muted-foreground">Active Faculty</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {withCredentials}
              </p>
              <p className="text-xs text-muted-foreground">
                With Login Credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Faculty Login Credentials
              </CardTitle>
              <CardDescription>
                View and manage faculty login usernames and passwords. Passwords
                are masked by default.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAllPasswords((v) => !v);
                  setRevealedIds(new Set());
                }}
                className="gap-1.5"
                data-ocid="user-mgmt-report.toggle"
              >
                {showAllPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide All
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show All Passwords
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(filtered, departments as Department[])}
                className="gap-1.5"
                data-ocid="user-mgmt-report.export_button"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
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
                data-ocid="user-mgmt-report.search_input"
              />
            </div>
            <Select
              value={deptFilter}
              onValueChange={setDeptFilter}
              data-ocid="user-mgmt-report.dept_select"
            >
              <SelectTrigger className="h-9 w-44">
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
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              data-ocid="user-mgmt-report.status_select"
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div
              className="rounded-lg border border-border p-10 text-center text-muted-foreground"
              data-ocid="user-mgmt-report.empty_state"
            >
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No faculty members found.</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
              <Table data-ocid="user-mgmt-report.table">
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
                      Subject
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
                    <TableHead className="font-bold text-foreground text-center">
                      PDFs
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((faculty, index) => (
                    <TableRow
                      key={faculty.id}
                      className={!faculty.active ? "opacity-60" : ""}
                      data-ocid={`user-mgmt-report.row.${index + 1}`}
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
                      <TableCell className="text-sm text-muted-foreground">
                        {faculty.subject || "—"}
                      </TableCell>
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
                                data-ocid={`user-mgmt-report.toggle.${index + 1}`}
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
                        {faculty.active ? (
                          <Badge className="bg-success/15 text-success border-success/30 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-xs"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {
                          (allPdfs as { facultyIds: number[] }[]).filter((p) =>
                            p.facultyIds.includes(faculty.id),
                          ).length
                        }
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
