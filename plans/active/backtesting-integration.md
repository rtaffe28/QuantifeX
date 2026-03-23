# Backtesting Integration Spec

## Context

The `rtaffe28/quantitative-trading-models` repo contains a full quantitative trading library:

**Strategies** (`strategies/`)
- `buy_and_hold_strategy.py` — baseline buy-and-hold approach
- `moving_average_strategy.py` — technical analysis via moving averages
- `covered_call_strategy.py` + `covered_call/` — covered call options strategy
- `leap_strategy.py` + `leap/` — LEAP (long-term options) strategy
- `wheel_strategy.py` + `wheel/` — wheel strategy (cash-secured puts + covered calls)

**Utils** (`utils/`)
- `black_scholes.py` — options pricing model
- `portfolio.py` — portfolio management & analysis
- `simulation.py` — strategy simulation engine
- `volatility.py` — volatility calculations
- `trading_actions.py` — trading action definitions

The goal is to integrate this library into QuantifeX so users can run backtests against historical data directly from the UI, view performance metrics, and compare strategies side by side.

---

## Goal

Add a **Backtesting** section to QuantifeX where users can:
1. Select a ticker from their watchlist (or search for one)
2. Choose a strategy (Buy & Hold, Moving Average, Covered Call, LEAP, Wheel)
3. Configure strategy parameters (date range, initial capital, strategy-specific settings)
4. Run a backtest and view performance results (returns, drawdown, Sharpe ratio, trade log)
5. Compare multiple strategy runs side by side

---

## 1. Repo Integration — Backend

### 1a. Add `quantitative-trading-models` as a Git Submodule

```bash
cd backend
git submodule add https://github.com/rtaffe28/quantitative-trading-models quant_models
```

This gives the Django backend access to the strategies and utils as a Python package without duplicating code.

**Modify `backend/requirements.txt`** — add any dependencies from the quant_models `requirements.txt` that aren't already present (likely: `numpy`, `pandas`, `scipy`, `yfinance`).

---

### 1b. Django App — `backtesting`

**Create `backend/backtesting/` Django app:**

```
backend/backtesting/
  __init__.py
  apps.py
  models.py
  serializers.py
  views/
    __init__.py
    run_backtest.py
    backtest_results.py
  urls.py
  tasks.py          # Celery task for async backtest execution
```

**Register in `backend/core/settings.py`:**
```python
INSTALLED_APPS = [
    ...
    'backtesting',
]
```

**Add to `backend/core/urls.py`:**
```python
path('api/backtesting/', include('backtesting.urls')),
```

---

### 1c. Database Models

**`backend/backtesting/models.py`**

```python
class BacktestRun(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10)
    strategy = models.CharField(max_length=50)  # e.g. "moving_average"
    parameters = models.JSONField()              # strategy-specific config
    start_date = models.DateField()
    end_date = models.DateField()
    initial_capital = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    # pending | running | complete | failed
    created_at = models.DateTimeField(auto_now_add=True)

class BacktestResult(models.Model):
    run = models.OneToOneField(BacktestRun, on_delete=models.CASCADE, related_name='result')
    total_return_pct = models.FloatField()
    annualized_return_pct = models.FloatField()
    max_drawdown_pct = models.FloatField()
    sharpe_ratio = models.FloatField()
    total_trades = models.IntegerField()
    win_rate_pct = models.FloatField()
    final_portfolio_value = models.DecimalField(max_digits=14, decimal_places=2)
    equity_curve = models.JSONField()    # [{date, value}, ...]
    trade_log = models.JSONField()       # [{date, action, price, quantity, pnl}, ...]
    completed_at = models.DateTimeField(auto_now_add=True)
```

---

### 1d. API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/backtesting/run/` | Submit a new backtest run |
| `GET` | `/api/backtesting/runs/` | List all runs for the authenticated user |
| `GET` | `/api/backtesting/runs/<id>/` | Get status + results for a specific run |
| `DELETE` | `/api/backtesting/runs/<id>/` | Delete a run |
| `GET` | `/api/backtesting/strategies/` | List available strategies with their parameter schemas |

**POST `/api/backtesting/run/` — Request body:**
```json
{
  "ticker": "AAPL",
  "strategy": "moving_average",
  "start_date": "2022-01-01",
  "end_date": "2024-01-01",
  "initial_capital": 10000,
  "parameters": {
    "short_window": 20,
    "long_window": 50
  }
}
```

