# Specification

## Summary
**Goal:** Update subscription plan pricing, limits, and license counts across backend and frontend for all three tiers (Basic, Premium, Diamond) and four billing cycles.

**Planned changes:**
- Update backend (`backend/main.mo`) subscription plan data to reflect exact pricing, faculty limits, PDF limits, and license counts for Basic, Premium, and Diamond tiers across Monthly, Quarterly, Half-yearly, and Yearly billing cycles
- Set default plan to Basic Monthly with correct limits (30 faculty, 500 PDFs, 2 licenses, ₹8,000)
- Remove any Free tier from the backend plan data model
- Update frontend plan configuration in `useQueries.ts` and `SubscriptionSection.tsx` to match the new pricing and limits exactly
- Display license count (2 / 4 / 6) on each plan card alongside faculty limit, PDF limit, and price
- Remove Free plan card from the Subscription Management UI

**User-visible outcome:** The Subscription Management section shows three plan cards (Basic, Premium, Diamond) with correct faculty limits, PDF limits, license counts, and per-cycle prices. Selecting a billing cycle updates the displayed price correctly, and choosing a plan passes the accurate tier and cycle data to the backend.
