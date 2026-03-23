# Earnings Calendar Spec

## Context

The existing `StockDetailView` already fetches earnings history via `yfinance`. This tool extends that to a forward-looking calendar view: upcoming earnings dates for all watchlist tickers, plus any additional tickers the user wants to track. yfinance provides `ticker.calendar` with the next earnings date for individual tickers.

---

## Goal

A calendar and list view showing upcoming earnings dates for the user's watchlist tickers. Users can also add extra tickers beyond their watchlist. Each event shows the earnings date, estimate EPS, previous EPS, and quick links into the watchlist detail view.

---

## 1. Backend — Earnings Calendar Endpoint

### New endpoint: `GET /api/earnings-calendar/`

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `tickers` | comma-separated string | e.g. `AAPL,MSFT,GOOGL` — if omitted, uses user's full watchlist |
| `days_ahead` | int | How many days forward to look (default 90, max 180) |

**Response:**

```json
{
  "events": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "earnings_date": "2024-10-31",
      "earnings_time": "AMC",
      "eps_estimate": 1.58,
      "eps_previous": 1.46,
      "revenue_estimate": 94200000000,
      "days_until": 12
    },
    ...
  ],
  "fetched_at": "2024-10-19T12:00:00Z"
}
```

`earnings_time`: `"BMO"` (before market open), `"AMC"` (after market close), or `"N/A"`

### Files to create/modify:

**Create `backend/core/views/earnings_calendar.py`**

```python
import yfinance as yf
from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Watchlist

class EarningsCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # If no tickers param, load from user's watchlist
        # For each ticker, call yf.Ticker(symbol).calendar to get next earnings date
        # Filter to within days_ahead window
        # Fetch eps_estimate and revenue_estimate from ticker.info
        # Fetch eps_previous from ticker.earnings_history (most recent quarter)
        # Return sorted by earnings_date ascending
```

**Implementation notes:**
- `ticker.calendar` returns a dict with key `"Earnings Date"` (can be a list of dates)
- `ticker.info` has `"epsForwardOneFY"`, `"forwardEps"` for estimate
- Fetch tickers in parallel using `yf.download()` or `concurrent.futures.ThreadPoolExecutor`
- Cap at 20 tickers per request to avoid timeouts
- Return empty `events: []` for tickers with no upcoming data rather than erroring

**Modify `backend/core/views/__init__.py`** — export `EarningsCalendarView`

**Modify `backend/core/urls.py`** — add `path('earnings-calendar/', views.EarningsCalendarView.as_view())`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/earningsCalendar.ts`**

```ts
const getEarningsCalendar = (params?: { tickers?: string; days_ahead?: number }) =>
  axiosInstance.get('earnings-calendar/', { params });
```

---

## 3. Frontend — TypeScript Models

**Create `frontend/quantifex_fe/src/models/EarningsCalendar.ts`**

```ts
export interface EarningsEvent {
  ticker: string;
  company_name: string;
  earnings_date: string;
  earnings_time: 'BMO' | 'AMC' | 'N/A';
  eps_estimate: number | null;
  eps_previous: number | null;
  revenue_estimate: number | null;
  days_until: number;
}

export interface EarningsCalendarResponse {
  events: EarningsEvent[];
  fetched_at: string;
}
```

---

## 4. Frontend — Page & Components

### File structure

```
src/
  pages/
    EarningsCalendarPage.tsx
  components/
    earnings/
      EarningsCalendarHeader.tsx
      EarningsEventCard.tsx
      EarningsListView.tsx
      EarningsCalendarGrid.tsx
      AddTickerBar.tsx
```

### 4a. `EarningsCalendarHeader`

- Title "Earnings Calendar"
- **View toggle**: [List] [Calendar] — switches between list and calendar grid views
- **Days ahead** segmented control: 30 / 60 / 90 / 180
- **Last updated** timestamp + refresh button

### 4b. `AddTickerBar`

- Text input: "Add ticker..." — pressing Enter adds to the tracked list
- Tracked tickers shown as removable tags above the input
- Default: all user's watchlist tickers (not removable but visually distinct)
- "Reset to Watchlist" button to restore defaults

### 4c. `EarningsListView`

Default view. Events grouped by week:

```
┌─ This Week ──────────────────────────────────────────────────────┐
│                                                                    │
│  Thu Oct 31                                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ AAPL  Apple Inc.              AMC   EPS Est: $1.58           │  │
│  │                                     Prev EPS: $1.46 (+8.2%) │  │
│  │                                     Rev Est:  $94.2B        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Fri Nov 1                                                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ MSFT  Microsoft Corp.         BMO   EPS Est: $3.12           │  │
│  │                                     Prev EPS: $2.99 (+4.3%) │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌─ Next Week ─────────────────────────────────────────────────────┐
  ...
