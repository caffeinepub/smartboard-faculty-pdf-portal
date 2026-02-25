import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PDF, Annotation, Faculty, FacultyWithPdfCount } from '../backend';

// ─── Faculty Record Types ─────────────────────────────────────────────────────

export interface FacultyRecord {
  id: bigint;
  name: string;
  active?: boolean;
}

// ─── Subscription Plan Types ──────────────────────────────────────────────────

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
  features: string[];
  billingCycles: BillingCycleOption[];
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  halfYearly: 'Half-yearly',
  yearly: 'Yearly',
};

export const PLAN_TIERS: PlanTier[] = [
  {
    name: 'basic',
    label: 'Basic',
    maxFaculty: 30,
    maxPdfs: 500,
    features: [
      'Up to 30 faculty members',
      'Up to 500 PDFs',
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
    features: [
      'Up to 100 faculty members',
      'Up to 2000 PDFs',
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
    features: [
      'Up to 500 faculty members',
      'Up to 5000 PDFs',
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

// ─── Admin Check ──────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['auth', 'isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Active Faculty (for Faculty Portal) ─────────────────────────────────────

export function useActiveFaculty() {
  const { actor, isFetching } = useActor();

  return useQuery<Faculty[]>({
    queryKey: ['faculty', 'active'],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getFaculty();
      return all.filter((f) => f.active);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── All Faculty (active + inactive, for Admin) ───────────────────────────────

export function useAllFacultyAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<Faculty[]>({
    queryKey: ['faculty', 'all-admin'],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getFaculty();
      return [...all].sort((a, b) => {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return Number(a.id - b.id);
      });
    },
    enabled: !!actor && !isFetching,
  });
}

// Keep backward compat alias used by FacultyPortal / FacultySelector
export function useAllFaculty() {
  return useActiveFaculty();
}

// ─── All Faculty With PDF Count (for Developer Portal / Admin) ────────────────

export function useAllFacultyWithPdfCount() {
  const { actor, isFetching } = useActor();

  return useQuery<FacultyWithPdfCount[]>({
    queryKey: ['allFacultyWithPdfCount'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFacultyWithPdfCount();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Add Faculty ──────────────────────────────────────────────────────────────

export function useAddFaculty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not initialized');

      let result;
      try {
        result = await actor.createFaculty(name);
      } catch (callErr: unknown) {
        // Network / canister call failure
        const msg = callErr instanceof Error ? callErr.message : String(callErr);
        throw new Error(`CALL_ERROR:${msg}`);
      }

      if (result.__kind__ === 'success') {
        return { name };
      } else if (result.__kind__ === 'limitReached') {
        const limit = Number(result.limitReached);
        throw new Error(`LIMIT_REACHED:${limit}`);
      } else {
        // result.__kind__ === 'error' — pass the raw backend message through
        throw new Error(`BACKEND_ERROR:${result.error}`);
      }
    },
    onSuccess: () => {
      // Invalidate all faculty-related queries so the table refreshes
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['allFacultyWithPdfCount'] });
    },
    onError: () => {
      // Keep the faculty list consistent even on error
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useUpdateFacultyName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ facultyId, name }: { facultyId: bigint; name: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend doesn't have updateFacultyName; this is a no-op placeholder
      return { facultyId, name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useDeactivateFaculty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (facultyId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend doesn't expose deactivate separately; placeholder
      return facultyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'usage'] });
    },
  });
}

export function useReactivateFaculty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (facultyId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend doesn't expose reactivate separately; placeholder
      return facultyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'usage'] });
    },
  });
}

export function useDeleteFaculty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (facultyId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend doesn't expose deleteFaculty separately; placeholder
      return facultyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'usage'] });
    },
  });
}

// ─── Plan Usage (derived from faculty + pdf counts) ──────────────────────────

export interface PlanUsage {
  facultyCount: number;
  pdfCount: number;
  currentPlanName: 'basic' | 'premium' | 'diamond';
  maxFaculty: number;
  maxPdfs: number;
}

export function usePlanUsage(allFaculty: Faculty[], allPdfs: PDF[]) {
  const activeFacultyCount = allFaculty.filter((f) => f.active).length;
  const pdfCount = allPdfs.length;
  const currentPlan = PLAN_TIERS.find((p) => p.name === 'basic')!;

  return {
    facultyCount: activeFacultyCount,
    pdfCount,
    currentPlanName: 'basic' as const,
    maxFaculty: currentPlan.maxFaculty,
    maxPdfs: currentPlan.maxPdfs,
  };
}

// ─── PDF Hooks ────────────────────────────────────────────────────────────────

