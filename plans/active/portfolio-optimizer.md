# Portfolio Optimizer (Efficient Frontier) Spec

## Context

The project already has `numpy`, `scipy`, `pandas`, and `yfinance` in the backend. The watchlist gives users a natural set of tickers to optimize. This tool applies Modern Portfolio Theory (MPT) to find the efficient frontier, the max Sharpe ratio portfolio, and the minimum variance portfolio for a user-selected set of tickers.

---

## Goal

Users pick tickers and a lookback period → the backend fetches historical returns, computes the covariance matrix, and runs Monte Carlo + analytical optimization to produce the efficient frontier. The frontend renders the scatter plot of simulated portfolios, the efficient frontier curve, and the optimal weights.

---

## 1. Backend — Optimization Endpoint

### New endpoint: `POST /api/portfolio/optimize/`

**Request body:**

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL", "BND"],
  "period": "3y",
  "risk_free_rate": 0.05
}
```

**Response:**

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL", "BND"],
  "max_sharpe": {
    "weights": {"AAPL": 0.35, "MSFT": 0.40, "GOOGL": 0.15, "BND": 0.10},
    "expected_return": 0.182,
    "volatility": 0.148,
    "sharpe_ratio": 1.23
  },
  "min_variance": {
    "weights": {"AAPL": 0.15, "MSFT": 0.20, "GOOGL": 0.10, "BND": 0.55},
    "expected_return": 0.098,
    "volatility": 0.082,
    "sharpe_ratio": 0.71
  },
  "frontier_points": [
    {"volatility": 0.082, "expected_return": 0.098, "sharpe": 0.71},
    ...
  ],
  "simulated_portfolios": [
    {"volatility": 0.14, "expected_return": 0.16, "sharpe": 1.10},
    ...
  ],
  "annual_returns": {"AAPL": 0.21, "MSFT": 0.19, "GOOGL": 0.14, "BND": 0.04},
  "correlation_matrix": {
    "AAPL": {"AAPL": 1.0, "MSFT": 0.78, "GOOGL": 0.72, "BND": -0.12},
    ...
  }
}
```

### Files to create/modify:

**Create `backend/core/views/portfolio_optimize.py`**

```python
import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class PortfolioOptimizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tickers = request.data.get('tickers', [])
        period = request.data.get('period', '3y')
        risk_free_rate = float(request.data.get('risk_free_rate', 0.05))

        # Validate: 2–15 tickers, allowed periods
        # Fetch adjusted close prices via yfinance
        # Compute daily log returns
        # Compute annualized mean returns + covariance matrix
        # Run 5000 random portfolio simulations
        # Run scipy.optimize to find max Sharpe + min variance analytically
        # Build efficient frontier by minimizing variance at target return levels
        # Return all data
```

**Validation rules:**
- 2–15 tickers required
- `period` must be one of `1y`, `2y`, `3y`, `5y`
- Return 400 if fewer than 252 trading days of data for any ticker

**Math:**
- Daily log returns: `np.log(prices / prices.shift(1)).dropna()`
- Annualized mean: `returns.mean() * 252`
- Annualized covariance: `returns.cov() * 252`
- Portfolio stats: `w @ μ` (return), `sqrt(w @ Σ @ w)` (vol), `(ret - rf) / vol` (Sharpe)
- Frontier: minimize variance at 50 evenly spaced target return levels between min and max individual asset return

**Modify `backend/core/views/__init__.py`** — export `PortfolioOptimizeView`

**Modify `backend/core/urls.py`** — add `path('portfolio/optimize/', views.PortfolioOptimizeView.as_view())`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/portfolio.ts`**

```ts
const optimizePortfolio = (payload: {
  tickers: string[];
  period: string;
  risk_free_rate: number;
}) => axiosInstance.post('portfolio/optimize/', payload);
```

---

## 3. Frontend — TypeScript Models

**Create `frontend/quantifex_fe/src/models/Portfolio.ts`**

```ts
export interface PortfolioPoint {
  volatility: number;
  expected_return: number;
  sharpe: number;
}

