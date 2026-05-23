# yfinance Rate Limiting & Retry

**Bucket:** Foundation & quality

## Goal
Wrap all yfinance calls in a single client that enforces a request-rate budget and surfaces throttle errors cleanly, so we stop risking IP bans and so the frontend can show a real "rate limited, try again" state.

## Why
- yfinance scrapes Yahoo Finance and gets throttled/banned with no warning when traffic spikes.
- Today every view calls yfinance directly — no central place to add a budget.
- Pairs with [[market-data-caching]]: cache reduces calls, rate limiter protects the calls that do happen.

## Scope
**In:** A single `yfinance_client` wrapper used by all backend code; token-bucket-style rate limiting (in-process or Redis-backed); bounded retry with jitter on transient errors; mapping yfinance/Yahoo errors to a `RateLimitError` exception.

**Out:** Switching providers (Polygon, IEX, etc.) — call that out as a separate decision if rate limiting still isn't enough.

## Approach
1. Create `backend/core/services/yfinance_client.py`. All views import from here; direct `import yfinance` becomes a lint-checked anti-pattern.
2. Token bucket: e.g. 2 requests/sec sustained, burst of 10. Backed by Redis to span workers.
3. On throttle/HTTP 429, retry with exponential backoff + jitter, max 3 attempts.
4. On final failure, raise `RateLimitError`; surfaced via [[error-handling-cleanup]] as a structured 503.
5. Frontend: detect the error code and show a non-scary "data temporarily unavailable" state.

## Key files
- `backend/core/services/yfinance_client.py` (new)
- All views currently calling `yfinance.Ticker(...)` directly

## Acceptance
- No `import yfinance` outside the client module.
- A burst test stays within the configured budget.
- Throttle errors propagate as a single typed exception.
