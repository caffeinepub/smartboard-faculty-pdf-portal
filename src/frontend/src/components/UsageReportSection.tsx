import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAllDepartments,
  useAllFacultyAdmin,
  useAllPDFs,
} from "../hooks/useQueries";

export default function UsageReportSection() {
  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const { data: pdfs = [] } = useAllPDFs();
  const { data: departments = [] } = useAllDepartments();

  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Build per-faculty usage rows
  const rows = useMemo(() => {
    return allFaculty.map((faculty) => {
      const assigned = pdfs.filter((p) => p.facultyIds.includes(faculty.id));
      const taught = assigned.filter((p) => p.taught);
      const notTaught = assigned.filter((p) => !p.taught);
      const dept = departments.find((d) => d.id === faculty.departmentId);
      return {
        faculty,
        deptName: dept?.name ?? "—",
        assigned,
        taught,
        notTaught,
      };
    });
  }, [allFaculty, pdfs, departments]);

  // Filter
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (deptFilter !== "all" && String(r.faculty.departmentId) !== deptFilter)
        return false;
      if (statusFilter === "taught" && r.taught.length === 0) return false;
      if (statusFilter === "not-taught" && r.notTaught.length === 0)
        return false;
      return true;
    });
  }, [rows, deptFilter, statusFilter]);

  // Summary stats
  const totalPDFs = pdfs.length;
  const totalTaught = pdfs.filter((p) => p.taught).length;
  const totalActiveFaculty = allFaculty.filter((f) => f.active).length;
  const facultyWhoTaught = rows.filter((r) => r.taught.length > 0).length;

  // CSV export
  const handleExportCSV = () => {
    const headers = [
      "Faculty Name",
      "Department",
      "Assigned PDFs",
      "Taught PDFs",
      "Not Taught PDFs",
      "Status",
    ];
    const csvRows = filtered.map((r) => [
      r.faculty.name,
      r.deptName,
      r.assigned.length,
      r.taught.map((p) => p.title).join("; "),
      r.notTaught.map((p) => p.title).join("; "),
      r.taught.length === r.assigned.length && r.assigned.length > 0
        ? "All Taught"
        : r.taught.length > 0
          ? "Partial"
          : "Not Started",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usage-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (taught: number, total: number) => {
    if (total === 0) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          No PDFs
        </Badge>
      );
    }
    if (taught === total) {
      return (
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          All Taught
        </Badge>
      );
    }
    if (taught > 0) {
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
          Partial ({taught}/{total})
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
        <XCircle className="h-3 w-3 mr-1" />
        Not Started
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-ocid="usage_report.section">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{totalPDFs}</p>
                <p className="text-xs text-muted-foreground">Total PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-success">
                  {totalTaught}
                </p>
                <p className="text-xs text-muted-foreground">PDFs Taught</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {totalActiveFaculty}
                </p>
                <p className="text-xs text-muted-foreground">Active Faculty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {facultyWhoTaught}
                </p>
                <p className="text-xs text-muted-foreground">Faculty Taught</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-accent" />
                Faculty Usage Report
              </CardTitle>
              <CardDescription>
                Track which faculty taught which PDFs to students.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 self-start sm:self-auto"
              data-ocid="usage_report.button"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger
                className="h-9 w-44"
                data-ocid="usage_report.select"
              >
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="h-9 w-40"
                data-ocid="usage_report.select"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="taught">Taught</SelectItem>
                <SelectItem value="not-taught">Not Taught</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="usage_report.empty_state"
            >
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No faculty data found
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add faculty members and assign PDFs to see usage reports here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table data-ocid="usage_report.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">
                      Faculty Name
                    </TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold text-center">
                      Assigned
                    </TableHead>
                    <TableHead className="font-semibold">Taught PDFs</TableHead>
                    <TableHead className="font-semibold">
                      Not Taught PDFs
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow
                      key={r.faculty.id}
                      className="hover:bg-muted/20 transition-colors"
                      data-ocid={`usage_report.row.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {r.faculty.name.charAt(0).toUpperCase()}
                          </div>
                          {r.faculty.name}
                          {!r.faculty.active && (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.deptName}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {r.assigned.length}
                      </TableCell>
                      <TableCell>
                        {r.taught.length === 0 ? (
                          <span className="text-sm text-muted-foreground/60 italic">
                            None yet
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.taught.map((p) => (
                              <Badge
                                key={p.id}
                                variant="outline"
                                className="text-xs bg-success/5 text-success border-success/20 max-w-[140px] truncate"
                                title={p.title}
                              >
                                {p.title}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.notTaught.length === 0 ? (
                          <span className="text-sm text-muted-foreground/60 italic">
                            —
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {r.notTaught.map((p) => (
                              <Badge
                                key={p.id}
                                variant="outline"
                                className="text-xs max-w-[140px] truncate text-muted-foreground"
                                title={p.title}
                              >
                                {p.title}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(r.taught.length, r.assigned.length)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Showing {filtered.length} of {allFaculty.length} faculty member
              {allFaculty.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
