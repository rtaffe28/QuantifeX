"""Portfolio dataclass: stock value, options value, total value across regimes."""
from datetime import datetime, timedelta

import pytest
from backtesting.engine.portfolio import Portfolio, Position, OptionContract


def test_empty_portfolio_total_is_cash():
    p = Portfolio(cash=1000.0)
    assert p.get_total_value(datetime(2025, 1, 1), prices={}) == 1000.0


def test_stock_value_uses_current_prices():
    p = Portfolio(cash=500.0, positions={"AAPL": Position("AAPL", 10, 150.0)})
    assert p.get_stock_value({"AAPL": 160.0}) == 1600.0
    # Total = cash + stock value
    assert p.get_total_value(datetime(2025, 1, 1), {"AAPL": 160.0}) == 2100.0


def test_missing_price_treats_as_zero():
    p = Portfolio(cash=500.0, positions={"AAPL": Position("AAPL", 10, 150.0)})
    assert p.get_stock_value({}) == 0.0


def test_options_value_zero_after_expiration():
    today = datetime(2025, 6, 1)
    expired = OptionContract(
        ticker="AAPL", strike=150, expiration_date=today,
        option_type="call", contracts=1, premium_received=0, position="long",
    )
    p = Portfolio(cash=0.0, options=[expired])
    assert p.get_options_value(today, {"AAPL": 200.0}) == 0.0


def test_long_call_intrinsic_value_no_vol():
    today = datetime(2025, 6, 1)
    exp = today + timedelta(days=30)
    opt = OptionContract("AAPL", 150, exp, "call", contracts=2, premium_received=0, position="long")
    p = Portfolio(cash=0.0, options=[opt])
    # Without volatility argument, falls back to intrinsic
    val = p.get_options_value(today, {"AAPL": 160.0}, volatility=None)
    # 2 contracts * 100 shares * (160 - 150) = 2000
    assert val == 2000.0


def test_short_call_intrinsic_subtracted():
    today = datetime(2025, 6, 1)
    exp = today + timedelta(days=30)
    opt = OptionContract("AAPL", 150, exp, "call", contracts=1, premium_received=500, position="short")
    p = Portfolio(cash=0.0, options=[opt])
    val = p.get_options_value(today, {"AAPL": 160.0}, volatility=None)
    # Short side -> negative intrinsic contribution
    assert val == -1000.0


def test_options_value_with_vol_uses_black_scholes():
    today = datetime(2025, 6, 1)
    exp = today + timedelta(days=180)
    opt = OptionContract("AAPL", 150, exp, "call", contracts=1, premium_received=0, position="long")
    p = Portfolio(cash=0.0, options=[opt])
    val = p.get_options_value(today, {"AAPL": 150.0}, volatility=0.25, risk_free_rate=0.05)
    # ATM call with positive vol must be positive
    assert val > 0
