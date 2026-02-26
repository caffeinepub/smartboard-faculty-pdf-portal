import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// ─── Local data types (managed in localStorage since backend is annotation-only) ───

export interface Faculty {
  id: number;
  name: string;
  active: boolean;
}

export interface FacultyWithPdfCount {
  faculty: Faculty;
  pdfCount: number;
}

export interface PDF {
  id: number;
  title: string;
  uploadDate: number;
  facultyIds: number[];
  taught: boolean;
  content: string; // base64
}

export type FacultyRecord = Faculty;

export interface DeviceRecord {
  fingerprint: string;
  registeredAt: number;
}

export type FacultyCreateResult =
  | { __kind__: 'success'; faculty: Faculty }
  | { __kind__: 'limitReached'; limit: number }
  | { __kind__: 'error'; message: string };

export type BillingCycle = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly';

export interface BillingCycleOption {
  key: BillingCycle;
  label: string;
  priceInr: number;
}

export interface PlanTier {
  name: 'basic' | 'premium' | 'diamond';
  label: string;
  maxFaculty: number;
  maxPdfs: number;
  licenseCount: number;
  features: string[];
  billingCycles: BillingCycleOption[];
}

export const PLAN_TIERS: PlanTier[] = [
  {
    name: 'basic',
    label: 'Basic',
    maxFaculty: 30,
    maxPdfs: 500,
    licenseCount: 2,
    features: [
      'Up to 30 faculty members',
      'Up to 500 PDFs',
      '2 Licenses',
      'Full annotations',
      'Smart board view',
      'Priority support',
    ],
    billingCycles: [
      { key: 'monthly', label: 'Monthly', priceInr: 8000 },
      { key: 'quarterly', label: 'Quarterly', priceInr: 25000 },
      { key: 'halfYearly', label: 'Half-yearly', priceInr: 50000 },
      { key: 'yearly', label: 'Yearly', priceInr: 100000 },
    ],
  },
  {
    name: 'premium',
    label: 'Premium',
    maxFaculty: 100,
    maxPdfs: 2000,
    licenseCount: 4,
    features: [
      'Up to 100 faculty members',
      'Up to 2000 PDFs',
      '4 Licenses',
      'Full annotations',
      'Smart board view',
      'Priority support',
      'Advanced analytics',
    ],
    billingCycles: [
      { key: 'monthly', label: 'Monthly', priceInr: 16500 },
      { key: 'quarterly', label: 'Quarterly', priceInr: 50000 },
      { key: 'halfYearly', label: 'Half-yearly', priceInr: 100000 },
      { key: 'yearly', label: 'Yearly', priceInr: 200000 },
    ],
  },
  {
    name: 'diamond',
    label: 'Diamond',
    maxFaculty: 500,
    maxPdfs: 5000,
    licenseCount: 6,
    features: [
      'Up to 500 faculty members',
      'Up to 5000 PDFs',
      '6 Licenses',
      'Full annotations',
      'Smart board view',
      'Dedicated support',
      'Advanced analytics',
      'Custom integrations',
    ],
    billingCycles: [
      { key: 'monthly', label: 'Monthly', priceInr: 33000 },
      { key: 'quarterly', label: 'Quarterly', priceInr: 100000 },
      { key: 'halfYearly', label: 'Half-yearly', priceInr: 200000 },
      { key: 'yearly', label: 'Yearly', priceInr: 400000 },
    ],
  },
];

// ─── localStorage helpers ───

