# EduBoards

## Current State
PDFs (including base64 content) are stored in localStorage, which has a 5-10MB browser limit. This causes "out of storage" errors after just 2-3 PDFs. There is no download button for faculty to save PDFs to their device.

## Requested Changes (Diff)

### Add
- IndexedDB storage layer (`src/frontend/src/utils/pdfStorage.ts`) with functions: `storePDF`, `getPDF`, `deletePDF`, `getAllPDFMeta`, `getPDFContent` — stores full base64 content in IndexedDB, keeps only metadata (id, title, uploadDate, facultyIds, taught) in localStorage
- File size validation in PDFUploadForm: warn if PDF > 50MB, hard block if > 100MB
- Storage usage indicator showing how many PDFs are stored and total estimated size
- Download PDF button in FacultyPDFList on each PDF card
- Download PDF button in TeachingView toolbar (next to Mark as Taught)
- `downloadPDF(pdfId, title)` utility that reads from IndexedDB and triggers browser download

### Modify
- `useQueries.ts`: 
  - `loadPDFs()` — reads metadata from localStorage, does NOT include content field
  - `savePDFs()` — saves metadata list (no content)
  - `useUploadPDF()` — stores content in IndexedDB via pdfStorage, metadata in localStorage
  - `useDeletePDF()` — also deletes from IndexedDB
  - `usePDFsByFaculty()` — returns PDFs without content for the list view
  - Add `usePDFContent(pdfId)` hook that fetches content from IndexedDB for a specific PDF
- `TeachingView.tsx`: use `usePDFContent(pdfId)` instead of reading content from the PDF list
- `FacultyPDFList.tsx`: add Download button on each card

### Remove
- Storing PDF base64 content in localStorage (moved to IndexedDB)

## Implementation Plan
1. Create `src/frontend/src/utils/pdfStorage.ts` — IndexedDB CRUD for PDF content
2. Update `useQueries.ts` — split metadata (localStorage) from content (IndexedDB)
3. Update `TeachingView.tsx` — fetch content from IndexedDB
4. Update `FacultyPDFList.tsx` — add Download button
5. Update `PDFUploadForm.tsx` — add file size validation
6. Validate
