# Backtest Permission Audit

**Bucket:** Foundation & quality

## Goal
Ensure backtest runs are scoped to their owning user across read, list, and delete endpoints. Currently any authenticated user can fetch or delete any other user's backtest by ID.

## Why
Multi-tenant data leak. Even on a single-user instance today, leaving this for later means the bug ships with whatever first non-trivial user load arrives. Easy to fix now, painful to discover via incident.

## Scope
**In:** Object-level ownership checks on every backtest endpoint; queryset filtering by `request.user`; tests asserting cross-user access returns 404 (not 403, to avoid ID enumeration).

**Out:** Sharing/collaboration features. Admin/staff override paths.

## Approach
1. Audit every view under the backtesting app — list, detail, delete, results.
2. Replace `BacktestRun.objects.get(pk=…)` with `.filter(user=request.user).get(pk=…)`.
3. For list views, ensure the base queryset is filtered by `user=request.user`.
4. Add a `IsOwner` permission class or use DRF's `get_queryset()` override consistently.
5. Tests: a user cannot read or delete another user's backtest (expect 404).
6. Sweep watchlist and transactions endpoints for the same pattern while we're here.

## Key files
- `backend/backtesting/views.py`, `backend/backtesting/permissions.py` (new), `backend/backtesting/tests/`

## Acceptance
- Cross-user access returns 404 for all backtest endpoints.
- Tests cover at least: list, detail, delete.
- Same pattern audited (and fixed if needed) for watchlists and transactions.
