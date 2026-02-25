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
  Monitor,
  Crown,
  UserCheck,
  UserX,
  Zap,
  Gem,
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
  useAllFacultyWithPdfCount,
  useGetDevices,
  useAllPDFs,
  PLAN_TIERS,
  type BillingCycle,
  type DeviceRecord,
  type FacultyWithPdfCount,
  type PDF,
} from '@/hooks/useQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
                <TableRow key={item.faculty.id} className="hover:bg-muted/20">
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
                    <div className="inline-flex items-center gap-1 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.pdfCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    #{item.faculty.id}
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

function PDFsTab() {
  const { data: pdfs = [], isLoading, isError, refetch, isFetching } = useAllPDFs();

  return (
    <div>
      <SectionHeader title="All PDFs" icon={FileText} onRefresh={refetch} isFetching={isFetching} />
      {isLoading ? (
        <SectionSkeleton rows={5} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : pdfs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No PDFs uploaded yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead className="text-center">Faculty Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdfs.map((pdf: PDF, idx: number) => (
                <TableRow key={pdf.id} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      {pdf.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(pdf.uploadDate)}
                  </TableCell>
                  <TableCell className="text-center text-sm">{pdf.facultyIds.length}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Devices Tab ──────────────────────────────────────────────────────────────

function DevicesTab() {
  const { data: devices = [], isLoading, isError, refetch, isFetching } = useGetDevices();

  return (
    <div>
      <SectionHeader title="Registered Devices" icon={Monitor} onRefresh={refetch} isFetching={isFetching} />
      {isLoading ? (
        <SectionSkeleton rows={3} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Monitor className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No devices registered</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>#</TableHead>
                <TableHead>Device Fingerprint</TableHead>
                <TableHead>Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device: DeviceRecord, idx: number) => (
                <TableRow key={device.fingerprint} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{device.fingerprint}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(device.registeredAt)}
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

// ─── Subscription Tab ─────────────────────────────────────────────────────────

function SubscriptionTab() {
  const selectedPlan = getSelectedPlan();
  const planTier = PLAN_TIERS.find((p) => p.name === selectedPlan.planName) ?? PLAN_TIERS[0];
  const { data: faculty = [] } = useAllFacultyWithPdfCount();
  const { data: pdfs = [] } = useAllPDFs();

  const activeFaculty = faculty.filter((f) => f.faculty.active).length;
  const facultyPercent = Math.min((activeFaculty / planTier.maxFaculty) * 100, 100);
  const pdfPercent = Math.min((pdfs.length / planTier.maxPdfs) * 100, 100);

  const planIcons: Record<string, React.ElementType> = {
    basic: Zap,
    premium: Crown,
    diamond: Gem,
  };
  const PlanIcon = planIcons[planTier.name] ?? Zap;

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlanIcon className="h-5 w-5 text-accent" />
            Current Plan: {planTier.label}
          </CardTitle>
          <CardDescription>
            Billing cycle: {selectedPlan.billingCycle} · License ID: {getLicenseId()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Faculty Usage</span>
              <span className="font-medium">{activeFaculty} / {planTier.maxFaculty}</span>
            </div>
            <Progress value={facultyPercent} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PDF Usage</span>
              <span className="font-medium">{pdfs.length} / {planTier.maxPdfs}</span>
            </div>
            <Progress value={pdfPercent} className="h-2" />
          </div>
          <div className="pt-2">
            <p className="text-sm font-medium text-foreground mb-2">Plan Features:</p>
            <ul className="space-y-1">
              {planTier.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Developer Portal ────────────────────────────────────────────────────

export default function DeveloperPortal() {
  const navigate = useNavigate();
  const { data: faculty = [] } = useAllFacultyWithPdfCount();
  const { data: pdfs = [] } = useAllPDFs();
  const { data: devices = [] } = useGetDevices();

  const activeFaculty = faculty.filter((f) => f.faculty.active).length;
  const taughtPdfs = pdfs.filter((p) => p.taught).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Developer Portal</h1>
            <p className="text-muted-foreground mt-0.5">
              System overview, analytics, and administration tools.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin' })}>
          Go to Admin Panel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Active Faculty" value={activeFaculty} color="bg-primary/10 text-primary" />
        <StatsCard icon={FileText} label="Total PDFs" value={pdfs.length} color="bg-accent/10 text-accent" />
        <StatsCard icon={CheckCircle2} label="PDFs Taught" value={taughtPdfs} color="bg-success/10 text-success" />
        <StatsCard icon={Monitor} label="Devices" value={devices.length} color="bg-secondary text-secondary-foreground" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="faculty">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="pdfs">PDFs</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="subscription">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="faculty" className="mt-6">
          <FacultyTab />
        </TabsContent>
        <TabsContent value="pdfs" className="mt-6">
          <PDFsTab />
        </TabsContent>
        <TabsContent value="devices" className="mt-6">
          <DevicesTab />
        </TabsContent>
        <TabsContent value="subscription" className="mt-6">
          <SubscriptionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
