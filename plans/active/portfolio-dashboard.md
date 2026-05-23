# Portfolio Dashboard

**Bucket:** New features

## Goal
A single dashboard page summarizing the user's portfolio: total account value, day change, holdings table with weights, allocation pie, recent activity.

## Why
- Currently the app is "log in → pick a feature." There's no landing surface that says "here's where you stand."
- Pulls together work from [[transactions-portfolio-aggregation]] and [[market-data-caching]] into something visible.
- Becomes the natural home for [[price-alerts]] notifications.

## Scope
**In:** New `/dashboard` route with the summary card, holdings table, allocation chart, and a recent-activity list. Backend endpoint(s) aggregating the data in one call to avoid waterfall fetches.

**Out:** Customizable widgets / drag-and-drop layout. Multi-account / per-watchlist segmentation (later if needed).

## Approach
1. Backend: `GET /api/dashboard/` returns `{summary, holdings, allocation, recent_transactions}`. Reuse the aggregation service from [[transactions-portfolio-aggregation]].
2. Frontend: new page with four panels using Chakra grid; charting via the chart lib already in use (Recharts? Chart.js?).
3. Make it the default route after login.
4. Empty-state UX for brand-new users (`<EmptyState>` from [[frontend-error-empty-states]]): "Record your first transaction to populate the dashboard."
5. Refresh: a manual refresh button; auto-refresh on tab focus.

## Key files
- `backend/dashboard/views.py` (new app), `backend/dashboard/services.py`
- `frontend/quantifex_fe/src/pages/Dashboard.tsx` (new)

## Acceptance
- Logging in lands on the dashboard.
- All four panels render with real data.
- Empty-state path tested with a fresh user.
