import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Annotation {
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
export type FacultyCreateResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "limitReached";
    limitReached: bigint;
} | {
    __kind__: "success";
    success: null;
};
export interface Faculty {
    id: bigint;
    active: boolean;
    name: string;
}
export interface PDF {
    id: bigint;
    title: string;
    content: string;
    taught: boolean;
    uploadDate: bigint;
    facultyIds: Array<bigint>;
}
export interface FacultyWithPdfCount {
    faculty: Faculty;
    pdfCount: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFaculty(name: string): Promise<FacultyCreateResult>;
    getAllFacultyWithPdfCount(): Promise<Array<FacultyWithPdfCount>>;
    getAnnotationsByPDF(pdfId: bigint): Promise<Array<Annotation>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFaculty(): Promise<Array<Faculty>>;
    getPDFsByFaculty(facultyId: bigint): Promise<Array<PDF>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAsTaught(pdfId: bigint): Promise<void>;
    resetAdminCredentials(): Promise<boolean>;
    saveAnnotation(pdfId: bigint, pageNumber: bigint, annotationType: string, coordinates: string, endX: number | null, endY: number | null, imageData: string | null, shapeType: string | null, fillColor: string | null): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminCredentials(username: string, password: string): Promise<boolean>;
    verifyAdminCredentials(username: string, password: string): Promise<boolean>;
}
