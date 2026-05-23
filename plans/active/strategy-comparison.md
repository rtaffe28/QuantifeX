# Strategy Comparison

**Bucket:** New features

## Goal
A page to run multiple strategies against the same symbol and time window in one shot, then chart their equity curves side-by-side with summary metrics (CAGR, max drawdown, Sharpe).

## Why
- Single-strategy backtests are useful but the natural next question is "which one would have been best?"
- All the inputs already exist (symbol + window + strategy + params); this is mostly UI + a small orchestration endpoint.
- Pairs naturally with [[additional-backtest-strategies]] — more strategies make comparison more interesting.

## Scope
**In:** A new "Compare strategies" page; backend endpoint that takes a list of strategy configs and returns all their results; equity-curve overlay chart; metrics table.

**Out:** Multi-symbol comparison. Optimization (parameter sweep) — separate plan.

## Approach
1. Backend: `POST /api/backtests/compare/` accepting `{symbol, start, end, strategies: [{name, params}, ...]}`. Reuse the existing run path per strategy; gather results.
2. Persist each as a normal `BacktestRun` so they're individually re-openable.
3. Compute summary metrics once at the end: CAGR, max drawdown, Sharpe, hit rate.
4. Frontend: multi-strategy selector (up to N strategies), shared params for symbol/window, "Run comparison" button.
5. Chart: overlaid equity curves with a legend. Metrics table below.
6. Reuse the export from [[backtest-results-export]] but as a "compare export" — one CSV per run + a combined summary.

## Key files
- `backend/backtesting/views.py`, `backend/backtesting/services/compare.py` (new)
- `frontend/quantifex_fe/src/pages/StrategyCompare.tsx` (new)

## Acceptance
- Comparison runs ≥2 strategies and renders overlaid equity curves.
- Metrics table matches single-run results when the same config is used.
- Long comparisons (5+ strategies) don't block the UI — uses Celery if needed.
