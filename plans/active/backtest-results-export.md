# Backtest Results Export

**Bucket:** Finish partial features

## Goal
Let users download a backtest run's full output — equity curve and trade log — as CSV or JSON, so they can pull results into a spreadsheet or notebook for deeper analysis.

## Why
- The backtester computes rich per-step data but the UI summarizes it. Users hit a ceiling fast.
- CSV export is cheap to implement and unblocks "I want to compare strategies in Excel" workflows.
- Sets up [[strategy-comparison]] (which can chart what's currently locked inside the run).

## Scope
**In:** `GET /api/backtests/<id>/export.csv` and `.json` returning equity curve and trades; frontend download buttons on the backtest detail page.

**Out:** PDF report. Charts as images. Multi-run merged exports (separate plan).

## Approach
1. Backend: add a renderer that serializes the existing run results to CSV (equity time series + trades sheet, or two endpoints if simpler).
2. JSON variant just returns the same structure as the detail endpoint but flattened for portability.
3. Reuse [[backtest-permission-audit]] ownership checks — must come after that plan or be re-audited together.
4. Frontend: two download buttons; filename includes symbol + strategy + date range.
5. Tests: a known small run produces a stable, hand-checked CSV.

## Key files
- `backend/backtesting/views.py`, `backend/backtesting/exporters.py` (new)
- `frontend/quantifex_fe/src/pages/BacktestDetail.tsx`

## Acceptance
- Both CSV and JSON download work from the UI.
- Files contain equity curve and trade-by-trade detail.
- Endpoints reject other users' runs (404).
