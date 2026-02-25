import React, { useState } from 'react';
import { Plus, Loader2, Users, FileText, AlertCircle, LogOut, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import PDFUploadForm from '@/components/PDFUploadForm';
import PDFListTable from '@/components/PDFListTable';
import SubscriptionSection from '@/components/SubscriptionSection';
import FacultyManagementTable from '@/components/FacultyManagementTable';
import DeviceManagementSection from '@/components/DeviceManagementSection';
import CreateFacultyModal from '@/components/CreateFacultyModal';
import AdminPasscodeGate, { LOCK_EVENT } from '@/components/AdminPasscodeGate';
import ChangeAdminCredentialsForm from '@/components/ChangeAdminCredentialsForm';
import { useAllFacultyAdmin, useAddFaculty, useAllPDFs, PLAN_TIERS } from '@/hooks/useQueries';
import type { Faculty } from '@/backend';

function parseInlineError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    (lower.includes('subscription limit') && lower.includes('faculty')) ||
    (lower.includes('limit reached') && lower.includes('faculty')) ||
    lower.includes('faculty limit')
  ) {
    return 'Faculty limit reached for your current plan. Please upgrade.';
  }
  if (lower.includes('unauthorized') || lower.includes('only admins')) {
    return 'Admin access required to add faculty members.';
  }
  if (lower.includes('name cannot be empty') || lower.includes('empty or whitespace')) {
    return 'Faculty name cannot be empty.';
  }
  return 'Failed to add faculty. Please try again.';
}

function AdminPanelContent() {
  const [newFacultyName, setNewFacultyName] = useState('');
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isCreateFacultyOpen, setIsCreateFacultyOpen] = useState(false);

  const { data: allFaculty = [], refetch: refetchFaculty } = useAllFacultyAdmin();
  const { data: pdfs = [], refetch: refetchPDFs } = useAllPDFs();
  const addFaculty = useAddFaculty();

  const activeFacultyCount = allFaculty.filter((f: Faculty) => f.active).length;
  const currentPlan = PLAN_TIERS.find((p) => p.name === 'basic')!;
  const isPdfLimitReached = pdfs.length >= currentPlan.maxPdfs;

  const activeFacultyList = allFaculty
    .filter((f: Faculty) => f.active)
    .map((f: Faculty) => ({ id: f.id, name: f.name }));

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
      await addFaculty.mutateAsync(name);
      setNewFacultyName('');
      setFacultyError(null);
    } catch (err: unknown) {
      setFacultyError(parseInlineError(err));
    }
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    refetchPDFs();
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage faculty members, upload teaching materials, and monitor your subscription.
            </p>
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
        <SubscriptionSection allFaculty={allFaculty} pdfCount={pdfs.length} />

        {/* Device Management Section */}
        <DeviceManagementSection />

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
                <CardDescription>
                  Add a new faculty member to the system.
                </CardDescription>
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
            <PDFUploadForm
              facultyList={activeFacultyList}
              onSuccess={handleUploadSuccess}
              disabled={isPdfLimitReached}
            />

            {uploadSuccess && (
              <Alert className="border-green-500/40 bg-green-500/10 py-2">
                <AlertDescription className="text-sm text-green-700 dark:text-green-400">
                  PDF uploaded successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column: Faculty Management + PDF List */}
          <div className="lg:col-span-2 space-y-6">
            <FacultyManagementTable facultyList={allFaculty} allPdfs={pdfs} />
            <PDFListTable pdfs={pdfs} facultyList={allFaculty} />
          </div>
        </div>

        {/* Change Admin Credentials Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="h-5 w-5 text-accent" />
              Change Admin Credentials
            </CardTitle>
            <CardDescription>
              Update the admin username and password used to access this panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-md">
            <ChangeAdminCredentialsForm />
          </CardContent>
        </Card>
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