export function useAllPDFs() {
  const queryClient = useQueryClient();
  return useQuery<PDF[]>({
    queryKey: ['pdfs', 'all'],
    queryFn: async () => {
      const cached = queryClient.getQueryData<PDF[]>(['pdfs', 'all']);
      return cached ?? [];
    },
    staleTime: Infinity,
  });
}

export function usePDFsByFaculty(facultyId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PDF[]>({
    queryKey: ['pdfs', 'faculty', facultyId?.toString()],
    queryFn: async () => {
      if (!actor || facultyId === null) return [];
      return actor.getPDFsByFaculty(facultyId);
    },
    enabled: !!actor && !isFetching && facultyId !== null,
  });
}

export function useUploadPDF() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      facultyIds,
    }: {
      title: string;
      content: string;
      facultyIds: bigint[];
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      // Backend uploadPDF not in interface; store locally
      const id = BigInt(Date.now());
      return { id, title, content, facultyIds };
    },
    onSuccess: (newPDF) => {
      const pdfRecord: PDF = {
        id: newPDF.id,
        title: newPDF.title,
        content: newPDF.content,
        taught: false,
        uploadDate: BigInt(Date.now()),
        facultyIds: newPDF.facultyIds,
      };
      queryClient.setQueryData<PDF[]>(['pdfs', 'all'], (old) => {
        const existing = old ?? [];
        return [...existing, pdfRecord];
      });
      queryClient.invalidateQueries({ queryKey: ['pdfs', 'faculty'] });
      queryClient.invalidateQueries({ queryKey: ['plan', 'usage'] });
    },
  });
}

export function useMarkAsTaught() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pdfId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.markAsTaught(pdfId);
      return pdfId;
    },
    onSuccess: (pdfId) => {
      queryClient.setQueryData<PDF[]>(['pdfs', 'all'], (old) => {
        if (!old) return old;
        return old.map((pdf) =>
          pdf.id === pdfId ? { ...pdf, taught: true } : pdf
        );
      });
      queryClient.invalidateQueries({ queryKey: ['pdfs', 'faculty'] });
    },
  });
}

// ─── Annotation Hooks ─────────────────────────────────────────────────────────

export function useAnnotationsByPDF(pdfId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Annotation[]>({
    queryKey: ['annotations', pdfId?.toString()],
    queryFn: async () => {
      if (!actor || pdfId === null) return [];
      return actor.getAnnotationsByPDF(pdfId);
    },
    enabled: !!actor && !isFetching && pdfId !== null,
  });
}

export function useSaveAnnotation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pdfId,
      pageNumber,
      annotationType,
      coordinates,
      endX = null,
      endY = null,
      imageData = null,
      shapeType = null,
      fillColor = null,
    }: {
      pdfId: bigint;
      pageNumber: bigint;
      annotationType: string;
      coordinates: string;
      endX?: number | null;
      endY?: number | null;
      imageData?: string | null;
      shapeType?: string | null;
      fillColor?: string | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const id = await actor.saveAnnotation(
        pdfId,
        pageNumber,
        annotationType,
        coordinates,
        endX,
        endY,
        imageData,
        shapeType,
        fillColor
      );
      return { id, pdfId, pageNumber, annotationType, coordinates, endX, endY, imageData, shapeType, fillColor };
    },
    onSuccess: (newAnnotation) => {
      const annotation: Annotation = {
        pdfId: newAnnotation.pdfId,
        pageNumber: newAnnotation.pageNumber,
        annotationType: newAnnotation.annotationType,
        coordinates: newAnnotation.coordinates,
        timestamp: BigInt(Date.now()),
        endX: newAnnotation.endX ?? undefined,
        endY: newAnnotation.endY ?? undefined,
        imageData: newAnnotation.imageData ?? undefined,
        shapeType: newAnnotation.shapeType ?? undefined,
        fillColor: newAnnotation.fillColor ?? undefined,
      };
      queryClient.setQueryData<Annotation[]>(
        ['annotations', newAnnotation.pdfId.toString()],
        (old) => {
          const existing = old ?? [];
          return [...existing, annotation];
        }
      );
    },
  });
}

// ─── Device Registration Hooks ────────────────────────────────────────────────

export function useGetDevices() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't expose device list in current interface
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDeviceCount() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['deviceCount'],
    queryFn: async () => {
      if (!actor) return 0;
      return 0;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRemoveDevice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fingerprint: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return fingerprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['deviceCount'] });
    },
  });
}

// ─── User Profile Hooks ───────────────────────────────────────────────────────

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
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Admin Credentials Hooks ──────────────────────────────────────────────────

export function useVerifyAdminCredentials() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.verifyAdminCredentials(username, password);
    },
  });
}

export function useSetAdminCredentials() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.setAdminCredentials(username, password);
      if (!result) {
        throw new Error('Failed to update credentials. Ensure username is non-empty and password is at least 6 characters.');
      }
      return result;
    },
  });
}