function loadFaculty(): Faculty[] {
  try {
    const raw = localStorage.getItem('eduboard_faculty');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFaculty(list: Faculty[]): void {
  localStorage.setItem('eduboard_faculty', JSON.stringify(list));
}

function loadPDFs(): PDF[] {
  try {
    const raw = localStorage.getItem('eduboard_pdfs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePDFs(list: PDF[]): void {
  localStorage.setItem('eduboard_pdfs', JSON.stringify(list));
}

function loadDevices(): DeviceRecord[] {
  try {
    const raw = localStorage.getItem('eduboard_devices');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDevices(list: DeviceRecord[]): void {
  localStorage.setItem('eduboard_devices', JSON.stringify(list));
}

function loadAnnotations(pdfId: number): LocalAnnotation[] {
  try {
    const raw = localStorage.getItem(`eduboard_annotations_${pdfId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAnnotations(pdfId: number, list: LocalAnnotation[]): void {
  localStorage.setItem(`eduboard_annotations_${pdfId}`, JSON.stringify(list));
}

// ─── Local annotation type ───

export interface LocalAnnotation {
  id: number;
  pdfId: number;
  pageNumber: number;
  annotationType: string;
  coordinates: string;
  timestamp: number;
  endX?: number | null;
  endY?: number | null;
  imageData?: string | null;
  shapeType?: string | null;
  fillColor?: string | null;
}

// ─── Admin credentials (localStorage-based) ───

const ADMIN_CREDS_KEY = 'eduboard_admin_creds';

function getAdminCredentials(): { username: string; password: string } {
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { username: 'admin', password: 'admin1234' };
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  return creds.username === username && creds.password === password;
}

export function setAdminCredentialsLocal(username: string, password: string): void {
  localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify({ username, password }));
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: { name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

/** Verify admin credentials against localStorage */
export function useVerifyAdminCredentials() {
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return verifyAdminCredentials(username, password);
    },
  });
}

/** Update admin credentials in localStorage */
export function useSetAdminCredentials() {
  return useMutation<void, Error, { username: string; password: string }>({
    mutationFn: async ({ username, password }) => {
      setAdminCredentialsLocal(username, password);
    },
  });
}

// ─── Faculty ─────────────────────────────────────────────────────────────────

export function useActiveFaculty() {
  return useQuery<Faculty[]>({
    queryKey: ['faculty', 'active'],
    queryFn: async () => loadFaculty().filter((f) => f.active),
    staleTime: 0,
  });
}

/** All faculty (active + inactive) sorted — for Admin Panel */
export function useAllFacultyAdmin() {
  return useQuery<Faculty[]>({
    queryKey: ['faculty'],
    queryFn: async () => {
      const list = loadFaculty();
      return [...list].sort((a, b) => {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return a.id - b.id;
      });
    },
    staleTime: 0,
  });
}

/** All faculty with PDF counts — for Developer Portal */
export function useAllFacultyWithPdfCount() {
  return useQuery<FacultyWithPdfCount[]>({
    queryKey: ['faculty', 'withPdfCount'],
    queryFn: async () => {
      const faculty = loadFaculty();
      const pdfs = loadPDFs();
      return faculty.map((f) => ({
        faculty: f,
        pdfCount: pdfs.filter((p) => p.facultyIds.includes(f.id)).length,
      }));
    },
    staleTime: 0,
  });
}

/** Backward-compat alias */
export function useAllFaculty() {
  return useActiveFaculty();
}

export function useAddFaculty() {
  const queryClient = useQueryClient();

  return useMutation<FacultyCreateResult, Error, string>({
    mutationFn: async (name: string): Promise<FacultyCreateResult> => {
      const list = loadFaculty();
      const planName = localStorage.getItem('eduboard_plan') || 'basic';
      const plan = PLAN_TIERS.find((p) => p.name === planName) ?? PLAN_TIERS[0];
      if (list.length >= plan.maxFaculty) {
        return { __kind__: 'limitReached', limit: plan.maxFaculty };
      }
      const newId = list.length > 0 ? Math.max(...list.map((f) => f.id)) + 1 : 1;
      const newFaculty: Faculty = { id: newId, name: name.trim(), active: true };
      saveFaculty([...list, newFaculty]);
      return { __kind__: 'success', faculty: newFaculty };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useUpdateFacultyName() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { facultyId: number; name: string }>({
    mutationFn: async ({ facultyId, name }) => {
      const list = loadFaculty();
      const updated = list.map((f) => (f.id === facultyId ? { ...f, name: name.trim() } : f));
      saveFaculty(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useDeactivateFaculty() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (facultyId: number) => {
      const list = loadFaculty();
      saveFaculty(list.map((f) => (f.id === facultyId ? { ...f, active: false } : f)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useReactivateFaculty() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (facultyId: number) => {
      const list = loadFaculty();
      saveFaculty(list.map((f) => (f.id === facultyId ? { ...f, active: true } : f)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (facultyId: number) => {
      saveFaculty(loadFaculty().filter((f) => f.id !== facultyId));
      // Remove faculty from PDFs too
      const pdfs = loadPDFs();
      savePDFs(pdfs.map((p) => ({ ...p, facultyIds: p.facultyIds.filter((id) => id !== facultyId) })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
    },
  });
}

// ─── PDF hooks ───────────────────────────────────────────────────────────────

export function useAllPDFs() {
  return useQuery<PDF[]>({
    queryKey: ['pdfs'],
    queryFn: async () => loadPDFs(),
    staleTime: 0,
  });
}

export function usePDFsByFaculty(facultyId: number) {
  return useQuery<PDF[]>({
    queryKey: ['pdfs', 'faculty', facultyId],
    queryFn: async () => loadPDFs().filter((p) => p.facultyIds.includes(facultyId)),
    staleTime: 0,
  });
}

/** Alias for backward compat */
export function useGetPDFsByFaculty(facultyId: number) {
  return usePDFsByFaculty(facultyId);
}

export interface UploadPDFParams {
  title: string;
  base64Content: string;
  selectedFacultyIds: number[];
}

export function useUploadPDF() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; error?: string }, Error, UploadPDFParams>({
    mutationFn: async ({ title, base64Content, selectedFacultyIds }) => {
      const pdfs = loadPDFs();
      const planName = localStorage.getItem('eduboard_plan') || 'basic';
      const plan = PLAN_TIERS.find((p) => p.name === planName) ?? PLAN_TIERS[0];
      if (pdfs.length >= plan.maxPdfs) {
        return { success: false, error: `PDF limit of ${plan.maxPdfs} reached for your plan.` };
      }
      if (!title.trim()) {
        return { success: false, error: 'Title is required.' };
      }
      if (selectedFacultyIds.length === 0) {
        return { success: false, error: 'Please select at least one faculty member.' };
      }
      const newId = pdfs.length > 0 ? Math.max(...pdfs.map((p) => p.id)) + 1 : 1;
      const newPDF: PDF = {
        id: newId,
        title: title.trim(),
        uploadDate: Date.now(),
        facultyIds: selectedFacultyIds,
        taught: false,
        content: base64Content,
      };
      savePDFs([...pdfs, newPDF]);
      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['pdfs'] });
        queryClient.invalidateQueries({ queryKey: ['faculty'] });
      }
    },
  });
}

export function useMarkPDFTaught() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { pdfId: number; taught: boolean }>({
    mutationFn: async ({ pdfId, taught }) => {
      savePDFs(loadPDFs().map((p) => (p.id === pdfId ? { ...p, taught } : p)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
    },
  });
}

/** Alias for TeachingView */
export function useMarkAsTaught() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (pdfId: number) => {
      savePDFs(loadPDFs().map((p) => (p.id === pdfId ? { ...p, taught: true } : p)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
    },
  });
}

export function useDeletePDF() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (pdfId: number) => {
      savePDFs(loadPDFs().filter((p) => p.id !== pdfId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] });
    },
  });
}

// ─── Annotations ─────────────────────────────────────────────────────────────

export interface SaveAnnotationParams {
  pdfId: number;
  pageNumber: number;
  annotationType: string;
  coordinates: string;
  endX?: number | null;
  endY?: number | null;
  imageData?: string | null;
  shapeType?: string | null;
  fillColor?: string | null;
}

export function useAnnotationsByPDF(pdfId: number) {
  return useQuery<LocalAnnotation[]>({
    queryKey: ['annotations', pdfId],
    queryFn: async () => loadAnnotations(pdfId),
    staleTime: 0,
  });
}

export function useSaveAnnotation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SaveAnnotationParams>({
    mutationFn: async (params) => {
      const list = loadAnnotations(params.pdfId);
      const newId = list.length > 0 ? Math.max(...list.map((a) => a.id)) + 1 : 1;
      const annotation: LocalAnnotation = {
        id: newId,
        pdfId: params.pdfId,
        pageNumber: params.pageNumber,
        annotationType: params.annotationType,
        coordinates: params.coordinates,
        timestamp: Date.now(),
        endX: params.endX ?? null,
        endY: params.endY ?? null,
        imageData: params.imageData ?? null,
        shapeType: params.shapeType ?? null,
        fillColor: params.fillColor ?? null,
      };
      saveAnnotations(params.pdfId, [...list, annotation]);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['annotations', variables.pdfId] });
    },
  });
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export function useDevices() {
  return useQuery<DeviceRecord[]>({
    queryKey: ['devices'],
    queryFn: async () => loadDevices(),
    staleTime: 0,
  });
}

/** Alias */
export function useGetDevices() {
  return useDevices();
}

export function useGetDeviceCount() {
  return useQuery<number>({
    queryKey: ['devices', 'count'],
    queryFn: async () => loadDevices().length,
    staleTime: 0,
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (fingerprint: string) => {
      saveDevices(loadDevices().filter((d) => d.fingerprint !== fingerprint));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
