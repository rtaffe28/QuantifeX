# Transactions: Portfolio Aggregation

**Bucket:** Finish partial features

## Goal
Turn the transactions log into a real portfolio view: per-symbol holdings, cost basis, realized P&L, unrealized P&L (using current price), and overall account totals.

## Why
- The transactions table exists but nothing on top of it. Users can record buys/sells but can't see what they own or how they're doing.
- This is the obvious next step before any portfolio dashboard (see [[portfolio-dashboard]]) — that plan consumes this endpoint.

## Scope
**In:** Backend aggregation endpoint `GET /api/transactions/portfolio/`; cost-basis calculation (FIFO by default); unrealized P&L using cached spot from [[market-data-caching]]; frontend summary panel.

**Out:** Tax-lot selection methods beyond FIFO (LIFO, specific-ID). Dividends/splits adjustments (call out as a follow-up if relevant).

## Approach
1. Walk transactions per symbol ordered by date; maintain a FIFO lot queue.
2. Sell → pop lots until quantity satisfied → realized P&L += (sell_price − lot_cost) × qty.
3. Remaining lots → current holdings with avg cost.
4. Unrealized P&L = (spot − avg_cost) × qty.
5. Aggregate totals: account value, total cost, total realized, total unrealized.
6. Response shape: `{holdings: [{symbol, qty, avg_cost, spot, unrealized_pl}], realized_pl_total, account_value}`.
7. Frontend: a summary card at the top of the transactions page.

## Key files
- `backend/transactions/services/portfolio.py` (new), `backend/transactions/views.py`
- `frontend/quantifex_fe/src/pages/TransactionsPage.tsx`

## Acceptance
- Aggregation matches a hand-computed example (write a test).
- Sells that exceed available qty return a clear error.
- Endpoint cached briefly to avoid recomputation on rapid refreshes.
