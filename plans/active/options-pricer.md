# Options Pricer & Greeks Calculator Spec

## Context

`quant_models/utils/black_scholes.py` is already available in the repo submodule and implements Black-Scholes pricing. The backend has `scipy` and `numpy` in requirements. The frontend already uses Recharts for charts. This tool is a UI wrapper around existing math with a payoff diagram on top.

---

## Goal

A dedicated page where users can price any option contract and see all Greeks, plus a payoff diagram showing P&L vs. underlying price at expiry. Supports calls and puts, long and short positions.

---

## 1. Backend — Options Pricing Endpoint

Rather than shipping Black-Scholes to the frontend, compute it server-side so the quant_models library is the single source of truth.

### New endpoint: `GET /api/options/price/`

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `symbol` | string | Underlying ticker (used to prefill current price + IV) |
| `spot` | float | Current underlying price |
| `strike` | float | Option strike price |
| `expiry_days` | int | Days to expiration |
| `iv` | float | Implied volatility (annualized, e.g. 0.25 = 25%) |
| `rate` | float | Risk-free rate (e.g. 0.05) |
| `option_type` | `call` \| `put` | Option type |

**Response:**

```json
{
  "price": 5.42,
  "delta": 0.61,
  "gamma": 0.034,
  "theta": -0.045,
  "vega": 0.18,
  "rho": 0.12,
  "intrinsic_value": 3.00,
  "time_value": 2.42,
  "breakeven": 155.42
}
```

### Files to create/modify:

**Create `backend/core/views/options_price.py`**

```python
import numpy as np
from scipy.stats import norm
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import yfinance as yf

class OptionsPriceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Parse & validate query params
        # If symbol provided, optionally prefill spot from yfinance
        # Run Black-Scholes directly (or delegate to quant_models.utils.black_scholes)
        # Return price + all Greeks
```

- Implement Black-Scholes inline (avoid submodule import issues in views) using `scipy.stats.norm`
- If `symbol` is provided and `spot`/`iv` are absent, fetch live price + historical vol from yfinance as defaults
- Validate all inputs; return 400 on invalid

**Modify `backend/core/views/__init__.py`** — export `OptionsPriceView`

**Modify `backend/core/urls.py`** — add `path('options/price/', views.OptionsPriceView.as_view())`

---

## 2. Frontend — API Service

**Create `frontend/quantifex_fe/src/api/options.ts`**

```ts
const getOptionsPrice = (params: OptionsPriceParams) =>
  axiosInstance.get('options/price/', { params });
```

---

## 3. Frontend — TypeScript Models

**Create `frontend/quantifex_fe/src/models/Options.ts`**

```ts
export interface OptionsPriceParams {
  symbol?: string;
  spot: number;
  strike: number;
  expiry_days: number;
  iv: number;
  rate: number;
  option_type: 'call' | 'put';
}

export interface OptionsGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsic_value: number;
  time_value: number;
  breakeven: number;
}
```

---

## 4. Frontend — Page & Components

### File structure

```
src/
  pages/
    OptionsPricerPage.tsx
  components/
    options/
      OptionsPricerForm.tsx
      GreeksPanel.tsx
      PayoffDiagram.tsx
```

### 4a. `OptionsPricerForm`

Inputs:
- **Ticker** (optional, text) — when filled, auto-fetches current price as default spot
- **Spot Price** (number)
- **Strike Price** (number)
- **Days to Expiry** (number)
- **Implied Volatility %** (number, stored as decimal)
- **Risk-Free Rate %** (number, stored as decimal)
- **Call / Put** toggle (two-button toggle, teal active state)
- **Long / Short** toggle (affects payoff diagram sign)

Auto-recalculates on any input change (debounced 300ms) — no submit button.

### 4b. `GreeksPanel`

Displays result in a 3×3 stat grid:

| Option Price | Intrinsic Value | Time Value |
|---|---|---|
| Delta | Gamma | Theta |
| Vega | Rho | Breakeven |

- Color-code Delta: green if call > 0.5, red if put < -0.5 (deep ITM)
- Theta always shown in red (time decay cost)
- Tooltip on each Greek label explaining what it means

### 4c. `PayoffDiagram`

Recharts `ComposedChart` with:
- X-axis: underlying price at expiry (range: spot ± 30%)
- Y-axis: P&L in dollars
- `Line` series for payoff: `max(0, spot_at_expiry - strike) - premium` for long call, etc.
- `ReferenceLine` at y=0 (breakeven line, dashed)
- `ReferenceLine` at x=current spot (vertical, dashed teal)
- `ReferenceLine` at x=strike (vertical, dashed gray)
- Toggle between Long/Short flips the P&L sign

Payoff computed client-side from the form values — no API call needed for the diagram.

### 4d. `OptionsPricerPage` layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Options Pricer                                                      │
├──────────────────────────┬───────────────────────────────────────────┤
│  Inputs                  │  Results                                  │
│                          │                                           │
│  Ticker: [AAPL    ]      │  ┌─ Greeks ──────────────────────────┐   │
│  Spot:   [$182.52 ]      │  │ Price    │ Intrinsic  │ Time Value │   │
│  Strike: [$185.00 ]      │  │ $5.42    │ $0.00      │ $5.42      │   │
│  Expiry: [30  days]      │  │ Delta    │ Gamma      │ Theta      │   │
│  IV:     [25.0   %]      │  │ 0.42     │ 0.034      │ -0.045     │   │
│  Rate:   [5.0    %]      │  │ Vega     │ Rho        │ Breakeven  │   │
│                          │  │ 0.18     │ 0.12       │ $190.42    │   │
│  [Call] [Put]            │  └────────────────────────────────────┘   │
│  [Long] [Short]          │                                           │
│                          │  ┌─ Payoff at Expiry ─────────────────┐   │
│                          │  │                /                    │   │
│                          │  │               /                     │   │
│                          │  │--------------/-------- (breakeven)  │   │
│                          │  │             |                       │   │
│                          │  │    (strike) | (spot)               │   │
│                          │  └────────────────────────────────────┘   │
└──────────────────────────┴───────────────────────────────────────────┘
```

---

## 5. Navigation

**`Sidebar.tsx`** — add "Options Pricer" under Tools section

**`App.tsx`** — add route `/options-pricer` → `<OptionsPricerPage />` (no auth required — pure calculator)

---

## 6. Verification

1. `GET /api/options/price/?spot=182.52&strike=185&expiry_days=30&iv=0.25&rate=0.05&option_type=call` returns correct price + Greeks
2. Enter a ticker — spot price auto-populates from current market price
3. Changing any input recalculates within 300ms
4. Payoff diagram updates in sync with inputs
5. Switch Call → Put: delta flips negative, breakeven changes
6. Switch Long → Short: payoff diagram flips (profit where loss was, loss where profit was)
7. Deep ITM option: intrinsic value > 0, time value = price - intrinsic
