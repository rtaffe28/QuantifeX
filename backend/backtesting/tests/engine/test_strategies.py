"""Strategy step() behavior on synthetic price data.

These exercise BuyAndHold and SmaCrossover with hand-crafted market_data so we
can assert precise trading decisions without yfinance involvement.
"""
from datetime import datetime, timedelta

import pandas as pd
import pytest

from backtesting.engine.base import StepContext
from backtesting.engine.portfolio import Portfolio
from backtesting.engine.registry import get_strategy
from backtesting.engine.trading_actions import TradingAction


def _ctx(date, portfolio, ticker="AAPL", prices=None, hist=None):
    return StepContext(
        date=date,
        portfolio=portfolio,
        market_data={"prices": prices or {ticker: 100.0}, "data": {ticker: hist} if hist is not None else {}},
        actions=TradingAction,
        ticker=ticker,
    )


class TestBuyAndHold:
    def test_buys_all_in_on_first_step(self):
        Strat = get_strategy("buy_and_hold")
        strat = Strat("AAPL", {})
        portfolio = Portfolio(cash=10_000)
        log: list = []
        TradingAction.set_transaction_log(log, datetime(2025, 1, 1))

        strat.step(_ctx(datetime(2025, 1, 1), portfolio, prices={"AAPL": 100.0}))
        # Should buy 100 shares (10_000 / 100)
        assert portfolio.positions["AAPL"].shares == 100
        assert portfolio.cash == 0
        assert log[-1]["action"] == "BUY_STOCK"

    def test_second_step_holds(self):
        Strat = get_strategy("buy_and_hold")
        strat = Strat("AAPL", {})
        portfolio = Portfolio(cash=10_000)
        TradingAction.set_transaction_log([], datetime(2025, 1, 1))
        strat.step(_ctx(datetime(2025, 1, 1), portfolio, prices={"AAPL": 100.0}))
        cash_after = portfolio.cash
        shares_after = portfolio.positions["AAPL"].shares
        strat.step(_ctx(datetime(2025, 1, 2), portfolio, prices={"AAPL": 110.0}))
        # No additional trades
        assert portfolio.cash == cash_after
        assert portfolio.positions["AAPL"].shares == shares_after


class TestSmaCrossover:
    def _hist(self, prices):
        idx = pd.date_range("2024-01-01", periods=len(prices), freq="B")
        return pd.DataFrame({"Close": prices}, index=idx)

    def test_skips_when_not_enough_history(self):
        Strat = get_strategy("sma_crossover")
        strat = Strat("AAPL", {"short_window": 50, "long_window": 200})
        portfolio = Portfolio(cash=10_000)
        TradingAction.set_transaction_log([], datetime(2025, 1, 1))

        # Only 50 bars — less than long_window
        short_hist = self._hist([100] * 50)
        strat.step(_ctx(datetime(2025, 1, 1), portfolio, hist=short_hist))
        assert portfolio.positions == {}

    def test_golden_cross_triggers_buy(self):
        Strat = get_strategy("sma_crossover")
        strat = Strat("AAPL", {"short_window": 3, "long_window": 5, "allocation": 1.0})
        portfolio = Portfolio(cash=10_000)
        TradingAction.set_transaction_log([], datetime(2025, 1, 1))

        # Decreasing then increasing series to force a crossover at the last bar
        prices = [100, 99, 98, 97, 96, 95, 110, 120, 130, 140]
        hist = self._hist(prices)
        ctx = _ctx(datetime(2025, 1, 1), portfolio, prices={"AAPL": 140.0}, hist=hist)

        # Seed prev_short/prev_long so we cross on this step
        strat.state = {"prev_short": 96.0, "prev_long": 99.0, "entered": False}

        strat.step(ctx)
        # short_ma (last 3) = (120+130+140)/3 = 130, long_ma (last 5) = (110+120+130+140+95)/5 = 119
        # 130 > 119 and prev_short(96) <= prev_long(99) -> golden cross -> buy
        assert "AAPL" in portfolio.positions
        assert strat.state["entered"] is True

    def test_death_cross_exits(self):
        Strat = get_strategy("sma_crossover")
        strat = Strat("AAPL", {"short_window": 3, "long_window": 5, "allocation": 1.0})
        portfolio = Portfolio(cash=0)
        # Pretend we're already in with 10 shares
        from backtesting.engine.portfolio import Position
        portfolio.positions["AAPL"] = Position("AAPL", 10, 100.0)

        TradingAction.set_transaction_log([], datetime(2025, 1, 1))
        # Increasing then decreasing — force a death cross
        prices = [100, 105, 110, 115, 120, 125, 90, 85, 80, 75]
        hist = self._hist(prices)
        ctx = _ctx(datetime(2025, 1, 1), portfolio, prices={"AAPL": 75.0}, hist=hist)
        strat.state = {"prev_short": 125.0, "prev_long": 120.0, "entered": True}
        strat.step(ctx)

        # Should have exited
        assert "AAPL" not in portfolio.positions
        assert strat.state["entered"] is False