**GET `/api/backtesting/strategies/` — Response:**
```json
[
  {
    "id": "buy_and_hold",
    "name": "Buy & Hold",
    "description": "Baseline strategy: buy on day 1, hold until end date.",
    "parameters": []
  },
  {
    "id": "moving_average",
    "name": "Moving Average Crossover",
    "description": "Buy when short MA crosses above long MA, sell on crossunder.",
    "parameters": [
      { "key": "short_window", "label": "Short Window (days)", "type": "number", "default": 20 },
      { "key": "long_window",  "label": "Long Window (days)",  "type": "number", "default": 50 }
    ]
  },
  {
    "id": "covered_call",
    "name": "Covered Call",
    "description": "Buy stock and sell OTM calls each month.",
    "parameters": [
      { "key": "strike_offset_pct", "label": "Strike Offset (%)", "type": "number", "default": 5 },
      { "key": "expiry_days",       "label": "Days to Expiry",     "type": "number", "default": 30 }
    ]
  },
  {
    "id": "wheel",
    "name": "Wheel",
    "description": "Sell cash-secured puts, transition to covered calls on assignment.",
    "parameters": [
      { "key": "put_strike_offset_pct", "label": "Put Strike Offset (%)", "type": "number", "default": 5 },
      { "key": "expiry_days",           "label": "Days to Expiry",         "type": "number", "default": 30 }
    ]
  },
  {
    "id": "leap",
    "name": "LEAP Strategy",
    "description": "Buy long-dated call options as a leveraged equity substitute.",
    "parameters": [
      { "key": "expiry_months",   "label": "Expiry (months)", "type": "number", "default": 12 },
      { "key": "delta_target",    "label": "Target Delta",    "type": "number", "default": 0.7 }
    ]
  }
]
```

---

### 1e. Backtest Execution — `views/run_backtest.py`

```python
# POST /api/backtesting/run/
class RunBacktestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Validate input via serializer
        # 2. Create BacktestRun(status='pending')
        # 3. Dispatch to Celery: execute_backtest.delay(run.id)
        # 4. Return run id + status 202 Accepted
```

**`backend/backtesting/tasks.py`** — Celery task:
```python
@shared_task
def execute_backtest(run_id):
    run = BacktestRun.objects.get(id=run_id)
    run.status = 'running'
    run.save()

    try:
        # Import from the submodule
        from quant_models.strategies import (
            BuyAndHoldStrategy, MovingAverageStrategy,
            CoveredCallStrategy, LeapStrategy, WheelStrategy,
        )
        from quant_models.utils.simulation import run_simulation
        from quant_models.utils.portfolio import compute_metrics

        # Fetch historical price data via yfinance
        import yfinance as yf
        data = yf.download(run.ticker, start=run.start_date, end=run.end_date)

        strategy_map = {
            'buy_and_hold': BuyAndHoldStrategy,
            'moving_average': MovingAverageStrategy,
            'covered_call': CoveredCallStrategy,
            'leap': LeapStrategy,
            'wheel': WheelStrategy,
        }
        StrategyClass = strategy_map[run.strategy]
        strategy = StrategyClass(**run.parameters)

        equity_curve, trade_log = run_simulation(strategy, data, run.initial_capital)
        metrics = compute_metrics(equity_curve, trade_log)

        BacktestResult.objects.create(run=run, **metrics,
            equity_curve=equity_curve, trade_log=trade_log)
        run.status = 'complete'
    except Exception as e:
        run.status = 'failed'
    finally:
        run.save()
```

> **Note:** The exact import paths and function signatures will need to be confirmed once the submodule is added and the quant_models interfaces are reviewed.

---

## 2. Frontend — Backtesting Page

### File Structure

```
frontend/quantifex_fe/src/
  pages/
    BacktestingPage.tsx
  components/
    backtesting/
      StrategySelector.tsx
      BacktestConfigForm.tsx
      BacktestResultsPanel.tsx
      EquityCurveChart.tsx
      MetricsSummary.tsx
      TradeLogTable.tsx
      RunHistory.tsx
  api/
    backtesting.ts
  models/
    Backtest.ts
```

---

### 2a. TypeScript Models — `models/Backtest.ts`

```ts
export interface StrategyParam {
  key: string;
  label: string;
  type: 'number' | 'string';
  default: number | string;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  parameters: StrategyParam[];
}

export interface BacktestRun {
  id: number;
  ticker: string;
  strategy: string;
  parameters: Record<string, number | string>;
  start_date: string;
  end_date: string;
  initial_capital: number;
  status: 'pending' | 'running' | 'complete' | 'failed';
  created_at: string;
  result?: BacktestResult;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface TradeLogEntry {
  date: string;
  action: 'BUY' | 'SELL' | 'EXPIRE' | 'ASSIGN';
  price: number;
  quantity: number;
  pnl: number;
}

export interface BacktestResult {
  total_return_pct: number;
  annualized_return_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  total_trades: number;
  win_rate_pct: number;
  final_portfolio_value: number;
  equity_curve: EquityPoint[];
  trade_log: TradeLogEntry[];
}
```

---

### 2b. API Service — `api/backtesting.ts`

Follow the existing `watchlist.ts` pattern:

```ts
export const getStrategies = () => api.get('/backtesting/strategies/');
export const submitBacktest = (payload) => api.post('/backtesting/run/', payload);
export const getBacktestRuns = () => api.get('/backtesting/runs/');
export const getBacktestRun = (id: number) => api.get(`/backtesting/runs/${id}/`);
export const deleteBacktestRun = (id: number) => api.delete(`/backtesting/runs/${id}/`);
```

