# QuantifeX Backlog

One-pager plans for improving the app. Drafts, not commitments — reorder, drop, or expand any of these.

Layout:
- `active/` — queued plans, not yet started.
- `completed/` — archive of finished plans for context.

## Foundation & quality

These shore up the floor. Most other plans assume some of these are done.

- [test-suite-bootstrap](active/test-suite-bootstrap.md) — Stand up pytest + Vitest with a few smoke tests so future changes can land tested.
- [backtest-permission-audit](active/backtest-permission-audit.md) — Fix cross-user access on backtest endpoints (currently anyone can read/delete any run).
- [security-hardening](active/security-hardening.md) — Remove insecure `SECRET_KEY` and `ALLOWED_HOSTS=*` defaults; require env vars.
- [error-handling-cleanup](active/error-handling-cleanup.md) — Replace silent `try/except: pass` with logged errors and structured API responses.
- [market-data-caching](active/market-data-caching.md) — Cache yfinance responses in Redis with sane per-data-type TTLs.
- [yfinance-rate-limiting](active/yfinance-rate-limiting.md) — Single rate-limited yfinance client with retries to avoid IP bans.
- [pagination-list-endpoints](active/pagination-list-endpoints.md) — Page watchlists, transactions, and backtest runs.
- [structured-logging](active/structured-logging.md) — JSON logs with request/user IDs; replace prints and silent excepts.

## Finish partial features

Things already started in the codebase but visibly unfinished.

- [options-chain-endpoint](active/options-chain-endpoint.md) — Real options chain (expirations, calls/puts with strike/IV/volume/OI) behind the existing stub.
- [transactions-portfolio-aggregation](active/transactions-portfolio-aggregation.md) — Compute holdings, cost basis, realized/unrealized P&L from the transactions log.
- [backtest-results-export](active/backtest-results-export.md) — CSV/JSON download of equity curve and trade log.
- [frontend-error-empty-states](active/frontend-error-empty-states.md) — Shared Loading/Error/Empty components applied across every data-fetching page.
- [auth-form-polish](active/auth-form-polish.md) — Strip `console.log`/`alert` stubs; wire backend validation errors into form fields.

## New features

Net-new surfaces, ordered roughly by value-to-effort.

- [portfolio-dashboard](active/portfolio-dashboard.md) — Landing page summarizing account value, holdings, allocation, recent activity.
- [price-alerts](active/price-alerts.md) — Threshold-based alerts with in-app notifications and optional email.
- [additional-backtest-strategies](active/additional-backtest-strategies.md) — RSI, MACD, and Bollinger strategies in the existing engine.
- [strategy-comparison](active/strategy-comparison.md) — Run multiple strategies against the same symbol/window with overlaid equity curves.

## Suggested order

Not prescriptive — but if you want a starting sequence:

1. `security-hardening` and `backtest-permission-audit` first (correctness/safety, cheap).
2. `test-suite-bootstrap` to make the rest landable with confidence.
3. `error-handling-cleanup` + `structured-logging` together — they share files.
4. `market-data-caching` + `yfinance-rate-limiting` together — they share files.
5. Then pick features by what you want to demo next: `transactions-portfolio-aggregation` unlocks `portfolio-dashboard`; `options-chain-endpoint` unlocks deeper options work; `additional-backtest-strategies` unlocks `strategy-comparison`.
