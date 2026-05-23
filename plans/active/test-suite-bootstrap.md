# Test Suite Bootstrap

**Bucket:** Foundation & quality

## Goal
Establish a working test harness on both backend and frontend so future plans can land with tests instead of bare diffs. Today there is one empty `core/tests.py` and no frontend test setup.

## Why
- Refactors and new features are landing untested; regressions ship silently.
- Auth, backtest permissions, and yfinance integration all need coverage before they can be safely changed.
- A test-running culture has to start somewhere — pick a small surface, make it green, then expand.

## Scope
**In:** pytest + pytest-django + factory_boy on the backend; Vitest + React Testing Library on the frontend; CI-runnable commands; one happy-path test per area as a template.

**Out:** Full coverage of existing code. End-to-end / browser tests. Coverage gates.

## Approach
1. Backend: add `pytest`, `pytest-django`, `factory-boy` to requirements; add `pytest.ini` with `DJANGO_SETTINGS_MODULE`.
2. Write factories for `User`, `Watchlist`, `BacktestRun`.
3. Smoke tests: register → login → create watchlist → list watchlists; run a buy-and-hold backtest.
4. Frontend: configure Vitest + RTL + jsdom; one render test for `WatchlistPage` with mocked API.
5. Document `pytest` / `pnpm test` in README.

## Key files
- `backend/requirements.txt`, `backend/pytest.ini`, `backend/core/tests/`
- `frontend/quantifex_fe/vitest.config.ts`, `frontend/quantifex_fe/src/test/`

## Acceptance
- `pytest` runs green with ≥5 backend tests across auth/watchlist/backtest.
- `pnpm test` runs green with ≥1 frontend component test.
- README documents both commands.
