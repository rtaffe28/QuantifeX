import math
from datetime import datetime

import pandas as pd

from .base import StepContext
from .registry import get_strategy
from .simulation import BacktestSimulation


def run_backtest_for(run) -> dict:
    """Execute a BacktestRun and return a result dict ready for BacktestResult(**dict).

    Pure function: does not mutate `run` and does not write to the DB. The
    Celery task wrapper is responsible for status transitions and persistence.
    """
    StrategyCls = get_strategy(run.strategy)
    strategy = StrategyCls(run.ticker, run.parameters or {})

    start = datetime(run.start_date.year, run.start_date.month, run.start_date.day)
    end = datetime(run.end_date.year, run.end_date.month, run.end_date.day)

    def callback(date, portfolio, market_data, actions):
        strategy.step(StepContext(
            date=date,
            portfolio=portfolio,
            market_data=market_data,
            actions=actions,
            ticker=strategy.ticker,
        ))

    sim = BacktestSimulation(
        tickers=[strategy.ticker],
        start_date=start,
        end_date=end,
        initial_cash=float(run.initial_capital),
        strategy_callback=callback,
    )

    portfolio_history = sim.run()
    transactions_df = sim.get_transactions()
    stats = sim.compute_performance_stats()

    equity_curve = _equity_curve(portfolio_history)
    trade_log = _trade_log(transactions_df)

    return {
        "total_return_pct": float(stats.get("total_return", 0.0)),
        "annualized_return_pct": float(stats.get("annualized_return", 0.0)),
        "max_drawdown_pct": float(stats.get("max_drawdown", 0.0)),
        "sharpe_ratio": float(stats.get("sharpe_ratio", 0.0) or 0.0),
        "total_trades": len(trade_log),
        "final_portfolio_value": float(stats.get("final_value", run.initial_capital) or run.initial_capital),
        "equity_curve": equity_curve,
        "trade_log": trade_log,
    }


def _equity_curve(portfolio_history) -> list[dict]:
    if portfolio_history is None or portfolio_history.empty:
        return []
    value_col = _find_value_column(portfolio_history)
    date_col = "date" if "date" in portfolio_history.columns else None
    out = []
    for idx, row in portfolio_history.iterrows():
        date_val = row[date_col] if date_col else idx
        date_str = str(date_val.date()) if hasattr(date_val, "date") else str(date_val)
        out.append({"date": date_str, "value": round(float(row[value_col]), 2)})
    return out


def _trade_log(transactions_df) -> list[dict]:
    if transactions_df is None or transactions_df.empty:
        return []
    out = []
    for _, row in transactions_df.iterrows():
        entry = {}
        for col in transactions_df.columns:
            val = row[col]
            if hasattr(val, "date"):
                val = str(val.date())
            elif hasattr(val, "item"):
                val = val.item()
            elif isinstance(val, float) and math.isnan(val):
                val = None
            entry[col] = val
        out.append(entry)
    return out


def _find_value_column(df):
    for candidate in ("total_value", "portfolio_value", "Total Value", "Portfolio Value", "value"):
        if candidate in df.columns:
            return candidate
    numeric_cols = df.select_dtypes(include="number").columns
    if len(numeric_cols) > 0:
        df["_total"] = df[numeric_cols].sum(axis=1)
        return "_total"
    return df.columns[0]
