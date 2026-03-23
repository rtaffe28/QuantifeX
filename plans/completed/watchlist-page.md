# Watchlist Page Spec

## Context
The `Watchlist` and `StockTicker` backend models already exist with working API endpoints:
- `GET/POST /api/watchlist/` — list & add watchlist entries (auth required)
- `DELETE /api/watchlist/delete/<id>/` — remove watchlist entry
- `GET /api/tickers/` — list all stock tickers

The frontend already has API service functions (`api/watchlist.ts`, `api/tickers.ts`), a `StockAutocomplete` component with Fuse.js fuzzy search, and a sidebar link to `/watchlist`. This spec covers building a full watchlist page with ticker search, watchlist management, and a detailed stock breakdown panel.

## Goal
Build a watchlist page where users can search & add tickers, remove tickers, and select a ticker to view a detailed statistics breakdown (price history, volatility, volume, earnings, and more).

---

## 1. Backend — New Stock Detail Endpoint

The existing endpoints cover watchlist CRUD and ticker listing. We need one new endpoint to serve detailed stock data for the selected ticker.

### Files to create/modify:

**Create `backend/core/views/stock_detail.py`**
- `StockDetailView(APIView)` — `GET /api/stock/<str:symbol>/`
- Permission: `IsAuthenticated`
- Accepts a ticker symbol as a URL param
- Returns a JSON payload with the following shape (data can be stubbed or pulled from a third-party API like yfinance in a later phase):

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "current_price": 182.52,
  "change_today": 1.34,
  "change_today_pct": 0.74,
  "market_cap": 2840000000000,
  "pe_ratio": 28.5,
  "dividend_yield": 0.55,
  "fifty_two_week_high": 199.62,
  "fifty_two_week_low": 124.17,
  "price_history": [
    { "date": "2024-01-02", "close": 185.22, "volume": 45123000 }
  ],
  "earnings": [
    { "quarter": "Q1 2024", "actual_eps": 2.18, "estimated_eps": 2.10, "revenue": 119500000000 }
  ],
  "volatility": {
    "beta": 1.28,
    "std_dev_30d": 0.019,
    "std_dev_90d": 0.022
  }
}
```

**Modify `backend/core/views/__init__.py`**
- Export `StockDetailView`

**Modify `backend/core/urls.py`**
- `path('stock/<str:symbol>/', views.StockDetailView.as_view())`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/stock.ts`**
Follow the `watchlist.ts` pattern:
- `getStockDetail(symbol: string)` — GET `/stock/{symbol}/`

---

## 3. Frontend — TypeScript Models

**Create `frontend/quantifex_fe/src/models/StockDetail.ts`**
```ts
export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

export interface EarningsReport {
  quarter: string;
  actual_eps: number;
  estimated_eps: number;
  revenue: number;
}

export interface Volatility {
  beta: number;
  std_dev_30d: number;
  std_dev_90d: number;
}

export interface StockDetail {
  symbol: string;
  name: string;
  current_price: number;
  change_today: number;
  change_today_pct: number;
  market_cap: number;
  pe_ratio: number;
  dividend_yield: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  price_history: PricePoint[];
  earnings: EarningsReport[];
  volatility: Volatility;
}
```

**Create `frontend/quantifex_fe/src/models/WatchlistItem.ts`**
```ts
export interface WatchlistItem {
  id: number;
  user: number;
  ticker: string;
}
```

---

## 4. Frontend — Watchlist Page Component

