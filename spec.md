# Specification

## Summary
**Goal:** Replace the existing passcode-based admin gate with a proper username + password authentication system, backed by stored credentials in the backend.

**Planned changes:**
- Add a stable admin credentials record to the backend with default username `admin` and password `admin1234`, exposed via `verifyAdminCredentials` and `setAdminCredentials` actor methods.
- Replace the `AdminPasscodeGate` component with a two-field login form (Username + Password) that calls `verifyAdminCredentials` on the backend; persist session in sessionStorage on success and show inline error on failure.
- Keep the existing "Lock / Sign Out" button behavior (clears sessionStorage, returns to login form).
- Update the Home Page admin access notice to display the default credentials (username: admin, password: admin1234).
- Add a "Change Admin Credentials" form inside the Admin Panel with New Username, New Password, and Confirm Password fields; validate inputs and call `setAdminCredentials` on success, showing appropriate success or error messages.

**User-visible outcome:** Admins log in with a username and password instead of a passcode, can change their credentials from within the Admin Panel, and the Home Page shows the default login details for first-time access.
