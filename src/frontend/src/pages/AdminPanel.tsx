import React, { useState } from 'react';
import AdminPasscodeGate, { LOCK_EVENT } from '../components/AdminPasscodeGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Settings,
  Users,
  FileText,
  CreditCard,
  Monitor,
  KeyRound,
  Plus,
  LogOut,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import FacultyManagementTable from '../components/FacultyManagementTable';
import PDFUploadForm from '../components/PDFUploadForm';
import PDFListTable from '../components/PDFListTable';
import SubscriptionSection from '../components/SubscriptionSection';
import DeviceManagementSection from '../components/DeviceManagementSection';
import ChangeAdminCredentialsForm from '../components/ChangeAdminCredentialsForm';
import CreateFacultyModal from '../components/CreateFacultyModal';
import {
  useAllFacultyAdmin,
  useAllPDFs,
  useAddFaculty,
  PLAN_TIERS,
  type Faculty,
} from '../hooks/useQueries';

function parseInlineError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes('limit reached') || lower.includes('faculty limit')) {
    return 'Faculty limit reached for your current plan. Please upgrade.';
  }
  if (lower.includes('unauthorized') || lower.includes('only admins') || lower.includes('admin-only')) {
    return 'Admin access required to add faculty members.';
  }
  if (lower.includes('name cannot be empty') || lower.includes('empty or whitespace')) {
    return 'Faculty name cannot be empty.';
  }
  if (lower.includes('already exists') || lower.includes('duplicate')) {
    return 'A faculty member with this name already exists.';
  }
  return raw || 'Failed to add faculty. Please try again.';
}

function AdminPanelContent() {
  const [newFacultyName, setNewFacultyName] = useState('');
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false);

  const { data: allFaculty = [] } = useAllFacultyAdmin();
  const { data: pdfs = [] } = useAllPDFs();
  const addFaculty = useAddFaculty();

  const activeFacultyCount = (allFaculty as Faculty[]).filter((f) => f.active).length;
  const currentPlan = PLAN_TIERS.find((p) => p.name === 'basic') ?? PLAN_TIERS[0];
  const isPdfLimitReached = pdfs.length >= currentPlan.maxPdfs;

  const handleLockSignOut = () => {
    window.dispatchEvent(new Event(LOCK_EVENT));
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyError(null);
    const name = newFacultyName.trim();
    if (!name) {
      setFacultyError('Please enter a faculty name.');
      return;
    }
    try {
      const result = await addFaculty.mutateAsync(name);
      if (result.__kind__ === 'success') {
        setNewFacultyName('');
        setFacultyError(null);
      } else if (result.__kind__ === 'limitReached') {
        setFacultyError(
          `Faculty limit of ${result.limit} reached. Please upgrade your plan.`
        );
      } else if (result.__kind__ === 'error') {
        setFacultyError(result.message || 'Failed to add faculty. Please try again.');
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
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground mt-0.5">
                Manage faculty members, upload teaching materials, and monitor your subscription.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <Users className="h-4 w-4 mr-1.5" />
              {activeFacultyCount} / {currentPlan.maxFaculty} Faculty
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <FileText className="h-4 w-4 mr-1.5" />
              {pdfs.length} / {currentPlan.maxPdfs} PDFs
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

        {/* Subscription Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">Subscription</h2>
          </div>
          <SubscriptionSection
            facultyCount={activeFacultyCount}
            pdfCount={pdfs.length}
          />
        </section>

        <Separator />

        {/* Device Management Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Device Management
            </h2>
          </div>
          <DeviceManagementSection />
        </section>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Add Faculty + PDF Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Faculty */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-accent" />
                  Add Faculty Member
                </CardTitle>
                <CardDescription>Add a new faculty member to the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFaculty} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="faculty-name" className="font-semibold">
                      Faculty Name
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="faculty-name"
                        value={newFacultyName}
                        onChange={(e) => {
                          setNewFacultyName(e.target.value);
                          if (facultyError) setFacultyError(null);
                        }}
                        placeholder="e.g., Dr. Sarah Johnson"
                        className="h-11"
                        disabled={addFaculty.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={addFaculty.isPending}
                        size="icon"
                        className="h-11 w-11 flex-shrink-0"
                      >
                        {addFaculty.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {facultyError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{facultyError}</AlertDescription>
                    </Alert>
                  )}
                </form>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsCreateFacultyOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Advanced Add Faculty
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* PDF Upload */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-accent" />
                  Upload PDF
                </CardTitle>
                <CardDescription>Upload a PDF and assign it to faculty members.</CardDescription>
              </CardHeader>
              <CardContent>
                <PDFUploadForm disabled={isPdfLimitReached} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Faculty Management + PDF List */}
          <div className="lg:col-span-2 space-y-6">
            <FacultyManagementTable facultyList={allFaculty} allPdfs={pdfs} />
            <PDFListTable pdfs={pdfs} facultyList={allFaculty} />
          </div>
        </div>

        {/* Change Admin Credentials Section */}
        <Separator />
        <section>
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
                Update the admin username and password used to access this panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeAdminCredentialsForm />
            </CardContent>
          </Card>
        </section>
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
