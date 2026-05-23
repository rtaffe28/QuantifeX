# Frontend Error & Empty States

**Bucket:** Finish partial features

## Goal
Add a small, consistent set of UI components — Loading, Error, Empty — and apply them across every page that fetches data. Today pages either silently fail, show partial data, or just stay blank.

## Why
- The backend cleanup in [[error-handling-cleanup]] will start producing real error responses; the frontend needs to display them.
- Empty states (no watchlists, no transactions, no backtests yet) currently look like bugs.
- A shared component set is the only way this stays consistent as features get added.

## Scope
**In:** `<LoadingState>`, `<ErrorState>`, `<EmptyState>` Chakra-styled components; a `useApiQuery` hook (or `useApiError` if RTK Query is already in use) that surfaces these states; rollout across watchlist, stock detail, options pages, earnings calendar, monte carlo, transactions, backtests.

**Out:** Skeleton loaders (nice-to-have, separate plan).

## Approach
1. Build the three components — each takes a title, optional description, optional CTA (e.g. "Add your first watchlist").
2. Define a small `ApiError` TS type matching the backend shape from [[error-handling-cleanup]].
3. Either: add a `useApiQuery` wrapper around fetch, or standardize an existing pattern — pick one and use it everywhere.
4. Update each page: replace ad-hoc `if (loading) return null` with `<LoadingState>`, same for error/empty.
5. Visual QA pass with the network throttled / API down.

## Key files
- `frontend/quantifex_fe/src/components/states/{Loading,Error,Empty}State.tsx` (new)
- `frontend/quantifex_fe/src/hooks/useApiQuery.ts` (new)
- All pages under `src/pages/`

## Acceptance
- Every data-fetching page renders all three states intentionally.
- Disconnecting the backend produces consistent error UI, not blank screens.
