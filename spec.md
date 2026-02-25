# Specification

## Summary
**Goal:** Fix the PDF-to-faculty assignment flow in the EduBoard Admin Panel so admins can successfully upload a PDF and assign it to one or more faculty members.

**Planned changes:**
- Audit and fix `PDFUploadForm` to correctly fetch and display the list of active faculty members from the backend on mount.
- Ensure selected faculty IDs are collected and passed correctly to the backend `uploadPDF` call without any extra admin credential argument.
- Remove any pre-flight admin credential re-check or caller-principal guard in `useUploadPDF` mutation hook that short-circuits submission.
- Fix the backend `uploadPDF` function in `backend/main.mo` to accept title, base64 content, and an array of faculty IDs, removing any `assert`, `isAdmin`, or caller-principal guard that causes authorization errors.
- Ensure the backend persists the faculty assignment and returns a well-typed success or error variant.
- Invalidate and refetch the PDF list query after a successful upload so the table reflects the new entry immediately.
- Display inline error messages (e.g., PDF limit exceeded) when upload or assignment fails.

**User-visible outcome:** Admins authenticated via AdminPasscodeGate can upload a PDF, select one or more faculty members, submit the form without errors, and immediately see the newly assigned PDF appear in the PDF list table.
