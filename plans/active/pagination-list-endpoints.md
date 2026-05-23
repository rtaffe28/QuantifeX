# Pagination on List Endpoints

**Bucket:** Foundation & quality

## Goal
Add pagination to list endpoints that today return everything in one response: watchlist items, transactions, backtest runs. Frontend gets page controls.

## Why
- Today these return all rows in a single payload. Fine at 10 backtests, ugly at 1,000.
- Easier to add now than to retrofit once UI assumes a flat array.
- Frontend pagination affordance also doubles as a slot for sort/filter later.

## Scope
**In:** DRF `PageNumberPagination` (or cursor for transactions if ordering by date), `page_size` configurable per endpoint, frontend pager component used on all paginated lists.

**Out:** Server-side sort/filter (separate plan if needed). Infinite scroll.

## Approach
1. Configure default pagination class in `REST_FRAMEWORK` settings: `PageNumberPagination`, `page_size=25`, `max_page_size=100`.
2. Override `pagination_class` to `None` on endpoints that should stay un-paginated (e.g. dropdown sources, if any).
3. Frontend: a shared `<Paginator>` Chakra component using the `count`/`next`/`previous` response shape.
4. Update existing data-fetch hooks to handle the paginated response shape.
5. Tests: list endpoints respect `page` and `page_size` and cap at `max_page_size`.

## Key files
- `backend/backend/settings.py` (REST_FRAMEWORK config)
- `backend/{watchlist,transactions,backtesting}/views.py`
- `frontend/quantifex_fe/src/components/Paginator.tsx` (new)

## Acceptance
- All list endpoints return `{count, next, previous, results}`.
- Frontend lists show a pager when `count > page_size`.
- Tests cover paging behavior for at least one endpoint.
