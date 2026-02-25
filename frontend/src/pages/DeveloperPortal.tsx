import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Shield,
  FileText,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Monitor,
  Crown,
  PenLine,
  UserCheck,
  UserX,
  Zap,
  Gem,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useIsAdmin,
  useAllFacultyWithPdfCount,
  useGetDevices,
  useAnnotationsByPDF,
  useAllPDFs,
  PLAN_TIERS,
  type BillingCycle,
} from '@/hooks/useQueries';
import type { Annotation, PDF, FacultyWithPdfCount } from '../backend';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLicenseId(): string {
  return localStorage.getItem('eduboard_license_id') || window.location.hostname || 'eduboard-default-license';
}

function getSelectedPlan(): { planName: 'basic' | 'premium' | 'diamond'; billingCycle: BillingCycle } {
  try {
    const raw = localStorage.getItem('eduboard_selected_plan');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { planName: 'basic', billingCycle: 'monthly' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
      <AlertCircle className="h-8 w-8" />
      <p className="font-medium text-sm">Failed to load data</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  onRefresh,
  isFetching,
}: {
  title: string;
  icon: React.ElementType;
  onRefresh: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        className="gap-1.5 h-8 text-xs"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}

// ─── Faculty Tab ──────────────────────────────────────────────────────────────

function FacultyTab() {
  const { data: facultyList = [], isLoading, isError, refetch, isFetching } = useAllFacultyWithPdfCount();

  return (
    <div>
      <SectionHeader title="All Faculty Members" icon={Users} onRefresh={refetch} isFetching={isFetching} />
      {isLoading ? (
        <SectionSkeleton rows={5} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : facultyList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No faculty members found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">PDFs Assigned</TableHead>
                <TableHead className="text-right">Faculty ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyList.map((item: FacultyWithPdfCount, idx: number) => (
                <TableRow key={item.faculty.id.toString()} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {item.faculty.name.charAt(0).toUpperCase()}
                      </div>
                      {item.faculty.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.faculty.active ? (
                      <Badge className="bg-success/15 text-success border-success/30 gap-1 text-xs">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                        <UserX className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold text-sm">{Number(item.pdfCount)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      #{item.faculty.id.toString()}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── PDFs Tab ─────────────────────────────────────────────────────────────────

function PDFsTab({
  allPDFs,
  isLoading,
  isError,
  refetch,
  isFetching,
  facultyMap,
}: {
  allPDFs: PDF[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isFetching: boolean;
  facultyMap: Map<string, string>;
}) {
  const [search, setSearch] = useState('');

  const filtered = allPDFs.filter((pdf) =>
    pdf.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          All PDFs
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isFetching}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SectionSkeleton rows={5} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">
            {search ? 'No PDFs match your search' : 'No PDFs uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[200px]">Title</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                <TableHead className="whitespace-nowrap">Upload Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pdf) => {
                const facultyNames = pdf.facultyIds
                  .map((id) => facultyMap.get(id.toString()) ?? `Faculty #${id}`)
                  .join(', ');
                return (
                  <TableRow key={pdf.id.toString()} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-foreground max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary/60 shrink-0" />
                        <span className="truncate">{pdf.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                      {pdf.facultyIds.length === 0 ? (
                        <span className="italic text-xs">Unassigned</span>
                      ) : (
                        <span className="truncate block">{facultyNames}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {formatDate(pdf.uploadDate)}
                    </TableCell>
                    <TableCell>
                      {pdf.taught ? (
                        <Badge className="bg-success/15 text-success border-success/30 gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Taught
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Annotations Tab ──────────────────────────────────────────────────────────

function AnnotationsTab({
  allPDFs,
  pdfsLoading,
}: {
  allPDFs: PDF[];
  pdfsLoading: boolean;
}) {
  // Collect all annotations from all PDFs using the first PDF's annotations as a sample
  // Since the backend only supports per-PDF annotation queries, we show a summary
  const pdfTitleMap = new Map<string, string>();
  allPDFs.forEach((pdf) => {
    pdfTitleMap.set(pdf.id.toString(), pdf.title);
  });

  if (pdfsLoading) {
    return (
      <div>
        <SectionHeader title="All Annotations" icon={PenLine} onRefresh={() => {}} isFetching={false} />
        <SectionSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
          <PenLine className="h-4 w-4 text-primary" />
          Annotations Overview
        </h3>
      </div>
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <PenLine className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Select a PDF from the PDFs tab to view its annotations</p>
        <p className="text-xs text-center max-w-xs">
          Annotations are stored per-PDF. Navigate to the Teaching View to see and add annotations for a specific PDF.
        </p>
      </div>
    </div>
  );
}

// ─── Subscription Tab ─────────────────────────────────────────────────────────

function SubscriptionTab({
  facultyCount,
  pdfCount,
}: {
  facultyCount: number;
  pdfCount: number;
}) {
  const selectedPlan = getSelectedPlan();
  const planTier = PLAN_TIERS.find((p) => p.name === selectedPlan.planName) ?? PLAN_TIERS[0];
  const cycleData = planTier.billingCycles.find((c) => c.key === selectedPlan.billingCycle) ?? planTier.billingCycles[0];

  const facultyPct = Math.min(100, Math.round((facultyCount / planTier.maxFaculty) * 100));
  const pdfPct = Math.min(100, Math.round((pdfCount / planTier.maxPdfs) * 100));

  const PlanIcon = planTier.name === 'diamond' ? Gem : planTier.name === 'premium' ? Crown : Zap;

  const tierColors: Record<string, string> = {
    basic: 'text-primary bg-primary/10',
    premium: 'text-accent bg-accent/10',
    diamond: 'text-sky-600 bg-sky-500/10',
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
          <Crown className="h-4 w-4 text-primary" />
          Subscription Overview
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Info Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Active Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tierColors[planTier.name]}`}>
                <PlanIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{planTier.label}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedPlan.billingCycle} billing</p>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-foreground">{formatPrice(cycleData.priceInr)}</p>
              <p className="text-xs text-muted-foreground">per {selectedPlan.billingCycle} period</p>
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Faculty
                </span>
                <span className="font-semibold text-foreground">
                  {facultyCount} / {planTier.maxFaculty}
                </span>
              </div>
              <Progress value={facultyPct} className="h-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  PDFs
                </span>
                <span className="font-semibold text-foreground">
                  {pdfCount} / {planTier.maxPdfs}
                </span>
              </div>
              <Progress value={pdfPct} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card className="border-border/60 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Plan Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {planTier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Devices Tab ──────────────────────────────────────────────────────────────

interface DeviceRecord {
  fingerprint: string;
  timestamp: bigint;
}

function DevicesTab() {
  const { data: devicesRaw = [], isLoading, refetch, isFetching } = useGetDevices();
  const devices = devicesRaw as DeviceRecord[];
  const licenseId = getLicenseId();

  return (
    <div>
      <SectionHeader title="Registered Devices" icon={Monitor} onRefresh={refetch} isFetching={isFetching} />
      {isLoading ? (
        <SectionSkeleton rows={4} />
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Monitor className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No devices registered</p>
          <p className="text-xs">License ID: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{licenseId}</code></p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>#</TableHead>
                <TableHead>Fingerprint</TableHead>
                <TableHead>Registered On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device, idx) => (
                <TableRow key={device.fingerprint} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {device.fingerprint.slice(0, 24)}…
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(device.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeveloperPortal() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: facultyWithPdfCount = [] } = useAllFacultyWithPdfCount();
  const { data: allPDFs = [], isLoading: pdfsLoading, isError: pdfsError, refetch: refetchPDFs, isFetching: pdfsFetching } = useAllPDFs();

  // Build faculty map for PDF tab
  const facultyMap = new Map<string, string>();
  facultyWithPdfCount.forEach((item: FacultyWithPdfCount) => {
    facultyMap.set(item.faculty.id.toString(), item.faculty.name);
  });

  const totalFaculty = facultyWithPdfCount.length;
  const totalPDFs = allPDFs.length;

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading portal…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This portal is restricted to administrators only.
              </p>
            </div>
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-base leading-tight">Developer Portal</h1>
              <p className="text-xs text-muted-foreground">Admin Overview</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/admin' })}
            className="gap-2 text-xs"
          >
            ← Admin Panel
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            icon={Users}
            label="Total Faculty"
            value={totalFaculty}
            color="bg-primary/10 text-primary"
          />
          <StatsCard
            icon={FileText}
            label="Total PDFs"
            value={totalPDFs}
            color="bg-accent/10 text-accent"
          />
          <StatsCard
            icon={CheckCircle2}
            label="Taught PDFs"
            value={allPDFs.filter((p) => p.taught).length}
            color="bg-success/10 text-success"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Pending PDFs"
            value={allPDFs.filter((p) => !p.taught).length}
            color="bg-warning/10 text-warning"
          />
        </div>

        {/* Tabs */}
        <Card className="border-border/60">
          <CardContent className="pt-5">
            <Tabs defaultValue="faculty">
              <TabsList className="mb-5 flex-wrap h-auto gap-1">
                <TabsTrigger value="faculty" className="gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  Faculty
                </TabsTrigger>
                <TabsTrigger value="pdfs" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  PDFs
                </TabsTrigger>
                <TabsTrigger value="annotations" className="gap-1.5 text-xs">
                  <PenLine className="h-3.5 w-3.5" />
                  Annotations
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1.5 text-xs">
                  <Crown className="h-3.5 w-3.5" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger value="devices" className="gap-1.5 text-xs">
                  <Monitor className="h-3.5 w-3.5" />
                  Devices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="faculty">
                <FacultyTab />
              </TabsContent>

              <TabsContent value="pdfs">
                <PDFsTab
                  allPDFs={allPDFs}
                  isLoading={pdfsLoading}
                  isError={pdfsError}
                  refetch={refetchPDFs}
                  isFetching={pdfsFetching}
                  facultyMap={facultyMap}
                />
              </TabsContent>

              <TabsContent value="annotations">
                <AnnotationsTab allPDFs={allPDFs} pdfsLoading={pdfsLoading} />
              </TabsContent>

              <TabsContent value="subscription">
                <SubscriptionTab
                  facultyCount={totalFaculty}
                  pdfCount={totalPDFs}
                />
              </TabsContent>

              <TabsContent value="devices">
                <DevicesTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4 text-center text-xs text-muted-foreground">
        <p>
          Built with{' '}
          <span className="text-destructive">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
          {' '}· © {new Date().getFullYear()} EduBoard
        </p>
      </footer>
    </div>
  );
}
