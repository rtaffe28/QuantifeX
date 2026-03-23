# Monte Carlo Portfolio Simulator Spec

## Context

Monte Carlo simulation projects future portfolio values by sampling from historical return distributions. This complements the Compound Interest Calculator (deterministic) and Backtesting (historical replay) by giving a probabilistic forward-looking view. The backend has `numpy`, `pandas`, and `yfinance` already available.

---

## Goal

Users define a portfolio (tickers + weights or dollar amounts), a time horizon, and a contribution schedule → the backend runs N simulations of future portfolio value using bootstrapped historical returns → the frontend renders a fan chart of percentile bands plus key probability statistics.

---

## 1. Backend — Simulation Endpoint

### New endpoint: `POST /api/monte-carlo/simulate/`

**Request body:**

```json
{
  "holdings": [
    {"ticker": "AAPL", "weight": 0.40},
    {"ticker": "MSFT", "weight": 0.30},
    {"ticker": "BND",  "weight": 0.30}
  ],
  "initial_value": 50000,
  "monthly_contribution": 500,
  "years": 20,
  "simulations": 1000,
  "historical_period": "10y",
  "risk_free_rate": 0.05
}
```

**Response:**

```json
{
  "years": 20,
  "initial_value": 50000,
  "percentiles": {
    "p10": [52000, 54000, ..., 180000],
    "p25": [55000, 59000, ..., 240000],
    "p50": [62000, 70000, ..., 350000],
    "p75": [70000, 84000, ..., 490000],
    "p90": [80000, 102000, ..., 680000]
  },
  "time_labels": ["Year 0", "Year 1", ..., "Year 20"],
  "stats": {
    "median_final": 350000,
    "mean_final": 372000,
    "p10_final": 180000,
    "p90_final": 680000,
    "prob_double": 0.81,
    "prob_triple": 0.52,
    "prob_loss": 0.04,
    "expected_annual_return": 0.092,
    "portfolio_volatility": 0.138
  }
}
```

### Files to create/modify:

**Create `backend/core/views/monte_carlo.py`**

```python
import numpy as np
import pandas as pd
import yfinance as yf
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MonteCarloView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Validate holdings (weights must sum to ~1.0, 1–15 tickers)
        # Validate years (1–50), simulations (100–5000), initial_value > 0
        # Fetch historical daily returns via yfinance
        # Compute weighted portfolio daily returns
        # Bootstrap: sample with replacement from historical daily returns
        # Run N simulations: compound sampled returns day by day, add monthly contributions
        # Compute percentile bands at each annual checkpoint
        # Compute probability statistics
        # Return structured response
```

**Simulation approach — block bootstrap:**
1. Fetch historical daily returns for each ticker over `historical_period`
2. Compute daily portfolio return: `sum(weight_i * return_i)` for each day
3. For each simulation: sample 252 days at a time (1 year) with replacement from historical daily portfolio returns, repeat for `years` years
4. Apply monthly contributions at each month boundary
5. Track portfolio value at each annual checkpoint
6. Compute percentiles across all simulations at each checkpoint

**Validation rules:**
- `holdings` weights must sum to 0.99–1.01
- `years` 1–50, `simulations` 100–5000
- `initial_value` > 0
- `historical_period` one of `3y`, `5y`, `10y`, `max`

**Modify `backend/core/views/__init__.py`** — export `MonteCarloView`

**Modify `backend/core/urls.py`** — add `path('monte-carlo/simulate/', views.MonteCarloView.as_view())`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/monteCarlo.ts`**

```ts
const runSimulation = (payload: MonteCarloPayload) =>
  axiosInstance.post('monte-carlo/simulate/', payload);
```

---

## 3. Frontend — TypeScript Models

**Create `frontend/quantifex_fe/src/models/MonteCarlo.ts`**

```ts
export interface Holding {
  ticker: string;
  weight: number;
}

export interface MonteCarloPayload {
  holdings: Holding[];
  initial_value: number;
  monthly_contribution: number;
  years: number;
  simulations: number;
  historical_period: string;
  risk_free_rate: number;
}

export interface MonteCarloStats {
  median_final: number;
  mean_final: number;
  p10_final: number;
  p90_final: number;
  prob_double: number;
  prob_triple: number;
  prob_loss: number;
  expected_annual_return: number;
  portfolio_volatility: number;
}

export interface MonteCarloResult {
  years: number;
  initial_value: number;
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  time_labels: string[];
  stats: MonteCarloStats;
}
```

---

## 4. Frontend — Page & Components

### File structure

```
src/
  pages/
    MonteCarloPage.tsx
  components/
    montecarlo/
      HoldingsInput.tsx
      SimulationSettings.tsx
      FanChart.tsx
      ProbabilityStats.tsx
      SimulationSummary.tsx
