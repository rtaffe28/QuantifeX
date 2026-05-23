# Options Chain Endpoint

**Bucket:** Finish partial features

## Goal
Replace the thin `/api/options/<symbol>/` endpoint with a real options chain: available expirations, then calls and puts per expiration with strike, last, bid/ask, IV, volume, open interest.

## Why
- The options pricer works in isolation but the analysis page has nothing real to show.
- This is the data shape every interesting feature on top wants — IV smile, max-pain, strategy backtests on actual chains.
- yfinance exposes this; we just don't surface it.

## Scope
**In:** Two endpoints — `GET /api/options/<symbol>/expirations/` and `GET /api/options/<symbol>/chain/?expiration=YYYY-MM-DD`. Cached via [[market-data-caching]], wrapped by [[yfinance-rate-limiting]]. Frontend: replace the stub options analysis page with a real chain table.

**Out:** Greeks for the whole chain (compute on demand client-side or via existing pricer endpoint). Historical chain snapshots.

## Approach
1. Backend: `yf.Ticker(symbol).options` for expirations; `yf.Ticker(symbol).option_chain(date)` for chain.
2. Serialize to a stable shape: `{expiration, calls: [{strike, last, bid, ask, iv, volume, oi}], puts: [...]}`.
3. Cache chain responses for ~5 minutes (more volatile than daily history).
4. Frontend: dropdown for expiration, two tables (calls left, puts right), highlight ATM row.
5. Click a row to prefill the options pricer.

## Key files
- `backend/options/views.py`, `backend/options/serializers.py`
- `frontend/quantifex_fe/src/pages/OptionsAnalysis.tsx`

## Acceptance
- Both endpoints return realistic, tested response shapes.
- Frontend shows a working chain table for any liquid US ticker.
- Clicking a strike prefills the pricer.
