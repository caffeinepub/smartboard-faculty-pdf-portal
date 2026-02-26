import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AnnotationUpdateResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "success";
    success: null;
};
export type AnnotationDeleteResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "success";
    success: null;
};
export interface PdfMetadata {
    id: bigint;
    title: string;
    contentBase64: string;
    assignedFaculty: Array<string>;
    isTaught: boolean;
}
export type PriceList = Array<{
    maxFaculty: bigint;
    tier: PlanTier;
    cycle: BillingCycle;
    maxPdfLimit: bigint;
    maxLicenses: bigint;
    priceInr: bigint;
}>;
export interface Annotation {
    id: bigint;
    fillColor?: string;
    imageData?: string;
    endX?: number;
    endY?: number;
    pageNumber: bigint;
    timestamp: bigint;
    pdfId: bigint;
    annotationType: string;
    shapeType?: string;
    coordinates: string;
}
export type SyncResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "success";
    success: SyncState;
};
export interface SubscriptionPlan {
    maxFaculty: bigint;
    tier: PlanTier;
    cycle: BillingCycle;
    maxPdfLimit: bigint;
    maxLicenses: bigint;
    priceInr: bigint;
}
export type AnnotationCreateResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "success";
    success: null;
};
export interface UserProfile {
    name: string;
}
export interface SyncState {
    unsyncedChanges: bigint;
    lastSyncTimestamp: bigint;
}
export enum BillingCycle {
    quarterly = "quarterly",
    monthly = "monthly",
    halfYearly = "halfYearly",
    yearly = "yearly"
}
export enum PlanTier {
    premium = "premium",
    diamond = "diamond",
    basic = "basic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAnnotation(annotation: Annotation): Promise<AnnotationCreateResult>;
    addPdf(pdf: PdfMetadata): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAnnotation(_annotationId: bigint): Promise<AnnotationDeleteResult>;
    getActiveSubscriptionPlan(): Promise<SubscriptionPlan>;
    getAvailablePriceList(): Promise<PriceList>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentSubscriptionLimits(): Promise<{
        maxFaculty: bigint;
        maxPdfLimit: bigint;
        maxLicenses: bigint;
    }>;
    getPdfById(pdfId: bigint): Promise<PdfMetadata | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markPdfAsTaught(pdfId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setSubscriptionPlan(newPlan: SubscriptionPlan): Promise<void>;
    syncAnnotations(): Promise<SyncResult>;
    updateAnnotation(_annotation: Annotation): Promise<AnnotationUpdateResult>;
}