**Create `frontend/quantifex_fe/src/pages/WatchlistPage.tsx`**

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  Watchlist                                                           │
├────────────────────────┬─────────────────────────────────────────────┤
│                        │                                             │
│  [ Search tickers... ] │         Stock Detail Panel                  │
│  ┌──────────────────┐  │                                             │
│  │ Search Results    │  │  AAPL — Apple Inc.         $182.52 +0.74%  │
│  │ (dropdown)        │  │                                             │
│  └──────────────────┘  │  ┌─ Key Stats ──────────────────────────┐   │
│                        │  │ Mkt Cap │ P/E │ Div Yield │ Beta     │   │
│  My Watchlist          │  │ $2.84T  │28.5 │ 0.55%     │ 1.28     │   │
│  ┌──────────────────┐  │  │ 52W Hi  │52W Lo│ 30d Vol  │ 90d Vol │   │
│  │ AAPL  ▸  ✕       │  │  │ $199.62 │$124  │ 1.9%     │ 2.2%    │   │
│  │ MSFT  ▸  ✕       │  │  └──────────────────────────────────────┘   │
│  │ GOOGL ▸  ✕       │  │                                             │
│  │                  │  │  ┌─ Price History (Line Chart) ──────────┐  │
│  │                  │  │  │                                        │  │
│  │                  │  │  │  ~~~~~/\~~~~                           │  │
│  │                  │  │  │              \~~~~/\~~                 │  │
│  └──────────────────┘  │  └────────────────────────────────────────┘  │
│                        │                                             │
│                        │  ┌─ Volume (Bar Chart) ─────────────────┐   │
│                        │  │  █ █ ▄ █ ▄ █ ▄ █ ▄ █ █ ▄ █          │   │
│                        │  └──────────────────────────────────────┘   │
│                        │                                             │
│                        │  ┌─ Earnings (Bar Chart) ───────────────┐   │
│                        │  │  Actual EPS vs Estimated EPS          │   │
│                        │  │  █▓ █▓ █▓ █▓   (grouped bars)        │   │
│                        │  └──────────────────────────────────────┘   │
│                        │                                             │
└────────────────────────┴─────────────────────────────────────────────┘
```

### Left Panel — Watchlist Sidebar (~300px width)

**Ticker Search**
- Reuse or adapt the existing `StockAutocomplete` component
- Text input with placeholder "Search tickers..."
- Fuse.js fuzzy search over all tickers (fetched on mount via `getTickers()`)
- Dropdown shows matching results (max 50, virtualized with `react-window`)
- Clicking a result calls `addToWatchlist(ticker)` and refreshes the list
- Show success/error feedback inline (e.g. "Already in watchlist")

**Watchlist Items**
- Fetch on mount via `getWatchlist()`
- Each item shows ticker symbol, a select arrow `▸`, and a delete `✕` button
- Clicking the ticker symbol or row selects it (highlights with `primary.default` background)
- Clicking `✕` calls `deleteFromWatchlist(id)` and removes from list
- Active/selected item has a distinct background (`bg.subtle` or `primary.default` with alpha)
- Empty state: "Your watchlist is empty. Search above to add tickers."

### Right Panel — Stock Detail

Only shown when a ticker is selected from the watchlist. Shows a loading `Spinner` while fetching.

**Header**
- Symbol + company name on the left
- Current price + daily change (green if positive, red if negative) on the right
- Use semantic color tokens `up` / `down`

**Key Stats Grid**
- 2-row, 4-column grid using Chakra UI `SimpleGrid` or `Grid`
- Row 1: Market Cap, P/E Ratio, Dividend Yield, Beta
- Row 2: 52W High, 52W Low, 30-Day Volatility (std_dev_30d as %), 90-Day Volatility (std_dev_90d as %)
- Format market cap with abbreviation ($2.84T, $150B, etc.)

**Price History Chart**
- Recharts `AreaChart` (consistent with CompoundInterestCalculator pattern)
- X-axis: dates, Y-axis: closing price
- Tooltip showing date + price on hover
- Teal gradient fill matching the theme's `primary.default` color
- Time range selector buttons: 1M, 3M, 6M, 1Y, ALL (filter `price_history` data client-side)

**Volume Chart**
- Recharts `BarChart` below the price chart
- X-axis: dates (same range as price chart), Y-axis: volume
- Bar color: `primary.default` (teal)
- Shared time range with price chart

**Earnings Chart**
- Recharts grouped `BarChart`
- X-axis: quarter labels, Y-axis: EPS
- Two bar series: Actual EPS (`up` green) vs Estimated EPS (`fg.muted` gray)
- Tooltip showing quarter, actual, estimated, and revenue

**Empty/Unselected State**
- When no ticker is selected, show a centered message: "Select a ticker from your watchlist to view details"

---

## 5. Frontend — Routing & Navigation

**Modify `frontend/quantifex_fe/src/App.tsx`**
- The `/watchlist` route likely already exists pointing to `StockAutocomplete`. Replace it with the new `WatchlistPage` component, still wrapped in `ProtectedRoute`.

**`frontend/quantifex_fe/src/components/Sidebar.tsx`**
- Already has a Watchlist link — no changes needed.

---

## 6. Component Breakdown

To keep the page manageable, split into sub-components:

| Component | File | Responsibility |
|-----------|------|----------------|
| `WatchlistPage` | `pages/WatchlistPage.tsx` | Top-level layout, state management (selected ticker, watchlist data) |
| `WatchlistSidebar` | `components/watchlist/WatchlistSidebar.tsx` | Search input + watchlist item list |
| `StockDetailPanel` | `components/watchlist/StockDetailPanel.tsx` | Orchestrates all detail sections |
| `StockHeader` | `components/watchlist/StockHeader.tsx` | Symbol, name, price, daily change |
| `KeyStatsGrid` | `components/watchlist/KeyStatsGrid.tsx` | Stats grid |
| `PriceHistoryChart` | `components/watchlist/PriceHistoryChart.tsx` | Area chart + time range buttons |
| `VolumeChart` | `components/watchlist/VolumeChart.tsx` | Volume bar chart |
| `EarningsChart` | `components/watchlist/EarningsChart.tsx` | Grouped EPS bar chart |

---

## 7. State Management

All state lives in `WatchlistPage` and is passed down as props:

| State | Type | Purpose |
|-------|------|---------|
| `watchlist` | `WatchlistItem[]` | User's current watchlist |
| `allTickers` | `StockTicker[]` | All available tickers for search |
| `selectedTicker` | `string \| null` | Currently selected ticker symbol |
| `stockDetail` | `StockDetail \| null` | Detail data for selected ticker |
| `loading` | `boolean` | Loading state for watchlist fetch |
| `detailLoading` | `boolean` | Loading state for stock detail fetch |
| `error` | `string \| null` | Error message |

- When `selectedTicker` changes, fetch `getStockDetail(symbol)` and update `stockDetail`
- When watchlist changes (add/remove), re-fetch via `getWatchlist()`
- If the selected ticker is removed from watchlist, clear `selectedTicker` and `stockDetail`

---

## 8. Formatting Utilities

Add to `frontend/quantifex_fe/src/lib/utils.ts` or a new `formatters.ts`:

- `formatMarketCap(value: number): string` — e.g. `2840000000000` → `"$2.84T"`
- `formatPercent(value: number): string` — e.g. `0.019` → `"1.9%"`
- `formatLargeNumber(value: number): string` — e.g. `45123000` → `"45.1M"`

---

## 9. Verification

1. Run Django backend, confirm `GET /api/stock/AAPL/` returns 200 with mock data
2. Navigate to `/watchlist` — should see the search bar and empty watchlist message
3. Search for a ticker, click to add — should appear in watchlist
4. Click a watchlist item — right panel should load with stock detail
5. Verify all charts render: price history, volume, earnings
6. Use time range buttons (1M/3M/6M/1Y/ALL) — price and volume charts should filter
7. Click `✕` on a watchlist item — should remove from list
8. Remove the selected item — detail panel should clear to empty state
