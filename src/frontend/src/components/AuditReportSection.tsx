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
  Download,
  Globe,
  LogIn,
  Monitor,
  Shield,
  Upload,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuditLog } from "../hooks/useQueries";

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getActionBadge(action: string) {
  const map: Record<
    string,
    { label: string; class: string; icon: React.ReactNode }
  > = {
    LOGIN: {
      label: "Login",
      class:
        "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
      icon: <LogIn className="h-3 w-3" />,
    },
    PDF_OPEN: {
      label: "PDF Open",
      class:
        "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
      icon: <Shield className="h-3 w-3" />,
    },
    PDF_TAUGHT: {
      label: "PDF Taught",
      class: "bg-success/10 text-success border-success/20",
      icon: <Shield className="h-3 w-3" />,
    },
    FACULTY_CREATED: {
      label: "Faculty Created",
      class:
        "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
      icon: <UserPlus className="h-3 w-3" />,
    },
    PDF_UPLOADED: {
      label: "PDF Uploaded",
      class: "bg-primary/10 text-primary border-primary/20",
      icon: <Upload className="h-3 w-3" />,
    },
  };

  const config = map[action] ?? {
    label: action,
    class: "bg-muted text-muted-foreground border-border",
    icon: <Monitor className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs font-medium ${config.class}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

function getRoleBadge(role: string) {
  if (role === "admin") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-destructive/10 text-destructive border-destructive/20"
      >
        Admin
      </Badge>
    );
  }
  if (role === "developer") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-violet-500/10 text-violet-600 border-violet-500/20"
      >
        Developer
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-xs bg-primary/10 text-primary border-primary/20"
    >
      Faculty
    </Badge>
  );
}

export default function AuditReportSection() {
  const { data: log = [] } = useAuditLog();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Sorted most recent first
  const sorted = useMemo(
    () => [...log].sort((a, b) => b.timestamp - a.timestamp),
    [log],
  );

  // Apply filters
  const filtered = useMemo(() => {
    return sorted.filter((entry) => {
      if (actorFilter !== "all" && entry.actorType !== actorFilter)
        return false;
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (fromDate) {
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (entry.timestamp < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate).setHours(23, 59, 59, 999);
        if (entry.timestamp > to) return false;
      }
      return true;
    });
  }, [sorted, actorFilter, actionFilter, fromDate, toDate]);

  // CSV export
  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "Actor",
      "Role",
      "Action",
      "Description",
      "IP Address",
      "Device",
    ];
    const csvRows = filtered.map((entry) => [
      formatDateTime(entry.timestamp),
      entry.actorName,
      entry.actorType,
      entry.action,
      entry.description,
      entry.ipAddress,
      entry.deviceFingerprint ?? "—",
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
    link.download = `audit-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-ocid="audit_report.section">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-accent" />
                Audit Report
              </CardTitle>
              <CardDescription>
                Track all access events — who accessed what, from which IP, and
                when.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 self-start sm:self-auto"
              data-ocid="audit_report.button"
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 pt-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 w-40 text-sm"
                data-ocid="audit_report.input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 w-40 text-sm"
                data-ocid="audit_report.input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger
                  className="h-9 w-36"
                  data-ocid="audit_report.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger
                  className="h-9 w-44"
                  data-ocid="audit_report.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="PDF_OPEN">PDF Open</SelectItem>
                  <SelectItem value="PDF_TAUGHT">PDF Taught</SelectItem>
                  <SelectItem value="FACULTY_CREATED">
                    Faculty Created
                  </SelectItem>
                  <SelectItem value="PDF_UPLOADED">PDF Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(fromDate ||
              toDate ||
              actorFilter !== "all" ||
              actionFilter !== "all") && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground opacity-0 select-none">
                  &nbsp;
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setActorFilter("all");
                    setActionFilter("all");
                  }}
                  data-ocid="audit_report.secondary_button"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {log.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-center"
              data-ocid="audit_report.empty_state"
            >
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Shield className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">
                No audit events recorded yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                Events will appear here as the app is used — logins, PDF opens,
                and more.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 text-center"
              data-ocid="audit_report.empty_state"
            >
              <Shield className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                No matching events
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Try adjusting the filters above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table data-ocid="audit_report.table">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold whitespace-nowrap">
                      Timestamp
                    </TableHead>
                    <TableHead className="font-semibold">Actor</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        IP Address
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Device
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, idx) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-muted/20 transition-colors"
                      data-ocid={`audit_report.row.${idx + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {formatDateTime(entry.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {entry.actorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{entry.actorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(entry.actorType)}</TableCell>
                      <TableCell>{getActionBadge(entry.action)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[260px]">
                        <span
                          className="line-clamp-2"
                          title={entry.description}
                        >
                          {entry.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                          <Globe className="h-3 w-3 shrink-0" />
                          {entry.ipAddress}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {entry.deviceFingerprint
                          ? `${entry.deviceFingerprint.slice(0, 12)}...`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Showing {filtered.length} of {log.length} audit event
              {log.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
