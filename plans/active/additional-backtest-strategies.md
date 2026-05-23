# Additional Backtest Strategies

**Bucket:** New features

## Goal
Add three more strategies to the existing engine: RSI mean-reversion, MACD crossover, and a Bollinger-band mean-reversion. The current five (Buy & Hold, SMA Crossover, Covered Call, Wheel, LEAP) all the existing parametric framework — pile on more.

## Why
- The engine already supports parameterized strategies with auto-generated forms. Adding strategies is mostly indicator math + entry/exit rules.
- More strategies make [[strategy-comparison]] worth building.
- Common indicators users expect from a backtester — their absence is a credibility gap.

## Scope
**In:** Three new strategy classes wired into the existing strategy registry, parameter schemas, default parameter values, basic tests on known data.

**Out:** Walk-forward analysis, Monte Carlo over strategy parameters (separate plan), portfolio-level multi-symbol strategies.

## Approach
1. Walk the existing strategy interface — match its `init`, `next_bar`, `params` contract exactly.
2. **RSI strategy**: enter long when RSI < `oversold` (default 30), exit when RSI > `overbought` (default 70). Params: `period`, `oversold`, `overbought`.
3. **MACD strategy**: enter long on MACD bullish crossover, exit on bearish. Params: `fast`, `slow`, `signal`.
4. **Bollinger strategy**: enter long when price < lower band, exit at middle band. Params: `period`, `std_dev`.
5. Use `ta` or `pandas_ta` if already a dep, otherwise hand-roll (these three are easy).
6. Tests: each strategy on a synthetic price series with a known correct number of trades.

## Key files
- `backend/backtesting/strategies/{rsi,macd,bollinger}.py` (new)
- `backend/backtesting/strategies/__init__.py` (register)

## Acceptance
- All three strategies appear in the strategy dropdown.
- Frontend form auto-generates from their param schemas.
- Tests pass on synthetic data with hand-checked expected results.
