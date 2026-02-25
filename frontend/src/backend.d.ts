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
export interface SyncState {
    unsyncedChanges: bigint;
    lastSyncTimestamp: bigint;
}
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
export type AnnotationCreateResult = {
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
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAnnotation(annotation: Annotation): Promise<AnnotationCreateResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAnnotation(_annotationId: bigint): Promise<AnnotationDeleteResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    syncAnnotations(): Promise<SyncResult>;
    updateAnnotation(_annotation: Annotation): Promise<AnnotationUpdateResult>;
}