---

### 2c. Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Backtesting                                                         │
├──────────────────────────────┬───────────────────────────────────────┤
│  Configure Backtest          │  Results                              │
│                              │                                       │
│  Ticker: [AAPL         ▾]    │  AAPL — Moving Average Crossover      │
│                              │  Jan 2022 → Jan 2024                  │
│  Strategy:                   │                                       │
│  ○ Buy & Hold                │  ┌─ Key Metrics ──────────────────┐   │
│  ● Moving Average            │  │ Total Return   │ +34.2%         │   │
│  ○ Covered Call              │  │ Ann. Return    │ +16.1%         │   │
│  ○ LEAP                      │  │ Max Drawdown   │ -18.4%         │   │
│  ○ Wheel                     │  │ Sharpe Ratio   │ 1.42           │   │
│                              │  │ Win Rate       │ 58%            │   │
│  Parameters:                 │  │ Total Trades   │ 24             │   │
│  Short Window: [20    ]      │  └────────────────────────────────┘   │
│  Long Window:  [50    ]      │                                       │
│                              │  ┌─ Equity Curve ─────────────────┐   │
│  Date Range:                 │  │  /\      /\  /\                 │   │
│  Start: [2022-01-01  ]       │  │ /  \____/  \/  \___/\__        │   │
│  End:   [2024-01-01  ]       │  └────────────────────────────────┘   │
│                              │                                       │
│  Initial Capital: [$10,000 ] │  ┌─ Trade Log ────────────────────┐   │
│                              │  │ Date   │ Action │ Price │ P&L   │   │
│  [  Run Backtest  ]          │  │ ...    │ BUY    │ $182  │ —     │   │
│                              │  │ ...    │ SELL   │ $194  │ +$600 │   │
│  ─── Run History ───         │  └────────────────────────────────┘   │
│  AAPL / Moving Avg  ✓ [view] │                                       │
│  MSFT / Buy & Hold  ✓ [view] │                                       │
│  TSLA / Wheel       ✗ [del]  │                                       │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

### 2d. Polling for Results

Since backtests run asynchronously via Celery, the frontend polls after submission:

```ts
// After submitBacktest(), poll every 2s until status !== 'pending' | 'running'
const pollRun = async (id: number) => {
  const interval = setInterval(async () => {
    const { data } = await getBacktestRun(id);
    if (data.status === 'complete' || data.status === 'failed') {
      clearInterval(interval);
      setRun(data);
    }
  }, 2000);
};
```

---

### 2e. Components

| Component | Responsibility |
|-----------|----------------|
| `BacktestingPage` | Top-level layout, state: selected strategy, form values, current run, run history |
| `StrategySelector` | Radio group of available strategies; on change update visible param fields |
| `BacktestConfigForm` | Ticker input (reuse `StockAutocomplete`), date pickers, capital input, dynamic param fields from strategy schema |
| `BacktestResultsPanel` | Orchestrates results display; shows spinner while `status === 'running'` |
| `MetricsSummary` | 2×3 stats grid (total return, ann. return, drawdown, Sharpe, win rate, trade count) |
| `EquityCurveChart` | Recharts `AreaChart` of `equity_curve` data, teal gradient, hover tooltip |
| `TradeLogTable` | Paginated table of `trade_log` entries; color-code positive/negative P&L |
| `RunHistory` | Scrollable list of past `BacktestRun` records with status badge, view/delete actions |

---

## 3. Sidebar Navigation

**Modify `frontend/quantifex_fe/src/components/Sidebar.tsx`**
- Add a "Backtesting" link pointing to `/backtesting`

**Modify `frontend/quantifex_fe/src/App.tsx`**
- Add route: `<Route path="/backtesting" element={<ProtectedRoute><BacktestingPage /></ProtectedRoute>} />`

---

## 4. Infrastructure — Celery

Backtests can be slow (seconds to minutes), so they must run async.

**`backend/core/celery.py`** — create if it doesn't exist:
```python
import os
from celery import Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

**`backend/core/settings.py`** — add Celery config:
```python
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
```

**`docker-compose.yml`** — add Redis + Celery worker services if not present:
```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]

celery:
  build: ./backend
  command: celery -A core worker --loglevel=info
  volumes: [./backend:/app]
  env_file: [.env]
  depends_on: [db, redis]
```

---

## 5. Verification

1. Run `git submodule update --init` and confirm `quant_models` package imports correctly
2. `POST /api/backtesting/strategies/` returns all 5 strategies with param schemas
3. Submit a Buy & Hold backtest — confirm `status` transitions: `pending → running → complete`
4. Navigate to `/backtesting` — form renders, strategy selection updates parameter fields
5. Run a backtest from the UI — spinner shows, then results populate
6. Equity curve chart renders with correct date range
7. Trade log table shows sorted entries with color-coded P&L
8. Run history shows past runs; clicking "view" reloads that run's results
9. Verify Covered Call / LEAP / Wheel runs complete without error (options pricing via Black-Scholes)
