# Price Alerts

**Bucket:** New features

## Goal
Let users set threshold alerts on tickers — "notify me when AAPL crosses $200" — with in-app notifications and an optional email channel.

## Why
- Watchlist is passive; alerts make it active.
- Celery is already in the stack; this is a natural use of scheduled tasks.
- High-utility feature for daily-active engagement.

## Scope
**In:** `Alert` model (user, symbol, direction, threshold, status), CRUD endpoints, a periodic Celery task that checks active alerts and fires notifications, in-app bell/notifications UI, optional email via Django's mail backend.

**Out:** SMS / push notifications. Complex conditions (e.g. "5% drop within 1 hour") — start with simple thresholds.

## Approach
1. Data model: `Alert(user, symbol, direction in {above, below}, threshold, status in {active, triggered, dismissed}, created_at, triggered_at)`.
2. CRUD endpoints scoped to user (apply the [[backtest-permission-audit]] pattern from the start).
3. Celery beat task every N minutes: pull active alerts, batch-fetch quotes via the cached client from [[market-data-caching]], compare, fire and mark triggered.
4. Notification model + endpoint for the frontend to poll (or wire SSE/WebSocket if cheap).
5. Frontend: "Set alert" button on stock detail; bell icon with unread count in nav.
6. Email channel as a user setting, off by default.

## Key files
- `backend/alerts/` (new app — models, views, tasks)
- `frontend/quantifex_fe/src/components/AlertModal.tsx`, `NotificationBell.tsx`

## Acceptance
- A user can set an alert and see it fire when the threshold is crossed (testable with a manual price override).
- Triggered alerts move out of "active" automatically.
- Email opt-in works end to end.