```

### 4a. `HoldingsInput`

- List of rows: [Ticker input] [Weight % slider + number input] [✕ remove]
- "Add Ticker" button appends a new empty row (max 15)
- "Add from Watchlist" prefills user's watchlist with equal weights
- Live weight sum displayed below ("Total: 95% — must equal 100%") with red warning if not 99–101%
- Weights auto-normalize button ("Normalize to 100%")

### 4b. `SimulationSettings`

| Setting | Control | Default |
|---------|---------|---------|
| Initial Value | Number input ($) | $10,000 |
| Monthly Contribution | Number input ($) | $500 |
| Time Horizon | Slider 1–50 years | 20 |
| Simulations | Segmented: 100 / 500 / 1000 / 5000 | 1000 |
| Historical Period | Segmented: 3Y / 5Y / 10Y / MAX | 10Y |

### 4c. `FanChart`

Recharts `AreaChart` with stacked percentile bands:

- X-axis: Year 0 → Year N
- Y-axis: Portfolio value (formatted as `$150k`, `$1.2M`)
- **5 bands** rendered as `Area` layers (lowest opacity at extremes, highest at median):
  - P10–P25: very light red fill
  - P25–P50: light orange fill
  - P50 line: solid teal line (most prominent)
  - P50–P75: light teal fill
  - P75–P90: very light teal fill
- `ReferenceLine` at initial value (dashed gray horizontal)
- Tooltip on hover: show all 5 percentile values for that year
- Legend: P10 / P25 / Median / P75 / P90

### 4d. `ProbabilityStats`

Stat cards in a 2×3 grid:

| Label | Value | Format |
|-------|-------|--------|
| Median Final Value | $350,000 | toUSD |
| Mean Final Value | $372,000 | toUSD |
| 10th Percentile | $180,000 | toUSD |
| 90th Percentile | $680,000 | toUSD |
| Prob. of Doubling | 81% | % |
| Prob. of Loss | 4% | red % |

### 4e. `SimulationSummary`

Text summary paragraph auto-generated from stats:

> "Based on 1,000 simulations using 10 years of historical returns, your portfolio has an 81% chance of doubling and only a 4% chance of losing money over 20 years. The median outcome is $350,000."

### Page layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Monte Carlo Simulator                                               │
├──────────────────────────┬───────────────────────────────────────────┤
│  Portfolio               │  Results                                  │
│                          │                                           │
│  AAPL  [40%] [━━━━━━━━━] │  ┌─ Fan Chart ──────────────────────┐   │
│  MSFT  [30%] [━━━━━━━━━] │  │      ░░░░░░░░░░░░░░░             │   │
│  BND   [30%] [━━━━━━━━━] │  │    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒          │   │
│  [+ Add Ticker]           │  │  ████████████████████████        │   │
│  Total: 100% ✓            │  └──────────────────────────────────┘   │
│                          │                                           │
│  ─── Settings ───        │  ┌─ Probability Stats ────────────────┐  │
│  Initial:   [$50,000]    │  │ Median    $350k  │ P90    $680k   │  │
│  Monthly:   [$500  ]     │  │ Mean      $372k  │ P10    $180k   │  │
│  Horizon:   [20 yrs]     │  │ Prob 2x   81%    │ Prob loss  4%  │  │
│  Sims:  [100][500][1000] │  └────────────────────────────────────┘  │
│  History: [3Y][5Y][●10Y] │                                           │
│                          │  "Based on 1,000 simulations..."         │
│  [Run Simulation]        │                                           │
└──────────────────────────┴───────────────────────────────────────────┘
```

---

## 5. Navigation

**`Sidebar.tsx`** — add "Monte Carlo" under Tools section

**`App.tsx`** — add route `/monte-carlo` → `<MonteCarloPage />` (ProtectedRoute)

---

## 6. Verification

1. `POST /api/monte-carlo/simulate/` with valid payload returns percentile data for each year
2. Weights not summing to ~100% returns 400 with message
3. Fan chart renders 5 percentile bands with correct colors
4. Median line is most visually prominent
5. Probability stats match expected values (prob_double > 0 and < 1)
6. "Add from Watchlist" prefills tickers with equal weights
7. Normalize button redistributes weights evenly across all tickers
8. Increasing simulations from 100 to 5000 produces smoother fan chart
9. Setting monthly contribution to 0 shows pure investment growth
