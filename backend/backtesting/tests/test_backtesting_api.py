"""Backtesting REST API: strategies endpoint, run creation, list, detail, delete."""
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest

from backtesting.models import BacktestRun, BacktestResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _market_frame(n_days: int = 260) -> pd.DataFrame:
    idx = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n_days, freq="B")
    closes = np.linspace(100, 200, n_days)
    return pd.DataFrame({
        "Open": closes * 0.99,
        "High": closes * 1.01,
        "Low": closes * 0.98,
        "Close": closes,
        "Volume": np.full(n_days, 1_000_000),
    }, index=idx)


def _valid_payload():
    return {
        "ticker": "AAPL",
        "strategy": "buy_and_hold",
        "parameters": {},
        "start_date": (date.today() - timedelta(days=400)).isoformat(),
        "end_date": date.today().isoformat(),
        "initial_capital": 10_000,
    }


# ---------------------------------------------------------------------------
# Strategies endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStrategiesEndpoint:
    URL = "/api/backtesting/strategies/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_returns_all_registered_strategies(self, auth_client):
        response = auth_client.get(self.URL)
        assert response.status_code == 200
        ids = {s["id"] for s in response.data}
        assert {"buy_and_hold", "sma_crossover"} <= ids

    def test_schema_includes_parameters(self, auth_client):
        response = auth_client.get(self.URL).data
        sma = next(s for s in response if s["id"] == "sma_crossover")
        assert any(p["key"] == "short_window" for p in sma["parameters"])
        assert any(p["key"] == "long_window" for p in sma["parameters"])


# ---------------------------------------------------------------------------
# Run backtest
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRunBacktest:
    URL = "/api/backtesting/run/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.post(self.URL, _valid_payload(), format="json").status_code == 401

    def test_unknown_strategy_rejected(self, auth_client):
        payload = {**_valid_payload(), "strategy": "bogus"}
        response = auth_client.post(self.URL, payload, format="json")
        assert response.status_code == 400
        assert "strategy" in response.data

    def test_missing_fields_rejected(self, auth_client):
        response = auth_client.post(self.URL, {"ticker": "AAPL"}, format="json")
        assert response.status_code == 400

    def test_successful_run_completes_eagerly(self, auth_client, user):
        """Celery is in EAGER mode in tests — the run finishes inline."""
        frame = _market_frame()
        with patch("backtesting.engine.simulation.yf") as yf_sim, \
             patch("backtesting.engine.volatility.yf") as yf_vol:
            yf_sim.download.return_value = frame
            yf_vol.Ticker.return_value = SimpleNamespace(history=lambda **kw: frame)

            response = auth_client.post(self.URL, _valid_payload(), format="json")

        assert response.status_code == 202, response.data
        run = BacktestRun.objects.get(id=response.data["id"])
        assert run.user == user
        assert run.status == BacktestRun.STATUS_COMPLETE
        assert hasattr(run, "result")
        assert run.result.total_return_pct > 0


# ---------------------------------------------------------------------------
# List & detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBacktestRunList:
    URL = "/api/backtesting/runs/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_only_returns_own_runs(self, auth_client, other_auth_client, user, other_user):
        BacktestRun.objects.create(
            user=user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        BacktestRun.objects.create(
            user=other_user, ticker="MSFT", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )

        mine = auth_client.get(self.URL).data
        theirs = other_auth_client.get(self.URL).data
        assert len(mine) == 1 and mine[0]["ticker"] == "AAPL"
        assert len(theirs) == 1 and theirs[0]["ticker"] == "MSFT"

    def test_ordered_newest_first(self, auth_client, user):
        first = BacktestRun.objects.create(
            user=user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        second = BacktestRun.objects.create(
            user=user, ticker="MSFT", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        response = auth_client.get(self.URL).data
        assert response[0]["id"] == second.id
        assert response[1]["id"] == first.id


@pytest.mark.django_db
class TestBacktestRunDetail:
    def _url(self, pk):
        return f"/api/backtesting/runs/{pk}/"

    def test_retrieve_own_run(self, auth_client, user):
        run = BacktestRun.objects.create(
            user=user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        response = auth_client.get(self._url(run.id))
        assert response.status_code == 200
        assert response.data["id"] == run.id

    def test_cannot_retrieve_other_users_run(self, auth_client, other_user):
        run = BacktestRun.objects.create(
            user=other_user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        assert auth_client.get(self._url(run.id)).status_code == 404

    def test_delete_own_run(self, auth_client, user):
        run = BacktestRun.objects.create(
            user=user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        assert auth_client.delete(self._url(run.id)).status_code == 204
        assert not BacktestRun.objects.filter(id=run.id).exists()

    def test_cannot_delete_other_users_run(self, auth_client, other_user):
        run = BacktestRun.objects.create(
            user=other_user, ticker="AAPL", strategy="buy_and_hold", parameters={},
            start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), initial_capital=10_000,
        )
        assert auth_client.delete(self._url(run.id)).status_code == 404
        assert BacktestRun.objects.filter(id=run.id).exists()
