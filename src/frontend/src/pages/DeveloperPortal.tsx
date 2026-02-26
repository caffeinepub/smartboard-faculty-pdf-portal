import React, { useState } from 'react';
import {
  Terminal,
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
  Key,
  PlusCircle,
  Trash2,
  XCircle,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  Copy,
  Settings,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAllFacultyWithPdfCount,
  useGetDevices,
  useAllPDFs,
  useAllLicenses,
  useCreateLicense,
  useRevokeLicense,
  useDeleteLicense,
  PLAN_TIERS,
  getDeveloperUsername,
  getAdminUsername,
  hasAdminCredentialsSet,
  setAdminCredentialsLocal,
  clearAdminCredentials,
  type BillingCycle,
  type LicenseKey,
  type LicensePlanTier,
  type DeviceRecord,
  type FacultyWithPdfCount,
  type PDF,
} from '@/hooks/useQueries';
import DeveloperPasscodeGate, { DEVELOPER_LOCK_EVENT } from '@/components/DeveloperPasscodeGate';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

function getLicenseId(): string {
  return localStorage.getItem('eduboard_license_id') || window.location.hostname || 'eduboard-default-license';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="border-indigo-900/50 bg-slate-800/60">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
            <Icon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-tight">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-red-400">
      <AlertCircle className="h-8 w-8" />
      <p className="font-medium text-sm">Failed to load data</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="border-slate-700 text-slate-300 hover:bg-slate-700">
        Try Again
      </Button>
    </div>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }, (_, i) => `skel-${i}`).map((key) => (
        <Skeleton key={key} className="h-10 w-full bg-slate-700/50" />
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
      <h3 className="font-semibold text-base flex items-center gap-2 text-white">
        <Icon className="h-4 w-4 text-indigo-400" />
        {title}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        className="gap-1.5 h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
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
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No faculty members found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/80 border-slate-700 hover:bg-slate-800/80">
                <TableHead className="w-10 text-slate-400">#</TableHead>
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-center text-slate-400">PDFs Assigned</TableHead>
                <TableHead className="text-right text-slate-400">Faculty ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyList.map((item: FacultyWithPdfCount, idx: number) => (
                <TableRow key={item.faculty.id} className="border-slate-700/50 hover:bg-slate-800/40">
                  <TableCell className="text-slate-500 text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {item.faculty.name.charAt(0).toUpperCase()}
                      </div>
                      {item.faculty.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.faculty.active ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-600 gap-1 text-xs">
                        <UserX className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1 text-sm text-slate-300">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      {item.pdfCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-500">
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
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No PDFs uploaded yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/80 border-slate-700 hover:bg-slate-800/80">
                <TableHead className="w-10 text-slate-400">#</TableHead>
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Upload Date</TableHead>
                <TableHead className="text-center text-slate-400">Faculty Count</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pdfs.map((pdf: PDF, idx: number) => (
                <TableRow key={pdf.id} className="border-slate-700/50 hover:bg-slate-800/40">
                  <TableCell className="text-slate-500 text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      {pdf.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {formatDate(pdf.uploadDate)}
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-300">{pdf.facultyIds.length}</TableCell>
                  <TableCell>
                    {pdf.taught ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Taught
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 border-slate-600 gap-1 text-xs">
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
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <Monitor className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No devices registered</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/80 border-slate-700 hover:bg-slate-800/80">
                <TableHead className="text-slate-400">#</TableHead>
                <TableHead className="text-slate-400">Device Fingerprint</TableHead>
                <TableHead className="text-slate-400">Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device: DeviceRecord, idx: number) => (
                <TableRow key={device.fingerprint} className="border-slate-700/50 hover:bg-slate-800/40">
                  <TableCell className="text-slate-500 text-sm font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">{device.fingerprint}</TableCell>
                  <TableCell className="text-sm text-slate-400">
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

// ─── Licenses Tab ─────────────────────────────────────────────────────────────

function LicensesTab() {
  const { data: licenses = [], isLoading, refetch, isFetching } = useAllLicenses();
  const createLicense = useCreateLicense();
  const revokeLicense = useRevokeLicense();
  const deleteLicense = useDeleteLicense();

  const [showCreate, setShowCreate] = useState(false);
  const [newPlanTier, setNewPlanTier] = useState<LicensePlanTier>('basic');
  const [newBillingCycle, setNewBillingCycle] = useState<BillingCycle>('monthly');
  const [newAdminName, setNewAdminName] = useState('');

  const handleCreate = () => {
    createLicense.mutate(
      { planTier: newPlanTier, billingCycle: newBillingCycle, adminName: newAdminName || undefined },
      {
        onSuccess: (license) => {
          toast.success(`License ${license.id} created`);
          setShowCreate(false);
          setNewAdminName('');
        },
      }
    );
  };

  const handleRevoke = (id: string) => {
    revokeLicense.mutate(id, { onSuccess: () => toast.success('License revoked') });
  };

  const handleDelete = (id: string) => {
    deleteLicense.mutate(id, { onSuccess: () => toast.success('License deleted') });
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).then(() => toast.success('License ID copied'));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-white">
          <Key className="h-4 w-4 text-indigo-400" />
          License Keys
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5 h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            onClick={() => setShowCreate(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Create License
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SectionSkeleton rows={3} />
      ) : licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <Key className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">No licenses created yet</p>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            onClick={() => setShowCreate(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Create First License
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/80 border-slate-700 hover:bg-slate-800/80">
                <TableHead className="text-slate-400">License ID</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Billing</TableHead>
                <TableHead className="text-slate-400">Assigned To</TableHead>
                <TableHead className="text-center text-slate-400">Devices</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license: LicenseKey) => (
                <TableRow
                  key={license.id}
                  className={`border-slate-700/50 hover:bg-slate-800/40 ${license.status === 'revoked' ? 'opacity-60' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-indigo-300">{license.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(license.id)}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-slate-300 text-sm">{license.planTier}</span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-slate-400 text-xs">{license.billingCycle}</span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {license.adminName || <span className="text-slate-600">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-slate-300">{license.devicesUsed} / {license.maxDevices}</span>
                  </TableCell>
                  <TableCell>
                    {license.status === 'active' ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                        Revoked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDate(license.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {license.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          onClick={() => handleRevoke(license.id)}
                          disabled={revokeLicense.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(license.id)}
                        disabled={deleteLicense.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create License Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-400" />
              Create New License
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Plan Tier</Label>
              <Select value={newPlanTier} onValueChange={(v) => setNewPlanTier(v as LicensePlanTier)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="basic" className="text-white hover:bg-slate-700">Basic (30 faculty, 500 PDFs, 2 licenses)</SelectItem>
                  <SelectItem value="premium" className="text-white hover:bg-slate-700">Premium (100 faculty, 2000 PDFs, 4 licenses)</SelectItem>
                  <SelectItem value="diamond" className="text-white hover:bg-slate-700">Diamond (500 faculty, 5000 PDFs, 6 licenses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Billing Cycle</Label>
              <Select value={newBillingCycle} onValueChange={(v) => setNewBillingCycle(v as BillingCycle)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="monthly" className="text-white hover:bg-slate-700">Monthly</SelectItem>
                  <SelectItem value="quarterly" className="text-white hover:bg-slate-700">Quarterly</SelectItem>
                  <SelectItem value="halfYearly" className="text-white hover:bg-slate-700">Half-Yearly</SelectItem>
                  <SelectItem value="yearly" className="text-white hover:bg-slate-700">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Assign to Admin (optional)</Label>
              <Input
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Admin name or institution"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              Each license allows up to 10 device logins using the unique license code.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLicense.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {createLicense.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : (
                <><Key className="mr-2 h-4 w-4" />Create License</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Management Tab ─────────────────────────────────────────────────────

function AdminMgmtTab() {
  const adminUsername = getAdminUsername();
  const adminExists = hasAdminCredentialsSet();

  const [showReset, setShowReset] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = () => {
    setResetError(null);
    if (!newUsername.trim()) {
      setResetError('Username cannot be empty.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    setAdminCredentialsLocal(newUsername.trim(), newPassword);
    toast.success('Admin credentials updated successfully');
    setShowReset(false);
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleClear = () => {
    clearAdminCredentials();
    toast.success('Admin credentials cleared. Admin will need to create a new account.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base flex items-center gap-2 text-white">
          <ShieldAlert className="h-4 w-4 text-indigo-400" />
          Admin Account Management
        </h3>
      </div>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Note: Developer Access
          </CardTitle>
          <CardDescription className="text-slate-400">
            You have full developer access. You can view, reset, or clear admin credentials from here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-900/60 border border-slate-700 p-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Admin Username</p>
              <p className="font-mono text-sm text-white">
                {adminExists ? adminUsername ?? '—' : <span className="text-slate-500 italic">No admin account set</span>}
              </p>
            </div>
            {adminExists && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                Active
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              onClick={() => setShowReset(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reset Admin Credentials
            </Button>
            {adminExists && (
              <Button
                variant="outline"
                className="flex-1 border-red-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Admin Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset Admin Credentials Dialog */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-400" />
              Reset Admin Credentials
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">New Username</Label>
              <Input
                value={newUsername}
                onChange={(e) => { setNewUsername(e.target.value); setResetError(null); }}
                placeholder="Enter new username"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setResetError(null); }}
                placeholder="Minimum 6 characters"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setResetError(null); }}
                placeholder="Re-enter password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                autoComplete="new-password"
              />
            </div>
            {resetError && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setShowReset(false); setResetError(null); }}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              disabled={!newUsername || !newPassword || !confirmPassword}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <PlanIcon className="h-5 w-5 text-indigo-400" />
            Current Plan: {planTier.label}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Billing cycle: {selectedPlan.billingCycle} · License ID: {getLicenseId()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Faculty Usage</span>
              <span className="font-medium text-white">{activeFaculty} / {planTier.maxFaculty}</span>
            </div>
            <Progress value={facultyPercent} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">PDF Usage</span>
              <span className="font-medium text-white">{pdfs.length} / {planTier.maxPdfs}</span>
            </div>
            <Progress value={pdfPercent} className="h-2" />
          </div>
          <div className="pt-2">
            <p className="text-sm font-medium text-white mb-2">Plan Features:</p>
            <ul className="space-y-1">
              {planTier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
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

function DeveloperPortalContent() {
  const { data: faculty = [] } = useAllFacultyWithPdfCount();
  const { data: pdfs = [] } = useAllPDFs();
  const { data: devices = [] } = useGetDevices();
  const { data: licenses = [] } = useAllLicenses();

  const activeFaculty = faculty.filter((f) => f.faculty.active).length;
  const taughtPdfs = pdfs.filter((p) => p.taught).length;
  const activeLicenses = licenses.filter((l) => l.status === 'active').length;
  const devUsername = getDeveloperUsername();

  const handleLock = () => {
    window.dispatchEvent(new Event(DEVELOPER_LOCK_EVENT));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Dark Indigo Header — visually distinct from Admin (maroon) */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-indigo-900/50 shadow-lg shadow-indigo-950/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Terminal className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white leading-tight">Developer Portal</h1>
              {devUsername && (
                <p className="text-xs text-slate-500 leading-tight">Signed in as {devUsername}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="gap-1.5 border-indigo-800/50 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 hover:border-indigo-600 bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard icon={Users} label="Active Faculty" value={activeFaculty} />
          <StatsCard icon={FileText} label="Total PDFs" value={pdfs.length} />
          <StatsCard icon={CheckCircle2} label="PDFs Taught" value={taughtPdfs} />
          <StatsCard icon={Key} label="Active Licenses" value={activeLicenses} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faculty">
          <TabsList className="w-full max-w-2xl grid grid-cols-6 bg-slate-800/80 border border-slate-700">
            <TabsTrigger value="faculty" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Faculty</TabsTrigger>
            <TabsTrigger value="pdfs" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">PDFs</TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Devices</TabsTrigger>
            <TabsTrigger value="licenses" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Licenses</TabsTrigger>
            <TabsTrigger value="admin-mgmt" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Admin Mgmt</TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 text-xs">Plan</TabsTrigger>
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
          <TabsContent value="licenses" className="mt-6">
            <LicensesTab />
          </TabsContent>
          <TabsContent value="admin-mgmt" className="mt-6">
            <AdminMgmtTab />
          </TabsContent>
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function DeveloperPortal() {
  return (
    <DeveloperPasscodeGate>
      <DeveloperPortalContent />
    </DeveloperPasscodeGate>
  );
}