export interface OptimalPortfolio {
  weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface OptimizationResult {
  tickers: string[];
  max_sharpe: OptimalPortfolio;
  min_variance: OptimalPortfolio;
  frontier_points: PortfolioPoint[];
  simulated_portfolios: PortfolioPoint[];
  annual_returns: Record<string, number>;
  correlation_matrix: Record<string, Record<string, number>>;
}
```

---

## 4. Frontend — Page & Components

### File structure

```
src/
  pages/
    PortfolioOptimizerPage.tsx
  components/
    portfolio/
      TickerSelector.tsx
      OptimizerSettings.tsx
      EfficientFrontierChart.tsx
      WeightsBreakdown.tsx
      CorrelationHeatmap.tsx
      OptimalPortfolioCard.tsx
```

### 4a. `TickerSelector`

- Multi-select input: type a ticker symbol, press Enter or comma to add (up to 15)
- Each tag shows ticker label + ✕ to remove
- "Add from Watchlist" button that pre-fills all tickers from the user's watchlist
- Disabled if already at 15 tickers

### 4b. `OptimizerSettings`

- **Lookback Period**: segmented control — 1Y / 2Y / 3Y / 5Y
- **Risk-Free Rate**: number input (default 5.0%)
- **Run Optimization** button — disabled until ≥ 2 tickers

### 4c. `EfficientFrontierChart`

Recharts `ScatterChart`:
- **Gray dots**: 5000 simulated random portfolios (color by Sharpe ratio using a teal gradient)
- **Teal line**: efficient frontier curve
- **Gold star marker**: Max Sharpe portfolio
- **Blue diamond marker**: Min Variance portfolio
- X-axis: Annualized Volatility (%)
- Y-axis: Annualized Return (%)
- Tooltip on hover: shows Return, Volatility, Sharpe

### 4d. `OptimalPortfolioCard`

Two side-by-side cards (Max Sharpe / Min Variance):

```
┌─ Max Sharpe Ratio ──────────────┐
│ Return   18.2%   Volatility 14.8%│
│ Sharpe Ratio: 1.23              │
│                                 │
│ Weights:                        │
│ AAPL ████████████████ 35%      │
│ MSFT ████████████████████ 40%  │
│ GOOGL ███████ 15%               │
│ BND  ████ 10%                   │
└─────────────────────────────────┘
```

Each weight row has a teal progress bar (`progress` width = weight%).

### 4e. `CorrelationHeatmap`

Grid of colored cells:
- Cell color: red (−1) → white (0) → teal (1)
- Cell label shows the correlation value
- Row/column headers are ticker symbols
- Rendered as a CSS grid (no extra library needed)

### 4f. Page layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Portfolio Optimizer                                                 │
├──────────────────────────────────────────────────────────────────────┤
│  Tickers: [AAPL ✕] [MSFT ✕] [GOOGL ✕] [BND ✕] [+ Add from watchlist]│
│  Period: [1Y] [2Y] [●3Y] [5Y]    Risk-Free Rate: [5.0%]             │
│  [Run Optimization]                                                  │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─ Efficient Frontier ──────────┐  ┌─ Max Sharpe  ┐ ┌─ Min Var  ─┐│
│  │    •••  ★                    │  │ Ret  18.2%   │ │ Ret  9.8%  ││
│  │   •••• /                     │  │ Vol  14.8%   │ │ Vol  8.2%  ││
│  │  ••••••/                     │  │ SR   1.23    │ │ SR   0.71  ││
│  │  ◆ ••/                       │  │              │ │            ││
│  │      /                       │  │ Weights ↓    │ │ Weights ↓  ││
│  └──────────────────────────────┘  └──────────────┘ └────────────┘│
│                                                                      │
│  ┌─ Correlation Matrix ─────────────────────────────────────────────┐│
│  │       AAPL   MSFT  GOOGL   BND                                   ││
│  │ AAPL  1.00   0.78   0.72  -0.12                                  ││
│  │ MSFT  0.78   1.00   0.81  -0.09                                  ││
│  │ GOOGL 0.72   0.81   1.00  -0.07                                  ││
│  │ BND  -0.12  -0.09  -0.07   1.00                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Navigation

**`Sidebar.tsx`** — add "Portfolio Optimizer" under Portfolio section

**`App.tsx`** — add route `/portfolio-optimizer` → `<PortfolioOptimizerPage />` (ProtectedRoute)

---

## 6. State Management

All state lives in `PortfolioOptimizerPage`:

| State | Type | Purpose |
|-------|------|---------|
| `tickers` | `string[]` | Selected tickers |
| `period` | `string` | Lookback period |
| `riskFreeRate` | `number` | Risk-free rate |
| `result` | `OptimizationResult \| null` | Optimization output |
| `loading` | `boolean` | Request in flight |
| `error` | `string \| null` | Error message |

---

## 7. Verification

1. `POST /api/portfolio/optimize/` with `["AAPL", "MSFT", "BND"]` returns valid frontier data
2. Efficient frontier scatter renders with simulated portfolios + frontier curve
3. Max Sharpe star and Min Variance diamond appear at correct locations
4. Weights in both cards sum to 100%
5. Correlation matrix renders with correct color gradient
6. "Add from Watchlist" pre-fills all user watchlist tickers
7. Submitting with 1 ticker returns a 400 error shown in UI
8. Optimization with a delisted/invalid ticker returns a graceful error