```

**`EarningsEventCard`:**
- Ticker badge (teal, bold)
- Company name
- `BMO` badge (blue) or `AMC` badge (orange) or `N/A` (gray)
- EPS estimate vs previous: show delta `+8.2%` in green if estimate > prev, red if lower
- Revenue estimate formatted via `formatMarketCap`
- `days_until` shown as "in 12 days" or "Tomorrow" or "Today"
- Clicking the card navigates to `/watchlist` with that ticker pre-selected (if it's in watchlist)

### 4d. `EarningsCalendarGrid`

Monthly calendar grid (secondary view):
- Standard 7-column Monday–Sunday grid
- Today highlighted with teal border
- Each day cell shows ticker badges for that day's earnings
- Days with multiple events stack vertically (max 3 shown + "and N more")
- Clicking a day cell opens a popover/drawer with that day's full `EarningsEventCard` list

### 4e. Page layout (List view)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Earnings Calendar                          [List] [Cal]  Updated 2m │
│  Tracking: [AAPL ✕][MSFT ✕][GOOGL ✕][+ Add ticker]  [Reset to WL]  │
│  Show: [●30d] [60d] [90d] [180d]                                     │
├──────────────────────────────────────────────────────────────────────┤
│  This Week                                                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Thu Oct 31   AAPL   Apple Inc.          AMC  Est $1.58        │  │
│  │                                              Prev $1.46 +8.2% │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Fri Nov 1    MSFT   Microsoft            BMO  Est $3.12       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  Next Week                                                           │
│  ...                                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 4f. Page layout (Calendar view)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Earnings Calendar                          [List] [●Cal] Updated 2m │
│  < November 2024 >                                                   │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────────┤
│  Mon │  Tue │  Wed │  Thu │  Fri │  Sat │  Sun                      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────────┤
│      │      │      │  31  │   1  │   2  │   3                       │
│      │      │      │ AAPL │ MSFT │      │                           │
│      │      │      │      │ GOOGL│      │                           │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────────────────────┤
│   4  │   5  │   6  │   7  │   8  │   9  │  10                       │
│      │      │      │ AMZN │      │      │                           │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────────────────────┘
```

---

## 5. Navigation

**`Sidebar.tsx`** — add "Earnings Calendar" under Portfolio section (it's portfolio-relevant, not a tool)

**`App.tsx`** — add route `/earnings-calendar` → `<EarningsCalendarPage />` (ProtectedRoute)

---

## 6. State Management

All state in `EarningsCalendarPage`:

| State | Type | Purpose |
|-------|------|---------|
| `events` | `EarningsEvent[]` | Fetched earnings events |
| `trackedTickers` | `string[]` | Tickers being tracked (watchlist + extras) |
| `daysAhead` | `number` | Filter window |
| `view` | `'list' \| 'calendar'` | Active view mode |
| `loading` | `boolean` | Fetch in flight |
| `lastUpdated` | `Date \| null` | Timestamp of last fetch |

- Fetch on mount using user's watchlist tickers
- Re-fetch when `trackedTickers` or `daysAhead` changes (debounced 500ms)
- Cache results in component state; "refresh" button bypasses cache

---

## 7. Verification

1. `GET /api/earnings-calendar/` with no params returns events for user's watchlist
2. `GET /api/earnings-calendar/?tickers=AAPL,MSFT&days_ahead=30` filters correctly
3. Events are sorted ascending by date
4. List view groups events by week correctly (This Week / Next Week / Month)
5. "Today" and "Tomorrow" labels appear for near-term events
6. Calendar view renders correct day positions for all events
7. Clicking a card for a watchlist ticker navigates to `/watchlist` (non-watchlist tickers do nothing)
8. Adding a non-watchlist ticker via the bar refetches and shows their event
9. Empty state shown when no earnings in window: "No earnings reports in the next 30 days for tracked tickers"
10. Tickers with no data (e.g. ETFs) are silently excluded rather than erroring
