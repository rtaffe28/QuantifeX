# Market Data Caching

**Bucket:** Foundation & quality

## Goal
Cache yfinance responses in Redis so identical lookups within a sensible TTL skip the network. Today every page load re-fetches data the user already saw seconds ago.

## Why
- yfinance is slow (1–3s typical) and rate-limited.
- A user loading their watchlist hits yfinance N times even though prices barely move within a minute.
- Reduces pressure on the rate-limit work in [[yfinance-rate-limiting]].
- Redis is already in the stack for Celery — no new infra.

## Scope
**In:** Cache wrapper for the yfinance client used by stock detail, earnings, options pricing autofill, and earnings calendar.

**Out:** Cache invalidation on user action (these are read-mostly endpoints). Long-term tick storage (would be a separate data-warehouse plan).

## Approach
1. Add `django-redis` (or use Django's built-in Redis cache) configured against the existing Redis.
2. Write a `cached_yfinance` helper: `key = (function_name, symbol, params_hash, day_bucket)`; TTLs by data type:
   - Intraday price: 60s
   - Daily history: 1h
   - Earnings dates: 6h
   - Annual financials: 24h
3. Add a `?bust=1` query param (auth-required) to skip the cache for manual refresh.
4. Metrics: log cache hit/miss counts to evaluate effectiveness.

## Key files
- `backend/core/services/market_data.py` (new), `backend/backend/settings.py` (cache config)

## Acceptance
- Repeated calls to stock detail within TTL hit Redis, not yfinance (verified via logs/metric).
- Cache keys are stable across processes (no `id()`-based keys).
- `?bust=1` forces a refresh for the requesting user.
