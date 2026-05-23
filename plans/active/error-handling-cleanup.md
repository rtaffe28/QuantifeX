# Error Handling Cleanup

**Bucket:** Foundation & quality

## Goal
Replace silent `try/except: pass` blocks across the API with logged errors and structured responses, so failures stop being invisible.

## Why
Stock detail, earnings calendar, and options views all swallow yfinance/network errors silently and return partial or empty data. Users see blank charts with no explanation; we can't debug because nothing is logged. This compounds: every new feature copies the pattern.

## Scope
**In:** Backend view-level error handling, standardized JSON error response shape, logging at the right levels, frontend toast/inline-error surfaces.

**Out:** Distributed tracing, Sentry integration (separate plan), retry logic (lives in [[yfinance-rate-limiting]]).

## Approach
1. Define a small `APIError` exception + DRF exception handler that returns `{error: {code, message, details}}`.
2. Walk every view in stock detail, earnings, options, backtesting — narrow `except` clauses to expected exceptions (`yfinance.YFinanceError`, `requests.RequestException`, etc.).
3. Log at `warning` for recoverable issues (partial data), `error` for failures.
4. Frontend: a shared `useApiError` hook + `<ErrorBanner>` component used consistently. See [[frontend-error-empty-states]].
5. Document the error contract in API docs (drf-spectacular).

## Key files
- `backend/core/exceptions.py` (new), `backend/core/views.py`, `backend/options/views.py`, `backend/backtesting/views.py`
- `frontend/quantifex_fe/src/hooks/useApiError.ts` (new)

## Acceptance
- No `except: pass` survives a repo grep in app code.
- Every API endpoint returns structured errors with stable `code` strings.
- Frontend surfaces backend errors visibly (toast or inline banner).
