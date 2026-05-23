"""End-to-end runner test: build a fake BacktestRun, mock yfinance, assert shape."""
from datetime import date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from backtesting.engine.runner import run_backtest_for


def _market_frame(n_days: int = 260) -> pd.DataFrame:
    """Trading-day index with a smooth uptrend so Buy & Hold makes money."""
    idx = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n_days, freq="B")
    closes = np.linspace(100, 200, n_days)
    return pd.DataFrame({
        "Open": closes * 0.99,
        "High": closes * 1.01,
        "Low": closes * 0.98,
        "Close": closes,
        "Volume": np.full(n_days, 1_000_000),
    }, index=idx)


@pytest.fixture
def fake_run():
    """Minimal BacktestRun stand-in — runner only reads attributes."""
    return SimpleNamespace(
        ticker="AAPL",
        strategy="buy_and_hold",
        parameters={},
        start_date=date.today() - timedelta(days=400),
        end_date=date.today(),
        initial_capital=10_000.0,
    )


def test_run_backtest_returns_full_shape(fake_run):
    frame = _market_frame()
    with patch("backtesting.engine.simulation.yf") as yf_sim, \
         patch("backtesting.engine.volatility.yf") as yf_vol:
        yf_sim.download.return_value = frame

        vol_ticker = SimpleNamespace(history=lambda **kw: frame)
        yf_vol.Ticker.return_value = vol_ticker

        result = run_backtest_for(fake_run)

    assert set(result.keys()) == {
        "total_return_pct", "annualized_return_pct", "max_drawdown_pct",
        "sharpe_ratio", "total_trades", "final_portfolio_value",
        "equity_curve", "trade_log",
    }
    assert result["total_trades"] >= 1
    assert result["equity_curve"]
    assert result["equity_curve"][0]["date"]
    assert result["equity_curve"][0]["value"] > 0
    # Buy & Hold on an uptrend should be profitable
    assert result["total_return_pct"] > 0
    assert result["final_portfolio_value"] > fake_run.initial_capital


def test_run_backtest_invalid_strategy_raises(fake_run):
    fake_run.strategy = "nonexistent_strategy"
    with pytest.raises(KeyError):
        run_backtest_for(fake_run)


def test_equity_curve_has_one_entry_per_trading_day(fake_run):
    frame = _market_frame(n_days=50)
    with patch("backtesting.engine.simulation.yf") as yf_sim, \
         patch("backtesting.engine.volatility.yf") as yf_vol:
        yf_sim.download.return_value = frame
        yf_vol.Ticker.return_value = SimpleNamespace(history=lambda **kw: frame)
        result = run_backtest_for(fake_run)

    assert len(result["equity_curve"]) == 50
