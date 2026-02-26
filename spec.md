# SmartBoard Faculty PDF Portal

## Current State

The app has three routes: Admin (`/admin`), Faculty (`/faculty`), Developer (`/dev-portal`).

- **Admin Portal**: Has its own login gate (`AdminPasscodeGate`) with username/password, landing screen with "Login as Admin" / "Create New Admin" options. Manages faculty, PDFs, subscriptions, devices.
- **Faculty Portal**: No login gate — faculty members are selected from a list. Can view/annotate PDFs.
- **Developer Portal**: No login gate. Accessible via hidden link in Faculty portal. Visually identical to Admin — same colors, same layout. Read-only view of faculty, PDFs, devices, subscription. Not accessible from the home page.

The home page only shows buttons for Admin Panel and Faculty Portal. The Developer Portal has no visible entry point.

## Requested Changes (Diff)

### Add
- **Developer Portal login gate** (`DeveloperPasscodeGate`) — separate from `AdminPasscodeGate`, using its own localStorage key (`eduboard_developer_creds`). Default credentials: `developer` / `dev1234`. Same two-option landing (Login / Create New Developer Account).
- **Developer Portal button on the home page** — third prominent button alongside Admin and Faculty.
- **Developer Portal button in the Layout navbar** — visible nav link to `/dev-portal`.
- **License management tab** in Developer Portal — create, view, revoke license keys. Each license key is stored in localStorage with metadata (plan tier, max devices, devices used, status).
- **Admin management tab** in Developer Portal — view all admin accounts, reset/delete admin credentials, create new admin accounts from developer level.
- **System settings tab** in Developer Portal — reset all data, export data, view system stats.
- **Distinct visual identity** for Developer Portal — use a different color accent (e.g., deep indigo/purple) and a "Developer" badge/indicator to distinguish it clearly from Admin (which uses the primary maroon color). The Developer Portal header should show "Developer Portal" branding, not "Smart Board Portal".

### Modify
- `HomePage.tsx` — add a third button "Developer Portal" in the hero CTA section and the Quick Access section.
- `Layout.tsx` — add "Developer" nav link, and show a "Dev Lock" button when on `/dev-portal` route (mirrors the Admin "Lock" button).
- `DeveloperPortal.tsx` — wrap the entire content in a new `DeveloperPasscodeGate`. Give it a unique visual style (deep indigo/slate color scheme). Add License Management and Admin Management tabs to the existing Faculty / PDFs / Devices / Plan tabs.
- Remove the hidden "Developer Access" link from `FacultyPortal.tsx` (now it has its own proper entry point).

### Remove
- Hidden "Developer Access" / "Dev Portal" button from the Faculty Portal's faculty selector screen and the header.

## Implementation Plan

1. Create `DeveloperPasscodeGate.tsx` — mirrors `AdminPasscodeGate.tsx` but uses `DEVELOPER_LOCK_EVENT`, `dev_authenticated` session key, and `eduboard_developer_creds` storage key. Shows "Developer Portal" branding with an indigo icon.
2. Update `useQueries.ts` — add `hasDeveloperCredentialsSet`, `verifyDeveloperCredentials`, `setDeveloperCredentialsLocal` helper functions. Add license management helpers (load/save license keys from localStorage).
3. Update `DeveloperPortal.tsx` — wrap in `DeveloperPasscodeGate`. Add License and Admin Management tabs. Apply distinct indigo color theme using Tailwind classes. Remove "Go to Admin Panel" button from Developer Portal header (replace with a "Logout" button).
4. Update `HomePage.tsx` — add Developer Portal button (use a `Code2` or `Terminal` icon, indigo styling).
5. Update `Layout.tsx` — add Developer nav item, show Dev Lock button on `/dev-portal` route.
6. Update `FacultyPortal.tsx` — remove the hidden "Developer Access" link and "Dev Portal" header button.

## UX Notes

- Developer Portal must feel distinct — use indigo/slate tones vs maroon/primary for Admin.
- The three portals should each have their own unmistakable visual identity from the home screen.
- License management is localStorage-based (same as all other data in this app).
- Default developer credentials pre-seeded on first load: username `developer`, password `dev1234`.
