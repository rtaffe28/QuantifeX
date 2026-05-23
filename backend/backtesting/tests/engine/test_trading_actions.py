"""TradingAction: buy/sell stock and option mechanics, with the transaction log."""
from datetime import datetime, timedelta

import pytest
from backtesting.engine.portfolio import Portfolio, Position
from backtesting.engine.trading_actions import TradingAction


@pytest.fixture
def portfolio_with_log():
    p = Portfolio(cash=10_000)
    log: list = []
    TradingAction.set_transaction_log(log, datetime(2025, 6, 1))
    return p, log


class TestBuyStock:
    def test_successful_purchase(self, portfolio_with_log):
        p, log = portfolio_with_log
        ok = TradingAction.buy_stock(p, "AAPL", 10, 150.0)
        assert ok is True
        assert p.cash == 8500
        assert p.positions["AAPL"].shares == 10
        assert p.positions["AAPL"].avg_cost == 150.0
        assert log[-1]["action"] == "BUY_STOCK"
        assert log[-1]["total"] == 1500

    def test_insufficient_cash_returns_false(self, portfolio_with_log):
        p, _ = portfolio_with_log
        assert TradingAction.buy_stock(p, "AAPL", 1000, 150.0) is False
        assert p.cash == 10_000  # untouched

    def test_average_cost_recomputed_on_second_buy(self, portfolio_with_log):
        p, _ = portfolio_with_log
        TradingAction.buy_stock(p, "AAPL", 10, 100.0)
        TradingAction.buy_stock(p, "AAPL", 10, 200.0)
        assert p.positions["AAPL"].shares == 20
        # avg_cost = (100*10 + 200*10) / 20 = 150
        assert p.positions["AAPL"].avg_cost == 150.0


class TestSellStock:
    def test_successful_sale(self, portfolio_with_log):
        p, log = portfolio_with_log
        p.positions["AAPL"] = Position("AAPL", 10, 100.0)
        ok = TradingAction.sell_stock(p, "AAPL", 5, 200.0)
        assert ok is True
        assert p.cash == 11_000
        assert p.positions["AAPL"].shares == 5
        assert log[-1]["action"] == "SELL_STOCK"

    def test_position_removed_when_fully_sold(self, portfolio_with_log):
        p, _ = portfolio_with_log
        p.positions["AAPL"] = Position("AAPL", 10, 100.0)
        TradingAction.sell_stock(p, "AAPL", 10, 200.0)
        assert "AAPL" not in p.positions

    def test_oversell_rejected(self, portfolio_with_log):
        p, _ = portfolio_with_log
        p.positions["AAPL"] = Position("AAPL", 5, 100.0)
        assert TradingAction.sell_stock(p, "AAPL", 10, 200.0) is False
        assert p.cash == 10_000

    def test_sell_without_position_rejected(self, portfolio_with_log):
        p, _ = portfolio_with_log
        assert TradingAction.sell_stock(p, "AAPL", 1, 200.0) is False


class TestOptionActions:
    def test_sell_call_requires_covering_shares(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        # No position — should fail
        assert TradingAction.sell_call(p, "AAPL", 150, exp, contracts=1, premium=5.0) is False

        # Owns 200 shares — can sell 2 contracts
        p.positions["AAPL"] = Position("AAPL", 200, 150.0)
        assert TradingAction.sell_call(p, "AAPL", 150, exp, contracts=2, premium=5.0) is True
        assert p.cash == 10_000 + 2 * 100 * 5.0
        assert len(p.options) == 1

    def test_sell_put_collects_premium_no_share_requirement(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        assert TradingAction.sell_put(p, "AAPL", 150, exp, contracts=1, premium=3.0) is True
        assert p.cash == 10_300

    def test_buy_call_costs_premium(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        assert TradingAction.buy_call(p, "AAPL", 150, exp, contracts=1, premium=2.5) is True
        assert p.cash == 10_000 - 250
        assert p.options[0].position == "long"

    def test_buy_call_insufficient_cash_rejected(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        assert TradingAction.buy_call(p, "AAPL", 150, exp, contracts=1000, premium=2.5) is False
        assert p.cash == 10_000

    def test_close_call_returns_cash_and_removes_option(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        TradingAction.buy_call(p, "AAPL", 150, exp, contracts=1, premium=2.5)
        cash_after_buy = p.cash
        assert TradingAction.close_call(p, "AAPL", 150, exp, contracts=1, premium=5.0) is True
        assert p.cash == cash_after_buy + 500
        assert p.options == []

    def test_close_call_unknown_position_rejected(self, portfolio_with_log):
        p, _ = portfolio_with_log
        exp = datetime(2025, 6, 1) + timedelta(days=30)
        assert TradingAction.close_call(p, "AAPL", 150, exp, contracts=1, premium=5.0) is False
